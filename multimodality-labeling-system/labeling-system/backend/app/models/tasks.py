# Add these new models to your existing app/models/tasks.py file
from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# New models for enhanced task creation

class FailureChoice(BaseModel):
    """Individual failure category configuration"""
    text: str
    options: List[str]
    multiple_select: bool = True
    
    @validator('options')
    def validate_options(cls, v):
        if not v or len(v) == 0:
            raise ValueError('options cannot be empty')
        if 'None' not in v:
            # Ensure 'None' is always an option
            v.insert(0, 'None')
        return v

class QuestionTemplate(BaseModel):
    """Template for generating questions"""
    question_text: str
    choices: Dict[str, FailureChoice]
    
    @validator('question_text')
    def validate_question_text(cls, v):
        if not v or not v.strip():
            raise ValueError('question_text cannot be empty')
        return v.strip()
    
    @validator('choices')
    def validate_choices(cls, v):
        if not v or len(v) == 0:
            raise ValueError('at least one failure category is required')
        return v

class MediaConfiguration(BaseModel):
    """Configuration for media sampling per question"""
    num_images: int = 0
    num_videos: int = 0
    num_audios: int = 0
    total_questions: int = 1
    
    @validator('num_images', 'num_videos', 'num_audios')
    def validate_media_counts(cls, v):
        if v < 0:
            raise ValueError('media counts cannot be negative')
        return v
    
    @validator('total_questions')
    def validate_total_questions(cls, v):
        if v <= 0:
            raise ValueError('total_questions must be positive')
        return v
    
    @validator('num_images')
    def validate_at_least_one_media_type(cls, v, values):
        # This will be called for each field, so we check the total when we have all values
        return v
    
    def __init__(self, **data):
        super().__init__(**data)
        total_media = self.num_images + self.num_videos + self.num_audios
        if total_media == 0:
            raise ValueError('at least one media type must be specified')

class TaskWithQuestionsCreate(BaseModel):
    """Enhanced task creation with question template and media config"""
    # Basic task info
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    example_media: List[str] = []
    
    # Task settings
    questions_number: int = 10
    required_agreements: int = 1
    deadline: Optional[datetime] = None
    
    # Question template (shared across all questions)
    question_template: QuestionTemplate
    
    # Media configuration (backend will randomly sample)
    media_config: MediaConfiguration
    
    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('title cannot be empty')
        return v.strip()
    
    @validator('questions_number')
    def validate_questions_number(cls, v):
        if v <= 0:
            raise ValueError('questions_number must be positive')
        return v
    
    @validator('required_agreements')
    def validate_required_agreements(cls, v):
        if v <= 0 or v > 10:
            raise ValueError('required_agreements must be between 1 and 10')
        return v

class TaskWithQuestions(BaseModel):
    """Response model for task with questions created"""
    # Basic task info
    id: str
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    example_media: List[str] = []
    status: str
    
    # Task settings
    questions_number: int
    required_agreements: int
    
    # Template and config
    question_template: QuestionTemplate
    media_config: MediaConfiguration
    
    # Metadata
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    

class MediaFile(BaseModel):
    """Individual media file information"""
    filename: str
    file_path: str
    media_type: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    duration_seconds: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    tags: List[str] = []
    key: Optional[str] = None
    metadata: Dict[str, Any] = {}

class MediaSampleRequest(BaseModel):
    """Request for sampling media files"""
    num_images: int = 0
    num_videos: int = 0
    num_audios: int = 0
    tags_filter: Optional[List[str]] = None
    exclude_used: bool = True
    
    @validator('num_images', 'num_videos', 'num_audios')
    def validate_counts(cls, v):
        if v < 0:
            raise ValueError('media counts cannot be negative')
        return v

class MediaSampleResponse(BaseModel):
    """Response with sampled media files"""
    sampled_media: List[MediaFile]
    total_available: Dict[str, int] = {}

class MediaAvailableResponse(BaseModel):
    """Response with all available media files"""
    images: List[MediaFile] = []
    videos: List[MediaFile] = []
    audios: List[MediaFile] = []
    total_counts: Dict[str, int] = {}

class QuestionWithMedia(BaseModel):
    """Question with its associated media files"""
    id: str
    task_id: str
    question_text: str
    question_order: int
    status: str
    target_classes: List[str]
    media_files: List[MediaFile]
    choices: Dict[str, FailureChoice]  # Inherited from template
    created_at: datetime
    updated_at: Optional[datetime] = None

class QuestionResponseDetailed(BaseModel):
    """Enhanced question response with full context"""
    id: str
    question_id: int
    user_id: str
    task_id: str
    task_assignment_id: str
    
    # Response data matching frontend structure
    responses: Dict[str, List[str]]  # e.g., {"A-type": ["A-Crack"], "B-type": ["None"]}
    
    # Additional metadata
    confidence_level: Optional[int] = None
    time_spent_seconds: Optional[int] = None
    started_at: Optional[datetime] = None
    submitted_at: datetime
    
    # Media files that were shown
    media_files: List[str] = []
    
    # Quality control
    is_honeypot_response: bool = False
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    metadata: Dict[str, Any] = {}

class QuestionResponseDetailedCreate(BaseModel):
    """Create detailed question response"""
    question_id: int
    task_id: str
    
    # Response data matching frontend structure  
    responses: Dict[str, List[str]]
    
    # Optional metadata
    confidence_level: Optional[int] = None
    time_spent_seconds: Optional[int] = None
    started_at: Optional[datetime] = None
    
    @validator('responses')
    def validate_responses(cls, v):
        if not v:
            raise ValueError('responses cannot be empty')
        
        # Validate that each category has at least one selection
        for category, selections in v.items():
            if not selections:
                raise ValueError(f'category {category} must have at least one selection')
        
        return v
    
    @validator('confidence_level')
    def validate_confidence_level(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError('confidence_level must be between 1 and 5')
        return v

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

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
class TaskStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active" 
    PAUSED = "paused"
    COMPLETED = "completed"


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


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    rule_image_path: Optional[str] = None
    rule_description: Optional[str] = None
    questions_number: int = 100
    required_agreements: int = 1
    deadline: Optional[datetime] = None

    @validator('questions_number')
    def validate_questions_number(cls, v):
        if v <= 0:
            raise ValueError('questions_number must be positive')
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
    questions_number: int
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
    questions_number: Optional[int] = None
    required_agreements: Optional[int] = None
    deadline: Optional[datetime] = None

class QuestionStatus(str, Enum):
    PENDING = "pending"
    LABELED = "labeled"
    REVIEWED = "reviewed"
    APPROVED = "approved"

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