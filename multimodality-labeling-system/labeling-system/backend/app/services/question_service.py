# Update your QuestionService or the relevant service handling questions

import os
import random
from pathlib import Path
from typing import List, Dict, Any
from app.models.tasks import MediaFile, MediaType, QuestionWithMedia
from app.database import get_supabase_client
from app.customer.LocalDataSampler import sampler

class QuestionService:
    def __init__(self):
        super().__init__()
        self.base_media_path = Path("uploads")  # Adjust as needed
        self.supabase = get_supabase_client()
    
    async def get_task_by_id(self, task_id: str) -> Dict:
        try:
            result = self.supabase.table("tasks").select("*").eq("id", task_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Error fetching task by ID: {str(e)}")

    async def get_questions_with_media(self, task_id: str, idx: int = 0) -> List[QuestionWithMedia]:
        """Get questions from DB and attach locally sampled media files"""
        try:
            # 1. Get task info to get task name
            task = await self.get_task_by_id(task_id)
            if not task:
                raise Exception("Task not found")

            # 2. Get questions from database (NO media)
            question = task['question_template']
            
            # 4. For each question, sample local media files
            questions_with_media = []
            
            
            sampled_media = await self._sample_local_media_for_task(
                task_name=task['title'], idx=idx
            )

            # Create QuestionWithMedia object
            question_with_media = QuestionWithMedia(
                id=task['id'],
                task_id=task['id'],
                question_text=question['question_text'],
                question_order=0,
                status=task['status'],
                target_classes=["X"],
                media_files=sampled_media,
                choices=question['choices'],
                created_at=task['created_at'],
                updated_at=task['updated_at']
            )
            
            questions_with_media.append(question_with_media)

            print(questions_with_media)
        
            return questions_with_media
            
        except Exception as e:
            print(e)
            raise Exception(f"Error fetching questions with media: {str(e)}")
    
    async def get_questions_from_db(self, task_id: str) -> List:
        """Get questions from database without media"""
        try:
            result = self.supabase.table("questions").select("*").eq("task_id", task_id).order("question_order").execute()
            return result.data
        except Exception as e:
            raise Exception(f"Error fetching questions from DB: {str(e)}")
    
    async def _sample_local_media_for_task(self, task_name: str, idx: int = 0) -> List[MediaFile]:
        """Sample media files from local task folder, preserving CSV column order"""
        try:
            sampled_media = []
            raw_data = sampler.sample_by_idx(task_name, idx)
            
            # Process columns in the same order as they appear in CSV
            # Python dict preserves insertion order (CSV column order)
            for key, value in raw_data.items():
                # Handle text prompts (formatted as "prompt: {content}")
                if key == "prompt" and value and value.strip():
                    # Create text media file for prompt
                    text_media = await self._create_text_media_file(value, key)
                    if text_media:
                        sampled_media.append(text_media)
                # Handle regular file paths
                elif os.path.isfile(value):
                    file_media = await self._create_media_file_from_path(Path(value), key)
                    if file_media:
                        sampled_media.append(file_media)
            return sampled_media
            
        except Exception as e:
            print(f"Warning: Error sampling media for task {task_name}: {str(e)}")
            # Return empty list if media sampling fails
            return []
    
    async def _get_media_files_by_type(self, task_path: Path, extensions: List[str]) -> List[MediaFile]:
        """Get media files of specific types from task folder"""
        media_files = []
        
        if not task_path.exists():
            print(f"Warning: Task media folder does not exist: {task_path}")
            return media_files
        
        try:
            for file_path in task_path.iterdir():
                if file_path.is_file() and file_path.suffix.lower().lstrip('.') in extensions:
                    media_file = await self._create_media_file_from_path(file_path)
                    if media_file:
                        media_files.append(media_file)
            
            return media_files
            
        except Exception as e:
            print(f"Error scanning media files in {task_path}: {str(e)}")
            return []
    
    async def _create_text_media_file(self, text_content: str, key: str = None) -> MediaFile:
        """Create MediaFile object for text content (prompts)"""
        try:
            return MediaFile(
                filename=f"{key}_prompt.txt" if key else "prompt.txt",
                file_path=text_content,  # Store the actual text content in file_path for text media
                key=key,
                media_type=MediaType.TEXT,
                file_size=len(text_content.encode('utf-8')),
                mime_type="text/plain",
                tags=["prompt", "text"],
                metadata={
                    "content_type": "prompt",
                    "character_count": len(text_content),
                    "word_count": len(text_content.split()),
                }
            )
        except Exception as e:
            print(f"Error creating text media file: {str(e)}")
            return None

    async def _create_media_file_from_path(self, file_path: Path, key: str = None) -> MediaFile:
        """Create MediaFile object from file path"""
        try:
            stat = file_path.stat()
            
            # Determine media type from extension
            extension = file_path.suffix.lower()
            if extension in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
                media_type = MediaType.IMAGE
            elif extension in ['.mp4', '.avi', '.mov', '.wmv', '.flv']:
                media_type = MediaType.VIDEO
            elif extension in ['.wav', '.mp3', '.flac', '.aac', '.ogg']:
                media_type = MediaType.AUDIO
            else:
                return None
            
            # MIME type mapping
            mime_types = {
                '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
                '.gif': 'image/gif', '.bmp': 'image/bmp',
                '.mp4': 'video/mp4', '.avi': 'video/avi', '.mov': 'video/quicktime',
                '.wmv': 'video/x-ms-wmv', '.flv': 'video/x-flv',
                '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.flac': 'audio/flac',
                '.aac': 'audio/aac', '.ogg': 'audio/ogg'
            }
            
            mime_type = mime_types.get(extension, 'application/octet-stream')
            
            return MediaFile(
                filename=file_path.name,
                file_path=str(file_path),
                key=key,
                media_type=media_type,
                file_size=stat.st_size,
                mime_type=mime_type,
                # Additional metadata could be extracted here
                # For images: width, height using PIL
                # For videos: duration using ffprobe
                # For audio: duration using mutagen
                tags=[],
                metadata={
                    "created_at": stat.st_mtime,
                    "last_modified": stat.st_mtime,
                    "task_folder": file_path.parent.name
                }
            )
            
        except Exception as e:
            print(f"Error creating media file info for {file_path}: {str(e)}")
            return None
    
    def _sanitize_folder_name(self, task_name: str) -> str:
        """Sanitize task name to be used as folder name"""
        # Remove/replace characters that aren't valid in folder names
        import re
        # Replace spaces with underscores and remove special characters
        sanitized = re.sub(r'[^\w\s-]', '', task_name)
        sanitized = re.sub(r'[-\s]+', '_', sanitized)
        return sanitized.strip('_')
    
    # Optional: Create sample media structure for testing
    async def create_sample_media_structure_for_task(self, task_name: str, num_files_per_type: int = 3):
        """Create sample media folder structure for testing"""
        try:
            folder_name = self._sanitize_folder_name(task_name)
            task_media_path = self.base_media_path / folder_name
            task_media_path.mkdir(parents=True, exist_ok=True)
            
            # Create sample files
            sample_files = []
            
            # Sample images
            for i in range(num_files_per_type):
                sample_files.append((f"sample_image_{i+1}.jpg", "Sample image content"))
            
            # Sample videos
            for i in range(num_files_per_type):
                sample_files.append((f"sample_video_{i+1}.mp4", "Sample video content"))
            
            # Sample audio
            for i in range(num_files_per_type):
                sample_files.append((f"sample_audio_{i+1}.wav", "Sample audio content"))
            
            # Create the files
            for filename, content in sample_files:
                file_path = task_media_path / filename
                if not file_path.exists():
                    file_path.write_text(f"# Sample media file: {filename}\n# Task: {task_name}\n# {content}")
            
            print(f"Created sample media structure for task: {task_name}")
            print(f"Location: {task_media_path}")
            print(f"Files created: {len(sample_files)}")
            
        except Exception as e:
            print(f"Error creating sample media structure: {str(e)}")