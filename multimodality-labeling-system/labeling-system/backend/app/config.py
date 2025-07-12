import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Labeling System API"
    VERSION: str = "1.0.0"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000"]
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_IMAGE_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
    ALLOWED_VIDEO_EXTENSIONS: set = {".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv"}
    ALLOWED_AUDIO_EXTENSIONS: set = {".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"}
    
    # Upload Directories
    UPLOAD_DIR: str = "uploads"
    IMAGES_DIR: str = f"{UPLOAD_DIR}/images"
    VIDEOS_DIR: str = f"{UPLOAD_DIR}/videos"
    AUDIO_DIR: str = f"{UPLOAD_DIR}/audio"
    RULES_DIR: str = f"{UPLOAD_DIR}/rules"
    
    def __post_init__(self):
        # Validate required environment variables
        required_vars = [
            "SUPABASE_URL",
            "SUPABASE_SERVICE_KEY", 
            "SUPABASE_JWT_SECRET"
        ]
        
        missing_vars = []
        for var in required_vars:
            if not getattr(self, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        # Create upload directories
        os.makedirs(self.IMAGES_DIR, exist_ok=True)
        os.makedirs(self.VIDEOS_DIR, exist_ok=True)
        os.makedirs(self.AUDIO_DIR, exist_ok=True)
        os.makedirs(self.RULES_DIR, exist_ok=True)

settings = Settings()
settings.__post_init__()