from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, case
from dotenv import load_dotenv
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import List, Optional
import random
import html
from collections import defaultdict

from database import get_db, engine, Base
from models import User, Alert, Report, SystemLog, UserRole, AlertStatus, ReportStatus
from schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    AlertCreate, AlertResponse,
    ReportCreate, ReportResponse, ReportStatusUpdate,
    UserRoleUpdate, ChatbotQuery, ChatbotResponse,
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
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
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
    now = datetime.utcnow()
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
    login_attempts[identifier].append(datetime.utcnow())

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
    current_user: User = Depends(get_current_user)
):
    # Use eager loading to avoid N+1 queries
    alerts = db.query(Alert).options(joinedload(Alert.creator)).order_by(desc(Alert.created_at)).all()
    return [add_creator_name(AlertResponse.model_validate(alert).model_dump(), alert.creator.name) 
            for alert in alerts]

@app.post("/api/alerts", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert_data: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.OFFICIAL]))
):
    # Sanitize input
    sanitized_title = sanitize_input(alert_data.title, max_length=255)
    sanitized_message = sanitize_input(alert_data.message, max_length=5000)
    
    new_alert = Alert(
        type=alert_data.type,
        title=sanitized_title,
        message=sanitized_message,
        priority=alert_data.priority,
        created_by=current_user.id
    )
    
    db.add(new_alert)
    
    # Log action (batch with alert creation)
    create_system_log(db, "alert_create", current_user.id, f"Created alert: {new_alert.title}")
    db.commit()  # Single commit for both operations
    db.refresh(new_alert)
    
    return add_creator_name(AlertResponse.model_validate(new_alert).model_dump(), current_user.name)

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
    alert.type = alert_data.type
    alert.priority = alert_data.priority
    
    create_system_log(db, "alert_update", current_user.id, f"Updated alert {alert_id}")
    db.commit()
    db.refresh(alert)
    
    return add_creator_name(AlertResponse.model_validate(alert).model_dump(), alert.creator.name)

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
        report.resolved_at = datetime.utcnow()
    
    # Log action (batch with status update)
    create_system_log(db, "report_status_update", current_user.id, 
                     f"Updated report {report_id} status to {status_data.status.value}")
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

# Chatbot Route
@app.post("/api/chatbot/query", response_model=ChatbotResponse)
def chatbot_query(
    query: ChatbotQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Simple mock response - you can integrate with AI services here
    responses = [
        "I'm here to help you with barangay-related questions. How can I assist you today?",
        "You can submit reports, view alerts, and access various barangay services through this platform.",
        "For emergencies, please contact the barangay hotline or visit the barangay hall.",
        "I can help you with information about barangay services, report submission, and general inquiries.",
    ]
    
    response_text = random.choice(responses)
    
    # Sanitize and log action
    sanitized_message = sanitize_input(query.message, max_length=50)
    create_system_log(db, "chatbot_query", current_user.id, f"Chatbot query: {sanitized_message}")
    db.commit()
    
    return ChatbotResponse(
        response=response_text,
        session_id=query.session_id or f"session_{datetime.utcnow().timestamp()}"
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



