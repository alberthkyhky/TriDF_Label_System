# app/services/__init__.py
"""
Service Layer Package

This package contains all business logic services partitioned by domain:
- LabelService: Label class management
- MediaService: Media file handling and sampling
- TaskService: Task creation and management
- AssignmentService: Task assignment management
- QuestionService: Question creation and media association
- ResponseService: Question response handling
- ExportService: Task response export functionality

Each service inherits from BaseService for common functionality.
"""

from .label_service import LabelService
from .media_service import MediaService
from .task_service import TaskService
from .assignment_service import AssignmentService
from .question_service import QuestionService
from .response_service import ResponseService
from .export_service import ExportService

# Create service instances
label_service = LabelService()
media_service = MediaService()
task_service = TaskService()
assignment_service = AssignmentService()
question_service = QuestionService()
response_service = ResponseService()
export_service = ExportService()

__all__ = [
    'LabelService', 'MediaService', 'TaskService', 
    'AssignmentService', 'QuestionService', 'ResponseService', 'ExportService',
    'label_service', 'media_service', 'task_service',
    'assignment_service', 'question_service', 'response_service', 'export_service'
]