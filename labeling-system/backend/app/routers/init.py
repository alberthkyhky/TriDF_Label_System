from .auth import router as auth_router
from .tasks import router as tasks_router
from .users import router as users_router
from .assignments import router as assignments_router
from .questions import router as questions_router
from .media import router as media_router
from .responses import router as responses_router

__all__ = [
    "auth_router",
    "tasks_router", 
    "users_router",
    "assignments_router",
    "questions_router",
    "media_router",
    "responses_router"
]