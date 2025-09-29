from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List, Optional
import jwt
import bcrypt
from datetime import datetime, timedelta
import os

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./trailtrack_crm.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="TrailTrack CRM API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001", 
        "http://localhost:5173",
        "https://trail.ngrok.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "trailtrack-secret-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(String, default="user")  # admin, user, viewer
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    website = Column(String)
    industry = Column(String)
    size = Column(String)
    phone = Column(String)
    email = Column(String)
    street = Column(String)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    country = Column(String)
    notes = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    contacts = relationship("Contact", back_populates="account")
    leads = relationship("Lead", back_populates="account")

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    first_name = Column(String)
    last_name = Column(String)
    title = Column(String)
    email = Column(String)
    phone = Column(String)
    notes = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    account = relationship("Account", back_populates="contacts")

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    primary_contact_id = Column(Integer, ForeignKey("contacts.id"))
    stage = Column(String, default="New")  # New, Qualified, Proposal, Negotiation, Closed-Won, Closed-Lost
    value_cents = Column(Integer, default=0)
    probability = Column(Integer, default=10)
    expected_close_date = Column(DateTime)
    source = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="open")  # open, closed_won, closed_lost
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    account = relationship("Account", back_populates="leads")
    activities = relationship("Activity", back_populates="lead")

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    account_id = Column(Integer, ForeignKey("accounts.id"))
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    type = Column(String)  # call, email, meeting, note, sms
    subject = Column(String)
    body = Column(Text)
    occurred_at = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Integer)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lead = relationship("Lead", back_populates="activities")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    linked_type = Column(String)  # lead, account, contact
    linked_id = Column(Integer)
    title = Column(String)
    due_at = Column(DateTime)
    priority = Column(String, default="medium")  # low, medium, high
    status = Column(String, default="open")  # open, done, canceled
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic Models
class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    email: str
    password: str

class AccountCreate(BaseModel):
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None

class ContactCreate(BaseModel):
    account_id: Optional[int] = None
    first_name: str
    last_name: str
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class LeadCreate(BaseModel):
    title: str
    account_id: Optional[int] = None
    primary_contact_id: Optional[int] = None
    stage: str = "New"
    value_cents: int = 0
    probability: int = 10
    expected_close_date: Optional[datetime] = None
    source: Optional[str] = None

class ActivityCreate(BaseModel):
    lead_id: Optional[int] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    type: str
    subject: str
    body: Optional[str] = None
    occurred_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None

class TaskCreate(BaseModel):
    linked_type: str
    linked_id: int
    title: str
    due_at: Optional[datetime] = None
    priority: str = "medium"

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(email: str = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# API Routes
@app.post("/auth/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        password_hash=hashed_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User created successfully"}

@app.post("/auth/login")
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@app.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role
    }

# Dashboard stats
@app.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get counts for dashboard
    total_leads = db.query(Lead).filter(Lead.owner_id == current_user.id).count()
    open_leads = db.query(Lead).filter(Lead.owner_id == current_user.id, Lead.status == "open").count()
    total_accounts = db.query(Account).filter(Account.owner_id == current_user.id).count()
    open_tasks = db.query(Task).filter(Task.owner_id == current_user.id, Task.status == "open").count()
    
    # Calculate pipeline value
    pipeline_value = db.query(Lead).filter(
        Lead.owner_id == current_user.id,
        Lead.status == "open"
    ).with_entities(Lead.value_cents).all()
    total_pipeline = sum([lead.value_cents for lead in pipeline_value]) / 100  # Convert cents to dollars
    
    return {
        "total_leads": total_leads,
        "open_leads": open_leads,
        "total_accounts": total_accounts,
        "open_tasks": open_tasks,
        "pipeline_value": total_pipeline
    }

# Accounts endpoints
@app.get("/accounts")
async def get_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.owner_id == current_user.id).all()
    return accounts

@app.post("/accounts")
async def create_account(account_data: AccountCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = Account(**account_data.model_dump(), owner_id=current_user.id)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@app.patch("/accounts/{account_id}")
async def update_account(account_id: int, account_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id, Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    for key, value in account_data.items():
        if hasattr(account, key):
            setattr(account, key, value)
    
    db.commit()
    db.refresh(account)
    return account

@app.delete("/accounts/{account_id}")
async def delete_account(account_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id, Account.owner_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    db.delete(account)
    db.commit()
    return {"message": "Account deleted successfully"}

# Contacts endpoints
@app.get("/contacts")
async def get_contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contacts = db.query(Contact).filter(Contact.owner_id == current_user.id).all()
    return contacts

@app.post("/contacts")
async def create_contact(contact_data: ContactCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = Contact(**contact_data.dict(), owner_id=current_user.id)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@app.get("/contacts/{contact_id}")
async def get_contact(contact_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@app.patch("/contacts/{contact_id}")
async def update_contact(contact_id: int, contact_data: ContactCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    for field, value in contact_data.dict(exclude_unset=True).items():
        setattr(contact, field, value)
    
    contact.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contact)
    return contact

@app.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted successfully"}

# Leads endpoints
@app.get("/leads")
async def get_leads(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    leads = db.query(Lead).filter(Lead.owner_id == current_user.id).all()
    return leads

@app.post("/leads")
async def create_lead(lead_data: LeadCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = Lead(**lead_data.dict(), owner_id=current_user.id)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@app.get("/leads/{lead_id}")
async def get_lead(lead_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@app.patch("/leads/{lead_id}")
async def update_lead(lead_id: int, lead_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Handle stage parameter for backward compatibility
    if 'stage' in lead_data:
        lead.stage = lead_data['stage']
        # Update status based on stage
        if lead_data['stage'] in ["Closed-Won", "Closed-Lost"]:
            lead.status = "closed_won" if lead_data['stage'] == "Closed-Won" else "closed_lost"
    
    # Handle other fields
    for field, value in lead_data.items():
        if hasattr(lead, field) and field != 'stage':  # stage handled above
            # Convert datetime strings to Python datetime objects
            if field == 'expected_close_date' and isinstance(value, str) and value:
                try:
                    # Handle different datetime formats from frontend
                    if 'T' in value:
                        value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    else:
                        value = datetime.strptime(value, '%Y-%m-%d')
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid datetime format for {field}: {value}")
            setattr(lead, field, value)
    
    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    return lead

@app.delete("/leads/{lead_id}")
async def delete_lead(lead_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.owner_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}

# Activities endpoints
@app.get("/activities")
async def get_activities(lead_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Activity).filter(Activity.owner_id == current_user.id)
    if lead_id:
        query = query.filter(Activity.lead_id == lead_id)
    activities = query.order_by(Activity.occurred_at.desc()).all()
    return activities

@app.post("/activities")
async def create_activity(activity_data: ActivityCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = Activity(**activity_data.dict(), owner_id=current_user.id)
    if not activity.occurred_at:
        activity.occurred_at = datetime.utcnow()
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

@app.get("/activities/{activity_id}")
async def get_activity(activity_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.owner_id == current_user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@app.patch("/activities/{activity_id}")
async def update_activity(activity_id: int, activity_data: ActivityCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.owner_id == current_user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    for field, value in activity_data.dict(exclude_unset=True).items():
        setattr(activity, field, value)
    
    db.commit()
    db.refresh(activity)
    return activity

@app.delete("/activities/{activity_id}")
async def delete_activity(activity_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.owner_id == current_user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    db.delete(activity)
    db.commit()
    return {"message": "Activity deleted successfully"}

# Tasks endpoints
@app.get("/tasks")
async def get_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.owner_id == current_user.id).order_by(Task.due_at).all()
    return tasks

@app.post("/tasks")
async def create_task(task_data: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = Task(**task_data.dict(), owner_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.get("/tasks/{task_id}")
async def get_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.patch("/tasks/{task_id}")
async def update_task(task_id: int, task_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for field, value in task_data.items():
        if hasattr(task, field):
            # Convert datetime strings to Python datetime objects
            if field == 'due_at' and isinstance(value, str) and value:
                try:
                    # Handle datetime-local format from frontend (YYYY-MM-DDTHH:MM)
                    if len(value) == 16 and 'T' in value:
                        value = datetime.strptime(value, '%Y-%m-%dT%H:%M')
                    else:
                        value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid datetime format for {field}: {value}")
            setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
