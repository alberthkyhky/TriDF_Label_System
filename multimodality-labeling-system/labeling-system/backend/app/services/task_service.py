from app.database import get_supabase_client
from app.models.tasks import (
    Task, TaskCreate, TaskUpdate, TaskAssignment, TaskAssignmentRequest,
    LabelClass, LabelClassCreate, Question, QuestionCreate,
    QuestionResponse, QuestionResponseCreate
)
from typing import List, Optional
from datetime import datetime

class TaskService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    # Label Classes
    async def get_label_classes(self, active_only: bool = True) -> List[LabelClass]:
        """Get all label classes"""
        try:
            query = self.supabase.table("label_classes").select("*")
            if active_only:
                query = query.eq("is_active", True)
            
            result = query.execute()
            return [LabelClass(**item) for item in result.data]
        except Exception as e:
            raise Exception(f"Error fetching label classes: {str(e)}")
    
    async def create_label_class(self, label_class_data: LabelClassCreate) -> LabelClass:
        """Create new label class"""
        try:
            result = self.supabase.table("label_classes").insert(label_class_data.dict()).execute()
            if result.data:
                return LabelClass(**result.data[0])
            raise Exception("Failed to create label class")
        except Exception as e:
            raise Exception(f"Error creating label class: {str(e)}")
    
    async def update_label_class(self, class_id: str, update_data: dict) -> LabelClass:
        """Update label class"""
        try:
            result = self.supabase.table("label_classes").update(update_data).eq("id", class_id).execute()
            if result.data:
                return LabelClass(**result.data[0])
            raise Exception("Failed to update label class")
        except Exception as e:
            raise Exception(f"Error updating label class: {str(e)}")
    
    async def delete_label_class(self, class_id: str) -> bool:
        """Soft delete label class"""
        try:
            self.supabase.table("label_classes").update({"is_active": False}).eq("id", class_id).execute()
            return True
        except Exception as e:
            raise Exception(f"Error deleting label class: {str(e)}")
    
    # Tasks
    async def get_tasks_for_user(self, user_id: str, user_role: str) -> List[Task]:
        """Get tasks based on user role and assignments"""
        try:
            if user_role == "admin":
                # Admins see all tasks
                result = self.supabase.table("tasks").select("*").execute()
            else:
                # Get tasks user created or is assigned to
                assignments = self.supabase.table("task_assignments").select("task_id").eq("user_id", user_id).execute()
                assigned_task_ids = [a["task_id"] for a in assignments.data]
                
                if assigned_task_ids:
                    result = self.supabase.table("tasks").select("*").or_(
                        f"created_by.eq.{user_id},id.in.({','.join(assigned_task_ids)})"
                    ).execute()
                else:
                    result = self.supabase.table("tasks").select("*").eq("created_by", user_id).execute()
            
            return [Task(**task) for task in result.data]
        except Exception as e:
            raise Exception(f"Error fetching tasks: {str(e)}")
    
    async def get_task_by_id(self, task_id: str) -> Optional[Task]:
        """Get task by ID"""
        try:
            result = self.supabase.table("tasks").select("*").eq("id", task_id).execute()
            if result.data:
                return Task(**result.data[0])
            return None
        except Exception as e:
            raise Exception(f"Error fetching task: {str(e)}")
    
    async def create_task(self, task_data: TaskCreate, created_by: str) -> Task:
        """Create new task"""
        try:
            task_dict = task_data.dict()
            task_dict["created_by"] = created_by
            task_dict["status"] = "draft"
            
            # Convert datetime to ISO string if present
            if task_dict.get("deadline"):
                task_dict["deadline"] = task_dict["deadline"].isoformat()
            
            result = self.supabase.table("tasks").insert(task_dict).execute()
            if result.data:
                return Task(**result.data[0])
            raise Exception("Failed to create task")
        except Exception as e:
            raise Exception(f"Error creating task: {str(e)}")
    
    async def update_task(self, task_id: str, update_data: TaskUpdate) -> Task:
        """Update task"""
        try:
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
            if not update_dict:
                return await self.get_task_by_id(task_id)
            
            # Convert datetime to ISO string if present
            if update_dict.get("deadline"):
                update_dict["deadline"] = update_dict["deadline"].isoformat()
            
            result = self.supabase.table("tasks").update(update_dict).eq("id", task_id).execute()
            if result.data:
                return Task(**result.data[0])
            raise Exception("Failed to update task")
        except Exception as e:
            raise Exception(f"Error updating task: {str(e)}")
    
    async def delete_task(self, task_id: str) -> bool:
        """Delete task and related data"""
        try:
            # Delete in order: responses -> assignments -> questions -> task
            self.supabase.table("question_responses").delete().eq("task_assignment_id.in.(select id from task_assignments where task_id = '{}')".format(task_id)).execute()
            self.supabase.table("task_assignments").delete().eq("task_id", task_id).execute()
            self.supabase.table("questions").delete().eq("task_id", task_id).execute()
            self.supabase.table("tasks").delete().eq("id", task_id).execute()
            return True
        except Exception as e:
            raise Exception(f"Error deleting task: {str(e)}")
    
    # Task Assignments
    async def get_user_assignments(self, user_id: str, active_only: bool = True) -> List[TaskAssignment]:
        """Get user's task assignments"""
        try:
            query = self.supabase.table("task_assignments").select("*").eq("user_id", user_id)
            if active_only:
                query = query.eq("is_active", True)
            
            result = query.execute()
            return [TaskAssignment(**assignment) for assignment in result.data]
        except Exception as e:
            raise Exception(f"Error fetching assignments: {str(e)}")
    
    async def create_task_assignment(self, assignment_data: TaskAssignmentRequest, task_id: str) -> TaskAssignment:
        """Create task assignment"""
        try:
            # Validate task exists
            task = await self.get_task_by_id(task_id)
            if not task:
                raise Exception("Task not found")
            
            # Validate user exists
            user_check = self.supabase.table("user_profiles").select("id").eq("id", assignment_data.user_id_to_assign).execute()
            if not user_check.data:
                raise Exception("User not found")

            # Convert label class names to IDs if necessary
            assigned_class_ids = []
            if assignment_data.assigned_classes:
                # Check if we're receiving names or IDs
                first_class = assignment_data.assigned_classes[0]
                
                # Simple check: if it looks like a UUID, assume they're all IDs
                import uuid
                try:
                    uuid.UUID(first_class)
                    # They're already UUIDs/IDs, use as-is
                    assigned_class_ids = assignment_data.assigned_classes
                    class_check = self.supabase.table("label_classes").select("id").in_("id", assigned_class_ids).execute()
                except ValueError:
                    # They're names, convert to IDs
                    class_check = self.supabase.table("label_classes").select("id, name").in_("name", assignment_data.assigned_classes).execute()
                    if not class_check.data:
                        raise Exception(f"No label classes found for names: {assignment_data.assigned_classes}")
                    
                    assigned_class_ids = [item["id"] for item in class_check.data]
                    
                    # Verify all names were found
                    found_names = [item["name"] for item in class_check.data]
                    missing_names = set(assignment_data.assigned_classes) - set(found_names)
                    if missing_names:
                        raise Exception(f"Label classes not found: {list(missing_names)}")
                
                if len(class_check.data) != len(assignment_data.assigned_classes):
                    raise Exception("One or more label classes not found")
            
            assignment_dict = {
                "task_id": task_id,
                "user_id": assignment_data.user_id_to_assign,
                "assigned_classes": assigned_class_ids,  # Store as IDs in database
                "target_labels": assignment_data.target_labels,
                "completed_labels": 0,
                "is_active": True
            }
            
            result = self.supabase.table("task_assignments").insert(assignment_dict).execute()
            if result.data:
                return TaskAssignment(**result.data[0])
            raise Exception("Failed to create assignment")
            
        except Exception as e:
            raise Exception(f"Error creating assignment: {str(e)}")

    async def update_assignment_progress(self, assignment_id: str, completed_labels: int) -> TaskAssignment:
        """Update assignment progress"""
        try:
            result = self.supabase.table("task_assignments").update({
                "completed_labels": completed_labels
            }).eq("id", assignment_id).execute()
            
            if result.data:
                assignment = TaskAssignment(**result.data[0])
                
                # Mark as completed if target reached
                if assignment.completed_labels >= assignment.target_labels:
                    self.supabase.table("task_assignments").update({
                        "completed_at": datetime.utcnow().isoformat()
                    }).eq("id", assignment_id).execute()
                
                return assignment
            raise Exception("Failed to update assignment progress")
        except Exception as e:
            raise Exception(f"Error updating assignment progress: {str(e)}")
    
    # Questions
    async def get_questions_for_task(self, task_id: str) -> List[Question]:
        """Get all questions for a task"""
        try:
            result = self.supabase.table("questions").select("*").eq("task_id", task_id).order("question_order").execute()
            return [Question(**question) for question in result.data]
        except Exception as e:
            raise Exception(f"Error fetching questions: {str(e)}")
    
    async def create_question(self, question_data: QuestionCreate) -> Question:
        """Create new question"""
        try:
            result = self.supabase.table("questions").insert(question_data.dict()).execute()
            if result.data:
                return Question(**result.data[0])
            raise Exception("Failed to create question")
        except Exception as e:
            raise Exception(f"Error creating question: {str(e)}")
    
    # Question Responses
    async def create_question_response(self, response_data: QuestionResponseCreate, user_id: str) -> QuestionResponse:
        """Create question response"""
        try:
            response_dict = response_data.dict()
            response_dict["user_id"] = user_id
            
            # Convert datetime to ISO string if present
            if response_dict.get("started_at"):
                response_dict["started_at"] = response_dict["started_at"].isoformat()
            
            result = self.supabase.table("question_responses").insert(response_dict).execute()
            if result.data:
                return QuestionResponse(**result.data[0])
            raise Exception("Failed to create response")
        except Exception as e:
            raise Exception(f"Error creating response: {str(e)}")
    
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
            raise Exception(f"Error fetching responses: {str(e)}")

# Create global instance
task_service = TaskService()