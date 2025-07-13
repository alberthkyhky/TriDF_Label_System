# app/routers/assignments.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from typing import List, Optional
from app.auth.dependencies import require_admin, get_current_user
from app.services.assignment_service import assignment_service
from pydantic import BaseModel

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