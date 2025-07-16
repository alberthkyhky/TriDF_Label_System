from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.auth.dependencies import get_current_user, require_admin
from app.models.tasks import (
    Task, TaskCreate, TaskUpdate, TaskAssignment, TaskAssignmentRequest,
    LabelClass, LabelClassCreate, Question, QuestionCreate,
    QuestionResponse, QuestionResponseCreate,
    # Add new enhanced models if you want to use the new features
    TaskWithQuestionsCreate, TaskWithQuestions, QuestionWithMedia,
    MediaSampleRequest, MediaSampleResponse, MediaAvailableResponse,
    QuestionResponseDetailedCreate, QuestionResponseDetailed
)

# Import the new partitioned services
from app.services.label_service import LabelService
from app.services.media_service import MediaService
from app.services.task_service import TaskService
from app.services.assignment_service import AssignmentService
from app.services.question_service import QuestionService
from app.services.response_service import ResponseService
from app.services.user_service import user_service
import re
from pathlib import Path
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Create service instances (or use dependency injection)
label_service = LabelService()
media_service = MediaService()
task_service = TaskService()
assignment_service = AssignmentService()
question_service = QuestionService()
response_service = ResponseService()

router = APIRouter(prefix="/tasks", tags=["tasks"])

class MediaFileRequest(BaseModel):
    file_path: str

# ===== LABEL CLASSES =====
@router.get("/label-classes", response_model=List[LabelClass])
async def get_label_classes(current_user: dict = Depends(get_current_user)):
    """Get all active label classes"""
    try:
        # Update last active
        await user_service.update_user_last_active(current_user["id"])
        
        return await label_service.get_label_classes()  # Changed from task_service
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/label-classes", response_model=LabelClass)
async def create_label_class(
    label_class_data: LabelClassCreate,
    current_user: dict = Depends(require_admin)
):
    """Create new label class (admin only)"""
    try:
        return await label_service.create_label_class(label_class_data)  # Changed from task_service
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/label-classes/{class_id}", response_model=LabelClass)
async def update_label_class(
    class_id: str,
    update_data: dict,
    current_user: dict = Depends(require_admin)
):
    """Update label class (admin only)"""
    try:
        return await label_service.update_label_class(class_id, update_data)  # Changed from task_service
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/label-classes/{class_id}")
async def delete_label_class(
    class_id: str,
    current_user: dict = Depends(require_admin)
):
    """Delete label class (admin only)"""
    try:
        success = await label_service.delete_label_class(class_id)  # Changed from task_service
        if success:
            return {"message": "Label class deleted successfully"}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete label class"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ===== MEDIA MANAGEMENT =====
@router.get("/media/available", response_model=MediaAvailableResponse)
async def get_available_media(current_user: dict = Depends(require_admin)):
    """Get all available media files (admin only)"""
    try:
        return await media_service.get_available_media()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/media/sample", response_model=MediaSampleResponse)
async def sample_media_files(
    request: MediaSampleRequest,
    current_user: dict = Depends(require_admin)
):
    """Sample specific quantities of media files (admin only)"""
    try:
        return await media_service.sample_media_files(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/media/create-samples")
async def create_sample_media_files(current_user: dict = Depends(require_admin)):
    """Create sample media files for testing (admin only)"""
    try:
        await media_service.create_sample_media_files()
        return {"message": "Sample media files created successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ===== TASKS =====
@router.get("/", response_model=List[Task])
async def get_tasks(current_user: dict = Depends(get_current_user)):
    """Get tasks based on user role and assignments"""
    try:
        # Update last active
        await user_service.update_user_last_active(current_user["id"])
        
        return await task_service.get_tasks_for_user(
            current_user["id"], 
            current_user["role"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{task_id}", response_model=Task)
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get task by ID"""
    try:
        task = await task_service.get_task_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if user has access to this task
        if current_user["role"] != "admin":
            user_tasks = await task_service.get_tasks_for_user(
                current_user["id"], 
                current_user["role"]
            )
            task_ids = [t.id for t in user_tasks]
            if task_id not in task_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this task"
                )
        
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{task_id}/enhanced", response_model=TaskWithQuestions)
async def get_enhanced_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get enhanced task with questions information"""
    try:
        # Check access permissions first
        if current_user["role"] != "admin":
            user_tasks = await task_service.get_tasks_for_user(
                current_user["id"], 
                current_user["role"]
            )
            task_ids = [t.id for t in user_tasks]
            if task_id not in task_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this task"
                )
        
        return await task_service.get_task_with_questions_by_id(task_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/", response_model=Task)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(require_admin)
):
    """Create new basic task (admin only)"""
    try:
        return await task_service.create_task(task_data, current_user["id"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/with-questions", response_model=TaskWithQuestions)
async def create_task_with_questions(
    task_data: TaskWithQuestionsCreate,
    current_user: dict = Depends(require_admin)
):
    """Create enhanced task with questions and media (admin only)"""
    try:
        return await task_service.create_task_with_questions(task_data, current_user["id"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    update_data: TaskUpdate,
    current_user: dict = Depends(require_admin)
):
    """Update task (admin only)"""
    try:
        # Check if task exists
        existing_task = await task_service.get_task_by_id(task_id)
        if not existing_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return await task_service.update_task(task_id, update_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: dict = Depends(require_admin)
):
    """Delete task (admin only)"""
    try:
        # Check if task exists
        existing_task = await task_service.get_task_by_id(task_id)
        if not existing_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        success = await task_service.delete_task(task_id)
        if success:
            return {"message": "Task deleted successfully"}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete task"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ===== TASK ASSIGNMENTS =====
@router.get("/assignments/my", response_model=List[TaskAssignment])
async def get_my_assignments(current_user: dict = Depends(get_current_user)):
    """Get current user's task assignments"""
    try:
        # Update last active
        await user_service.update_user_last_active(current_user["id"])
        
        return await assignment_service.get_user_assignments(current_user["id"])  # Changed from task_service
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{task_id}/assign", response_model=TaskAssignment)
async def assign_task(
    task_id: str,
    assignment_data: TaskAssignmentRequest,
    current_user: dict = Depends(require_admin)
):
    """Assign task to user (admin only)"""
    try:
        return await assignment_service.create_task_assignment(assignment_data, task_id)  # Changed from task_service
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/assignments/{assignment_id}/progress")
async def update_assignment_progress(
    assignment_id: str,
    completed_labels: int,
    current_user: dict = Depends(require_admin)
):
    """Update assignment progress (admin only)"""
    try:
        assignment = await assignment_service.update_assignment_progress(assignment_id, completed_labels)
        return {"message": "Assignment progress updated", "assignment": assignment}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{task_id}/assignments", response_model=List[TaskAssignment])
async def get_task_assignments(
    task_id: str,
    current_user: dict = Depends(require_admin)
):
    """Get all assignments for a task (admin only)"""
    try:
        # This would need to be implemented in assignment_service
        # For now, return empty list
        return []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ===== QUESTIONS =====
@router.get("/{task_id}/questions", response_model=List[Question])
async def get_task_questions(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get questions for a task"""
    try:
        # Check if user has access to this task
        if current_user["role"] != "admin":
            user_tasks = await task_service.get_tasks_for_user(
                current_user["id"], 
                current_user["role"]
            )
            task_ids = [t.id for t in user_tasks]
            if task_id not in task_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this task"
                )
        
        return await question_service.get_questions_for_task(task_id)  # Changed from task_service
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{task_id}/questions-with-media", response_model=List[QuestionWithMedia])
async def get_task_questions_with_media(
    task_id: str,
    idx: Optional[int] = None,  # NEW: Optional index parameter
    current_user: dict = Depends(get_current_user)
):
    """Get questions for a task with locally sampled media files"""
    try:
        # Check if user has access to this task
        if current_user["role"] != "admin":
            user_tasks = await task_service.get_tasks_for_user(
                current_user["id"], 
                current_user["role"]
            )
            task_ids = [t.id for t in user_tasks]
            if task_id not in task_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this task"
                )
        
        # Use the updated service method with idx parameter
        return await question_service.get_questions_with_media(task_id, idx=idx)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Add a helper endpoint for creating sample media (development only)
@router.post("/{task_id}/create-sample-media")
async def create_sample_media_for_task(
    task_id: str,
    current_user: dict = Depends(require_admin)
):
    """Create sample media folder structure for a task (development only)"""
    try:
        # Get task to get task name
        task = await task_service.get_task_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Create sample media structure
        await question_service.create_sample_media_structure_for_task(
            task_name=task.title,
            num_files_per_type=5  # Create 5 of each type
        )
        
        return {
            "message": f"Sample media structure created for task: {task.title}",
            "folder_path": f"uploads/{question_service._sanitize_folder_name(task.title)}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{task_id}/questions", response_model=Question)
async def create_question(
    task_id: str,
    question_data: QuestionCreate,
    current_user: dict = Depends(require_admin)
):
    """Create question for task (admin only)"""
    try:
        # Verify task exists
        task = await task_service.get_task_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Ensure question_data has correct task_id
        question_data.task_id = task_id
        
        return await question_service.create_question(question_data)  # Changed from task_service
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{task_id}/media")
async def serve_media_file_by_path(
    task_id: str,
    request: MediaFileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Serve media files using absolute file path (POST method)"""
    try:
        # Get task to verify access
        task = await task_service.get_task_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if user has access to this task
        if current_user["role"] != "admin":
            user_tasks = await task_service.get_tasks_for_user(
                current_user["id"], 
                current_user["role"]
            )
            task_ids = [t.id for t in user_tasks]
            if task_id not in task_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this task"
                )
        
        # Validate and resolve file path
        file_path = Path(request.file_path)
        
        # Security: Ensure the file path is within allowed directories
        # You can customize these allowed base paths
        allowed_base_paths = [
            Path("uploads").resolve(),
            Path("/uploads").resolve() if Path("/uploads").exists() else None,
            # Add other allowed base paths as needed
        ]
        allowed_base_paths = [p for p in allowed_base_paths if p is not None]
        
        # Check if the file path is within allowed directories
        file_path_resolved = file_path.resolve()
        is_allowed = any(
            str(file_path_resolved).startswith(str(base_path))
            for base_path in allowed_base_paths
        )

        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: File path not in allowed directories"
            )
        
        # Check if file exists
        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Media file not found: {request.file_path}"
            )
        
        # Determine media type for proper headers
        media_types = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.bmp': 'image/bmp',
            '.mp4': 'video/mp4', '.avi': 'video/x-msvideo', '.mov': 'video/quicktime',
            '.wmv': 'video/x-ms-wmv', '.flv': 'video/x-flv',
            '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.flac': 'audio/flac',
            '.aac': 'audio/aac', '.ogg': 'audio/ogg'
        }
        
        file_extension = file_path.suffix.lower()
        media_type = media_types.get(file_extension, 'application/octet-stream')
        
        # Return the file
        return FileResponse(
            path=str(file_path_resolved),
            media_type=media_type,
            filename=file_path.name,
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error serving media file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serving media file: {str(e)}"
        )

def _sanitize_folder_name(task_name: str) -> str:
    """Sanitize task name to be used as folder name"""
    sanitized = re.sub(r'[^\w\s-]', '', task_name)
    sanitized = re.sub(r'[-\s]+', '_', sanitized)
    return sanitized.strip('_')

# Optional: Endpoint to check if media file exists
@router.head("/media/{task_id}/{filename}")
async def check_media_file(
    task_id: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if media file exists (HEAD request)"""
    # Same logic as serve_media_file but return just headers
    try:
        task = await task_service.get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
        sanitized_task_name = _sanitize_folder_name(task.title)
        file_path = Path("uploads") / sanitized_task_name / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        
        return {"status": "exists", "size": file_path.stat().st_size}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ===== QUESTION RESPONSES =====
@router.post("/responses", response_model=QuestionResponse)
async def create_question_response(
    response_data: QuestionResponseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit response to a question"""
    try:
        return await response_service.create_question_response(  # Changed from task_service
            response_data, 
            current_user["id"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/responses/detailed", response_model=QuestionResponseDetailed)
async def create_detailed_question_response(
    response_data: QuestionResponseDetailedCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit detailed response to a question with enhanced data"""
    try:
        return await response_service.create_detailed_question_response(  # New enhanced method
            response_data, 
            current_user["id"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/responses/my", response_model=List[QuestionResponse])
async def get_my_responses(
    task_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's question responses"""
    try:
        return await response_service.get_user_responses(current_user["id"], task_id)  # Changed from task_service
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

