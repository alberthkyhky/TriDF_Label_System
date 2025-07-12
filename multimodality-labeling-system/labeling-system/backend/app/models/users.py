from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    LABELER = "labeler" 
    REVIEWER = "reviewer"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.LABELER

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    preferred_classes: Optional[List[str]] = []

class UserInDB(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    preferred_classes: Optional[List[str]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True

class UserPublic(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    created_at: datetime
    last_active: Optional[datetime] = None

class UserPerformance(BaseModel):
    user_id: str
    total_questions_labeled: int
    accuracy_score: float
    average_time_per_question: Optional[float]
    labels_today: int
    labels_this_week: int
    labels_this_month: int
    streak_days: int