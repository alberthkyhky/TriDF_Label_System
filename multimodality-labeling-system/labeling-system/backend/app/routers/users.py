from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from app.auth.dependencies import get_current_user, require_admin
from app.models.users import UserPublic, UserPerformance, UserUpdate
from app.models.auth import UserProfile
from app.services.user_service import user_service
from app.services.auth_service import auth_service

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserPublic])
async def get_all_users(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_admin)
):
    """Get all users with pagination (admin only)"""
    try:
        return await user_service.get_all_users(limit, offset)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/search", response_model=List[UserPublic])
async def search_users(
    q: str = Query(..., min_length=2),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """Search users by email or name (admin only)"""
    try:
        return await user_service.search_users(q, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/by-role/{role}", response_model=List[UserPublic])
async def get_users_by_role(
    role: str,
    current_user: dict = Depends(require_admin)
):
    """Get users by role (admin only)"""
    try:
        if role not in ["admin", "labeler", "reviewer"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be admin, labeler, or reviewer"
            )
        
        return await user_service.get_users_by_role(role)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/active", response_model=List[UserPublic])
async def get_active_users(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(require_admin)
):
    """Get users active in the last N days (admin only)"""
    try:
        return await user_service.get_active_users(days)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{user_id}", response_model=UserPublic)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user by ID"""
    try:
        # Users can only view their own profile unless they're admin
        if current_user["role"] != "admin" and current_user["id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{user_id}/performance", response_model=UserPerformance)
async def get_user_performance(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user performance metrics"""
    try:
        # Users can only view their own performance unless they're admin
        if current_user["role"] != "admin" and current_user["id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return await user_service.get_user_performance(user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{user_id}/activity", response_model=Dict[str, Any])
async def get_user_activity_summary(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive user activity summary"""
    try:
        # Users can only view their own activity unless they're admin
        if current_user["role"] != "admin" and current_user["id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return await user_service.get_user_activity_summary(user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{user_id}", response_model=UserPublic)
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    current_user: dict = Depends(require_admin)
):
    """Update user (admin only)"""
    try:
        # Check if user exists
        existing_user = await user_service.get_user_by_id(user_id)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return await user_service.update_user_admin(user_id, update_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """Deactivate user account (admin only)"""
    try:
        # Check if user exists
        existing_user = await user_service.get_user_by_id(user_id)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent self-deactivation
        if user_id == current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account"
            )
        
        success = await auth_service.deactivate_user(user_id)
        if success:
            return {"message": "User deactivated successfully"}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to deactivate user"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{user_id}/reactivate")
async def reactivate_user(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """Reactivate user account (admin only)"""
    try:
        # Check if user exists
        existing_user = await user_service.get_user_by_id(user_id)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        success = await auth_service.reactivate_user(user_id)
        if success:
            return {"message": "User reactivated successfully"}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reactivate user"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_data: dict,
    current_user: dict = Depends(require_admin)
):
    """Update user role (admin only)"""
    try:
        # Validate role
        role = role_data.get("role")
        if role not in ["admin", "labeler", "reviewer"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be admin, labeler, or reviewer"
            )
        
        # Check if user exists
        existing_user = await user_service.get_user_by_id(user_id)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent removing admin role from self
        if user_id == current_user["id"] and role != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove admin role from your own account"
            )
        
        updated_user = await auth_service.update_user_role(user_id, role)
        return {"message": "User role updated successfully", "user": updated_user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )