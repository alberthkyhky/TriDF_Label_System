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
            # Find the user's task assignment with assignment details
            assignments = self.supabase.table("task_assignments").select("*").eq("user_id", user_id).eq("task_id", response_data.task_id).execute()
            
            if not assignments.data:
                raise Exception("No task assignment found for user")
            
            assignment = assignments.data[0]
            assignment_id = assignment["id"]
            
            # Check if assignment is still active
            if not assignment.get("is_active", True):
                raise Exception("Assignment is not active")
            
            # Calculate assignment limits
            question_range_start = assignment.get("question_range_start", 1)
            question_range_end = assignment.get("question_range_end", 1)
            assignment_total = question_range_end - question_range_start + 1
            current_completed = assignment.get("completed_labels", 0)
            
            # Check if user has already completed their assignment
            if current_completed >= assignment_total:
                raise Exception(f"Assignment already completed. You have finished all {assignment_total} assigned questions.")
            
            # Check if this would exceed the assignment limit
            if current_completed + 1 > assignment_total:
                raise Exception(f"Cannot submit response. This would exceed your assigned question limit of {assignment_total} questions.")
            
            # Validate question_id is within assigned range (question_id is 0-based, ranges are 1-based)
            if response_data.question_id < (question_range_start - 1) or response_data.question_id >= question_range_end:
                raise Exception(f"Question {response_data.question_id + 1} is outside your assigned range ({question_range_start}-{question_range_end})")
            
            # Check if this specific question has already been answered
            existing_responses = self.supabase.table("question_responses").select("id").eq("task_assignment_id", assignment_id).eq("question_id", response_data.question_id).execute()
            is_update = bool(existing_responses.data)
            existing_response_id = existing_responses.data[0]["id"] if is_update else None
            
            # Create the response record
            response_dict = {
                "question_id": response_data.question_id,
                "user_id": user_id,
                "task_assignment_id": assignment_id,
                "selected_choices": [],  # Keep for backward compatibility
                "responses": response_data.responses,  # New structured format
                "confidence_level": response_data.confidence_level,
                "time_spent_seconds": response_data.time_spent_seconds,
                "metadata": {
                    "response_version": "2.0",
                    "frontend_structure": True
                }
            }
            
            if response_data.started_at:
                response_dict["started_at"] = response_data.started_at.isoformat()
            
            # Insert or update response based on whether it already exists
            if is_update:
                print(f"🔄 Updating existing response {existing_response_id}: {response_dict}")
                result = self.supabase.table("question_responses").update(response_dict).eq("id", existing_response_id).execute()
                print(f"✅ Response updated successfully: {result.data}")
                if not result.data:
                    raise Exception("Failed to update response")
            else:
                print(f"🔍 Inserting new response data: {response_dict}")
                result = self.supabase.table("question_responses").insert(response_dict).execute()
                print(f"✅ Response inserted successfully: {result.data}")
                if not result.data:
                    raise Exception("Failed to create response")
            
            created_response = result.data[0]
            
            # Update assignment progress (only for new responses, not updates)
            if not is_update:
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
                is_honeypot_response=created_response.get("is_honeypot_response", False),
                is_flagged=created_response.get("is_flagged", False),
                flag_reason=created_response.get("flag_reason"),
                metadata=created_response.get("metadata", {})
            )
            
        except Exception as e:
            print(e)
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
    
    async def get_user_response_for_question(self, user_id: str, task_id: str, question_id: int) -> Optional[QuestionResponseDetailed]:
        """Get user's existing response for a specific question"""
        try:
            # Get the task assignment
            assignments = self.supabase.table("task_assignments").select("id").eq("user_id", user_id).eq("task_id", task_id).execute()
            if not assignments.data:
                return None
            
            assignment_id = assignments.data[0]["id"]
            
            # Get the existing response
            result = self.supabase.table("question_responses").select("*").eq("task_assignment_id", assignment_id).eq("question_id", question_id).execute()
            
            if not result.data:
                return None
            
            response_data = result.data[0]
            
            return QuestionResponseDetailed(
                id=response_data["id"],
                question_id=response_data["question_id"],
                user_id=response_data["user_id"],
                task_id=task_id,
                task_assignment_id=response_data["task_assignment_id"],
                responses=response_data.get("responses", {}),
                confidence_level=response_data.get("confidence_level"),
                time_spent_seconds=response_data.get("time_spent_seconds"),
                started_at=response_data.get("started_at"),
                submitted_at=response_data["submitted_at"],
                is_honeypot_response=response_data.get("is_honeypot_response", False),
                is_flagged=response_data.get("is_flagged", False),
                flag_reason=response_data.get("flag_reason"),
                metadata=response_data.get("metadata", {})
            )
        except Exception as e:
            raise self._handle_supabase_error("fetching response for question", e)