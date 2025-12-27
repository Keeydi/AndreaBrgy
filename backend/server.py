from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="BarangayAlert API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    address: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    address: Optional[str] = None
    phone: Optional[str] = None
    created_at: str

class UserUpdate(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None

class AlertCreate(BaseModel):
    title: str
    message: str
    type: str  # Emergency, Advisory, Announcement

class AlertResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    created_by: str
    created_by_name: str
    created_at: str

class ReportCreate(BaseModel):
    report_type: str
    description: str
    location: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    report_type: str
    description: str
    location: Optional[str] = None
    status: str
    official_response: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

class ReportStatusUpdate(BaseModel):
    status: str
    official_response: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SystemLogResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    action: str
    details: Optional[str] = None
    timestamp: str


# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user

async def require_role(allowed_roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

async def log_action(user_id: str, user_name: str, action: str, details: str = None):
    log_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_name": user_name,
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.system_logs.insert_one(log_entry)


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": "resident",  # Default role
        "status": "active",
        "address": user.address,
        "phone": user.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    await log_action(user_doc["id"], user_doc["name"], "USER_REGISTERED", f"New user registered: {user.email}")
    
    token = create_token(user_doc["id"], user_doc["role"])
    return {
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": user_doc["id"],
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"]
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    await log_action(user["id"], user["name"], "USER_LOGIN", f"User logged in: {user['email']}")
    
    token = create_token(user["id"], user["role"])
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        status=user["status"],
        address=user.get("address"),
        phone=user.get("phone"),
        created_at=user["created_at"]
    )


# ==================== ALERTS ROUTES ====================

@api_router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(user: dict = Depends(get_current_user)):
    alerts = await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [AlertResponse(**alert) for alert in alerts]

@api_router.post("/alerts", response_model=AlertResponse)
async def create_alert(alert: AlertCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["official", "admin"]:
        raise HTTPException(status_code=403, detail="Only officials can create alerts")
    
    alert_doc = {
        "id": str(uuid.uuid4()),
        "title": alert.title,
        "message": alert.message,
        "type": alert.type,
        "created_by": user["id"],
        "created_by_name": user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.alerts.insert_one(alert_doc)
    await log_action(user["id"], user["name"], "ALERT_CREATED", f"Alert created: {alert.title} ({alert.type})")
    
    return AlertResponse(**alert_doc)


# ==================== REPORTS ROUTES ====================

@api_router.get("/reports", response_model=List[ReportResponse])
async def get_reports(user: dict = Depends(get_current_user)):
    if user["role"] in ["official", "admin"]:
        # Officials and admins see all reports
        reports = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    else:
        # Residents see only their own reports
        reports = await db.reports.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return [ReportResponse(**report) for report in reports]

@api_router.post("/reports", response_model=ReportResponse)
async def create_report(report: ReportCreate, user: dict = Depends(get_current_user)):
    report_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "report_type": report.report_type,
        "description": report.description,
        "location": report.location,
        "status": "pending",
        "official_response": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.reports.insert_one(report_doc)
    await log_action(user["id"], user["name"], "REPORT_SUBMITTED", f"Report submitted: {report.report_type}")
    
    return ReportResponse(**report_doc)

@api_router.put("/reports/{report_id}/status", response_model=ReportResponse)
async def update_report_status(report_id: str, update: ReportStatusUpdate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["official", "admin"]:
        raise HTTPException(status_code=403, detail="Only officials can update report status")
    
    report = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    update_data = {
        "status": update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if update.official_response:
        update_data["official_response"] = update.official_response
    
    await db.reports.update_one({"id": report_id}, {"$set": update_data})
    await log_action(user["id"], user["name"], "REPORT_STATUS_UPDATED", f"Report {report_id} status updated to: {update.status}")
    
    updated_report = await db.reports.find_one({"id": report_id}, {"_id": 0})
    return ReportResponse(**updated_report)


# ==================== USERS ROUTES (ADMIN) ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(500)
    return [UserResponse(**u) for u in users]

@api_router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(user_id: str, update: UserUpdate, user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    if update.role:
        update_data["role"] = update.role
    if update.status:
        update_data["status"] = update.status
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
        await log_action(user["id"], user["name"], "USER_UPDATED", f"User {user_id} updated: {update_data}")
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return UserResponse(**updated_user)


# ==================== CHATBOT ROUTES ====================

@api_router.post("/chatbot/query", response_model=ChatResponse)
async def chatbot_query(message: ChatMessage, user: dict = Depends(get_current_user)):
    session_id = message.session_id or str(uuid.uuid4())
    
    system_message = """You are BarangayBot, an AI assistant for Brgy Korokan's BarangayAlert system. 
You help residents with:
- Information about barangay services and office hours
- Guidance on submitting emergency reports
- Understanding alert types (Emergency, Advisory, Announcement)
- General community information

Be helpful, concise, and friendly. If you don't know something specific to the barangay, 
suggest they contact the barangay office or submit a report through the system.

Barangay Office Hours: Monday-Friday 8AM-5PM
Emergency Hotline: Available 24/7 through the Emergency Report feature
Location: Brgy Korokan Hall, Main Street"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=message.message)
        response = await chat.send_message(user_message)
        
        await log_action(user["id"], user["name"], "CHATBOT_QUERY", f"User asked: {message.message[:100]}")
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        # Fallback response
        return ChatResponse(
            response="I apologize, but I'm having trouble connecting right now. Please try again later or contact the barangay office directly for assistance.",
            session_id=session_id
        )


# ==================== SYSTEM LOGS ROUTES ====================

@api_router.get("/logs", response_model=List[SystemLogResponse])
async def get_system_logs(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logs = await db.system_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(500)
    return [SystemLogResponse(**log) for log in logs]


# ==================== DASHBOARD STATS ====================

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    if user["role"] not in ["official", "admin"]:
        raise HTTPException(status_code=403, detail="Officials only")
    
    total_users = await db.users.count_documents({})
    total_alerts = await db.alerts.count_documents({})
    total_reports = await db.reports.count_documents({})
    pending_reports = await db.reports.count_documents({"status": "pending"})
    resolved_reports = await db.reports.count_documents({"status": "resolved"})
    
    # Get recent reports
    recent_reports = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    
    # Get report counts by type
    report_types = await db.reports.aggregate([
        {"$group": {"_id": "$report_type", "count": {"$sum": 1}}}
    ]).to_list(10)
    
    return {
        "total_users": total_users,
        "total_alerts": total_alerts,
        "total_reports": total_reports,
        "pending_reports": pending_reports,
        "resolved_reports": resolved_reports,
        "recent_reports": recent_reports,
        "report_types": {r["_id"]: r["count"] for r in report_types}
    }


# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for demo purposes"""
    # Check if already seeded
    existing_admin = await db.users.find_one({"email": "admin@brgykorokan.gov.ph"})
    if existing_admin:
        return {"message": "Data already seeded"}
    
    # Create admin user
    admin = {
        "id": str(uuid.uuid4()),
        "name": "Kapitan Juan dela Cruz",
        "email": "admin@brgykorokan.gov.ph",
        "password": hash_password("admin123"),
        "role": "admin",
        "status": "active",
        "address": "Brgy Korokan, Main Street",
        "phone": "09171234567",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin)
    
    # Create official user
    official = {
        "id": str(uuid.uuid4()),
        "name": "Maria Santos",
        "email": "official@brgykorokan.gov.ph",
        "password": hash_password("official123"),
        "role": "official",
        "status": "active",
        "address": "Brgy Korokan, Zone 1",
        "phone": "09181234567",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(official)
    
    # Create sample resident
    resident = {
        "id": str(uuid.uuid4()),
        "name": "Pedro Reyes",
        "email": "pedro@gmail.com",
        "password": hash_password("resident123"),
        "role": "resident",
        "status": "active",
        "address": "Brgy Korokan, Zone 3",
        "phone": "09191234567",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(resident)
    
    # Create sample alerts
    alerts = [
        {
            "id": str(uuid.uuid4()),
            "title": "Typhoon Warning",
            "message": "Typhoon signal #2 has been raised. All residents are advised to stay indoors and prepare emergency supplies.",
            "type": "Emergency",
            "created_by": official["id"],
            "created_by_name": official["name"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Road Repair Notice",
            "message": "Main Street will undergo repairs from December 20-25. Please use alternative routes.",
            "type": "Advisory",
            "created_by": official["id"],
            "created_by_name": official["name"],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Barangay Christmas Party",
            "message": "Join us for the annual Barangay Christmas Party on December 23 at the covered court. Everyone is welcome!",
            "type": "Announcement",
            "created_by": admin["id"],
            "created_by_name": admin["name"],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        }
    ]
    await db.alerts.insert_many(alerts)
    
    # Create sample reports
    reports = [
        {
            "id": str(uuid.uuid4()),
            "user_id": resident["id"],
            "user_name": resident["name"],
            "report_type": "Infrastructure",
            "description": "Street light not working on Zone 3 corner",
            "location": "Zone 3, Near Sari-sari Store",
            "status": "pending",
            "official_response": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": resident["id"],
            "user_name": resident["name"],
            "report_type": "Emergency",
            "description": "Flooded area near the bridge",
            "location": "Brgy Korokan Bridge",
            "status": "in_progress",
            "official_response": "Response team has been dispatched",
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
        }
    ]
    await db.reports.insert_many(reports)
    
    return {
        "message": "Data seeded successfully",
        "users": {
            "admin": {"email": "admin@brgykorokan.gov.ph", "password": "admin123"},
            "official": {"email": "official@brgykorokan.gov.ph", "password": "official123"},
            "resident": {"email": "pedro@gmail.com", "password": "resident123"}
        }
    }


# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "BarangayAlert API v1.0", "status": "running"}


# Include the router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
