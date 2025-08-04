from app.database import get_supabase_client
from app.models.users import UserPublic, UserPerformance, UserUpdate
from app.models.auth import UserStats
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

class UserService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def get_all_users(self, limit: int = 100, offset: int = 0) -> List[UserPublic]:
        """Get all users with pagination"""
        try:
            result = self.supabase.table("user_profiles").select(
                "id, email, full_name, role, created_at"
            ).range(offset, offset + limit - 1).execute()
            
            users = []
            for user_data in result.data:
                # Get last active from user_stats (with error handling)
                try:
                    stats = self.supabase.table("user_stats").select("last_active").eq("user_id", user_data["id"]).execute()
                    last_active = stats.data[0]["last_active"] if stats.data else None
                except:
                    last_active = None
                
                user_data["last_active"] = last_active
                users.append(UserPublic(**user_data))
            
            return users
        except Exception as e:
            raise Exception(f"Error fetching users: {str(e)}")
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserPublic]:
        """Get user by ID"""
        try:
            result = self.supabase.table("user_profiles").select(
                "id, email, full_name, role, created_at"
            ).eq("id", user_id).execute()
            
            if not result.data:
                return None
            
            user_data = result.data[0]
            
            # Get last active from user_stats (with error handling)
            try:
                stats = self.supabase.table("user_stats").select("last_active").eq("user_id", user_id).execute()
                user_data["last_active"] = stats.data[0]["last_active"] if stats.data else None
            except:
                user_data["last_active"] = None
            
            return UserPublic(**user_data)
        except Exception as e:
            raise Exception(f"Error fetching user: {str(e)}")
    
    async def search_users(self, query: str, limit: int = 50) -> List[UserPublic]:
        """Search users by email or name"""
        try:
            result = self.supabase.table("user_profiles").select(
                "id, email, full_name, role, created_at"
            ).or_(
                f"email.ilike.%{query}%,full_name.ilike.%{query}%"
            ).limit(limit).execute()
            
            users = []
            for user_data in result.data:
                # Get last active from user_stats (with error handling)
                try:
                    stats = self.supabase.table("user_stats").select("last_active").eq("user_id", user_data["id"]).execute()
                    last_active = stats.data[0]["last_active"] if stats.data else None
                except:
                    last_active = None
                
                user_data["last_active"] = last_active
                users.append(UserPublic(**user_data))
            
            return users
        except Exception as e:
            raise Exception(f"Error searching users: {str(e)}")
    
    async def get_user_performance(self, user_id: str) -> UserPerformance:
        """Get detailed user performance metrics"""
        try:
            # Try to get user stats with only basic columns that should exist
            stats_result = self.supabase.table("user_stats").select(
                "user_id, total_questions_labeled, accuracy_score, average_time_per_question, labels_today, labels_this_week, labels_this_month"
            ).eq("user_id", user_id).execute()
            
            if not stats_result.data:
                # Create default stats if none exist - but don't insert, just return
                default_stats = {
                    "user_id": user_id,
                    "total_questions_labeled": 0,
                    "accuracy_score": 1.0,
                    "average_time_per_question": None,
                    "labels_today": 0,
                    "labels_this_week": 0,
                    "labels_this_month": 0,
                    "streak_days": 0
                }
                return UserPerformance(**default_stats)
            
            stats = stats_result.data[0]
            # Add missing fields with defaults
            stats["streak_days"] = stats.get("streak_days", 0)
            # Ensure accuracy_score is between 0 and 1 for the model
            if stats.get("accuracy_score", 1.0) > 1:
                stats["accuracy_score"] = stats["accuracy_score"] / 100.0
            
            return UserPerformance(**stats)
        except Exception as e:
            # If table doesn't exist or has different schema, return defaults
            print(f"Warning: Could not fetch user performance for {user_id}: {str(e)}")
            default_stats = {
                "user_id": user_id,
                "total_questions_labeled": 0,
                "accuracy_score": 1.0,
                "average_time_per_question": None,
                "labels_today": 0,
                "labels_this_week": 0,
                "labels_this_month": 0,
                "streak_days": 0
            }
            return UserPerformance(**default_stats)
    
    async def update_user_admin(self, user_id: str, update_data: UserUpdate) -> UserPublic:
        """Update user (admin function)"""
        try:
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
            if not update_dict:
                return await self.get_user_by_id(user_id)
            
            result = self.supabase.table("user_profiles").update(update_dict).eq("id", user_id).execute()
            if result.data:
                return await self.get_user_by_id(user_id)
            raise Exception("Failed to update user")
        except Exception as e:
            raise Exception(f"Error updating user: {str(e)}")
    
    async def get_users_by_role(self, role: str) -> List[UserPublic]:
        """Get users by role"""
        try:
            result = self.supabase.table("user_profiles").select(
                "id, email, full_name, role, created_at"
            ).eq("role", role).execute()
            
            users = []
            for user_data in result.data:
                # Get last active from user_stats (with error handling)
                try:
                    stats = self.supabase.table("user_stats").select("last_active").eq("user_id", user_data["id"]).execute()
                    last_active = stats.data[0]["last_active"] if stats.data else None
                except:
                    last_active = None
                
                user_data["last_active"] = last_active
                users.append(UserPublic(**user_data))
            
            return users
        except Exception as e:
            raise Exception(f"Error fetching users by role: {str(e)}")
    
    async def get_active_users(self, days: int = 30) -> List[UserPublic]:
        """Get users active in the last N days"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Get active user IDs from user_stats (with error handling)
            try:
                stats_result = self.supabase.table("user_stats").select("user_id").gte("last_active", cutoff_date.isoformat()).execute()
                active_user_ids = [stat["user_id"] for stat in stats_result.data]
            except:
                # If user_stats table doesn't exist, return all users
                active_user_ids = []
            
            if not active_user_ids:
                return []
            
            # Get user profiles for active users
            result = self.supabase.table("user_profiles").select(
                "id, email, full_name, role, created_at"
            ).in_("id", active_user_ids).execute()
            
            users = []
            for user_data in result.data:
                # Get last active from user_stats (with error handling)
                try:
                    stats = self.supabase.table("user_stats").select("last_active").eq("user_id", user_data["id"]).execute()
                    last_active = stats.data[0]["last_active"] if stats.data else None
                except:
                    last_active = None
                
                user_data["last_active"] = last_active
                users.append(UserPublic(**user_data))
            
            return users
        except Exception as e:
            raise Exception(f"Error fetching active users: {str(e)}")
    
    async def get_user_activity_summary(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user activity summary"""
        try:
            # Get user stats
            performance = await self.get_user_performance(user_id)
            
            # Get task assignments
            assignments = self.supabase.table("task_assignments").select("*").eq("user_id", user_id).execute()
            
            # Get recent responses (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            responses = self.supabase.table("question_responses").select("*").eq("user_id", user_id).gte("submitted_at", thirty_days_ago.isoformat()).execute()
            
            # Calculate additional metrics
            active_assignments = len([a for a in assignments.data if a["is_active"]])
            completed_assignments = len([a for a in assignments.data if a["completed_at"]])
            total_target_labels = sum(a["target_labels"] for a in assignments.data)
            total_completed_labels = sum(a["completed_labels"] for a in assignments.data)
            
            completion_rate = (total_completed_labels / total_target_labels * 100) if total_target_labels > 0 else 0
            
            # Recent activity
            recent_responses_count = len(responses.data)
            avg_daily_labels = recent_responses_count / 30 if recent_responses_count > 0 else 0
            
            return {
                "performance": performance,
                "assignments": {
                    "active": active_assignments,
                    "completed": completed_assignments,
                    "total": len(assignments.data),
                    "completion_rate": round(completion_rate, 2)
                },
                "recent_activity": {
                    "responses_last_30_days": recent_responses_count,
                    "avg_daily_labels": round(avg_daily_labels, 2)
                },
                "totals": {
                    "target_labels": total_target_labels,
                    "completed_labels": total_completed_labels
                }
            }
        except Exception as e:
            raise Exception(f"Error fetching user activity summary: {str(e)}")
    
    async def update_user_last_active(self, user_id: str) -> bool:
        """Update user's last active timestamp"""
        try:
            # Try to update existing record
            result = self.supabase.table("user_stats").update({
                "last_active": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            
            # If no rows affected, try to create the record (if table exists)
            if not result.data:
                self.supabase.table("user_stats").insert({
                    "user_id": user_id,
                    "last_active": datetime.utcnow().isoformat(),
                    "total_questions_labeled": 0,
                    "accuracy_score": 1.0,
                    "labels_today": 0,
                    "labels_this_week": 0,
                    "labels_this_month": 0
                }).execute()
            return True
        except Exception as e:
            # Don't raise error if user_stats table doesn't exist or has different schema
            print(f"Warning: Could not update last active for user {user_id}: {str(e)}")
            return False

# Create global instance
user_service = UserService()