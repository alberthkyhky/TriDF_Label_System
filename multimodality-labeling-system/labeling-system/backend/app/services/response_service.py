# app/services/response_service.py
from typing import List, Optional
from app.services.base_service import BaseService
from app.services.assignment_service import AssignmentService
from app.models.tasks import (
    QuestionResponse, QuestionResponseCreate, 
    QuestionResponseDetailed, QuestionResponseDetailedCreate
)

class ResponseService(BaseService):
    """Service for managing question responses"""
    
    def __init__(self):
        super().__init__()
        self.assignment_service = AssignmentService()
    
    async def create_question_response(self, response_data: QuestionResponseCreate, user_id: str) -> QuestionResponse:
        """Create question response"""
        try:
            response_dict = response_data.dict()
            response_dict["user_id"] = user_id
            
            if response_dict.get("started_at"):
                response_dict["started_at"] = response_dict["started_at"].isoformat()
            
            result = self.supabase.table("question_responses").insert(response_dict).execute()
            if result.data:
                return QuestionResponse(**result.data[0])
            raise Exception("Failed to create response")
        except Exception as e:
            raise self._handle_supabase_error("creating response", e)
    
    async def create_detailed_question_response(self, response_data: QuestionResponseDetailedCreate, user_id: str) -> QuestionResponseDetailed:
        """Create a detailed question response with structured data"""
        try:
            # Find the user's task assignment
            assignments = self.supabase.table("task_assignments").select("id").eq("user_id", user_id).eq("task_id", response_data.task_id).execute()
            
            if not assignments.data:
                raise Exception("No task assignment found for user")
            
            assignment_id = assignments.data[0]["id"]
            
            # Create the response record
            response_dict = {
                "question_id": response_data.question_id,
                "user_id": user_id,
                "task_assignment_id": assignment_id,
                "selected_choices": [],  # Keep for backward compatibility
                "responses": response_data.responses,  # New structured format
                "media_files": response_data.media_files,
                "confidence_level": response_data.confidence_level,
                "time_spent_seconds": response_data.time_spent_seconds,
                "metadata": {
                    "response_version": "2.0",
                    "frontend_structure": True
                }
            }
            
            if response_data.started_at:
                response_dict["started_at"] = response_data.started_at.isoformat()
            
            # Insert response
            result = self.supabase.table("question_responses").insert(response_dict).execute()
            if not result.data:
                raise Exception("Failed to create response")
            
            created_response = result.data[0]
            
            # Update assignment progress
            await self.assignment_service.update_assignment_progress_from_response(assignment_id)
            
            return QuestionResponseDetailed(
                id=created_response["id"],
                question_id=created_response["question_id"],
                user_id=created_response["user_id"],
                task_id=response_data.task_id,
                task_assignment_id=created_response["task_assignment_id"],
                responses=response_data.responses,
                confidence_level=created_response.get("confidence_level"),
                time_spent_seconds=created_response.get("time_spent_seconds"),
                started_at=created_response.get("started_at"),
                submitted_at=created_response["submitted_at"],
                media_files=response_data.media_files,
                is_honeypot_response=created_response.get("is_honeypot_response", False),
                is_flagged=created_response.get("is_flagged", False),
                flag_reason=created_response.get("flag_reason"),
                metadata=created_response.get("metadata", {})
            )
            
        except Exception as e:
            raise self._handle_supabase_error("creating detailed response", e)
    
    async def get_user_responses(self, user_id: str, task_id: Optional[str] = None) -> List[QuestionResponse]:
        """Get user's question responses"""
        try:
            query = self.supabase.table("question_responses").select("*").eq("user_id", user_id)
            
            if task_id:
                # Filter by task through task_assignment
                assignments = self.supabase.table("task_assignments").select("id").eq("user_id", user_id).eq("task_id", task_id).execute()
                assignment_ids = [a["id"] for a in assignments.data]
                if assignment_ids:
                    query = query.in_("task_assignment_id", assignment_ids)
                else:
                    return []
            
            result = query.order("submitted_at", desc=True).execute()
            return [QuestionResponse(**response) for response in result.data]
        except Exception as e:
            raise self._handle_supabase_error("fetching responses", e)