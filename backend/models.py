from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Float, DateTime, Boolean
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
    name = Column(String, index=True)
    category = Column(Enum(CategoryEnum))
    serial_number = Column(String, unique=True, index=True)
    purchase_date = Column(Date)
    warranty_end_date = Column(Date)
    status = Column(Enum(StatusEnum), default=StatusEnum.AVAILABLE)
    condition_score = Column(Integer)  # 1-10
    flagged_in_audit = Column(Boolean, default=False)

    allocations = relationship("Allocation", back_populates="asset")
    maintenance_records = relationship("MaintenanceRecord", back_populates="asset")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    department = Column(String)

    allocations = relationship("Allocation", back_populates="employee")

class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    assigned_date = Column(Date)
    returned_date = Column(Date, nullable=True)

    asset = relationship("Asset", back_populates="allocations")
    employee = relationship("Employee", back_populates="allocations")

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    service_date = Column(Date)
    description = Column(String)
    cost = Column(Float)

    asset = relationship("Asset", back_populates="maintenance_records")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_sub = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    picture = Column(String)
    role = Column(String, default="admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    user_name = Column(String)
    action = Column(Enum(AuditActionEnum))
    asset_id = Column(Integer, nullable=True, index=True)
    details = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), index=True)
    verified_by = Column(String)
    verified_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(VerificationStatusEnum))
    notes = Column(String, nullable=True)

    asset = relationship("Asset")
