from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List, Dict
from models import CategoryEnum, StatusEnum

# Asset
class AssetBase(BaseModel):
    name: str
    category: CategoryEnum
    serial_number: str
    purchase_date: date
    warranty_end_date: date
    status: StatusEnum
    condition_score: int

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[CategoryEnum] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None
    warranty_end_date: Optional[date] = None
    status: Optional[StatusEnum] = None
    condition_score: Optional[int] = None

class Asset(AssetBase):
    id: int

    class Config:
        from_attributes = True

# Employee
class EmployeeBase(BaseModel):
    name: str
    email: str
    department: str

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int

    class Config:
        from_attributes = True

# Allocation
class AllocationBase(BaseModel):
    asset_id: int
    employee_id: int
    assigned_date: date
    returned_date: Optional[date] = None

class AllocationCreate(BaseModel):
    asset_id: int
    employee_id: int

class Allocation(AllocationBase):
    id: int

    class Config:
        from_attributes = True

# MaintenanceRecord
class MaintenanceRecordBase(BaseModel):
    asset_id: int
    service_date: date
    description: str
    cost: float

class MaintenanceRecordCreate(BaseModel):
    asset_id: int
    description: str
    cost: float

class MaintenanceRecord(MaintenanceRecordBase):
    id: int

    class Config:
        from_attributes = True

# Aggregates / Others
class Stats(BaseModel):
    total_assets: int
    available: int
    allocated: int
    in_maintenance: int
    retired: int
    utilization_percent: float
    by_category: Dict[str, int]

class AIRecommendation(BaseModel):
    asset_id: int
    asset_name: str
    reason: str
    suggestion: str
    confidence_score: float
    estimated_cost: float
    ai_explanation: str

# Auth & User
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    role: str = "admin"

class UserCreate(UserBase):
    google_sub: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class GoogleToken(BaseModel):
    credential: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class SentEmail(BaseModel):
    to: str
    subject: str
    body: str
    timestamp: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    source: str

class AuditLog(BaseModel):
    id: int
    user_email: str
    user_name: str
    action: str
    asset_id: Optional[int] = None
    details: str
    timestamp: datetime
    class Config:
        from_attributes = True

class VerificationCreate(BaseModel):
    asset_id: int
    status: str
    notes: Optional[str] = None

class VerificationRecord(BaseModel):
    id: int
    asset_id: int
    verified_by: str
    verified_at: datetime
    status: str
    notes: Optional[str] = None
    class Config:
        from_attributes = True

class AssetVerificationStatus(BaseModel):
    asset_id: int
    asset_name: str
    serial_number: str
    last_verified_at: Optional[datetime] = None
    status: Optional[str] = None
    is_overdue: bool

class CategoryUtilization(BaseModel):
    category: str
    total: int
    allocated_percent: float
    avg_duration_days: float
    idle_count: int

class MonthlyTrend(BaseModel):
    month: str
    allocations: int

class UtilizationReport(BaseModel):
    overall_total: int
    overall_allocated_percent: float
    overall_avg_duration_days: float
    overall_idle_count: int
    categories: List[CategoryUtilization]
    trend: List[MonthlyTrend]
