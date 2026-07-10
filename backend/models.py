from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Numeric, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from database import Base


class CategoryEnum(str, enum.Enum):
    LAPTOP = "LAPTOP"
    MONITOR = "MONITOR"
    PHONE = "PHONE"
    SOFTWARE_LICENSE = "SOFTWARE_LICENSE"


class StatusEnum(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ALLOCATED = "ALLOCATED"
    IN_MAINTENANCE = "IN_MAINTENANCE"
    RETIRED = "RETIRED"


class AuditActionEnum(str, enum.Enum):
    ASSET_CREATED = "ASSET_CREATED"
    ASSET_UPDATED = "ASSET_UPDATED"
    ASSET_ALLOCATED = "ASSET_ALLOCATED"
    ASSET_RETURNED = "ASSET_RETURNED"
    MAINTENANCE_LOGGED = "MAINTENANCE_LOGGED"
    ASSET_VERIFIED = "ASSET_VERIFIED"
    ASSET_RETIRED = "ASSET_RETIRED"


class VerificationStatusEnum(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    MISSING = "MISSING"
    DAMAGED = "DAMAGED"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    # name= parameter on Enum prevents Alembic/PostgreSQL name collisions
    category = Column(Enum(CategoryEnum, name="categoryenum"))
    serial_number = Column(String(255), unique=True, index=True)
    purchase_date = Column(Date)
    warranty_end_date = Column(Date)
    status = Column(Enum(StatusEnum, name="statusenum"), default=StatusEnum.AVAILABLE)
    condition_score = Column(Integer)  # 1-10
    flagged_in_audit = Column(Boolean, default=False)

    allocations = relationship("Allocation", back_populates="asset", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="asset", cascade="all, delete-orphan")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)
    department = Column(String(255))

    allocations = relationship("Allocation", back_populates="employee")


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    assigned_date = Column(Date)
    returned_date = Column(Date, nullable=True)

    asset = relationship("Asset", back_populates="allocations")
    employee = relationship("Employee", back_populates="allocations")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"))
    service_date = Column(Date)
    description = Column(String(1000))
    # Numeric(10, 2) for precise financial storage — no floating-point drift
    cost = Column(Numeric(10, 2))

    asset = relationship("Asset", back_populates="maintenance_records")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_sub = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255))
    picture = Column(String(1024))
    role = Column(String(50), default="admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Notification Preferences
    pref_email = Column(Boolean, default=True)
    pref_slack = Column(Boolean, default=True)
    pref_push = Column(Boolean, default=True)


class UserFcmToken(Base):
    __tablename__ = "user_fcm_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token = Column(String(512), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    notification_type = Column(String(100), index=True) # e.g. "Asset Allocated"
    recipient = Column(String(255), index=True) # e.g. "user@example.com" or "user_id: 1"
    status = Column(String(50)) # "SUCCESS" or "FAILED"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    failure_reason = Column(String(1000), nullable=True)




class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), index=True)
    user_name = Column(String(255))
    action = Column(Enum(AuditActionEnum, name="auditactionenum"))
    asset_id = Column(Integer, nullable=True, index=True)
    details = Column(String(2000))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), index=True)
    verified_by = Column(String(255))
    verified_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(VerificationStatusEnum, name="verificationstatusenum"))
    notes = Column(String(1000), nullable=True)

    asset = relationship("Asset")
