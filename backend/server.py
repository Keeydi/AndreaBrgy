from fastapi import FastAPI, Depends, HTTPException, status, Request, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, case
from dotenv import load_dotenv
import os
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import random
import html
from collections import defaultdict

from database import get_db, engine, Base
from models import User, Alert, Report, SystemLog, UserRole, AlertStatus, ReportStatus, AlertType, AlertPriority
from schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    AlertCreate, AlertResponse,
    ReportCreate, ReportResponse, ReportStatusUpdate,
    UserRoleUpdate, UserPasswordReset, ChatbotQuery, ChatbotResponse,
    DashboardStats, SystemLogResponse
)

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Initialize FastAPI app
app = FastAPI(
    title="AndreaBrgy API",
    version="1.0.0",
    # Security headers
    docs_url="/docs",
    redoc_url="/redoc"
)

# Request size limit (10MB)
MAX_REQUEST_SIZE = 10 * 1024 * 1024

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type"],
    max_age=3600,
)

# Helper function to get CORS headers
def get_cors_headers(request: Request) -> dict:
    """Get CORS headers for the request origin."""
    origin = request.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]
    
    headers = {}
    if origin in allowed_origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    
    return headers

# Exception handler to ensure CORS headers on validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors and ensure CORS headers are included."""
    headers = get_cors_headers(request)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers=headers
    )

# Exception handler for HTTPException to ensure CORS headers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions and ensure CORS headers are included."""
    headers = get_cors_headers(request)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers
    )

# Exception handler for general exceptions to ensure CORS headers
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions and ensure CORS headers are included."""
    headers = get_cors_headers(request)
    import traceback
    print(f"Unhandled exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers
    )

# Rate limiting storage (in production, use Redis)
login_attempts = defaultdict(list)
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 300  # 5 minutes

# Security
security = HTTPBearer()

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

def require_role(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

def create_system_log(db: Session, action: str, user_id: Optional[int], details: str):
    """Helper function to create system log entries."""
    log = SystemLog(action=action, user_id=user_id, details=details)
    db.add(log)
    return log

def add_creator_name(response_dict: dict, creator_name: str):
    """Helper function to add creator name to response dict."""
    response_dict['created_by_name'] = creator_name
    return response_dict

def sanitize_input(text: str, max_length: Optional[int] = None) -> str:
    """Sanitize user input to prevent XSS attacks."""
    if not text:
        return text
    # Escape HTML characters
    sanitized = html.escape(text)
    # Remove any remaining script tags
    import re
    sanitized = re.sub(r'<script[^>]*>.*?</script>', '', sanitized, flags=re.IGNORECASE | re.DOTALL)
    if max_length:
        sanitized = sanitized[:max_length]
    return sanitized

def check_rate_limit(identifier: str) -> bool:
    """Check if rate limit is exceeded for login attempts."""
    now = datetime.now(timezone.utc)
    # Clean old attempts
    login_attempts[identifier] = [
        attempt for attempt in login_attempts[identifier]
        if (now - attempt).total_seconds() < LOGIN_WINDOW_SECONDS
    ]
    # Check if limit exceeded
    if len(login_attempts[identifier]) >= MAX_LOGIN_ATTEMPTS:
        return False
    return True

def record_login_attempt(identifier: str):
    """Record a login attempt."""
    login_attempts[identifier].append(datetime.now(timezone.utc))

# Auth Routes
@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Rate limiting check
    email_lower = user_data.email.lower()
    if not check_rate_limit(f"register_{email_lower}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later."
        )
    
    # Check if email already exists (case-insensitive)
    # MySQL is case-insensitive by default, but we normalize to lowercase
    existing_user = db.query(User).filter(User.email == email_lower).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Sanitize user input
    sanitized_name = sanitize_input(user_data.name, max_length=255)
    sanitized_phone = sanitize_input(user_data.phone, max_length=20) if user_data.phone else None
    sanitized_address = sanitize_input(user_data.address, max_length=500) if user_data.address else None
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=email_lower,
        password_hash=hashed_password,
        name=sanitized_name,
        role=user_data.role,
        phone=sanitized_phone,
        address=sanitized_address
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    token = create_access_token(new_user.id, new_user.email, new_user.role.value)
    
    # Log action
    create_system_log(db, "user_register", new_user.id, f"User {new_user.email} registered")
    db.commit()
    
    return TokenResponse(
        token=token,
        user=UserResponse.model_validate(new_user)
    )

@app.post("/api/auth/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # Rate limiting check
    email_lower = credentials.email.lower()
    if not check_rate_limit(email_lower):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    # Case-insensitive email lookup (MySQL is case-insensitive by default)
    # We normalize to lowercase for consistency
    user = db.query(User).filter(func.lower(User.email) == email_lower).first()
    
    if not user:
        record_login_attempt(email_lower)
        print(f"Login attempt failed: User not found for email: {email_lower}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not verify_password(credentials.password, user.password_hash):
        record_login_attempt(email_lower)
        print(f"Login attempt failed: Invalid password for email: {email_lower}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Clear attempts on successful login
    if email_lower in login_attempts:
        del login_attempts[email_lower]
    
    # Create token
    token = create_access_token(user.id, user.email, user.role.value)
    
    # Log action (async logging - don't block login response)
    try:
        create_system_log(db, "user_login", user.id, f"User {user.email} logged in")
        db.commit()
    except Exception:
        # Don't fail login if logging fails
        db.rollback()
        pass
    
    return TokenResponse(
        token=token,
        user=UserResponse.model_validate(user)
    )

@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

# Alert Routes
@app.get("/api/alerts", response_model=List[AlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    since: Optional[datetime] = None
):
    # Use eager loading to avoid N+1 queries
    query = db.query(Alert).options(joinedload(Alert.creator))
    
    # If since parameter is provided, only return alerts created after that time
    if since:
        query = query.filter(Alert.created_at > since)
    
    alerts = query.order_by(desc(Alert.created_at)).all()
    result = []
    for alert in alerts:
        alert_dict = {
            "id": alert.id,
            "type": str(alert.type.value) if hasattr(alert.type, 'value') else str(alert.type),
            "title": alert.title,
            "message": alert.message,
            "priority": alert.priority,
            "status": alert.status,
            "created_by": alert.created_by,
            "created_at": alert.created_at
        }
        result.append(add_creator_name(AlertResponse.model_validate(alert_dict).model_dump(), alert.creator.name))
    return result

@app.get("/api/alerts/new", response_model=List[AlertResponse])
def get_new_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    since: Optional[str] = Query(None, description="ISO timestamp to get alerts after")
):
    """Get alerts created after a specific timestamp (for polling)."""
    query = db.query(Alert).options(joinedload(Alert.creator)).filter(Alert.status == AlertStatus.ACTIVE)
    
    if since:
        try:
            # Handle both with and without timezone
            since_str = since.replace('Z', '+00:00') if since.endswith('Z') else since
            since_dt = datetime.fromisoformat(since_str)
            # Ensure timezone aware
            if since_dt.tzinfo is None:
                since_dt = since_dt.replace(tzinfo=timezone.utc)
            query = query.filter(Alert.created_at > since_dt)
        except (ValueError, AttributeError) as e:
            # If invalid timestamp, return all active alerts
            pass
    
    alerts = query.order_by(desc(Alert.created_at)).limit(10).all()
    result = []
    for alert in alerts:
        alert_dict = {
            "id": alert.id,
            "type": str(alert.type.value) if hasattr(alert.type, 'value') else str(alert.type),
            "title": alert.title,
            "message": alert.message,
            "priority": alert.priority,
            "status": alert.status,
            "created_by": alert.created_by,
            "created_at": alert.created_at
        }
        result.append(add_creator_name(AlertResponse.model_validate(alert_dict).model_dump(), alert.creator.name))
    return result

@app.post("/api/alerts", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert_data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.OFFICIAL]))
):
    # Sanitize input
    sanitized_title = sanitize_input(alert_data.title, max_length=255)
    sanitized_message = sanitize_input(alert_data.message, max_length=5000)
    
    # Convert alert type to lowercase and map to enum
    alert_type_lower = alert_data.type.lower()
    # Map common variations to enum values
    type_mapping = {
        'emergency': AlertType.EMERGENCY,
        'advisory': AlertType.WARNING,  # Map Advisory to Warning
        'announcement': AlertType.ANNOUNCEMENT,
        'warning': AlertType.WARNING,
        'info': AlertType.INFO
    }
    # Use mapped type or default to INFO if not found
    alert_type_enum = type_mapping.get(alert_type_lower, AlertType.INFO)
    
    new_alert = Alert(
        type=alert_type_enum,
        title=sanitized_title,
        message=sanitized_message,
        priority=alert_data.priority or AlertPriority.MEDIUM,
        created_by=current_user.id
    )
    
    db.add(new_alert)
    
    # Log action (batch with alert creation)
    create_system_log(db, "alert_create", current_user.id, f"Created alert: {new_alert.title}")
    db.commit()  # Single commit for both operations
    db.refresh(new_alert)
    
    # Convert alert to dict and ensure type is a string
    alert_dict = {
        "id": new_alert.id,
        "type": str(new_alert.type.value) if hasattr(new_alert.type, 'value') else str(new_alert.type),
        "title": new_alert.title,
        "message": new_alert.message,
        "priority": new_alert.priority,
        "status": new_alert.status,
        "created_by": new_alert.created_by,
        "created_at": new_alert.created_at
    }
    
    return add_creator_name(AlertResponse.model_validate(alert_dict).model_dump(), current_user.name)

@app.put("/api/alerts/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: int,
    alert_data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.OFFICIAL]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Sanitize input
    alert.title = sanitize_input(alert_data.title, max_length=255)
    alert.message = sanitize_input(alert_data.message, max_length=5000)
    
    # Convert alert type to lowercase and map to enum
    alert_type_lower = alert_data.type.lower()
    # Map common variations to enum values
    type_mapping = {
        'emergency': AlertType.EMERGENCY,
        'advisory': AlertType.WARNING,  # Map Advisory to Warning
        'announcement': AlertType.ANNOUNCEMENT,
        'warning': AlertType.WARNING,
        'info': AlertType.INFO
    }
    # Use mapped type or default to INFO if not found
    alert.type = type_mapping.get(alert_type_lower, AlertType.INFO)
    alert.priority = alert_data.priority
    
    create_system_log(db, "alert_update", current_user.id, f"Updated alert {alert_id}")
    db.commit()
    db.refresh(alert)
    
    # Convert alert to dict and ensure type is a string
    alert_dict = {
        "id": alert.id,
        "type": str(alert.type.value) if hasattr(alert.type, 'value') else str(alert.type),
        "title": alert.title,
        "message": alert.message,
        "priority": alert.priority,
        "status": alert.status,
        "created_by": alert.created_by,
        "created_at": alert.created_at
    }
    
    return add_creator_name(AlertResponse.model_validate(alert_dict).model_dump(), alert.creator.name)

@app.delete("/api/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.OFFICIAL]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    create_system_log(db, "alert_delete", current_user.id, f"Deleted alert {alert_id}")
    db.delete(alert)
    db.commit()
    return None

# Report Routes
@app.get("/api/reports", response_model=List[ReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Use eager loading to avoid N+1 queries
    query = db.query(Report).options(joinedload(Report.creator))
    
    # Residents can only see their own reports
    if current_user.role == UserRole.RESIDENT:
        reports = query.filter(Report.created_by == current_user.id).order_by(desc(Report.created_at)).all()
    else:
        reports = query.order_by(desc(Report.created_at)).all()
    
    return [add_creator_name(ReportResponse.model_validate(report).model_dump(), report.creator.name) 
            for report in reports]

@app.post("/api/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Sanitize input
    sanitized_title = sanitize_input(report_data.title, max_length=255)
    sanitized_description = sanitize_input(report_data.description, max_length=5000)
    sanitized_location = sanitize_input(report_data.location, max_length=500) if report_data.location else None
    
    new_report = Report(
        type=report_data.type,
        title=sanitized_title,
        description=sanitized_description,
        location=sanitized_location,
        created_by=current_user.id
    )
    
    db.add(new_report)
    
    # Log action (batch with report creation)
    create_system_log(db, "report_create", current_user.id, f"Created report: {new_report.title}")
    db.commit()  # Single commit for both operations
    db.refresh(new_report)
    
    return add_creator_name(ReportResponse.model_validate(new_report).model_dump(), current_user.name)

@app.put("/api/reports/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    status_data: ReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.OFFICIAL]))
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    report.status = status_data.status
    if status_data.status == ReportStatus.RESOLVED:
        report.resolved_at = datetime.now(timezone.utc)
    
    # Update official response if provided
    if status_data.official_response is not None:
        sanitized_response = sanitize_input(status_data.official_response, max_length=5000)
        report.official_response = sanitized_response
    
    # Log action (batch with status update)
    log_details = f"Updated report {report_id} status to {status_data.status.value}"
    if status_data.official_response:
        log_details += " with response"
    create_system_log(db, "report_status_update", current_user.id, log_details)
    db.commit()  # Single commit for both operations
    db.refresh(report)
    
    return add_creator_name(ReportResponse.model_validate(report).model_dump(), report.creator.name)

@app.delete("/api/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.OFFICIAL]))
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Residents can only delete their own reports
    if current_user.role == UserRole.RESIDENT and report.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reports"
        )
    
    create_system_log(db, "report_delete", current_user.id, f"Deleted report {report_id}")
    db.delete(report)
    db.commit()
    return None

# User Management Routes (Admin only)
@app.get("/api/users", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    users = db.query(User).all()
    return [UserResponse.model_validate(user) for user in users]

@app.put("/api/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = role_data.role
    
    # Log action (batch with role update)
    create_system_log(db, "user_role_update", current_user.id, 
                     f"Updated user {user_id} role to {role_data.role.value}")
    db.commit()  # Single commit for both operations
    db.refresh(user)
    
    return UserResponse.model_validate(user)

@app.put("/api/users/{user_id}/password", response_model=UserResponse)
def reset_user_password(
    user_id: int,
    password_data: UserPasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """
    Reset password for a user. Admin only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Hash the new password
    hashed_password = hash_password(password_data.new_password)
    user.password_hash = hashed_password
    
    # Log action (batch with password update)
    create_system_log(db, "user_password_reset", current_user.id, 
                     f"Reset password for user {user_id} ({user.email})")
    db.commit()  # Single commit for both operations
    db.refresh(user)
    
    return UserResponse.model_validate(user)

# Chatbot Rule Engine
def get_chatbot_response(message: str) -> str:
    """Rule-based chatbot that matches keywords and patterns to provide responses."""
    message_lower = message.lower().strip()
    
    # Rule definitions: (keywords, response)
    rules = [
        # Office hours
        (['oras', 'hours', 'open', 'close', 'bukas', 'sara', 'office time', 'orasan'], 
         "Ang barangay office ay bukas mula Lunes hanggang Biyernes, 8:00 AM - 5:00 PM. "
         "Para sa emergency, maaari kayong tumawag sa hotline: (02) 123-4567."),
        
        # How to report
        (['report', 'mag-report', 'paano mag-report', 'how to report', 'submit report', 'ireport', 'i-report'],
         "Para mag-submit ng report:\n"
         "1. Pumunta sa 'Report' sa menu\n"
         "2. Piliin ang uri ng problema (Emergency, Crime, Infrastructure, etc.)\n"
         "3. Ilagay ang detalye ng problema\n"
         "4. Maglagay ng lokasyon kung saan nangyari\n"
         "5. I-click ang 'Send Report'\n\n"
         "Para sa emergency, maaari din kayong tumawag sa barangay hotline."),
        
        # Alert types
        (['alert', 'alerts', 'uri ng alert', 'types of alert', 'anong alert', 'what alerts'],
         "May apat na uri ng alerts:\n"
         "• Emergency - Para sa mga emergency na sitwasyon\n"
         "• Announcement - Mga anunsyo mula sa barangay\n"
         "• Warning - Mga babala at paalala\n"
         "• Info - Pangkalahatang impormasyon\n\n"
         "Makikita ninyo ang lahat ng alerts sa 'Alerts' page."),
        
        # Emergency
        (['emergency', 'emergency report', 'sakuna', 'sunog', 'baha', 'aksidente', 'urgent'],
         "Para sa emergency:\n"
         "1. Tumawag agad sa barangay hotline: (02) 123-4567\n"
         "2. O mag-submit ng emergency report sa app\n"
         "3. Para sa life-threatening emergencies, tumawag sa 911\n\n"
         "Ang emergency reports ay inuuna namin at may mabilis na response."),
        
        # Services
        (['service', 'services', 'serbisyo', 'ano ang serbisyo', 'what services', 'available services'],
         "Mga serbisyo ng barangay:\n"
         "• Emergency Response\n"
         "• Report Management\n"
         "• Community Alerts\n"
         "• Public Information\n"
         "• Complaint Handling\n"
         "• Infrastructure Requests\n\n"
         "Para sa karagdagang impormasyon, bisitahin ang barangay hall."),
        
        # Status check
        (['status', 'check status', 'report status', 'ano na ang report', 'update', 'update ng report'],
         "Para makita ang status ng inyong report:\n"
         "1. Pumunta sa 'My Reports' sa menu\n"
         "2. Makikita ninyo ang lahat ng inyong reports\n"
         "3. Ang status ay maaaring: Pending, In Progress, Resolved, o Rejected\n"
         "4. Makikita din ninyo ang response mula sa barangay officials kung mayroon."),
        
        # Contact
        (['contact', 'tawag', 'phone', 'number', 'telepono', 'paano makipag-ugnayan', 'how to contact'],
         "Para makipag-ugnayan sa barangay:\n"
         "• Hotline: (02) 123-4567\n"
         "• Email: info@brgykorokan.gov.ph\n"
         "• Address: Barangay Hall, Zone 1, Barangay Korokan\n"
         "• Office Hours: Lunes-Biyernes, 8:00 AM - 5:00 PM"),
        
        # Registration
        (['register', 'sign up', 'mag-register', 'paano mag-register', 'account', 'gumawa ng account'],
         "Para mag-register:\n"
         "1. Pumunta sa 'Register' page\n"
         "2. Ilagay ang inyong email, pangalan, at password\n"
         "3. Piliin ang inyong role (Resident, Official, o Admin)\n"
         "4. I-click ang 'Register'\n\n"
         "Kailangan ng password na may hindi bababa sa 8 characters, may uppercase, lowercase, at number."),
        
        # Greeting
        (['hello', 'hi', 'kamusta', 'kumusta', 'magandang araw', 'good morning', 'good afternoon', 'good evening'],
         "Magandang araw! Ako si BarangayBot, ang inyong AI assistant. Paano ko kayo matutulungan ngayon?"),
        
        # Help
        (['help', 'tulong', 'paano', 'how', 'help me', 'tulungan'],
         "Ako ay nandito para tumulong! Maaari ninyo akong tanungin tungkol sa:\n"
         "• Oras ng barangay office\n"
         "• Paano mag-submit ng report\n"
         "• Mga uri ng alerts\n"
         "• Status ng inyong reports\n"
         "• Mga serbisyo ng barangay\n"
         "• Emergency procedures\n\n"
         "Ano ang gusto ninyong malaman?"),
    ]
    
    # Check each rule
    for keywords, response in rules:
        if any(keyword in message_lower for keyword in keywords):
            return response
    
    # Default response if no rule matches
    default_responses = [
        "Pasensya, hindi ko lubos na naintindihan ang inyong tanong. Maaari ba ninyong magtanong tungkol sa:\n"
        "• Oras ng barangay office\n"
        "• Paano mag-report\n"
        "• Mga uri ng alerts\n"
        "• Status ng reports\n\n"
        "O subukan ninyong magtanong sa ibang paraan.",
        
        "Ako ay nandito para tumulong sa inyong mga katanungan tungkol sa barangay. "
        "Maaari ba ninyong magtanong tungkol sa office hours, reports, alerts, o serbisyo?",
        
        "Para sa mas tiyak na impormasyon, maaari ninyong:\n"
        "• Bisitahin ang 'Alerts' page para sa mga anunsyo\n"
        "• Gumawa ng report sa 'Report' page\n"
        "• Tumawag sa barangay hotline: (02) 123-4567",
    ]
    
    return random.choice(default_responses)

# Chatbot Route
@app.post("/api/chatbot/query", response_model=ChatbotResponse)
def chatbot_query(
    query: ChatbotQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Sanitize input
    sanitized_message = sanitize_input(query.message, max_length=1000)
    
    # Get rule-based response
    response_text = get_chatbot_response(sanitized_message)
    
    # Log action
    create_system_log(db, "chatbot_query", current_user.id, f"Chatbot query: {sanitized_message[:50]}")
    db.commit()
    
    return ChatbotResponse(
        response=response_text,
        session_id=query.session_id or f"session_{datetime.now(timezone.utc).timestamp()}"
    )

# Dashboard Stats Route - Optimized with single query
@app.get("/api/stats/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.OFFICIAL]))
):
    # Optimized: Get all stats in fewer queries using CASE statements
    # Single query for report stats
    report_stats = db.query(
        func.count(Report.id).label('total'),
        func.sum(case((Report.status == ReportStatus.PENDING, 1), else_=0)).label('pending'),
        func.sum(case((Report.status == ReportStatus.RESOLVED, 1), else_=0)).label('resolved')
    ).first()
    
    # Single query for alert stats
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.status == AlertStatus.ACTIVE).scalar() or 0
    
    # Single query for user stats
    user_stats = db.query(
        func.count(User.id).label('total'),
        func.sum(case((User.role == UserRole.RESIDENT, 1), else_=0)).label('residents'),
        func.sum(case((User.role == UserRole.OFFICIAL, 1), else_=0)).label('officials')
    ).first()
    
    return DashboardStats(
        total_reports=report_stats.total or 0,
        pending_reports=int(report_stats.pending or 0),
        resolved_reports=int(report_stats.resolved or 0),
        active_alerts=active_alerts,
        total_users=user_stats.total or 0,
        residents=int(user_stats.residents or 0),
        officials=int(user_stats.officials or 0)
    )

# System Logs Route
@app.get("/api/logs", response_model=List[SystemLogResponse])
def get_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    try:
        # Get logs ordered by timestamp
        logs = db.query(SystemLog).order_by(desc(SystemLog.timestamp)).limit(100).all()
        
        # Get all user IDs that exist in logs
        user_ids = [log.user_id for log in logs if log.user_id]
        
        # Load all users in one query if there are any
        users_dict = {}
        if user_ids:
            users = db.query(User).filter(User.id.in_(user_ids)).all()
            users_dict = {user.id: user.name for user in users}
        
        # Build response
        result = []
        for log in logs:
            # Manually construct the response dict to avoid Pydantic validation issues
            # with the user relationship (which is a User object, not a string)
            log_dict = {
                'id': log.id,
                'action': log.action,
                'user': users_dict.get(log.user_id, "System") if log.user_id else "System",
                'details': log.details,
                'timestamp': log.timestamp
            }
            result.append(SystemLogResponse(**log_dict))
        
        return result
    except Exception as e:
        print(f"Error fetching logs: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching logs: {str(e)}"
        )

# Seed Data Route (for development)
@app.post("/api/seed")
def seed_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    # Create demo alerts
    alert1 = Alert(
        type="emergency",
        title="Emergency Evacuation Notice",
        message="All residents in Zone 3 are advised to evacuate immediately due to flooding.",
        priority="high",
        created_by=current_user.id
    )
    alert2 = Alert(
        type="announcement",
        title="Barangay Assembly Meeting",
        message="Monthly barangay assembly meeting will be held on Saturday at 2 PM.",
        priority="medium",
        created_by=current_user.id
    )
    db.add(alert1)
    db.add(alert2)
    
    # Create demo reports
    resident = db.query(User).filter(User.role == UserRole.RESIDENT).first()
    if resident:
        report1 = Report(
            type="complaint",
            title="Garbage Collection Issue",
            description="Garbage has not been collected in Zone 3 for the past week.",
            location="Zone 3, near basketball court",
            created_by=resident.id
        )
        report2 = Report(
            type="request",
            title="Request for Street Light",
            description="Requesting installation of street light in Zone 5 for safety.",
            location="Zone 5, main road",
            status=ReportStatus.IN_PROGRESS,
            created_by=resident.id
        )
        db.add(report1)
        db.add(report2)
    
    db.commit()
    
    return {"message": "Demo data loaded successfully"}

@app.get("/")
def root():
    return {"message": "AndreaBrgy API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



