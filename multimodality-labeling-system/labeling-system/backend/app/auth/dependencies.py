from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.database import get_supabase_client
from app.models.auth import TokenPayload
from typing import Optional

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and return user ID"""
    try:
        token = credentials.credentials
        
        if not settings.SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT secret not configured"
            )
            
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        token_data = TokenPayload(**payload)
        user_id = token_data.sub
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
            
        return user_id
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

async def get_current_user(user_id: str = Depends(verify_token)) -> dict:
    """Get current user profile"""
    try:
        supabase = get_supabase_client()
        result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
            
        return result.data[0]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user profile: {str(e)}"
        )

async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current active user"""
    # Add any additional checks for user status here
    return current_user

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def require_admin_or_reviewer(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin or reviewer role"""
    if current_user.get("role") not in ["admin", "reviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or reviewer access required"
        )
    return current_user

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Get user ID if token is provided, otherwise return None"""
    if not credentials:
        return None
    
    try:
        return await verify_token(credentials)
    except HTTPException:
        return None