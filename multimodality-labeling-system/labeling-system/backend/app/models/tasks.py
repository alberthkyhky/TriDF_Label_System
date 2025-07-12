from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active" 
    PAUSED = "paused"
    COMPLETED = "completed"

class QuestionStatus(str, Enum):
    PENDING = "pending"
    LABELED = "labeled"
    REVIEWED = "reviewed"
    APPROVED = "approved"

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"

class LabelClass(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    color_hex: str = "#667eea"
    is_active: bool = True
    created_at: Optional[datetime] = None

class LabelClassCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color_hex: str = "#667eea"
    is_active: bool = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    rule_image_path: Optional[str] = None
    rule_description: Optional[str] = None
    questions_per_user: int = 100
    required_agreements: int = 1
    deadline: Optional[datetime] = None

    @validator('questions_per_user')
    def validate_questions_per_user(cls, v):
        if v <= 0:
            raise ValueError('questions_per_user must be positive')
        return v

    @validator('required_agreements')
    def validate_required_agreements(cls, v):
        if v <= 0 or v > 10:
            raise ValueError('required_agreements must be between 1 and 10')
        return v

class Task(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    rule_image_path: Optional[str] = None
    rule_description: Optional[str] = None
    questions_per_user: int
    required_agreements: int
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    metadata: Optional[dict] = {}

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    rule_image_path: Optional[str] = None
    rule_description: Optional[str] = None
    questions_per_user: Optional[int] = None
    required_agreements: Optional[int] = None
    deadline: Optional[datetime] = None

class TaskAssignmentRequest(BaseModel):
    user_id_to_assign: str
    assigned_classes: List[str]
    target_labels: int

    @validator('target_labels')
    def validate_target_labels(cls, v):
        if v <= 0:
            raise ValueError('target_labels must be positive')
        return v

    @validator('assigned_classes')
    def validate_assigned_classes(cls, v):
        if not v:
            raise ValueError('assigned_classes cannot be empty')
        return v

class TaskAssignment(BaseModel):
    id: str
    task_id: str
    user_id: str
    assigned_classes: List[str]
    target_labels: int
    completed_labels: int = 0
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    is_active: bool = True

class Question(BaseModel):
    id: str
    task_id: str
    question_text: Optional[str] = None
    question_order: int
    status: QuestionStatus
    target_classes: List[str]
    created_at: datetime
    updated_at: Optional[datetime] = None

class QuestionCreate(BaseModel):
    task_id: str
    question_text: Optional[str] = None
    question_order: int
    target_classes: List[str]

class QuestionMedia(BaseModel):
    id: str
    question_id: str
    file_path: str
    media_type: MediaType
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    display_order: int = 1
    duration_seconds: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    uploaded_at: datetime
    metadata: Optional[dict] = {}

class AnswerChoice(BaseModel):
    id: str
    question_id: str
    label_class_id: Optional[str] = None
    choice_text: str
    choice_value: str
    display_order: int = 1
    is_correct: Optional[bool] = None
    created_at: datetime

class AnswerChoiceCreate(BaseModel):
    question_id: str
    label_class_id: Optional[str] = None
    choice_text: str
    choice_value: str
    display_order: int = 1
    is_correct: Optional[bool] = None

class QuestionResponse(BaseModel):
    id: str
    question_id: str
    user_id: str
    task_assignment_id: str
    selected_choices: List[str]
    confidence_level: Optional[int] = None
    time_spent_seconds: Optional[int] = None
    started_at: Optional[datetime] = None
    submitted_at: datetime
    is_honeypot_response: bool = False
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    metadata: Optional[dict] = {}

class QuestionResponseCreate(BaseModel):
    question_id: str
    task_assignment_id: str
    selected_choices: List[str]
    confidence_level: Optional[int] = None
    time_spent_seconds: Optional[int] = None
    started_at: Optional[datetime] = None

    @validator('confidence_level')
    def validate_confidence_level(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError('confidence_level must be between 1 and 5')
        return v

    @validator('selected_choices')
    def validate_selected_choices(cls, v):
        if not v:
            raise ValueError('selected_choices cannot be empty')
        return v