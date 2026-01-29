from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.auth.dependencies import get_current_user
from app.utils.error_handling import handle_router_errors
from app.models.tasks import (
    QuestionResponse, QuestionResponseCreate,
    QuestionResponseDetailed, QuestionResponseDetailedCreate
)
from app.services.response_service import ResponseService

# Create service instances
response_service = ResponseService()

router = APIRouter(prefix="/responses", tags=["responses"])


@router.post("/", response_model=QuestionResponse)
@handle_router_errors
async def create_question_response(
    response_data: QuestionResponseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit response to a question"""
    return await response_service.create_question_response(
        response_data, 
        current_user["id"]
    )


@router.post("/detailed", response_model=QuestionResponseDetailed)
@handle_router_errors
async def create_detailed_question_response(
    response_data: QuestionResponseDetailedCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit detailed response to a question with enhanced data"""
    return await response_service.create_detailed_question_response(
        response_data, 
        current_user["id"]
    )


@router.get("/my", response_model=List[QuestionResponse])
@handle_router_errors
async def get_my_responses(
    task_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's question responses"""
    return await response_service.get_user_responses(current_user["id"], task_id)


@router.get("/my/question/{task_id}/{question_id}", response_model=Optional[QuestionResponseDetailed])
@handle_router_errors
async def get_my_response_for_question(
    task_id: str,
    question_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's existing response for a specific question"""
    return await response_service.get_user_response_for_question(
        current_user["id"], 
        task_id, 
        question_id
    )