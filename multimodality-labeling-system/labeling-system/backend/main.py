from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pydantic import BaseModel
from typing import Optional, List
import jwt

load_dotenv()

app = FastAPI(title="Labeling System API", version="1.0.0")

# Initialize Supabase
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Security
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str = "labeler"
    preferred_classes: Optional[List[str]] = []

class UserStats(BaseModel):
    total_questions_labeled: int = 0
    accuracy_score: float = 100.0
    labels_today: int = 0
    labels_this_week: int = 0
    labels_this_month: int = 0

# Auth dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify JWT token
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            os.getenv("SUPABASE_JWT_SECRET", "your-jwt-secret"), 
            algorithms=["HS256"],
            audience="authenticated"
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.get("/")
async def root():
    return {"message": "Labeling System API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "labeling-system-api"}

@app.get("/auth/profile", response_model=UserProfile)
async def get_user_profile(user_id: str = Depends(get_current_user)):
    try:
        result = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/auth/profile", response_model=UserProfile)
async def update_user_profile(profile_data: UserProfile, user_id: str = Depends(get_current_user)):
    try:
        result = supabase.table("user_profiles").update({
            "full_name": profile_data.full_name,
            "preferred_classes": profile_data.preferred_classes
        }).eq("id", user_id).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/stats", response_model=UserStats)
async def get_user_stats(user_id: str = Depends(get_current_user)):
    try:
        result = supabase.table("user_stats").select("*").eq("user_id", user_id).execute()
        if result.data:
            return result.data[0]
        else:
            # Create default stats if none exist
            default_stats = {
                "user_id": user_id,
                "total_questions_labeled": 0,
                "accuracy_score": 100.0,
                "labels_today": 0,
                "labels_this_week": 0,
                "labels_this_month": 0
            }
            supabase.table("user_stats").insert(default_stats).execute()
            return UserStats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)