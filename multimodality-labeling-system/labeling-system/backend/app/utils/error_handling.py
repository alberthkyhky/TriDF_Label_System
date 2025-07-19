from functools import wraps
from fastapi import HTTPException, status
from typing import Callable, Any
import logging

logger = logging.getLogger(__name__)


def handle_service_errors(func: Callable) -> Callable:
    """
    Decorator to handle service layer errors consistently.
    Preserves HTTPException raising and converts other exceptions to 500 errors.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs) -> Any:
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Service error in {func.__name__}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )
    return wrapper


def handle_router_errors(func: Callable) -> Callable:
    """
    Decorator to handle router-level errors consistently.
    Same behavior as handle_service_errors but for router endpoints.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs) -> Any:
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Router error in {func.__name__}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )
    return wrapper