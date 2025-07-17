# app/routers/assignments.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from typing import List, Optional
from app.auth.dependencies import require_admin, get_current_user
from app.services.assignment_service import AssignmentService
from app.services.task_service import TaskService
from app.services.user_service import user_service
from app.models.tasks import TaskAssignment, TaskAssignmentRequest
from pydantic import BaseModel

# Create service instances
task_service = TaskService()
assignment_service = AssignmentService()

router = APIRouter(prefix="/assignments", tags=["assignments"])

class AssignmentStatusUpdate(BaseModel):
    is_active: bool

@router.get("/all")
async def get_all_assignments(
    current_user: dict = Depends(require_admin),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get all assignments with user and task details (admin only)"""
    try:
        return await assignment_service.get_all_assignments_with_details(limit, offset)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching assignments: {str(e)}"
        )

@router.get("/stats")
async def get_assignment_statistics(
    current_user: dict = Depends(require_admin)
):
    """Get assignment statistics (admin only)"""
    try:
        return await assignment_service.get_assignment_stats()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching stats: {str(e)}"
        )

@router.get("/{assignment_id}")
async def get_assignment_details(
    assignment_id: str,
    current_user: dict = Depends(require_admin)
):
    """Get assignment details (admin only)"""
    try:
        assignment = await assignment_service.get_assignment_with_details(assignment_id)
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        return assignment
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching assignment: {str(e)}"
        )

@router.put("/{assignment_id}/status")
async def update_assignment_status(
    assignment_id: str,
    status_update: AssignmentStatusUpdate,
    current_user: dict = Depends(require_admin)
):
    """Update assignment status (admin only)"""
    try:
        success = await assignment_service.update_assignment_status(
            assignment_id, 
            status_update.is_active
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        return {"message": "Assignment status updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating assignment: {str(e)}"
        )

@router.get("/export")
async def export_assignments(
    format: str = Query("csv", regex="^(csv|json)$"),
    current_user: dict = Depends(require_admin)
):
    """Export assignments data (admin only)"""
    try:
        if format == "csv":
            data = await assignment_service.export_assignments_csv()
            return Response(
                content=data,
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=assignments.csv"}
            )
        else:
            data = await assignment_service.export_assignments_json()
            return Response(
                content=data,
                media_type="application/json",
                headers={"Content-Disposition": "attachment; filename=assignments.json"}
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting assignments: {str(e)}"
        )


# ===== TASK-SPECIFIC ASSIGNMENT ENDPOINTS =====

@router.get("/my", response_model=List[TaskAssignment])
async def get_my_assignments(current_user: dict = Depends(get_current_user)):
    """Get current user's task assignments"""
    try:
        # Update last active
        print(current_user)
        
        await user_service.update_user_last_active(current_user["id"])
        return await assignment_service.get_user_assignments(current_user["id"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/task/{task_id}/assign", response_model=TaskAssignment)
async def assign_task(
    task_id: str,
    assignment_data: TaskAssignmentRequest,
    current_user: dict = Depends(require_admin)
):
    """Assign task to user (admin only)"""
    try:
        return await assignment_service.create_task_assignment(assignment_data, task_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{assignment_id}/progress")
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


@router.get("/task/{task_id}", response_model=TaskAssignment)
async def get_task_assignments(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's assignment for a specific task"""
    try:
        # Update last active
        await user_service.update_user_last_active(current_user["id"])
        
        # Verify task exists
        task = await task_service.get_task_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if user has access to this task (unless admin)
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
        
        # Get assignment for this task and current user
        assignment = await assignment_service.get_task_assignment_for_user(
            task_id=task_id, 
            user_id=current_user["id"]
        )
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No assignment found for this task"
            )
        
        return assignment
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )