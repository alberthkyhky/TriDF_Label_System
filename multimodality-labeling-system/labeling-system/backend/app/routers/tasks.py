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

# Create service instances (or use dependency injection)
label_service = LabelService()
media_service = MediaService()
task_service = TaskService()
assignment_service = AssignmentService()
question_service = QuestionService()
response_service = ResponseService()

router = APIRouter(prefix="/tasks", tags=["tasks"])

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





