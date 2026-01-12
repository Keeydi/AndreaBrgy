from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Index, TypeDecorator
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OFFICIAL = "OFFICIAL"
    RESIDENT = "RESIDENT"

class AlertType(str, enum.Enum):
    EMERGENCY = "emergency"
    ANNOUNCEMENT = "announcement"
    WARNING = "warning"
    INFO = "info"

class AlertPriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"

class ReportType(str, enum.Enum):
    EMERGENCY = "emergency"
    CRIME = "crime"
    INFRASTRUCTURE = "infrastructure"
    HEALTH = "health"
    FLOOD = "flood"
    COMPLAINT = "complaint"
    REQUEST = "request"
    OTHER = "other"

class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"

# TypeDecorator to handle AlertType enum conversion properly
class AlertTypeEnum(TypeDecorator):
    impl = String(50)
    cache_ok = True
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_class = AlertType
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, AlertType):
            return value.value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in AlertType:
                if enum_item.value.lower() == value_lower:
                    return enum_item.value
        return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, AlertType):
            return value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in AlertType:
                if enum_item.value.lower() == value_lower:
                    return enum_item
        # Default to INFO if not found
        return AlertType.INFO

# TypeDecorator to handle AlertPriority enum conversion properly
class AlertPriorityEnum(TypeDecorator):
    impl = String(50)
    cache_ok = True
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_class = AlertPriority
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, AlertPriority):
            return value.value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in AlertPriority:
                if enum_item.value.lower() == value_lower:
                    return enum_item.value
        return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, AlertPriority):
            return value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in AlertPriority:
                if enum_item.value.lower() == value_lower:
                    return enum_item
        # Default to MEDIUM if not found
        return AlertPriority.MEDIUM

# TypeDecorator to handle AlertStatus enum conversion properly
class AlertStatusEnum(TypeDecorator):
    impl = String(50)
    cache_ok = True
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_class = AlertStatus
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, AlertStatus):
            return value.value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in AlertStatus:
                if enum_item.value.lower() == value_lower:
                    return enum_item.value
        return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, AlertStatus):
            return value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in AlertStatus:
                if enum_item.value.lower() == value_lower:
                    return enum_item
        # Default to ACTIVE if not found
        return AlertStatus.ACTIVE

# TypeDecorator to handle enum conversion properly for reports
class ReportTypeEnum(TypeDecorator):
    impl = String(50)
    cache_ok = True
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_class = ReportType
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, ReportType):
            return value.value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in ReportType:
                if enum_item.value.lower() == value_lower:
                    return enum_item.value
        return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, ReportType):
            return value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in ReportType:
                if enum_item.value.lower() == value_lower:
                    return enum_item
        # Default to OTHER if not found
        return ReportType.OTHER

# TypeDecorator to handle ReportStatus enum conversion properly
class ReportStatusEnum(TypeDecorator):
    impl = String(50)
    cache_ok = True
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_class = ReportStatus
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, ReportStatus):
            return value.value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in ReportStatus:
                if enum_item.value.lower() == value_lower:
                    return enum_item.value
        return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, ReportStatus):
            return value
        if isinstance(value, str):
            # Try to find enum by value (case-insensitive)
            value_lower = value.lower()
            for enum_item in ReportStatus:
                if enum_item.value.lower() == value_lower:
                    return enum_item
        # Default to PENDING if not found
        return ReportStatus.PENDING

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, native_enum=False), default=UserRole.RESIDENT, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships (lazy loading is fine for these as they're not always needed)
    reports = relationship("Report", back_populates="creator")
    alerts = relationship("Alert", back_populates="creator")
    logs = relationship("SystemLog", back_populates="user")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(AlertTypeEnum(), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(AlertPriorityEnum(), default=AlertPriority.MEDIUM, index=True)
    status = Column(AlertStatusEnum(), default=AlertStatus.ACTIVE, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships with eager loading
    creator = relationship("User", back_populates="alerts", lazy="joined")

    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_alert_status_created', 'status', 'created_at'),
    )

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(ReportTypeEnum(), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(500), nullable=True)
    status = Column(ReportStatusEnum(), default=ReportStatus.PENDING, index=True)
    official_response = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships with eager loading
    creator = relationship("User", back_populates="reports", lazy="joined")

    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_report_status_created', 'status', 'created_at'),
        Index('idx_report_user_created', 'created_by', 'created_at'),
    )

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships (use default lazy loading, we'll use joinedload in queries)
    user = relationship("User", back_populates="logs")

    # Composite index for common queries
    __table_args__ = (
        Index('idx_log_timestamp_action', 'timestamp', 'action'),
    )


