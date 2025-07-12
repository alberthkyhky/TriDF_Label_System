from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.auth.dependencies import get_current_user, require_admin
from app.models.tasks import (
    Task, TaskCreate, TaskUpdate, TaskAssignment, TaskAssignmentRequest,
    LabelClass, LabelClassCreate, Question, QuestionCreate,
    QuestionResponse, QuestionResponseCreate
)
from app.services.task_service import task_service
from app.services.user_service import user_service

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Label Classes
@router.get("/label-classes", response_model=List[LabelClass])
async def get_label_classes(current_user: dict = Depends(get_current_user)):
    """Get all active label classes"""
    try:
        # Update last active
        await user_service.update_user_last_active(current_user["id"])
        
        return await task_service.get_label_classes()
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
        return await task_service.create_label_class(label_class_data)
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
        return await task_service.update_label_class(class_id, update_data)
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
        success = await task_service.delete_label_class(class_id)
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

# Tasks
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

@router.post("/", response_model=Task)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(require_admin)
):
    """Create new task (admin only)"""
    try:
        return await task_service.create_task(task_data, current_user["id"])
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

# Task Assignments
@router.get("/assignments/my", response_model=List[TaskAssignment])
async def get_my_assignments(current_user: dict = Depends(get_current_user)):
    """Get current user's task assignments"""
    try:
        # Update last active
        await user_service.update_user_last_active(current_user["id"])
        
        return await task_service.get_user_assignments(current_user["id"])
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
        return await task_service.create_task_assignment(assignment_data, task_id)
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
        # This would need to be implemented in task_service
        # For now, return empty list
        return []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Questions
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
        
        return await task_service.get_questions_for_task(task_id)
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
        
        return await task_service.create_question(question_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Question Responses
@router.post("/responses", response_model=QuestionResponse)
async def create_question_response(
    response_data: QuestionResponseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit response to a question"""
    try:
        return await task_service.create_question_response(
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
    task_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's question responses"""
    try:
        return await task_service.get_user_responses(current_user["id"], task_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )