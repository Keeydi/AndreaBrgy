from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
import re
from models import UserRole, AlertType, AlertPriority, AlertStatus, ReportType, ReportStatus

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v and not re.match(r'^[\d\s\-\+\(\)]+$', v):
            raise ValueError('Invalid phone number format')
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    role: Optional[UserRole] = UserRole.RESIDENT

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

# Alert Schemas
class AlertBase(BaseModel):
    type: str = Field(..., max_length=50)
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=5000)
    priority: Optional[AlertPriority] = Field(default=AlertPriority.MEDIUM)
    
    @field_validator('type', mode='before')
    @classmethod
    def normalize_type(cls, v):
        """Normalize alert type to lowercase for validation."""
        if isinstance(v, str):
            return v.lower()
        return v
    
    @model_validator(mode='after')
    def ensure_priority(self):
        """Ensure priority is always set."""
        if self.priority is None:
            self.priority = AlertPriority.MEDIUM
        return self

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    status: AlertStatus
    created_by: int
    created_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Report Schemas
class ReportBase(BaseModel):
    type: ReportType
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=5000)
    location: Optional[str] = Field(None, max_length=500)
    
    @field_validator('type', mode='before')
    @classmethod
    def normalize_report_type(cls, v):
        """Normalize report type to enum value."""
        if isinstance(v, str):
            # Convert to lowercase and map to enum
            v_lower = v.lower()
            type_mapping = {
                'emergency': ReportType.EMERGENCY,
                'crime': ReportType.CRIME,
                'infrastructure': ReportType.INFRASTRUCTURE,
                'health': ReportType.HEALTH,
                'flood': ReportType.FLOOD,
                'complaint': ReportType.COMPLAINT,
                'request': ReportType.REQUEST,
                'other': ReportType.OTHER
            }
            return type_mapping.get(v_lower, ReportType.OTHER)
        return v

class ReportCreate(ReportBase):
    pass

class ReportResponse(ReportBase):
    id: int
    status: ReportStatus
    official_response: Optional[str] = None
    created_by: int
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReportStatusUpdate(BaseModel):
    status: ReportStatus
    official_response: Optional[str] = Field(None, max_length=5000)

# User Management Schemas
class UserRoleUpdate(BaseModel):
    role: UserRole

class UserPasswordReset(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

# Chatbot Schemas
class ChatbotQuery(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: Optional[str] = Field(None, max_length=100)

class ChatbotResponse(BaseModel):
    response: str
    session_id: str

# Stats Schemas
class DashboardStats(BaseModel):
    total_reports: int
    pending_reports: int
    resolved_reports: int
    active_alerts: int
    total_users: int
    residents: int
    officials: int

# System Log Schemas
class SystemLogResponse(BaseModel):
    id: int
    action: str
    user: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True



