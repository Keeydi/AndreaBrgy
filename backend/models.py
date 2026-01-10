from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Index
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
    type = Column(Enum(AlertType, native_enum=False), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(Enum(AlertPriority, native_enum=False), default=AlertPriority.MEDIUM, index=True)
    status = Column(Enum(AlertStatus, native_enum=False), default=AlertStatus.ACTIVE, index=True)
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
    type = Column(Enum(ReportType, native_enum=False), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(500), nullable=True)
    status = Column(Enum(ReportStatus, native_enum=False), default=ReportStatus.PENDING, index=True)
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


