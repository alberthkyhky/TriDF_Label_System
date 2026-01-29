from functools import wraps
from typing import Callable, List, Optional
from fastapi import HTTPException, status, Depends
from app.auth.dependencies import get_current_user
from app.services.task_service import TaskService


task_service = TaskService()


def require_task_access(task_id_param: str = "task_id"):
    """
    Decorator to ensure user has access to a specific task.
    
    Args:
        task_id_param: The parameter name that contains the task_id (default: "task_id")
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user from dependencies
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, dict) and "id" in value and "role" in value:
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Skip access check for admin users
            if current_user["role"] == "admin":
                return await func(*args, **kwargs)
            
            # Get task_id from parameters
            task_id = kwargs.get(task_id_param)
            if not task_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing {task_id_param} parameter"
                )
            
            # Check if user has access to this task
            user_tasks = await task_service.get_tasks_for_user(
                current_user["id"], 
                current_user["role"]
            )
            task_ids = [t.id for t in user_tasks]
            
            if task_id not in task_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this task"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_admin_or_owner(owner_id_param: str = "user_id"):
    """
    Decorator to ensure user is either admin or the owner of the resource.
    
    Args:
        owner_id_param: The parameter name that contains the owner's user_id
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user from dependencies
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, dict) and "id" in value and "role" in value:
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Allow admin access
            if current_user["role"] == "admin":
                return await func(*args, **kwargs)
            
            # Check ownership
            owner_id = kwargs.get(owner_id_param)
            if owner_id and current_user["id"] == owner_id:
                return await func(*args, **kwargs)
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: admin or ownership required"
            )
        return wrapper
    return decorator