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
            # Check for duplicate task name
            await self._check_duplicate_task_name(task_data.title)
            
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
            # Check for duplicate task name
            await self._check_duplicate_task_name(task_data.title)
            
            # Create the base task with template and config stored as metadata
            task_dict = {
                "title": task_data.title,
                "description": task_data.description,
                "instructions": task_data.instructions,
                "example_media": task_data.example_media,
                "status": "draft",
                "questions_number": task_data.questions_number,
                "required_agreements": task_data.required_agreements,
                # Store the template in the database
                "question_template": self._serialize_question_template(task_data.question_template),
                "priority": task_data.priority,
                "created_by": created_by,
                "metadata": {
                    "created_with": "enhanced_interface",
                    "version": "2.0",
                    "questions_generated": False  # Flag to indicate no questions generated yet
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
                priority=created_task.get("priority", "medium"),
                status=created_task["status"],
                questions_number=created_task["questions_number"],
                required_agreements=created_task["required_agreements"],
                question_template=task_data.question_template,
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

    
    async def update_task(self, task_id: str, update_data: TaskUpdate) -> Task:
        """Update task"""
        try:
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
            if not update_dict:
                return await self.get_task_by_id(task_id)
            
            # Check for duplicate name if title is being changed
            if "title" in update_dict:
                await self._check_duplicate_task_name_for_update(task_id, update_dict["title"])
            
            if update_dict.get("deadline"):
                update_dict["deadline"] = update_dict["deadline"].isoformat()
            
            result = self.supabase.table("tasks").update(update_dict).eq("id", task_id).execute()
            if result.data:
                return Task(**result.data[0])
            raise Exception("Failed to update task")
        except Exception as e:
            raise self._handle_supabase_error("updating task", e)
    
    async def update_task_with_questions(self, task_id: str, update_data) -> dict:
        """Update task with question template and media config"""
        try:
            from app.models.tasks import TaskWithQuestionsUpdate
            
            # Convert to dict and filter out None values
            update_dict = {}
            
            # Handle basic fields
            if update_data.title is not None:
                # Check for duplicate name if title is being changed
                await self._check_duplicate_task_name_for_update(task_id, update_data.title)
                update_dict["title"] = update_data.title
            if update_data.description is not None:
                update_dict["description"] = update_data.description
            if update_data.instructions is not None:
                update_dict["instructions"] = update_data.instructions
            if update_data.priority is not None:
                update_dict["priority"] = update_data.priority
            if update_data.status is not None:
                update_dict["status"] = update_data.status
            if update_data.questions_number is not None:
                update_dict["questions_number"] = update_data.questions_number
            if update_data.required_agreements is not None:
                update_dict["required_agreements"] = update_data.required_agreements
            if update_data.deadline is not None:
                update_dict["deadline"] = update_data.deadline.isoformat()
            
            # Handle question template (serialize to JSON)
            if update_data.question_template is not None:
                update_dict["question_template"] = update_data.question_template.dict()
            
            if not update_dict:
                # Return existing task with questions format
                return await self.get_task_with_questions_by_id(task_id)
            
            # Update the task
            result = self.supabase.table("tasks").update(update_dict).eq("id", task_id).execute()
            if result.data:
                # Return the updated task in TaskWithQuestions format
                return await self.get_task_with_questions_by_id(task_id)
            
            raise Exception("Failed to update task with questions")
            
        except Exception as e:
            raise self._handle_supabase_error("updating task with questions", e)
    
    async def delete_task(self, task_id: str) -> bool:
        """Delete task and related data"""
        try:
            # First, get all assignment IDs for this task
            assignments_result = self.supabase.table("task_assignments")\
                .select("id")\
                .eq("task_id", task_id)\
                .execute()
            
            assignment_ids = [assignment["id"] for assignment in assignments_result.data]
            
            # Delete in order: responses -> assignments -> questions -> task
            if assignment_ids:
                # Delete responses for all assignments of this task
                for assignment_id in assignment_ids:
                    self.supabase.table("question_responses")\
                        .delete()\
                        .eq("task_assignment_id", assignment_id)\
                        .execute()
            
            # Delete task assignments
            self.supabase.table("task_assignments")\
                .delete()\
                .eq("task_id", task_id)\
                .execute()
            
            # Delete questions for this task
            self.supabase.table("questions")\
                .delete()\
                .eq("task_id", task_id)\
                .execute()
            
            # Finally, delete the task itself
            result = self.supabase.table("tasks")\
                .delete()\
                .eq("id", task_id)\
                .execute()
            
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
                priority=task_data.get("priority", "medium"),
                status=task_data["status"],
                questions_number=task_data["questions_number"],
                required_agreements=task_data["required_agreements"],
                question_template=task_data.get("question_template", {}),
                created_by=task_data["created_by"],
                created_at=task_data["created_at"],
                updated_at=task_data.get("updated_at"),
                deadline=task_data.get("deadline"),
            )
        except Exception as e:
            raise self._handle_supabase_error("fetching enhanced task", e)
    
    async def _check_duplicate_task_name(self, title: str) -> None:
        """Check if a task with the given title already exists"""
        try:
            result = self.supabase.table("tasks").select("id, title").eq("title", title).execute()
            if result.data:
                raise Exception(f"A task with the name '{title}' already exists. Please choose a different name.")
        except Exception as e:
            # If it's our custom duplicate error, re-raise it
            if "already exists" in str(e):
                raise e
            # Otherwise, handle as a general database error
            raise self._handle_supabase_error("checking for duplicate task name", e)
    
    async def _check_duplicate_task_name_for_update(self, task_id: str, title: str) -> None:
        """Check if a task with the given title already exists (excluding current task)"""
        try:
            result = self.supabase.table("tasks").select("id, title").eq("title", title).neq("id", task_id).execute()
            if result.data:
                raise Exception(f"A task with the name '{title}' already exists. Please choose a different name.")
        except Exception as e:
            # If it's our custom duplicate error, re-raise it
            if "already exists" in str(e):
                raise e
            # Otherwise, handle as a general database error
            raise self._handle_supabase_error("checking for duplicate task name", e)
