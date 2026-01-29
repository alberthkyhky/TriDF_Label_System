import os
import uuid
import mimetypes
from typing import Optional, Tuple
from pathlib import Path
from app.config import settings

def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename while preserving extension"""
    file_extension = Path(original_filename).suffix.lower()
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{file_extension}"

def get_file_type_and_directory(filename: str) -> Tuple[str, str]:
    """Determine file type and appropriate directory based on extension"""
    file_extension = Path(filename).suffix.lower()
    
    if file_extension in settings.ALLOWED_IMAGE_EXTENSIONS:
        return "image", settings.IMAGES_DIR
    elif file_extension in settings.ALLOWED_VIDEO_EXTENSIONS:
        return "video", settings.VIDEOS_DIR
    elif file_extension in settings.ALLOWED_AUDIO_EXTENSIONS:
        return "audio", settings.AUDIO_DIR
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")

def validate_file_size(file_size: int) -> bool:
    """Validate file size against maximum allowed"""
    return file_size <= settings.MAX_FILE_SIZE

def get_mime_type(filename: str) -> Optional[str]:
    """Get MIME type for file"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type

def ensure_directory_exists(directory_path: str) -> bool:
    """Ensure directory exists, create if it doesn't"""
    try:
        os.makedirs(directory_path, exist_ok=True)
        return True
    except Exception:
        return False

def validate_file_extension(filename: str) -> bool:
    """Validate if file extension is allowed"""
    file_extension = Path(filename).suffix.lower()
    allowed_extensions = (
        settings.ALLOWED_IMAGE_EXTENSIONS |
        settings.ALLOWED_VIDEO_EXTENSIONS |
        settings.ALLOWED_AUDIO_EXTENSIONS
    )
    return file_extension in allowed_extensions

def get_file_info(filepath: str) -> dict:
    """Get comprehensive file information"""
    if not os.path.exists(filepath):
        return {}
    
    stat = os.stat(filepath)
    filename = os.path.basename(filepath)
    
    return {
        "filename": filename,
        "size": stat.st_size,
        "mime_type": get_mime_type(filename),
        "created_at": stat.st_ctime,
        "modified_at": stat.st_mtime,
        "extension": Path(filename).suffix.lower()
    }

def sanitize_filename(filename: str) -> str:
    """Sanitize filename by removing dangerous characters"""
    # Remove or replace dangerous characters
    dangerous_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*']
    sanitized = filename
    
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '_')
    
    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip(' .')
    
    # Ensure filename is not empty
    if not sanitized:
        sanitized = "unnamed_file"
    
    return sanitized

def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

def is_image_file(filename: str) -> bool:
    """Check if file is an image"""
    extension = Path(filename).suffix.lower()
    return extension in settings.ALLOWED_IMAGE_EXTENSIONS

def is_video_file(filename: str) -> bool:
    """Check if file is a video"""
    extension = Path(filename).suffix.lower()
    return extension in settings.ALLOWED_VIDEO_EXTENSIONS

def is_audio_file(filename: str) -> bool:
    """Check if file is an audio file"""
    extension = Path(filename).suffix.lower()
    return extension in settings.ALLOWED_AUDIO_EXTENSIONS

def calculate_accuracy_score(correct: int, total: int) -> float:
    """Calculate accuracy percentage"""
    if total == 0:
        return 100.0
    return round((correct / total) * 100, 2)

def paginate_results(items: list, page: int, per_page: int) -> dict:
    """Paginate list of items"""
    start = (page - 1) * per_page
    end = start + per_page
    
    paginated_items = items[start:end]
    total_items = len(items)
    total_pages = (total_items + per_page - 1) // per_page
    
    return {
        "items": paginated_items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }