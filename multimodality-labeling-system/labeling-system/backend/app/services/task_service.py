# app/services/task_service.py
from typing import List, Optional
from datetime import datetime
import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from fastapi.responses import FileResponse
from app.services.base_service import BaseService
from app.services.media_service import MediaService
from app.models.tasks import (
    Task, TaskCreate, TaskUpdate, TaskWithQuestionsCreate, TaskWithQuestions, ExampleImage
)
from app.config import settings

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
                    result = self.supabase.table("tasks").select("*").or_("created_by.eq.{},id.in.({})".format(user_id, ','.join(assigned_task_ids))).execute()
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
                "example_images": [img.dict() for img in task_data.example_images],  # UPDATED to use example_images
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
            
            # Parse example_images from database
            example_images_data = created_task.get("example_images", [])
            example_images = [ExampleImage(**img_data) for img_data in example_images_data]

            # Return the task without generating any questions
            return TaskWithQuestions(
                id=created_task["id"],
                title=created_task["title"],
                description=created_task.get("description"),
                instructions=created_task.get("instructions"),
                example_images=example_images,  # UPDATED to use example_images
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
            
            # Handle example_images (serialize to JSON)
            if update_data.example_images is not None:
                update_dict["example_images"] = [img.dict() for img in update_data.example_images]
            
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

            # Parse example_images JSONB field
            example_images_data = task_data.get("example_images", [])
            example_images = []
            if example_images_data:
                for img_data in example_images_data:
                    example_images.append(ExampleImage(**img_data))

            return TaskWithQuestions(
                id=task_data["id"],
                title=task_data["title"],
                description=task_data.get("description"),
                instructions=task_data.get("instructions"),
                example_images=example_images,  # UPDATED to use example_images
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
    
    # ===== EXAMPLE IMAGES METHODS =====
    
    async def upload_example_image(self, task_id: str, file: UploadFile, caption: str = "") -> ExampleImage:
        """Upload and store example image for a task"""
        try:
            # 1. Validate task exists
            task = await self.get_task_by_id(task_id)
            if not task:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            
            # 2. Validate file
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image files are allowed")
            
            if file.size and file.size > 10 * 1024 * 1024:  # 10MB limit
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size must be less than 10MB")
            
            allowed_types = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
            if file.content_type not in allowed_types:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only JPG, PNG, GIF, and WebP formats are supported")
            
            # 3. Generate unique filename for Supabase storage
            file_extension = Path(file.filename).suffix.lower() if file.filename else '.jpg'
            unique_filename = f"img_{uuid.uuid4().hex[:8]}_{file.filename}"
            storage_path = f"{task_id}/{unique_filename}"
            
            # 4. Upload to Supabase storage
            file_bytes = await file.read()
            
            print(f"🔍 Attempting to upload to storage path: {storage_path}")
            print(f"🔍 File size: {len(file_bytes)} bytes")
            print(f"🔍 Content type: {file.content_type}")
            
            try:
                storage_response = self.supabase.storage.from_("task-example-images").upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={
                        "content-type": file.content_type,
                        "cache-control": "3600",
                        "upsert": "false"
                    }
                )
                
                print(f"🔍 Storage response: {storage_response}")
                
                if hasattr(storage_response, 'status_code') and storage_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                        detail=f"Failed to upload image to storage: {storage_response}"
                    )
                
                # Check if the response has an error
                if hasattr(storage_response, 'error') and storage_response.error:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                        detail=f"Storage upload error: {storage_response.error}"
                    )
                    
            except Exception as storage_error:
                print(f"❌ Storage upload failed: {storage_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                    detail=f"Storage upload failed: {str(storage_error)}"
                )
            
            # 5. Get public URL for the uploaded file
            public_url_response = self.supabase.storage.from_("task-example-images").get_public_url(storage_path)
            public_url = public_url_response
            
            # 6. Create ExampleImage object
            example_image = ExampleImage(
                filename=unique_filename,
                file_path=public_url,  # Store public URL instead of local path
                caption=caption or ""
            )
            
            # 7. Update task's example_images array in database
            current_images = await self._get_task_example_images(task_id)
            current_images.append(example_image)
            
            await self._update_task_example_images_db(task_id, current_images)
            
            return example_image
            
        except HTTPException:
            raise
        except Exception as e:
            raise self._handle_supabase_error("uploading example image", e)
    
    async def update_example_images(self, task_id: str, images: List[ExampleImage]) -> List[ExampleImage]:
        """Update example images order and captions"""
        try:
            # 1. Validate task exists
            task = await self.get_task_by_id(task_id)
            if not task:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            
            # 2. Validate all files exist in storage (skip validation for Supabase URLs)
            # Note: For Supabase storage, we trust the URLs are valid since they're from our storage
            
            # 3. Update database
            await self._update_task_example_images_db(task_id, images)
            
            return images
            
        except HTTPException:
            raise
        except Exception as e:
            raise self._handle_supabase_error("updating example images", e)
    
    async def delete_example_image(self, task_id: str, filename: str) -> bool:
        """Delete example image from task"""
        try:
            # 1. Get current images
            current_images = await self._get_task_example_images(task_id)
            
            # 2. Find and remove the image
            image_to_remove = None
            updated_images = []
            
            for image in current_images:
                if image.filename == filename:
                    image_to_remove = image
                else:
                    updated_images.append(image)
            
            if not image_to_remove:
                return False
            
            # 3. Delete file from Supabase storage
            try:
                storage_path = f"{task_id}/{image_to_remove.filename}"
                delete_response = self.supabase.storage.from_("task-example-images").remove([storage_path])
                # Note: Supabase storage delete doesn't always throw errors for missing files
            except Exception as storage_error:
                print(f"Warning: Could not delete file from storage: {storage_error}")
            
            # 4. Update database
            await self._update_task_example_images_db(task_id, updated_images)
            
            return True
            
        except Exception as e:
            raise self._handle_supabase_error("deleting example image", e)
    
    async def get_example_image_file(self, task_id: str, filename: str):
        """Get example image public URL (for Supabase storage)"""
        try:
            # 1. Get current images to validate filename exists
            current_images = await self._get_task_example_images(task_id)
            
            # 2. Find the image
            image_file = None
            for image in current_images:
                if image.filename == filename:
                    image_file = image
                    break
            
            if not image_file:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Example image not found")
            
            # 3. Return the public URL (already stored in file_path for Supabase storage)
            return {"url": image_file.file_path}
            
        except HTTPException:
            raise
        except Exception as e:
            raise self._handle_supabase_error("serving example image", e)
    
    async def _get_task_example_images(self, task_id: str) -> List[ExampleImage]:
        """Get current example images for a task"""
        try:
            result = self.supabase.table("tasks").select("example_images").eq("id", task_id).execute()
            
            if not result.data:
                return []
            
            images_data = result.data[0].get("example_images", [])
            
            return [ExampleImage(**img_data) for img_data in images_data]
            
        except Exception as e:
            raise self._handle_supabase_error("fetching task example images", e)
    
    async def _update_task_example_images_db(self, task_id: str, images: List[ExampleImage]) -> None:
        """Update task's example_images in database"""
        try:
            images_data = [img.dict() for img in images]
            
            result = self.supabase.table("tasks").update({
                "example_images": images_data
            }).eq("id", task_id).execute()
            
            if not result.data:
                raise Exception("Failed to update example images")
                
        except Exception as e:
            raise self._handle_supabase_error("updating task example images in database", e)
