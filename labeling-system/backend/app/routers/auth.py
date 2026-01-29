from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import verify_token, get_current_user
from app.utils.error_handling import handle_router_errors
from app.models.auth import UserProfile, UserProfileUpdate, UserStats
from app.services.auth_service import auth_service
from app.services.user_service import user_service

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.get("/profile", response_model=UserProfile)
@handle_router_errors
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    profile = await auth_service.get_user_profile(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    return profile

@router.put("/profile", response_model=UserProfile)
@handle_router_errors
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile"""
    updated_profile = await auth_service.update_user_profile(
        current_user["id"], 
        profile_data
    )
    
    # Update last active
    await user_service.update_user_last_active(current_user["id"])
    
    return updated_profile

@router.get("/stats", response_model=UserStats)
@handle_router_errors
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get current user's statistics"""
    stats = await auth_service.get_user_stats(current_user["id"])
    
    # Update last active
    await user_service.update_user_last_active(current_user["id"])
    
    return stats

@router.get("/me", response_model=UserProfile)
@handle_router_errors
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information"""
    profile = await auth_service.get_user_profile(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Update last active
    await user_service.update_user_last_active(current_user["id"])
    
    return profile

@router.post("/refresh")
@handle_router_errors
async def refresh_user_session(user_id: str = Depends(verify_token)):
    """Refresh user session and update last active"""
    await user_service.update_user_last_active(user_id)
    return {"message": "Session refreshed successfully"}