from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.auth.dependencies import get_current_user
from app.models.tasks import (
    QuestionResponse, QuestionResponseCreate,
    QuestionResponseDetailed, QuestionResponseDetailedCreate
)
from app.services.response_service import ResponseService

# Create service instances
response_service = ResponseService()

router = APIRouter(prefix="/responses", tags=["responses"])


@router.post("/", response_model=QuestionResponse)
async def create_question_response(
    response_data: QuestionResponseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit response to a question"""
    try:
        return await response_service.create_question_response(
            response_data, 
            current_user["id"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/detailed", response_model=QuestionResponseDetailed)
async def create_detailed_question_response(
    response_data: QuestionResponseDetailedCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit detailed response to a question with enhanced data"""
    try:
        return await response_service.create_detailed_question_response(
            response_data, 
            current_user["id"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/my", response_model=List[QuestionResponse])
async def get_my_responses(
    task_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's question responses"""
    try:
        return await response_service.get_user_responses(current_user["id"], task_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )