# app/services/media_service.py
import os
import random
from pathlib import Path
from typing import List
from app.services.base_service import BaseService
from app.models.tasks import (
    MediaFile, MediaType, MediaSampleRequest, 
    MediaSampleResponse, MediaAvailableResponse
)

class MediaService(BaseService):
    """Service for managing media files"""
    
    def __init__(self):
        super().__init__()
        self.base_upload_dir = Path("uploads")
        self.image_dir = self.base_upload_dir / "images"
        self.video_dir = self.base_upload_dir / "videos"
        self.audio_dir = self.base_upload_dir / "audio"
        
        # Ensure directories exist
        for directory in [self.image_dir, self.video_dir, self.audio_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    async def get_available_media(self) -> MediaAvailableResponse:
        """Get all available media files from the uploads directory"""
        try:
            images = await self._scan_media_directory(self.image_dir, MediaType.IMAGE)
            videos = await self._scan_media_directory(self.video_dir, MediaType.VIDEO)
            audios = await self._scan_media_directory(self.audio_dir, MediaType.AUDIO)
            
            return MediaAvailableResponse(
                images=images,
                videos=videos,
                audios=audios,
                total_counts={
                    "images": len(images),
                    "videos": len(videos),
                    "audios": len(audios),
                    "total": len(images) + len(videos) + len(audios)
                }
            )
        except Exception as e:
            raise self._handle_supabase_error("scanning media files", e)
    
    async def sample_media_files(self, request: MediaSampleRequest) -> MediaSampleResponse:
        """Sample specific quantities of media files"""
        try:
            available_media = await self.get_available_media()
            sampled_media = []
            
            # Apply tag filtering if specified
            if request.tags_filter:
                available_media = self._apply_tag_filter(available_media, request.tags_filter)
            
            # Sample requested quantities
            sampled_media.extend(self._sample_by_type(available_media.images, request.num_images))
            sampled_media.extend(self._sample_by_type(available_media.videos, request.num_videos))
            sampled_media.extend(self._sample_by_type(available_media.audios, request.num_audios))
            
            return MediaSampleResponse(
                sampled_media=sampled_media,
                total_available=available_media.total_counts
            )
        except Exception as e:
            raise self._handle_supabase_error("sampling media files", e)
    
    async def insert_question_media(self, question_id: str, media_files: List[MediaFile]):
        """Insert media files for a question"""
        try:
            media_records = []
            
            for idx, media in enumerate(media_files):
                media_record = {
                    "question_id": question_id,
                    "file_path": media.file_path,
                    "media_type": media.media_type.value if hasattr(media.media_type, 'value') else media.media_type,
                    "file_size": media.file_size,
                    "mime_type": media.mime_type,
                    "display_order": idx + 1,
                    "duration_seconds": media.duration_seconds,
                    "width": media.width,
                    "height": media.height,
                    "metadata": media.metadata
                }
                media_records.append(media_record)
            
            if media_records:
                self.supabase.table("question_media").insert(media_records).execute()
        except Exception as e:
            raise self._handle_supabase_error("inserting question media", e)
    
    async def create_sample_media_files(self):
        """Create sample media files for testing (development only)"""
        try:
            sample_files = [
                ("images/sample_image_01.jpg", "Sample manufacturing image 1"),
                ("images/sample_image_02.jpg", "Sample manufacturing image 2"),
                ("images/sample_image_03.jpg", "Sample manufacturing image 3"),
                ("videos/sample_video_01.mp4", "Sample inspection video 1"),
                ("videos/sample_video_02.mp4", "Sample inspection video 2"),
                ("audio/sample_audio_01.wav", "Sample machine sound 1"),
                ("audio/sample_audio_02.wav", "Sample machine sound 2"),
            ]
            
            for file_path, description in sample_files:
                full_path = self.base_upload_dir / file_path
                if not full_path.exists():
                    full_path.write_text(f"# Sample file: {description}\n# Created for testing purposes")
            
            print(f"Created {len(sample_files)} sample media files")
        except Exception as e:
            print(f"Error creating sample media files: {str(e)}")
    
    # Private methods
    async def _scan_media_directory(self, directory: Path, media_type: MediaType) -> List[MediaFile]:
        """Scan a directory for media files of a specific type"""
        media_files = []
        extensions = self._get_extensions_for_type(media_type)
        
        if directory.exists():
            for file_path in directory.glob("*"):
                if file_path.is_file() and file_path.suffix.lower() in extensions:
                    media_file = await self._create_media_file_info(file_path, media_type)
                    if media_file:
                        media_files.append(media_file)
        
        return media_files
    
    def _get_extensions_for_type(self, media_type: MediaType) -> List[str]:
        """Get file extensions for a media type"""
        extensions_map = {
            MediaType.IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
            MediaType.VIDEO: ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
            MediaType.AUDIO: ['.wav', '.mp3', '.flac', '.aac', '.ogg']
        }
        return extensions_map.get(media_type, [])
    
    async def _create_media_file_info(self, file_path: Path, media_type: MediaType) -> MediaFile:
        """Create MediaFile object from file path"""
        try:
            stat = file_path.stat()
            mime_types = {
                '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
                '.gif': 'image/gif', '.bmp': 'image/bmp',
                '.mp4': 'video/mp4', '.avi': 'video/avi', '.mov': 'video/quicktime',
                '.wmv': 'video/x-ms-wmv', '.flv': 'video/x-flv',
                '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.flac': 'audio/flac',
                '.aac': 'audio/aac', '.ogg': 'audio/ogg'
            }
            
            mime_type = mime_types.get(file_path.suffix.lower(), 'application/octet-stream')
            
            return MediaFile(
                filename=file_path.name,
                file_path=str(file_path),
                media_type=media_type,
                file_size=stat.st_size,
                mime_type=mime_type,
                tags=[],
                metadata={
                    "created_at": stat.st_mtime,
                    "last_modified": stat.st_mtime
                }
            )
        except Exception as e:
            print(f"Error creating media file info for {file_path}: {str(e)}")
            return None
    
    def _apply_tag_filter(self, available_media: MediaAvailableResponse, tags_filter: List[str]) -> MediaAvailableResponse:
        """Apply tag filtering to available media"""
        available_media.images = [m for m in available_media.images 
                                if any(tag in m.tags for tag in tags_filter)]
        available_media.videos = [m for m in available_media.videos 
                                if any(tag in m.tags for tag in tags_filter)]
        available_media.audios = [m for m in available_media.audios 
                                if any(tag in m.tags for tag in tags_filter)]
        return available_media
    
    def _sample_by_type(self, media_list: List[MediaFile], count: int) -> List[MediaFile]:
        """Sample a specific count of media files from a list"""
        if count > 0 and media_list:
            sampled = random.sample(media_list, min(count, len(media_list)))
            # Assign display order
            for idx, media in enumerate(sampled):
                media.metadata["display_order"] = idx + 1
            return sampled
        return []
