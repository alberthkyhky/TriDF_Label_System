from typing import Union, Any, Optional
from app.config import settings
import os


class ConfigManager:
    """
    Centralized configuration management utility.
    Provides convenient access to configuration values with validation.
    """
    
    @staticmethod
    def get_upload_dir(media_type: str = "") -> str:
        """Get upload directory path for specific media type."""
        if media_type.lower() == "image":
            return settings.IMAGES_DIR
        elif media_type.lower() == "video":
            return settings.VIDEOS_DIR
        elif media_type.lower() == "audio":
            return settings.AUDIO_DIR
        elif media_type.lower() == "rules":
            return settings.RULES_DIR
        else:
            return settings.UPLOAD_DIR
    
    @staticmethod
    def get_allowed_extensions(media_type: str) -> set:
        """Get allowed file extensions for specific media type."""
        media_type = media_type.lower()
        if media_type == "image":
            return settings.ALLOWED_IMAGE_EXTENSIONS
        elif media_type == "video":
            return settings.ALLOWED_VIDEO_EXTENSIONS
        elif media_type == "audio":
            return settings.ALLOWED_AUDIO_EXTENSIONS
        else:
            return set()
    
    @staticmethod
    def is_allowed_file_extension(filename: str, media_type: str) -> bool:
        """Check if file extension is allowed for media type."""
        if not filename:
            return False
        
        file_ext = os.path.splitext(filename.lower())[1]
        allowed_extensions = ConfigManager.get_allowed_extensions(media_type)
        return file_ext in allowed_extensions
    
    @staticmethod
    def get_max_file_size() -> int:
        """Get maximum allowed file size in bytes."""
        return settings.MAX_FILE_SIZE
    
    @staticmethod
    def get_api_config() -> dict:
        """Get API configuration settings."""
        return {
            "api_v1_str": settings.API_V1_STR,
            "project_name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "cors_origins": settings.BACKEND_CORS_ORIGINS
        }
    
    @staticmethod
    def get_database_config() -> dict:
        """Get database configuration (Supabase) settings."""
        return {
            "url": settings.SUPABASE_URL,
            "anon_key": settings.SUPABASE_ANON_KEY,
            "service_key": settings.SUPABASE_SERVICE_KEY,
            "jwt_secret": settings.SUPABASE_JWT_SECRET
        }
    
    @staticmethod
    def get_env_var(key: str, default: Any = None) -> Optional[str]:
        """Get environment variable with optional default."""
        return os.getenv(key, default)
    
    @staticmethod
    def validate_config() -> bool:
        """Validate that all required configuration is present."""
        try:
            # This will trigger validation in Settings.__post_init__
            required_vars = [
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_KEY,
                settings.SUPABASE_JWT_SECRET
            ]
            return all(var for var in required_vars)
        except ValueError:
            return False


# Global config manager instance
config_manager = ConfigManager()