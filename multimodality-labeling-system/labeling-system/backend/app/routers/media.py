from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel
import re
from app.auth.dependencies import get_current_user, require_admin
from app.utils.error_handling import handle_router_errors
from app.utils.access_control import require_task_access
from app.models.tasks import (
    MediaSampleRequest, MediaSampleResponse, MediaAvailableResponse
)
from app.services.media_service import MediaService
from app.services.task_service import TaskService
from app.config import ROOT_DIR

# Create service instances
media_service = MediaService()
task_service = TaskService()

router = APIRouter(prefix="/media", tags=["media"])


class MediaFileRequest(BaseModel):
    file_path: str


@router.get("/available", response_model=MediaAvailableResponse)
@handle_router_errors
async def get_available_media(current_user: dict = Depends(require_admin)):
    """Get all available media files (admin only)"""
    return await media_service.get_available_media()


@router.post("/sample", response_model=MediaSampleResponse)
@handle_router_errors
async def sample_media_files(
    request: MediaSampleRequest,
    current_user: dict = Depends(require_admin)
):
    """Sample specific quantities of media files (admin only)"""
    return await media_service.sample_media_files(request)


@router.post("/create-samples")
@handle_router_errors
async def create_sample_media_files(current_user: dict = Depends(require_admin)):
    """Create sample media files for testing (admin only)"""
    await media_service.create_sample_media_files()
    return {"message": "Sample media files created successfully"}


@router.post("/{task_id}/serve")
@handle_router_errors
@require_task_access()
async def serve_media_file_by_path(
    task_id: str,
    request: MediaFileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Serve media files using absolute file path (POST method)"""
    # Get task to verify access
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Validate and resolve file path
    file_path = Path(request.file_path)
    
    # Security: Ensure the file path is within allowed directories
    # You can customize these allowed base paths
    allowed_base_paths = [
        Path("taskData").resolve(),
        Path("/taskData").resolve() if Path("/taskData").exists() else None,
        Path(ROOT_DIR).resolve(),
        # Add other allowed base paths as needed
    ]
    allowed_base_paths = [p for p in allowed_base_paths if p is not None]
    
    # Check if the file path is within allowed directories
    file_path_resolved = file_path.resolve()
    is_allowed = any(
        str(file_path_resolved).startswith(str(base_path))
        for base_path in allowed_base_paths
    )

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: File path not in allowed directories"
        )
    
    # Check if file exists
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media file not found: {request.file_path}"
        )
    
    # Determine media type for proper headers
    media_types = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.bmp': 'image/bmp',
        '.mp4': 'video/mp4', '.avi': 'video/x-msvideo', '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv', '.flv': 'video/x-flv',
        '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.flac': 'audio/flac',
        '.aac': 'audio/aac', '.ogg': 'audio/ogg'
    }
    
    file_extension = file_path.suffix.lower()
    media_type = media_types.get(file_extension, 'application/octet-stream')
    
    # Return the file
    return FileResponse(
        path=str(file_path_resolved),
        media_type=media_type,
        filename=file_path.name,
        headers={
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*"
        }
    )


def _sanitize_folder_name(task_name: str) -> str:
    """Sanitize task name to be used as folder name"""
    sanitized = re.sub(r'[^\w\s-]', '', task_name)
    sanitized = re.sub(r'[-\s]+', '_', sanitized)
    return sanitized.strip('_')


@router.head("/{task_id}/{filename}")
@handle_router_errors
async def check_media_file(
    task_id: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if media file exists (HEAD request)"""
    # Same logic as serve_media_file but return just headers
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    sanitized_task_name = _sanitize_folder_name(task.title)
    file_path = Path("uploads") / sanitized_task_name / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    
    return {"status": "exists", "size": file_path.stat().st_size}