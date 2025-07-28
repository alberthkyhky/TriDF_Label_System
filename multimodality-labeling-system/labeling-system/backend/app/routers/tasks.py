from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
import io
from app.auth.dependencies import get_current_user, require_admin
from app.utils.error_handling import handle_router_errors
from app.utils.access_control import require_task_access
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
from app.services.export_service import ExportService

# Create service instances (or use dependency injection)
label_service = LabelService()
media_service = MediaService()
task_service = TaskService()
assignment_service = AssignmentService()
question_service = QuestionService()
response_service = ResponseService()
export_service = ExportService()

router = APIRouter(prefix="/tasks", tags=["tasks"])

# ===== LABEL CLASSES =====
@router.get("/label-classes", response_model=List[LabelClass])
@handle_router_errors
async def get_label_classes(current_user: dict = Depends(get_current_user)):
    """Get all active label classes"""
    # Update last active
    await user_service.update_user_last_active(current_user["id"])
    
    return await label_service.get_label_classes()  # Changed from task_service

@router.post("/label-classes", response_model=LabelClass)
@handle_router_errors
async def create_label_class(
    label_class_data: LabelClassCreate,
    current_user: dict = Depends(require_admin)
):
    """Create new label class (admin only)"""
    return await label_service.create_label_class(label_class_data)  # Changed from task_service

@router.put("/label-classes/{class_id}", response_model=LabelClass)
@handle_router_errors
async def update_label_class(
    class_id: str,
    update_data: dict,
    current_user: dict = Depends(require_admin)
):
    """Update label class (admin only)"""
    return await label_service.update_label_class(class_id, update_data)  # Changed from task_service

@router.delete("/label-classes/{class_id}")
@handle_router_errors
async def delete_label_class(
    class_id: str,
    current_user: dict = Depends(require_admin)
):
    """Delete label class (admin only)"""
    success = await label_service.delete_label_class(class_id)  # Changed from task_service
    if success:
        return {"message": "Label class deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Failed to delete label class"
    )


# ===== TASKS =====
@router.get("/", response_model=List[Task])
@handle_router_errors
async def get_tasks(current_user: dict = Depends(get_current_user)):
    """Get tasks based on user role and assignments"""
    # Update last active
    await user_service.update_user_last_active(current_user["id"])
    
    return await task_service.get_tasks_for_user(
        current_user["id"], 
        current_user["role"]
    )

@router.get("/{task_id}", response_model=Task)
@handle_router_errors
@require_task_access()
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get task by ID"""
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task

@router.get("/{task_id}/enhanced", response_model=TaskWithQuestions)
@handle_router_errors
@require_task_access()
async def get_enhanced_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get enhanced task with questions information"""
    return await task_service.get_task_with_questions_by_id(task_id)

@router.post("/", response_model=Task)
@handle_router_errors
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(require_admin)
):
    """Create new basic task (admin only)"""
    return await task_service.create_task(task_data, current_user["id"])

@router.post("/with-questions", response_model=TaskWithQuestions)
@handle_router_errors
async def create_task_with_questions(
    task_data: TaskWithQuestionsCreate,
    current_user: dict = Depends(require_admin)
):
    """Create enhanced task with questions and media (admin only)"""
    return await task_service.create_task_with_questions(task_data, current_user["id"])

@router.put("/{task_id}", response_model=Task)
@handle_router_errors
async def update_task(
    task_id: str,
    update_data: TaskUpdate,
    current_user: dict = Depends(require_admin)
):
    """Update task (admin only)"""
    # Check if task exists
    existing_task = await task_service.get_task_by_id(task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return await task_service.update_task(task_id, update_data)

@router.delete("/{task_id}")
@handle_router_errors
async def delete_task(
    task_id: str,
    current_user: dict = Depends(require_admin)
):
    """Delete task (admin only)"""
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


# ===== TASK RESPONSE EXPORT =====
@router.get("/{task_id}/responses/export")
@handle_router_errors
async def export_task_responses(
    task_id: str,
    format: str = Query(default="csv", regex="^(csv|json)$"),
    current_user: dict = Depends(require_admin)
):
    """
    Export all responses for a specific task.
    
    Args:
        task_id: The ID of the task to export responses for
        format: Export format (csv or json)
        current_user: Current authenticated admin user
    
    Returns:
        StreamingResponse with the exported data
    """
    try:
        if format == "csv":
            content, filename = await export_service.export_task_responses_csv(task_id)
            media_type = "text/csv"
        else:  # json
            content, filename = await export_service.export_task_responses_json(task_id)
            media_type = "application/json"
        
        # Create file-like object from string content
        file_like = io.BytesIO(content.encode('utf-8'))
        
        return StreamingResponse(
            file_like,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        print(f"Error exporting task responses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Export failed: {str(e)}"
        )



