from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserProfile(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "labeler"
    preferred_classes: Optional[List[str]] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_classes: Optional[List[str]] = []

class UserStats(BaseModel):
    user_id: str
    total_questions_labeled: int = 0
    total_annotations: int = 0
    accuracy_score: float = 100.0
    labels_today: int = 0
    labels_this_week: int = 0
    labels_this_month: int = 0
    average_time_per_question: Optional[float] = None
    last_active: Optional[datetime] = None
    streak_days: int = 0
    updated_at: Optional[datetime] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    aud: Optional[str] = None

class UserRole(BaseModel):
    role: str

class UserList(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    created_at: datetime
    last_active: Optional[datetime] = None