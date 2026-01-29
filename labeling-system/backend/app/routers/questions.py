from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.auth.dependencies import get_current_user, require_admin
from app.utils.error_handling import handle_router_errors
from app.utils.access_control import require_task_access
from app.models.tasks import (
    Question, QuestionCreate, QuestionWithMedia
)
from app.services.question_service import QuestionService
from app.services.task_service import TaskService

# Create service instances
question_service = QuestionService()
task_service = TaskService()

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("/{task_id}/questions", response_model=List[Question])
@handle_router_errors
@require_task_access()
async def get_task_questions(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get questions for a task"""
    return await question_service.get_questions_for_task(task_id)


@router.get("/{task_id}/questions-with-media", response_model=List[QuestionWithMedia])
@handle_router_errors
@require_task_access()
async def get_task_questions_with_media(
    task_id: str,
    idx: Optional[int] = None,  # Optional index parameter
    current_user: dict = Depends(get_current_user)
):
    """Get questions for a task with locally sampled media files"""
    # Use the updated service method with idx parameter
    return await question_service.get_questions_with_media(task_id, idx=idx)


@router.post("/{task_id}/create-sample-media")
@handle_router_errors
async def create_sample_media_for_task(
    task_id: str,
    current_user: dict = Depends(require_admin)
):
    """Create sample media folder structure for a task (development only)"""
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


@router.post("/{task_id}/questions", response_model=Question)
@handle_router_errors
async def create_question(
    task_id: str,
    question_data: QuestionCreate,
    current_user: dict = Depends(require_admin)
):
    """Create question for task (admin only)"""
    # Verify task exists
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Ensure question_data has correct task_id
    question_data.task_id = task_id
    
    return await question_service.create_question(question_data)