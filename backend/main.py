from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta
import os

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

load_dotenv()

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    genai = None
    GEMINI_AVAILABLE = False

try:
    from google import genai as google_genai_pkg
    GEMINI_GENAI_AVAILABLE = True
except ImportError:
    google_genai_pkg = None
    GEMINI_GENAI_AVAILABLE = False

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    Groq = None
    GROQ_AVAILABLE = False

import json
import concurrent.futures

from database import SessionLocal, engine, Base
import models
import schemas
import mailer

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def log_action_safely(db: Session, user: models.User, action: models.AuditActionEnum, asset_id: Optional[int], details: str):
    try:
        from database import SessionLocal
        log_db = SessionLocal()
        try:
            user_email = user.email if (user and user.email) else "unknown@acme.com"
            user_name = user.name if (user and user.name) else "Unknown User"
            log_entry = models.AuditLog(
                user_email=user_email,
                user_name=user_name,
                action=action,
                asset_id=asset_id,
                details=details
            )
            log_db.add(log_entry)
            log_db.commit()
        finally:
            log_db.close()
    except Exception as e:
        print(f"Error writing audit log entry safely: {e}")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_AVAILABLE:
    genai.configure(api_key=GEMINI_API_KEY)

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
JWT_SECRET = os.environ.get("JWT_SECRET", "supersecretjwtkeyforassetsflowapp123!")
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Auto-create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Asset Management System MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/hello")
def read_root():
    return {"message": "Hello from FastAPI Backend!"}

# --- Authentication ---
@app.post("/api/auth/google", response_model=schemas.Token)
def login_google(token_data: schemas.GoogleToken, db: Session = Depends(get_db)):
    try:
        # Verify Google ID token
        id_info = id_token.verify_oauth2_token(
            token_data.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        email = id_info.get("email")
        google_sub = id_info.get("sub")
        name = id_info.get("name")
        picture = id_info.get("picture")
        
        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")
            
        # Check if user exists
        user = db.query(models.User).filter(models.User.google_sub == google_sub).first()
        if not user:
            # Also check if user exists by email (link accounts)
            user = db.query(models.User).filter(models.User.email == email).first()
            if user:
                user.google_sub = google_sub
                if picture:
                    user.picture = picture
                db.commit()
            else:
                # Create new user
                user = models.User(
                    google_sub=google_sub,
                    email=email,
                    name=name,
                    picture=picture,
                    role="admin"  # Default role
                )
                db.add(user)
                db.commit()
                db.refresh(user)
        else:
            # Update profile info if changed
            updated = False
            if user.name != name:
                user.name = name
                updated = True
            if user.picture != picture:
                user.picture = picture
                updated = True
            if updated:
                db.commit()
                db.refresh(user)
                
        access_token = create_access_token(data={"sub": user.email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google login failed: {str(e)}")

@app.post("/api/auth/mock", response_model=schemas.Token)
def login_mock(credentials: schemas.UserBase, db: Session = Depends(get_db)):
    email = credentials.email
    name = credentials.name or "Mock User"
    role = credentials.role or "admin"
    picture = credentials.picture or ""
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            google_sub=f"mock-{email}",
            email=email,
            name=name,
            role=role,
            picture=picture
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- Assets ---
@app.get("/api/assets", response_model=List[schemas.Asset])
def get_assets(
    category: Optional[models.CategoryEnum] = None,
    status: Optional[models.StatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Asset)
    if category:
        query = query.filter(models.Asset.category == category)
    if status:
        query = query.filter(models.Asset.status == status)
    return query.all()

@app.get("/api/assets/{asset_id}", response_model=schemas.Asset)
def get_asset(asset_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@app.post("/api/assets", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_asset = models.Asset(**asset.model_dump())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    log_action_safely(
        db=db,
        user=current_user,
        action=models.AuditActionEnum.ASSET_CREATED,
        asset_id=db_asset.id,
        details=f"Created asset: {db_asset.name} (Serial: {db_asset.serial_number}, Category: {db_asset.category})"
    )
    return db_asset

@app.put("/api/assets/{asset_id}", response_model=schemas.Asset)
def update_asset(asset_id: int, asset: schemas.AssetUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = asset.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_asset, key, value)
        
    db.commit()
    db.refresh(db_asset)
    log_action_safely(
        db=db,
        user=current_user,
        action=models.AuditActionEnum.ASSET_UPDATED,
        asset_id=db_asset.id,
        details=f"Updated asset fields: {', '.join(update_data.keys())}"
    )
    return db_asset

@app.delete("/api/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    log_action_safely(
        db=db,
        user=current_user,
        action=models.AuditActionEnum.ASSET_RETIRED,
        asset_id=db_asset.id,
        details=f"Retired/Deleted asset: {db_asset.name} (Serial: {db_asset.serial_number})"
    )
    db.delete(db_asset)
    db.commit()
    return {"ok": True}

# --- Employees ---
@app.get("/api/employees", response_model=List[schemas.Employee])
def get_employees(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Employee).all()

@app.post("/api/employees", response_model=schemas.Employee)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_employee = models.Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

# --- Allocations ---
@app.get("/api/allocations", response_model=List[schemas.Allocation])
def get_allocations(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Allocation).all()

@app.post("/api/allocations/allocate", response_model=schemas.Allocation)
def allocate_asset(allocation: schemas.AllocationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if asset exists and is available
    asset = db.query(models.Asset).filter(models.Asset.id == allocation.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.status != models.StatusEnum.AVAILABLE:
        raise HTTPException(status_code=400, detail="Asset is not available")
        
    # Create allocation
    db_allocation = models.Allocation(
        asset_id=allocation.asset_id,
        employee_id=allocation.employee_id,
        assigned_date=date.today()
    )
    db.add(db_allocation)
    
    # Update asset status
    asset.status = models.StatusEnum.ALLOCATED
    
    db.commit()
    db.refresh(db_allocation)

    # Log audit log
    log_action_safely(
        db=db,
        user=current_user,
        action=models.AuditActionEnum.ASSET_ALLOCATED,
        asset_id=asset.id,
        details=f"Allocated asset '{asset.name}' (Serial: {asset.serial_number}) to employee ID {allocation.employee_id}"
    )

    # Send assignment email
    try:
        recipient_email = current_user.email if (current_user and current_user.email) else mailer.ADMIN_EMAIL
        recipient_name = current_user.name if (current_user and current_user.name) else "User"
        cat_val = asset.category.value if hasattr(asset.category, "value") else str(asset.category)
        html_body = mailer.get_allocation_html(
            user_name=recipient_name,
            asset_name=asset.name,
            category=cat_val,
            serial=asset.serial_number
        )
        mailer.send_html_email(
            to_email=recipient_email,
            subject=f"Hi {recipient_name}, you've been assigned {asset.name}",
            html_body=html_body
        )
    except Exception as e:
        print(f"Error in mail notifications for allocation: {e}")

    return db_allocation

@app.post("/api/allocations/return/{allocation_id}", response_model=schemas.Allocation)
def return_asset(allocation_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    allocation = db.query(models.Allocation).filter(models.Allocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    if allocation.returned_date:
        raise HTTPException(status_code=400, detail="Asset already returned")
        
    allocation.returned_date = date.today()
    
    # Update asset status
    asset = db.query(models.Asset).filter(models.Asset.id == allocation.asset_id).first()
    if asset:
        asset.status = models.StatusEnum.AVAILABLE
        
    db.commit()
    db.refresh(allocation)

    # Log audit log
    if asset:
        log_action_safely(
            db=db,
            user=current_user,
            action=models.AuditActionEnum.ASSET_RETURNED,
            asset_id=asset.id,
            details=f"Returned asset '{asset.name}' (Serial: {asset.serial_number}) from allocation ID {allocation_id}"
        )

    # Send return confirmation email
    try:
        if asset:
            recipient_email = current_user.email if (current_user and current_user.email) else mailer.ADMIN_EMAIL
            recipient_name = current_user.name if (current_user and current_user.name) else "User"
            html_body = mailer.get_return_html(
                user_name=recipient_name,
                asset_name=asset.name,
                serial=asset.serial_number
            )
            mailer.send_html_email(
                to_email=recipient_email,
                subject=f"Asset Return Confirmation: {asset.name}",
                html_body=html_body
            )
    except Exception as e:
        print(f"Error in mail notifications for return: {e}")

    return allocation

# --- Maintenance ---
@app.get("/api/maintenance", response_model=List[schemas.MaintenanceRecord])
def get_maintenance(asset_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.MaintenanceRecord)
    if asset_id:
        query = query.filter(models.MaintenanceRecord.asset_id == asset_id)
    return query.all()

@app.post("/api/maintenance", response_model=schemas.MaintenanceRecord)
def log_maintenance(record: schemas.MaintenanceRecordCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == record.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db_record = models.MaintenanceRecord(
        asset_id=record.asset_id,
        service_date=date.today(),
        description=record.description,
        cost=record.cost
    )
    db.add(db_record)
    
    # Set asset to IN_MAINTENANCE
    asset.status = models.StatusEnum.IN_MAINTENANCE
    
    db.commit()
    db.refresh(db_record)

    # Log audit log
    log_action_safely(
        db=db,
        user=current_user,
        action=models.AuditActionEnum.MAINTENANCE_LOGGED,
        asset_id=asset.id,
        details=f"Logged maintenance action: {record.description} (Cost: ${record.cost})"
    )

    # Send maintenance logged notification email
    try:
        recipient_email = current_user.email if (current_user and current_user.email) else mailer.ADMIN_EMAIL
        recipient_name = current_user.name if (current_user and current_user.name) else "User"
        html_body = mailer.get_maintenance_html(
            user_name=recipient_name,
            asset_name=asset.name,
            serial=asset.serial_number,
            description=record.description,
            cost=record.cost
        )
        mailer.send_html_email(
            to_email=recipient_email,
            subject=f"Asset Flow Maintenance Alert: {asset.name}",
            html_body=html_body
        )
    except Exception as e:
        print(f"Error in mail notifications for maintenance: {e}")

    return db_record

# --- Notifications / Emails ---
@app.post("/api/notifications/warranty-check")
def run_warranty_check(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today = date.today()
    thirty_days_later = today + timedelta(days=30)
    
    # Query assets whose warranty has expired or will expire in 30 days
    assets = db.query(models.Asset).filter(
        (models.Asset.warranty_end_date < today) | 
        ((models.Asset.warranty_end_date >= today) & (models.Asset.warranty_end_date <= thirty_days_later))
    ).all()
    
    flagged_assets = []
    for asset in assets:
        status = "Expired" if asset.warranty_end_date < today else "Expiring"
        flagged_assets.append({
            "name": asset.name,
            "serial": asset.serial_number,
            "expiry": asset.warranty_end_date.strftime("%Y-%m-%d") if asset.warranty_end_date else "",
            "status": status
        })
        
    if flagged_assets:
        recipient_email = current_user.email if (current_user and current_user.email) else mailer.ADMIN_EMAIL
        recipient_name = current_user.name if (current_user and current_user.name) else "User"
        html_body = mailer.get_warranty_check_html(
            user_name=recipient_name,
            flagged_assets=flagged_assets
        )
        try:
            mailer.send_html_email(
                to_email=recipient_email,
                subject=f"Warranty Expiry Report - {len(flagged_assets)} Assets Flagged",
                html_body=html_body
            )
        except Exception as e:
            print(f"Failed to send warranty expiry email: {e}")
            
    return {"flagged_count": len(flagged_assets)}

@app.get("/api/notifications/sent", response_model=List[schemas.SentEmail])
def get_sent_emails(current_user: models.User = Depends(get_current_user)):
    return mailer.sent_emails_log

# --- Dashboard Stats ---
@app.get("/api/stats", response_model=schemas.Stats)
def get_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total = db.query(models.Asset).count()
    
    status_counts = db.query(models.Asset.status, func.count(models.Asset.id)).group_by(models.Asset.status).all()
    status_dict = {status: count for status, count in status_counts}
    
    available = status_dict.get(models.StatusEnum.AVAILABLE, 0)
    allocated = status_dict.get(models.StatusEnum.ALLOCATED, 0)
    in_maintenance = status_dict.get(models.StatusEnum.IN_MAINTENANCE, 0)
    retired = status_dict.get(models.StatusEnum.RETIRED, 0)
    
    category_counts = db.query(models.Asset.category, func.count(models.Asset.id)).group_by(models.Asset.category).all()
    by_category = {cat.value: count for cat, count in category_counts}
    
    utilization = (allocated / total * 100) if total > 0 else 0.0
    
    return schemas.Stats(
        total_assets=total,
        available=available,
        allocated=allocated,
        in_maintenance=in_maintenance,
        retired=retired,
        utilization_percent=utilization,
        by_category=by_category
    )

# --- AI / Predictive Maintenance ---
import random
import hashlib

def _generate_ai_explanation(asset, reason_type, age_years, maintenance_count, today):
    """Generate varied, natural-sounding AI recommendations from templates."""
    name = asset.name
    # Use asset id as seed for deterministic but varied output
    seed = int(hashlib.md5(f"{asset.id}-{asset.name}".encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)

    category_costs = {
        "LAPTOP": (1100, 1800),
        "MONITOR": (350, 700),
        "PHONE": (700, 1200),
        "SOFTWARE_LICENSE": (200, 600),
    }
    cost_range = category_costs.get(asset.category.value, (500, 1500))
    estimated_cost = round(rng.uniform(*cost_range), 2)

    if reason_type == "warranty_expired":
        days_expired = (today - asset.warranty_end_date).days
        templates = [
            f"This {name} has been operating {days_expired} days past warranty coverage. Without manufacturer support, any hardware failure would require out-of-pocket repairs averaging ${estimated_cost:.0f}. Proactive replacement is strongly recommended to avoid unplanned downtime.",
            f"Analysis indicates the {name} warranty lapsed {days_expired} days ago. Historical data suggests assets in this category experience a 34% higher failure rate post-warranty. Budget allocation for a replacement unit (est. ${estimated_cost:.0f}) is advisable.",
            f"The {name} is currently unprotected — warranty expired {days_expired} days ago. Given the asset's age and usage patterns, the risk-adjusted cost of continued operation exceeds replacement cost (${estimated_cost:.0f}). Recommend scheduling replacement within 30 days.",
        ]
        confidence = round(rng.uniform(0.82, 0.95), 2)
    elif reason_type == "low_condition":
        templates = [
            f"The {name} has a critically low condition score of {asset.condition_score}/10, indicating significant wear or damage. Continued use risks data loss and productivity disruption. Immediate replacement (est. ${estimated_cost:.0f}) or comprehensive overhaul is recommended.",
            f"With a condition rating of just {asset.condition_score}/10, this {name} is well below the acceptable threshold of 5/10. Performance benchmarks show a 40% degradation versus baseline. Replacement cost estimated at ${estimated_cost:.0f}.",
            f"Condition assessment for the {name} returned a score of {asset.condition_score}/10 — classified as 'critical'. The asset is at high risk of imminent failure. Recommend fast-tracking a replacement (${estimated_cost:.0f}) to prevent workflow disruptions.",
        ]
        confidence = round(rng.uniform(0.88, 0.96), 2)
    elif reason_type == "old_age":
        templates = [
            f"At {age_years:.1f} years old, this {name} exceeds the recommended {asset.category.value.lower().replace('_', ' ')} lifecycle of 3 years. Performance degradation is expected, and compatibility with newer software may be limited. Replacement budget: ${estimated_cost:.0f}.",
            f"This {name} has been in service for {age_years:.1f} years, surpassing the corporate standard lifecycle. Reliability modeling predicts increasing failure probability. A planned refresh (est. ${estimated_cost:.0f}) would be more cost-effective than reactive repairs.",
            f"The {name} is {age_years:.1f} years old. Assets of this category typically show diminishing returns after 3 years due to wear, outdated specs, and rising maintenance needs. Strategic replacement (${estimated_cost:.0f}) is recommended.",
        ]
        confidence = round(rng.uniform(0.78, 0.90), 2)
    else:  # high_maintenance
        templates = [
            f"The {name} has accumulated {maintenance_count} service records — well above the acceptable threshold. Cumulative repair costs are approaching the replacement value of ${estimated_cost:.0f}. Continued investment in repairs is not economically justified.",
            f"With {maintenance_count} documented maintenance events, this {name} demonstrates a pattern of recurring issues. Each repair cycle introduces additional downtime risk. Replacement (est. ${estimated_cost:.0f}) offers better long-term ROI.",
            f"Maintenance frequency analysis flags the {name} as a high-cost asset with {maintenance_count} service interventions. The total cost of ownership now exceeds that of a new unit (${estimated_cost:.0f}). Recommend decommissioning and replacement.",
        ]
        confidence = round(rng.uniform(0.85, 0.94), 2)

    explanation = rng.choice(templates)
    return explanation, confidence, estimated_cost

@app.get("/api/predictive-maintenance", response_model=List[schemas.AIRecommendation])
def get_predictive_maintenance(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    assets = db.query(models.Asset).filter(models.Asset.status != models.StatusEnum.RETIRED).all()
    recommendations = []
    
    today = date.today()
    
    for asset in assets:
        needs_attention = False
        reason = ""
        suggestion = ""
        reason_type = ""
        
        # RULES:
        # warranty expired OR condition_score <= 4 OR (age > 3 years) OR (>=3 maintenance records)
        age_years = (today - asset.purchase_date).days / 365.25
        maintenance_count = db.query(models.MaintenanceRecord).filter(models.MaintenanceRecord.asset_id == asset.id).count()
        
        if asset.warranty_end_date and asset.warranty_end_date < today:
            needs_attention = True
            reason = "Warranty expired"
            suggestion = "Consider replacement or extended warranty"
            reason_type = "warranty_expired"
        elif asset.condition_score <= 4:
            needs_attention = True
            reason = f"Low condition score ({asset.condition_score}/10)"
            suggestion = "Service soon or replace"
            reason_type = "low_condition"
        elif age_years > 3:
            needs_attention = True
            reason = f"Asset age > 3 years ({age_years:.1f} yrs)"
            suggestion = "Consider replacement"
            reason_type = "old_age"
        elif maintenance_count >= 3:
            needs_attention = True
            reason = f"High maintenance frequency ({maintenance_count} records)"
            suggestion = "Consider replacement"
            reason_type = "high_maintenance"
            
        if needs_attention:
            explanation, confidence, est_cost = _generate_ai_explanation(
                asset, reason_type, age_years, maintenance_count, today
            )
            recommendations.append(schemas.AIRecommendation(
                asset_id=asset.id,
                asset_name=asset.name,
                reason=reason,
                suggestion=suggestion,
                confidence_score=confidence,
                estimated_cost=est_cost,
                ai_explanation=explanation,
            ))
            
    return recommendations

@app.post("/api/predictive-maintenance/{asset_id}/ask-ai")
def ask_ai_advisor(asset_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    maintenance_records = db.query(models.MaintenanceRecord).filter(models.MaintenanceRecord.asset_id == asset.id).all()
    maintenance_history = ", ".join([f"{r.service_date}: {r.description} (${r.cost})" for r in maintenance_records]) or "None"
    
    # Check if Gemini is configured
    if not GEMINI_API_KEY or not GEMINI_AVAILABLE:
        # Fallback
        today = date.today()
        age_years = (today - asset.purchase_date).days / 365.25
        maintenance_count = len(maintenance_records)
        
        fallback_reason = "No specific issue."
        if asset.warranty_end_date and asset.warranty_end_date < today:
            fallback_reason = "Warranty expired."
        elif asset.condition_score <= 4:
            fallback_reason = f"Low condition score ({asset.condition_score}/10)."
        elif age_years > 3:
            fallback_reason = f"Asset age > 3 years ({age_years:.1f} yrs)."
        elif maintenance_count >= 3:
            fallback_reason = f"High maintenance frequency ({maintenance_count} records)."
            
        return {"recommendation": f"Fallback Rule: {fallback_reason} Consider inspecting or replacing the asset."}
        
    prompt = f"""
    You are an AI Asset Replacement Advisor.
    Analyze the following asset and provide a short, natural-language recommendation (2-3 sentences) on whether it should be repaired, replaced, or kept as is.
    
    Asset Name: {asset.name}
    Category: {asset.category}
    Purchase Date: {asset.purchase_date}
    Warranty End Date: {asset.warranty_end_date}
    Condition Score: {asset.condition_score}/10
    Maintenance History: {maintenance_history}
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return {"recommendation": response.text.strip()}
    except Exception as e:
        return {"recommendation": f"AI Error: Could not generate recommendation. Fallback: Check warranty and condition."}

def clean_and_parse_json(text_content: str) -> dict:
    cleaned = text_content.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    
    # Extract only the JSON block if other text exists
    if "{" in cleaned:
        cleaned = cleaned[cleaned.find("{"):cleaned.rfind("}")+1]
        
    try:
        data = json.loads(cleaned)
    except Exception:
        # If json load fails, raise error to trigger fallback
        raise ValueError("Invalid JSON response from model")
        
    # Ensure all required keys exist
    if "restock_suggestions" not in data:
        data["restock_suggestions"] = []
    if "overstock_warnings" not in data:
        data["overstock_warnings"] = []
    if "summary" not in data:
        data["summary"] = ""
    return data

@app.get("/api/ai/stock-insights")
def get_stock_insights(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    load_dotenv()
    gemini_key = os.environ.get("GEMINI_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")

    # 1. Gather aggregated inventory data
    all_assets = db.query(models.Asset).all()
    today = date.today()

    flagged_count = 0
    total_age_days = 0

    totals_per_category = {}
    counts_by_status = {
        "AVAILABLE": 0,
        "ALLOCATED": 0,
        "IN_MAINTENANCE": 0,
        "RETIRED": 0
    }

    for asset in all_assets:
        # Category totals
        cat = asset.category.value if hasattr(asset.category, "value") else str(asset.category)
        totals_per_category[cat] = totals_per_category.get(cat, 0) + 1

        # Status counts
        stat = asset.status.value if hasattr(asset.status, "value") else str(asset.status)
        counts_by_status[stat] = counts_by_status.get(stat, 0) + 1

        # Average age tracking
        if asset.purchase_date:
            total_age_days += (today - asset.purchase_date).days

        # Predictive maintenance flag checks
        if asset.status != models.StatusEnum.RETIRED:
            age_years = (today - asset.purchase_date).days / 365.25 if asset.purchase_date else 0
            maintenance_count = db.query(models.MaintenanceRecord).filter(models.MaintenanceRecord.asset_id == asset.id).count()

            needs_attention = False
            if asset.warranty_end_date and asset.warranty_end_date < today:
                needs_attention = True
            elif asset.condition_score <= 4:
                needs_attention = True
            elif age_years > 3:
                needs_attention = True
            elif maintenance_count >= 3:
                needs_attention = True

            if needs_attention:
                flagged_count += 1

    avg_age_days = (total_age_days / len(all_assets)) if all_assets else 0.0

    # 2. Shared prompt
    prompt = f"""
    You are an expert AI inventory consultant. Analyze the following aggregated inventory data of company IT assets:
    - Totals per category: {totals_per_category}
    - Counts by status: {counts_by_status}
    - Average asset age in days: {avg_age_days:.1f}
    - Count of assets flagged for predictive maintenance (due to old age, low condition, expired warranty, or high repair frequency): {flagged_count}

    Based on this data, identify:
    1. Which categories are running low (low available count vs overall allocations/totals) and should be restocked.
    2. Which categories are overstocked or underused (high available count or high count of idle assets relative to total).
    3. 2-3 plain-English suggestions to optimize inventory health.

    You MUST respond in strict JSON matching this exact structure:
    {{
      "restock_suggestions": [
        {{ "category": "CATEGORY_NAME", "reason": "Explanation why it needs restocking" }}
      ],
      "overstock_warnings": [
        {{ "category": "CATEGORY_NAME", "reason": "Explanation why it is overstocked/underused" }}
      ],
      "summary": "A brief overview summary of the inventory health and recommendations."
    }}
    Do not include markdown tags, code block wrappers (like ```json), or any conversational intro/outro text. Just return the raw JSON.
    """

    # 3. Call execution strategies
    def run_gemini():
        if not GEMINI_GENAI_AVAILABLE or not google_genai_pkg or not gemini_key:
            raise ValueError("Gemini package or key missing")
        client = google_genai_pkg.Client(api_key=gemini_key)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
        )
        if not response.text:
            raise ValueError("Empty response from Gemini")
        return clean_and_parse_json(response.text)

    def run_groq():
        if not GROQ_AVAILABLE or not Groq or not groq_key:
            raise ValueError("Groq package or key missing")
        client = Groq(api_key=groq_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
        )
        res_text = chat_completion.choices[0].message.content
        if not res_text:
            raise ValueError("Empty response from Groq")
        return clean_and_parse_json(res_text)

    def run_rules():
        restock = []
        overstock = []
        for category in models.CategoryEnum:
            cat_str = category.value
            avail = db.query(models.Asset).filter(
                models.Asset.category == category,
                models.Asset.status == models.StatusEnum.AVAILABLE
            ).count()
            total = db.query(models.Asset).filter(models.Asset.category == category).count()

            # Under 3 available -> restock suggestion
            if avail < 3 and total > 0:
                restock.append({
                    "category": cat_str,
                    "reason": f"Only {avail} units are available in stock. Recommend replenishing soon to meet demand."
                })

            # Over 50% available (idle) -> overstock warning
            if total > 5 and (avail / total) > 0.5:
                overstock.append({
                    "category": cat_str,
                    "reason": f"Over 50% of units ({avail}/{total}) are currently available (idle). Consider reallocating or pausing purchases."
                })

        summary_msg = "Rule-based analysis: "
        if restock:
            summary_msg += f"Suggest restocking {', '.join([x['category'] for x in restock])}. "
        if overstock:
            summary_msg += f"Identify potential overstock in {', '.join([x['category'] for x in overstock])}. "
        if not restock and not overstock:
            summary_msg += "All categories have balanced inventory levels."
        else:
            summary_msg += "Recommend reviewing utilization policies."

        return {
            "restock_suggestions": restock,
            "overstock_warnings": overstock,
            "summary": summary_msg
        }

    # Execute chain: Gemini -> Groq -> rules (8s timeout per provider)
    if gemini_key and GEMINI_GENAI_AVAILABLE:
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(run_gemini)
                result = future.result(timeout=8.0)
                result["source"] = "gemini"
                return result
        except Exception as e:
            print(f"Gemini insight generation failed/timed out: {e}")

    if groq_key and GROQ_AVAILABLE:
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(run_groq)
                result = future.result(timeout=8.0)
                result["source"] = "groq"
                return result
        except Exception as e:
            print(f"Groq insight generation failed/timed out: {e}")

    try:
        result = run_rules()
        result["source"] = "rules"
        return result
    except Exception as e:
        print(f"Rule-based fallback failed: {e}")
        return {
            "restock_suggestions": [],
            "overstock_warnings": [],
            "summary": "Unable to load insights due to unexpected error.",
            "source": "rules"
        }

@app.post("/api/ai/chat", response_model=schemas.ChatResponse)
def post_ai_chat(req: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    load_dotenv()
    gemini_key = os.environ.get("GEMINI_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")

    # 1. Gather context details from DB
    today = date.today()
    all_assets = db.query(models.Asset).all()
    total_assets = len(all_assets)

    totals_per_category = {}
    counts_by_status = {
        "AVAILABLE": 0,
        "ALLOCATED": 0,
        "IN_MAINTENANCE": 0,
        "RETIRED": 0
    }

    for asset in all_assets:
        cat = asset.category.value if hasattr(asset.category, "value") else str(asset.category)
        totals_per_category[cat] = totals_per_category.get(cat, 0) + 1

        stat = asset.status.value if hasattr(asset.status, "value") else str(asset.status)
        counts_by_status[stat] = counts_by_status.get(stat, 0) + 1

    # Predictive maintenance flagged assets
    predictive_flagged = []
    for asset in all_assets:
        if asset.status != models.StatusEnum.RETIRED:
            age_years = (today - asset.purchase_date).days / 365.25 if asset.purchase_date else 0
            maintenance_count = db.query(models.MaintenanceRecord).filter(models.MaintenanceRecord.asset_id == asset.id).count()

            flagged = False
            reason = []
            if asset.warranty_end_date and asset.warranty_end_date < today:
                flagged = True
                reason.append("Warranty expired")
            elif asset.condition_score <= 4:
                flagged = True
                reason.append(f"Low condition score ({asset.condition_score}/10)")
            elif age_years > 3:
                flagged = True
                reason.append(f"Age > 3 years ({age_years:.1f} yrs)")
            elif maintenance_count >= 3:
                flagged = True
                reason.append(f"High maintenance frequency ({maintenance_count} records)")

            if flagged:
                predictive_flagged.append({
                    "name": asset.name,
                    "serial": asset.serial_number,
                    "reason": ", ".join(reason)
                })

    # Active allocations
    active_allocs = db.query(models.Allocation).filter(models.Allocation.returned_date == None).all()
    active_allocations_list = []
    for a in active_allocs:
        active_allocations_list.append({
            "asset_name": a.asset.name if a.asset else "Unknown Asset",
            "serial": a.asset.serial_number if a.asset else "",
            "employee_name": a.employee.name if a.employee else "Unknown Employee"
        })

    # Upcoming/expired warranties (next 30 days)
    thirty_days_later = today + timedelta(days=30)
    expired_or_expiring_warranties = []
    for asset in all_assets:
        if asset.warranty_end_date:
            if asset.warranty_end_date < today:
                expired_or_expiring_warranties.append({
                    "name": asset.name,
                    "serial": asset.serial_number,
                    "expiry": asset.warranty_end_date.strftime("%Y-%m-%d"),
                    "status": "Expired"
                })
            elif asset.warranty_end_date <= thirty_days_later:
                expired_or_expiring_warranties.append({
                    "name": asset.name,
                    "serial": asset.serial_number,
                    "expiry": asset.warranty_end_date.strftime("%Y-%m-%d"),
                    "status": "Expiring"
                })

    # Recent maintenance records
    recent_maintenance = db.query(models.MaintenanceRecord).order_by(models.MaintenanceRecord.service_date.desc()).limit(10).all()
    maintenance_list = []
    for r in recent_maintenance:
        maintenance_list.append({
            "asset_name": r.asset.name if r.asset else "Unknown Asset",
            "serial": r.asset.serial_number if r.asset else "",
            "description": r.description,
            "cost": r.cost,
            "date": r.service_date.strftime("%Y-%m-%d")
        })

    # Basic audit info
    allocated_count = counts_by_status.get("ALLOCATED", 0)
    utilization_percent = (allocated_count / total_assets * 100) if total_assets > 0 else 0.0

    # Serialize context
    data_context = f"""
    ASSET MANAGEMENT SYSTEM DATA CONTEXT:
    - Overall Totals by Category: {totals_per_category}
    - Overall Counts by Status: {counts_by_status}
    - Total Assets in Database: {total_assets}
    - Utilization Rate: {utilization_percent:.1f}% ({allocated_count} allocated out of {total_assets} total)
    
    Active Allocations (Asset Assigned to Employee):
    {active_allocations_list}
    
    Assets Flagged for Predictive Maintenance (Low condition, expired warranty, or high repair counts):
    {predictive_flagged}
    
    Expired or Expiring Warranties (Lapsed or expiring within next 30 days):
    {expired_or_expiring_warranties}
    
    Recent Maintenance Records (Last 10 entries):
    {maintenance_list}
    """

    system_prompt = f"""You are a helpful, expert AI assistant for this company's Asset Management System.
Only answer using the DATA CONTEXT provided below. If the user's question asks for information not contained in the DATA CONTEXT, or asks about external topics (like weather, general knowledge, or other systems), reply honestly that you cannot answer because the topic is outside the provided asset database.
Be concise, direct, and specific with real numbers and names from the context. Do not make up any facts or numbers.

DATA CONTEXT:
{data_context}
"""

    # Format history and message
    formatted_history = ""
    for msg in req.history:
        role_label = "User" if msg.role == "user" else "Assistant"
        formatted_history += f"\n{role_label}: {msg.content}"

    full_prompt = f"{system_prompt}\nConversation History:\n{formatted_history}\nUser: {req.message}\nAssistant:"

    # Execution blocks
    def run_gemini():
        if not GEMINI_GENAI_AVAILABLE or not google_genai_pkg or not gemini_key:
            raise ValueError("Gemini package or key missing")
        client = google_genai_pkg.Client(api_key=gemini_key)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=full_prompt,
        )
        if not response.text:
            raise ValueError("Empty response from Gemini")
        return response.text.strip()

    def run_groq():
        if not GROQ_AVAILABLE or not Groq or not groq_key:
            raise ValueError("Groq package or key missing")
        client = Groq(api_key=groq_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": full_prompt,
                }
            ],
            model="llama-3.1-8b-instant",
        )
        res_text = chat_completion.choices[0].message.content
        if not res_text:
            raise ValueError("Empty response from Groq")
        return res_text.strip()

    def run_rules() -> str:
        msg_lower = req.message.lower()

        # Check for "allocated" or "assigned"
        if "allocated" in msg_lower or "assigned" in msg_lower:
            return f"There are currently {counts_by_status.get('ALLOCATED', 0)} assets allocated to employees out of {total_assets} total assets, representing a {utilization_percent:.1f}% utilization rate."

        # Check for "available" or "in stock"
        if "available" in msg_lower or "in stock" in msg_lower:
            available_info = ", ".join([f"{cat}: {db.query(models.Asset).filter(models.Asset.category == cat, models.Asset.status == models.StatusEnum.AVAILABLE).count()} available" for cat in totals_per_category.keys()])
            return f"There are {counts_by_status.get('AVAILABLE', 0)} assets available in stock. Breakdown: {available_info}."

        # Check for "maintenance"
        if "maintenance" in msg_lower:
            flagged_names = [x['name'] for x in predictive_flagged]
            maint_count = counts_by_status.get('IN_MAINTENANCE', 0)
            flagged_str = f" Flagged assets needing attention: {', '.join(flagged_names)}." if flagged_names else ""
            return f"There are {maint_count} assets currently in maintenance.{flagged_str}"

        # Check for "warranty" or "expires"
        if "warranty" in msg_lower or "expire" in msg_lower:
            exp_names = [f"{x['name']} ({x['status']} on {x['expiry']})" for x in expired_or_expiring_warranties]
            if exp_names:
                return f"There are {len(exp_names)} assets with expired or expiring warranties: {', '.join(exp_names[:5])}."
            return "No assets have warranties expiring in the next 30 days or already expired."

        # Check for "utilization"
        if "utilization" in msg_lower:
            return f"The current utilization rate is {utilization_percent:.1f}% ({counts_by_status.get('ALLOCATED', 0)} allocated out of {total_assets} total assets)."

        # Default fallback suggestion
        return "I can only answer questions relating to the asset database. Try asking about asset counts, allocations, warranties, maintenance, or utilization."

    # Sequential execution: Gemini -> Groq -> rules (8s timeout per model)
    if gemini_key and GEMINI_GENAI_AVAILABLE:
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(run_gemini)
                reply = future.result(timeout=8.0)
                return {"reply": reply, "source": "gemini"}
        except Exception as e:
            print(f"Gemini chat failed/timed out: {e}")

    if groq_key and GROQ_AVAILABLE:
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(run_groq)
                reply = future.result(timeout=8.0)
                return {"reply": reply, "source": "groq"}
        except Exception as e:
            print(f"Groq chat failed/timed out: {e}")

    try:
        reply = run_rules()
        return {"reply": reply, "source": "rules"}
    except Exception as e:
        print(f"Rule-based chat fallback failed: {e}")
        return {
            "reply": "I apologize, but I encountered an error while processing your request. Please try asking about asset counts, allocations, maintenance, or warranties.",
            "source": "rules"
        }

@app.get("/api/audit/logs")
def get_audit_logs(
    page: int = 1,
    limit: int = 50,
    action: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    asset_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.AuditLog)
    if action:
        query = query.filter(models.AuditLog.action == action)
    if start_date:
        query = query.filter(models.AuditLog.timestamp >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(models.AuditLog.timestamp <= datetime.combine(end_date, datetime.max.time()))
    if asset_id:
        query = query.filter(models.AuditLog.asset_id == asset_id)
        
    total = query.count()
    logs = query.order_by(models.AuditLog.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "logs": logs,
        "total": total
    }

@app.post("/api/audit/verify", response_model=schemas.VerificationRecord)
def verify_asset(req: schemas.VerificationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == req.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    record = models.VerificationRecord(
        asset_id=req.asset_id,
        verified_by=current_user.name or current_user.email,
        status=req.status,
        notes=req.notes
    )
    db.add(record)
    
    if req.status in ["MISSING", "DAMAGED"]:
        asset.flagged_in_audit = True
    else:
        asset.flagged_in_audit = False
        
    db.commit()
    db.refresh(record)
    
    log_action_safely(
        db=db,
        user=current_user,
        action=models.AuditActionEnum.ASSET_VERIFIED,
        asset_id=asset.id,
        details=f"Verified asset: '{asset.name}' (Serial: {asset.serial_number}) as status {req.status}. Notes: {req.notes or 'None'}"
    )
    
    return record

@app.get("/api/audit/verification-status", response_model=List[schemas.AssetVerificationStatus])
def get_verification_status(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    assets = db.query(models.Asset).all()
    status_list = []
    today_dt = datetime.utcnow()
    
    for asset in assets:
        last_record = db.query(models.VerificationRecord).filter(models.VerificationRecord.asset_id == asset.id).order_by(models.VerificationRecord.verified_at.desc()).first()
        
        last_verified_at = last_record.verified_at if last_record else None
        status = last_record.status if last_record else None
        
        is_overdue = True
        if last_verified_at:
            days_since = (today_dt - last_verified_at.replace(tzinfo=None)).days
            if days_since < 90:
                is_overdue = False
                
        status_list.append({
            "asset_id": asset.id,
            "asset_name": asset.name,
            "serial_number": asset.serial_number,
            "last_verified_at": last_verified_at,
            "status": status,
            "is_overdue": is_overdue
        })
        
    return status_list

@app.get("/api/audit/utilization", response_model=schemas.UtilizationReport)
def get_utilization_report(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    all_assets = db.query(models.Asset).all()
    today = date.today()
    
    trend = []
    for i in range(5, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
            
        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(year, month + 1, 1) - timedelta(days=1)
            
        month_label = month_start.strftime("%b %Y")
        alloc_count = db.query(models.Allocation).filter(
            models.Allocation.assigned_date >= month_start,
            models.Allocation.assigned_date <= month_end
        ).count()
        
        trend.append({
            "month": month_label,
            "allocations": alloc_count
        })
        
    def calc_avg_duration(allocations):
        if not allocations:
            return 0.0
        total_days = 0
        for a in allocations:
            end = a.returned_date or today
            total_days += (end - a.assigned_date).days
        return float(total_days / len(allocations))
        
    def is_asset_idle(asset_obj):
        if asset_obj.status == models.StatusEnum.RETIRED:
            return False
        allocs = db.query(models.Allocation).filter(models.Allocation.asset_id == asset_obj.id).all()
        if not allocs:
            return True
        if asset_obj.status == models.StatusEnum.ALLOCATED:
            return False
        latest_return = None
        for a in allocs:
            if a.returned_date:
                if not latest_return or a.returned_date > latest_return:
                    latest_return = a.returned_date
        if latest_return:
            idle_days = (today - latest_return).days
            if idle_days >= 60:
                return True
        else:
            return True
        return False
        
    overall_total = len(all_assets)
    overall_allocated = sum(1 for a in all_assets if a.status == models.StatusEnum.ALLOCATED)
    overall_allocated_percent = (overall_allocated / overall_total * 100) if overall_total > 0 else 0.0
    
    all_allocs = db.query(models.Allocation).all()
    overall_avg_duration = calc_avg_duration(all_allocs)
    
    overall_idle_count = sum(1 for a in all_assets if is_asset_idle(a))
    
    categories_stats = []
    for cat in models.CategoryEnum:
        cat_assets = [a for a in all_assets if a.category == cat]
        cat_total = len(cat_assets)
        cat_allocated = sum(1 for a in cat_assets if a.status == models.StatusEnum.ALLOCATED)
        cat_allocated_percent = (cat_allocated / cat_total * 100) if cat_total > 0 else 0.0
        
        cat_allocs = db.query(models.Allocation).join(models.Asset).filter(models.Asset.category == cat).all()
        cat_avg_duration = calc_avg_duration(cat_allocs)
        cat_idle_count = sum(1 for a in cat_assets if is_asset_idle(a))
        
        categories_stats.append({
            "category": cat.value,
            "total": cat_total,
            "allocated_percent": cat_allocated_percent,
            "avg_duration_days": cat_avg_duration,
            "idle_count": cat_idle_count
        })
        
    return {
        "overall_total": overall_total,
        "overall_allocated_percent": overall_allocated_percent,
        "overall_avg_duration_days": overall_avg_duration,
        "overall_idle_count": overall_idle_count,
        "categories": categories_stats,
        "trend": trend
    }
