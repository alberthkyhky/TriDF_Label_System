from app.database import get_supabase_client
from abc import ABC

class BaseService(ABC):
    """Base service class with common functionality"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def _handle_supabase_error(self, operation: str, error: Exception) -> Exception:
        """Standardized error handling for Supabase operations"""
        return Exception(f"Error {operation}: {str(error)}")