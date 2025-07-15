# app/services/task_service.py
from typing import List, Optional
from datetime import datetime
from app.services.base_service import BaseService
from app.services.media_service import MediaService
from app.models.tasks import (
    Task, TaskCreate, TaskUpdate, TaskWithQuestionsCreate, TaskWithQuestions
)

class TaskService(BaseService):
    """Service for managing tasks"""
    
    def __init__(self):
        super().__init__()
        self.media_service = MediaService()
    
    async def get_tasks_for_user(self, user_id: str, user_role: str) -> List[TaskWithQuestions]:
        """Get tasks based on user role and assignments"""
        try:
            if user_role == "admin":
                result = self.supabase.table("tasks").select("*").execute()
            else:
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
            raise self._handle_supabase_error("fetching tasks", e)
    
    async def get_task_by_id(self, task_id: str) -> Optional[Task]:
        """Get task by ID"""
        try:
            result = self.supabase.table("tasks").select("*").eq("id", task_id).execute()
            if result.data:
                return Task(**result.data[0])
            return None
        except Exception as e:
            raise self._handle_supabase_error("fetching task", e)
    
    async def create_task(self, task_data: TaskCreate, created_by: str) -> Task:
        """Create new task"""
        try:
            task_dict = task_data.dict()
            task_dict["created_by"] = created_by
            task_dict["status"] = "draft"
            
            if task_dict.get("deadline"):
                task_dict["deadline"] = task_dict["deadline"].isoformat()
            
            result = self.supabase.table("tasks").insert(task_dict).execute()
            if result.data:
                return Task(**result.data[0])
            raise Exception("Failed to create task")
        except Exception as e:
            raise self._handle_supabase_error("creating task", e)
    
    async def create_task_with_questions(self, task_data: TaskWithQuestionsCreate, created_by: str) -> TaskWithQuestions:
        """Create task with question template - NO media generation, NO question creation"""
        try:
            # Create the base task with template and config stored as metadata
            task_dict = {
                "title": task_data.title,
                "description": task_data.description,
                "instructions": task_data.instructions,
                "example_media": task_data.example_media,
                "status": "draft",
                "questions_number": task_data.questions_number,
                "required_agreements": task_data.required_agreements,
                # Store the template and config in the database
                "question_template": self._serialize_question_template(task_data.question_template),
                "media_config": self._serialize_media_config(task_data.media_config),
                "created_by": created_by,
                "metadata": {
                    "created_with": "enhanced_interface",
                    "version": "2.0",
                    "questions_generated": False,  # Flag to indicate no questions generated yet
                    "media_attached": False        # Flag to indicate no media attached yet
                }
            }
            
            if task_data.deadline:
                task_dict["deadline"] = task_data.deadline.isoformat()
            
            # Insert task into database (only the task, no questions)
            result = self.supabase.table("tasks").insert(task_dict).execute()
            if not result.data:
                raise Exception("Failed to create task")
            
            created_task = result.data[0]
            
            # Return the task without generating any questions
            return TaskWithQuestions(
                id=created_task["id"],
                title=created_task["title"],
                description=created_task.get("description"),
                instructions=created_task.get("instructions"),
                example_media=created_task.get("example_media", []),
                status=created_task["status"],
                questions_number=created_task["questions_number"],
                required_agreements=created_task["required_agreements"],
                question_template=task_data.question_template,
                media_config=task_data.media_config,
                created_by=created_task["created_by"],
                created_at=created_task["created_at"],
                updated_at=created_task.get("updated_at"),
                deadline=created_task.get("deadline"),
            )
            
        except Exception as e:
            print(f"Error in create_task_with_questions: {e}")
            raise self._handle_supabase_error("creating task with questions", e)

    def _serialize_question_template(self, question_template) -> dict:
        """Properly serialize QuestionTemplate to dict"""
        choices_dict = {}
        
        # Convert each FailureChoice to dict
        for key, failure_choice in question_template.choices.items():
            choices_dict[key] = {
                "text": failure_choice.text,
                "options": failure_choice.options,
                "multiple_select": failure_choice.multiple_select
            }
        
        return {
            "question_text": question_template.question_text,
            "choices": choices_dict
        }

    def _serialize_media_config(self, media_config) -> dict:
        """Properly serialize MediaConfiguration to dict"""
        return {
            "num_images": media_config.num_images,
            "num_videos": media_config.num_videos,
            "num_audios": media_config.num_audios,
        }
    
    async def update_task(self, task_id: str, update_data: TaskUpdate) -> Task:
        """Update task"""
        try:
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
            if not update_dict:
                return await self.get_task_by_id(task_id)
            
            if update_dict.get("deadline"):
                update_dict["deadline"] = update_dict["deadline"].isoformat()
            
            result = self.supabase.table("tasks").update(update_dict).eq("id", task_id).execute()
            if result.data:
                return Task(**result.data[0])
            raise Exception("Failed to update task")
        except Exception as e:
            raise self._handle_supabase_error("updating task", e)
    
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
            raise self._handle_supabase_error("deleting task", e)
    
    async def get_task_with_questions_by_id(self, task_id: str) -> TaskWithQuestions:
        """Get enhanced task with questions information"""
        try:
            result = self.supabase.from_("tasks").select("*").eq("id", task_id).execute()
            
            if not result.data:
                raise Exception("Task not found")
            
            task_data = result.data[0]

            return TaskWithQuestions(
                id=task_data["id"],
                title=task_data["title"],
                description=task_data.get("description"),
                instructions=task_data.get("instructions"),
                example_media=task_data.get("example_media", []),
                status=task_data["status"],
                questions_number=task_data["questions_number"],
                required_agreements=task_data["required_agreements"],
                question_template=task_data.get("question_template", {}),
                media_config=task_data.get("media_config", {}),
                created_by=task_data["created_by"],
                created_at=task_data["created_at"],
                updated_at=task_data.get("updated_at"),
                deadline=task_data.get("deadline"),
            )
        except Exception as e:
            raise self._handle_supabase_error("fetching enhanced task", e)
