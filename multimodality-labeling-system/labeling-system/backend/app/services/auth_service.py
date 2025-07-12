from app.database import get_supabase_client
from app.models.auth import UserProfile, UserProfileUpdate, UserStats
from typing import Optional, List
from datetime import datetime

class AuthService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """Get user profile by ID"""
        try:
            result = self.supabase.table("user_profiles").select("*").eq("id", user_id).execute()
            if result.data:
                return UserProfile(**result.data[0])
            return None
        except Exception as e:
            raise Exception(f"Error fetching user profile: {str(e)}")
    
    async def update_user_profile(self, user_id: str, profile_data: UserProfileUpdate) -> UserProfile:
        """Update user profile"""
        try:
            update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
            if not update_data:
                # If no data to update, just return current profile
                return await self.get_user_profile(user_id)
            
            result = self.supabase.table("user_profiles").update(update_data).eq("id", user_id).execute()
            if result.data:
                return UserProfile(**result.data[0])
            raise Exception("Failed to update user profile")
        except Exception as e:
            raise Exception(f"Error updating user profile: {str(e)}")
    
    async def get_user_stats(self, user_id: str) -> UserStats:
        """Get user statistics"""
        try:
            result = self.supabase.table("user_stats").select("*").eq("user_id", user_id).execute()
            if result.data:
                return UserStats(**result.data[0])
            else:
                # Create default stats if none exist
                default_stats = {
                    "user_id": user_id,
                    "total_questions_labeled": 0,
                    "total_annotations": 0,
                    "accuracy_score": 100.0,
                    "labels_today": 0,
                    "labels_this_week": 0,
                    "labels_this_month": 0,
                    "streak_days": 0
                }
                self.supabase.table("user_stats").insert(default_stats).execute()
                return UserStats(**default_stats)
        except Exception as e:
            raise Exception(f"Error fetching user stats: {str(e)}")
    
    async def update_user_stats(self, user_id: str, stats_update: dict) -> UserStats:
        """Update user statistics"""
        try:
            result = self.supabase.table("user_stats").update(stats_update).eq("user_id", user_id).execute()
            if result.data:
                return UserStats(**result.data[0])
            raise Exception("Failed to update user stats")
        except Exception as e:
            raise Exception(f"Error updating user stats: {str(e)}")
    
    async def get_all_users(self, limit: int = 100, offset: int = 0) -> List[UserProfile]:
        """Get all users (admin only)"""
        try:
            result = self.supabase.table("user_profiles").select("*").range(offset, offset + limit - 1).execute()
            return [UserProfile(**user) for user in result.data]
        except Exception as e:
            raise Exception(f"Error fetching users: {str(e)}")
    
    async def update_user_role(self, user_id: str, role: str) -> UserProfile:
        """Update user role (admin only)"""
        try:
            result = self.supabase.table("user_profiles").update({"role": role}).eq("id", user_id).execute()
            if result.data:
                return UserProfile(**result.data[0])
            raise Exception("Failed to update user role")
        except Exception as e:
            raise Exception(f"Error updating user role: {str(e)}")
    
    async def deactivate_user(self, user_id: str) -> bool:
        """Deactivate user account (admin only)"""
        try:
            # Update user profile to inactive
            self.supabase.table("user_profiles").update({"is_active": False}).eq("id", user_id).execute()
            # Deactivate all assignments
            self.supabase.table("task_assignments").update({"is_active": False}).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            raise Exception(f"Error deactivating user: {str(e)}")
    
    async def reactivate_user(self, user_id: str) -> bool:
        """Reactivate user account (admin only)"""
        try:
            self.supabase.table("user_profiles").update({"is_active": True}).eq("id", user_id).execute()
            return True
        except Exception as e:
            raise Exception(f"Error reactivating user: {str(e)}")
    
    async def increment_user_labels(self, user_id: str) -> bool:
        """Increment user's label counts (called when user submits a response)"""
        try:
            # Get current stats
            current_stats = await self.get_user_stats(user_id)
            
            # Prepare update data
            update_data = {
                "total_questions_labeled": current_stats.total_questions_labeled + 1,
                "total_annotations": current_stats.total_annotations + 1,
                "last_active": datetime.utcnow().isoformat()
            }
            
            # Check if it's a new day for daily count
            if current_stats.last_active:
                last_active = datetime.fromisoformat(current_stats.last_active.replace('Z', '+00:00'))
                if last_active.date() != datetime.utcnow().date():
                    # New day, reset daily count
                    update_data["labels_today"] = 1
                    # Calculate streak
                    if (datetime.utcnow().date() - last_active.date()).days == 1:
                        update_data["streak_days"] = current_stats.streak_days + 1
                    else:
                        update_data["streak_days"] = 1
                else:
                    # Same day, increment
                    update_data["labels_today"] = current_stats.labels_today + 1
                    update_data["streak_days"] = current_stats.streak_days
            else:
                # First time labeling
                update_data["labels_today"] = 1
                update_data["streak_days"] = 1
            
            # Update weekly and monthly counts (simplified - you might want more sophisticated logic)
            update_data["labels_this_week"] = current_stats.labels_this_week + 1
            update_data["labels_this_month"] = current_stats.labels_this_month + 1
            
            # Update in database
            await self.update_user_stats(user_id, update_data)
            return True
            
        except Exception as e:
            raise Exception(f"Error incrementing user labels: {str(e)}")
    
    async def update_user_accuracy(self, user_id: str, is_correct: bool) -> bool:
        """Update user's accuracy score based on quality check result"""
        try:
            current_stats = await self.get_user_stats(user_id)
            
            # Simple accuracy calculation (you might want more sophisticated algorithm)
            # This is a basic implementation - in production you'd want to track
            # total attempts and correct attempts separately
            current_accuracy = current_stats.accuracy_score
            
            if is_correct:
                # Gradually increase accuracy (weighted average)
                new_accuracy = min(100.0, current_accuracy + (100.0 - current_accuracy) * 0.1)
            else:
                # Decrease accuracy more significantly for wrong answers
                new_accuracy = max(0.0, current_accuracy - (current_accuracy * 0.2))
            
            await self.update_user_stats(user_id, {
                "accuracy_score": round(new_accuracy, 2)
            })
            
            return True
            
        except Exception as e:
            raise Exception(f"Error updating user accuracy: {str(e)}")
    
    async def calculate_average_time_per_question(self, user_id: str, time_spent: int) -> bool:
        """Calculate and update average time per question"""
        try:
            current_stats = await self.get_user_stats(user_id)
            
            if current_stats.average_time_per_question is None:
                new_average = float(time_spent)
            else:
                # Calculate weighted average (giving more weight to recent data)
                total_questions = current_stats.total_questions_labeled
                if total_questions > 0:
                    weight = 0.9  # Weight for existing average
                    new_average = (current_stats.average_time_per_question * weight + 
                                 time_spent * (1 - weight))
                else:
                    new_average = float(time_spent)
            
            await self.update_user_stats(user_id, {
                "average_time_per_question": round(new_average, 2)
            })
            
            return True
            
        except Exception as e:
            raise Exception(f"Error calculating average time: {str(e)}")
    
    async def reset_daily_stats(self, user_id: str) -> bool:
        """Reset daily statistics (typically called by a scheduled job)"""
        try:
            await self.update_user_stats(user_id, {
                "labels_today": 0
            })
            return True
        except Exception as e:
            raise Exception(f"Error resetting daily stats: {str(e)}")
    
    async def reset_weekly_stats(self, user_id: str) -> bool:
        """Reset weekly statistics (typically called by a scheduled job)"""
        try:
            await self.update_user_stats(user_id, {
                "labels_this_week": 0
            })
            return True
        except Exception as e:
            raise Exception(f"Error resetting weekly stats: {str(e)}")
    
    async def reset_monthly_stats(self, user_id: str) -> bool:
        """Reset monthly statistics (typically called by a scheduled job)"""
        try:
            await self.update_user_stats(user_id, {
                "labels_this_month": 0
            })
            return True
        except Exception as e:
            raise Exception(f"Error resetting monthly stats: {str(e)}")
    
    async def get_user_leaderboard(self, limit: int = 10, metric: str = "total_questions_labeled") -> List[dict]:
        """Get leaderboard of top users by specified metric"""
        try:
            valid_metrics = [
                "total_questions_labeled", "accuracy_score", "labels_today", 
                "labels_this_week", "labels_this_month", "streak_days"
            ]
            
            if metric not in valid_metrics:
                raise ValueError(f"Invalid metric. Must be one of: {valid_metrics}")
            
            # Get user stats ordered by metric
            result = self.supabase.table("user_stats").select(
                "user_id, total_questions_labeled, accuracy_score, labels_today, "
                "labels_this_week, labels_this_month, streak_days"
            ).order(metric, desc=True).limit(limit).execute()
            
            # Get user profiles for the top users
            leaderboard = []
            for stats in result.data:
                profile = await self.get_user_profile(stats["user_id"])
                if profile:
                    leaderboard.append({
                        "user": {
                            "id": profile.id,
                            "full_name": profile.full_name,
                            "email": profile.email
                        },
                        "stats": stats,
                        "metric_value": stats[metric]
                    })
            
            return leaderboard
            
        except Exception as e:
            raise Exception(f"Error getting leaderboard: {str(e)}")
    
    async def bulk_update_user_roles(self, user_role_updates: List[dict]) -> bool:
        """Bulk update user roles (admin only)"""
        try:
            for update in user_role_updates:
                user_id = update.get("user_id")
                role = update.get("role")
                
                if user_id and role and role in ["admin", "labeler", "reviewer"]:
                    await self.update_user_role(user_id, role)
            
            return True
        except Exception as e:
            raise Exception(f"Error bulk updating user roles: {str(e)}")
    
    async def get_users_by_performance(self, min_accuracy: float = 80.0, min_labels: int = 10) -> List[dict]:
        """Get users meeting performance criteria"""
        try:
            result = self.supabase.table("user_stats").select("*").gte("accuracy_score", min_accuracy).gte("total_questions_labeled", min_labels).execute()
            
            users_with_performance = []
            for stats in result.data:
                profile = await self.get_user_profile(stats["user_id"])
                if profile:
                    users_with_performance.append({
                        "user": profile,
                        "stats": UserStats(**stats)
                    })
            
            return users_with_performance
        except Exception as e:
            raise Exception(f"Error getting users by performance: {str(e)}")
    
    async def get_inactive_users(self, days_inactive: int = 7) -> List[UserProfile]:
        """Get users who haven't been active for specified days"""
        try:
            from datetime import timedelta
            cutoff_date = datetime.utcnow() - timedelta(days=days_inactive)
            
            result = self.supabase.table("user_stats").select("user_id").lt("last_active", cutoff_date.isoformat()).execute()
            
            inactive_users = []
            for stats in result.data:
                profile = await self.get_user_profile(stats["user_id"])
                if profile:
                    inactive_users.append(profile)
            
            return inactive_users
        except Exception as e:
            raise Exception(f"Error getting inactive users: {str(e)}")
    
    async def create_user_backup(self, user_id: str) -> dict:
        """Create a backup of all user data"""
        try:
            # Get user profile
            profile = await self.get_user_profile(user_id)
            stats = await self.get_user_stats(user_id)
            
            # Get user's assignments
            assignments = self.supabase.table("task_assignments").select("*").eq("user_id", user_id).execute()
            
            # Get user's responses
            responses = self.supabase.table("question_responses").select("*").eq("user_id", user_id).execute()
            
            backup_data = {
                "user_id": user_id,
                "created_at": datetime.utcnow().isoformat(),
                "profile": profile.dict() if profile else None,
                "stats": stats.dict(),
                "assignments": assignments.data,
                "responses": responses.data
            }
            
            return backup_data
        except Exception as e:
            raise Exception(f"Error creating user backup: {str(e)}")

# Create global instance
auth_service = AuthService()