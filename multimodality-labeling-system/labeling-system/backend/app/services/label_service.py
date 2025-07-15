# app/services/label_service.py
from typing import List
from app.services.base_service import BaseService
from app.models.tasks import LabelClass, LabelClassCreate

class LabelService(BaseService):
    """Service for managing label classes"""
    
    async def get_label_classes(self, active_only: bool = True) -> List[LabelClass]:
        """Get all label classes"""
        try:
            query = self.supabase.table("label_classes").select("*")
            if active_only:
                query = query.eq("is_active", True)
            
            result = query.execute()
            return [LabelClass(**item) for item in result.data]
        except Exception as e:
            raise self._handle_supabase_error("fetching label classes", e)
    
    async def create_label_class(self, label_class_data: LabelClassCreate) -> LabelClass:
        """Create new label class"""
        try:
            result = self.supabase.table("label_classes").insert(label_class_data.dict()).execute()
            if result.data:
                return LabelClass(**result.data[0])
            raise Exception("Failed to create label class")
        except Exception as e:
            raise self._handle_supabase_error("creating label class", e)
    
    async def update_label_class(self, class_id: str, update_data: dict) -> LabelClass:
        """Update label class"""
        try:
            result = self.supabase.table("label_classes").update(update_data).eq("id", class_id).execute()
            if result.data:
                return LabelClass(**result.data[0])
            raise Exception("Failed to update label class")
        except Exception as e:
            raise self._handle_supabase_error("updating label class", e)
    
    async def delete_label_class(self, class_id: str) -> bool:
        """Soft delete label class"""
        try:
            self.supabase.table("label_classes").update({"is_active": False}).eq("id", class_id).execute()
            return True
        except Exception as e:
            raise self._handle_supabase_error("deleting label class", e)
