# app/services/assignment_service.py
from typing import List, Dict, Any
import json
import csv
from io import StringIO
from datetime import datetime
from app.database import get_supabase_client
from app.models.tasks import TaskAssignment, TaskAssignmentRequest
import uuid

class AssignmentService:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def get_user_assignment_overview(self) -> Dict[str, Any]:
        """Get complete user assignment overview data in single optimized call"""
        try:
            print("🔄 Starting get_user_assignment_overview fetch...")
            # Get all required data in parallel with high limits
            tasks_result = self.supabase.table("tasks")\
                .select("id, title, status, questions_number")\
                .eq("status", "active")\
                .execute()
            
            # Get all users (labelers and admins)
            labelers_result = self.supabase.table("user_profiles")\
                .select("id, email, full_name")\
                .eq("role", "labeler")\
                .execute()
            
            admins_result = self.supabase.table("user_profiles")\
                .select("id, email, full_name")\
                .eq("role", "admin")\
                .execute()
            
            # Get all assignments with high limit and order by most recent
            assignments_result = self.supabase.table("task_assignments")\
                .select("*")\
                .order("assigned_at", desc=True)\
                .limit(2000)\
                .execute()
            
            print(f"📊 Fetched data - Tasks: {len(tasks_result.data)}, Labelers: {len(labelers_result.data)}, Admins: {len(admins_result.data)}, Assignments: {len(assignments_result.data)}")
            
            
            # Combine users and mark their roles
            all_users = []
            for user in labelers_result.data:
                all_users.append({**user, "userRole": "labeler"})
            for user in admins_result.data:
                all_users.append({**user, "userRole": "admin"})
            
            # Sort users by email
            all_users.sort(key=lambda x: x["email"])
            
            # Create task lookup map
            task_map = {task["id"]: task for task in tasks_result.data}
            
            # Process users with assignments
            enhanced_users = []
            users_with_assignments = 0
            for user in all_users:
                # Filter assignments for this user
                user_assignments = [a for a in assignments_result.data if a["user_id"] == user["id"]]
                
                if user_assignments:
                    users_with_assignments += 1
                    print(f"👤 User {user['full_name']} has {len(user_assignments)} assignments")
                
                # Process assignments with task details
                enhanced_assignments = []
                for assignment in user_assignments:
                    task = task_map.get(assignment["task_id"])
                    if not task and not assignment.get("task_id"):
                        continue  # Skip invalid assignments
                    
                    enhanced_assignments.append({
                        "assignment_id": assignment["id"],
                        "task_id": assignment["task_id"],
                        "task_title": task["title"] if task else f"Task {assignment['task_id'][:8]}",
                        "completed_labels": assignment.get("completed_labels", 0),
                        "question_range_start": assignment.get("question_range_start", 1),
                        "question_range_end": assignment.get("question_range_end", 1),
                        "is_active": assignment.get("is_active", True)
                    })
                
                enhanced_users.append({
                    **user,
                    "currentAssignments": enhanced_assignments
                })
            
            print(f"✅ Processed {len(enhanced_users)} users, {users_with_assignments} have assignments")
            
            return {
                "tasks": tasks_result.data,
                "users": enhanced_users
            }
            
        except Exception as e:
            print(f"Error in get_user_assignment_overview: {str(e)}")
            raise e

    async def get_all_assignments_with_details(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all assignments with user and task details"""
        try:
            # Get assignments
            assignments_result = self.supabase.table("task_assignments")\
                .select("*")\
                .order("assigned_at", desc=True)\
                .limit(limit)\
                .offset(offset)\
                .execute()
            
            assignments = []
            for assignment in assignments_result.data:
                # Get task details
                task_result = self.supabase.table("tasks")\
                    .select("title")\
                    .eq("id", assignment["task_id"])\
                    .execute()
                
                # Get user details
                user_result = self.supabase.table("user_profiles")\
                    .select("full_name, email")\
                    .eq("id", assignment["user_id"])\
                    .execute()
                
                # No label classes to process
                class_names = []
                
                assignment_data = {
                    **assignment,
                    "task_title": task_result.data[0]["title"] if task_result.data else "Unknown Task",
                    "user_name": user_result.data[0]["full_name"] if user_result.data else "Unknown User",
                    "user_email": user_result.data[0]["email"] if user_result.data else "Unknown Email",
                    "accuracy": None,  # Can be calculated later
                    "time_spent": None,  # Can be calculated later
                }
                assignments.append(assignment_data)
            
            return assignments
            
        except Exception as e:
            print(f"Error in get_all_assignments_with_details: {str(e)}")
            raise e

    async def get_task_assignment_for_user(self, task_id: str, user_id: str) -> TaskAssignment:
        """Get assignment for a specific task and user (should be unique)"""
        try:
            result = self.supabase.table("task_assignments")\
                .select("*")\
                .eq("task_id", task_id)\
                .eq("user_id", user_id)\
                .execute()
            
            if not result.data:
                return None
            
            if len(result.data) > 1:
                # Log warning if multiple assignments found (shouldn't happen)
                print(f"Warning: Multiple assignments found for user {user_id} and task {task_id}")
            
            return TaskAssignment(**result.data[0])
        except Exception as e:
            raise Exception(f"Error fetching task assignment for user: {str(e)}")

    async def get_assignment_stats(self) -> Dict[str, Any]:
        """Calculate assignment statistics"""
        try:
            # Get all assignments
            result = self.supabase.table("task_assignments").select("*").execute()
            assignments = result.data
            
            if not assignments:
                return {
                    "total_assignments": 0,
                    "active_assignments": 0,
                    "completed_assignments": 0,
                    "avg_completion_rate": 0,
                    "total_labels_completed": 0,
                    "total_labels_target": 0,
                }
            
            total = len(assignments)
            active = len([a for a in assignments if a.get("is_active", True)])
            completed = len([a for a in assignments if a.get("completed_labels", 0) >= (a.get("question_range_end", 1) - a.get("question_range_start", 1) + 1)])
            
            total_completed = sum(a.get("completed_labels", 0) for a in assignments)
            total_target = sum((a.get("question_range_end", 1) - a.get("question_range_start", 1) + 1) for a in assignments)
            avg_completion = (total_completed / total_target * 100) if total_target > 0 else 0
            
            return {
                "total_assignments": total,
                "active_assignments": active,
                "completed_assignments": completed,
                "avg_completion_rate": avg_completion,
                "total_labels_completed": total_completed,
                "total_labels_target": total_target,
            }
            
        except Exception as e:
            print(f"Error in get_assignment_stats: {str(e)}")
            raise e

    async def get_assignment_with_details(self, assignment_id: str) -> Dict[str, Any]:
        """Get single assignment with details"""
        try:
            # Get assignment
            assignment_result = self.supabase.table("task_assignments")\
                .select("*")\
                .eq("id", assignment_id)\
                .execute()
            
            if not assignment_result.data:
                return None
            
            assignment = assignment_result.data[0]
            
            # Get task details
            task_result = self.supabase.table("tasks")\
                .select("title")\
                .eq("id", assignment["task_id"])\
                .execute()
            
            # Get user details
            user_result = self.supabase.table("user_profiles")\
                .select("full_name, email")\
                .eq("id", assignment["user_id"])\
                .execute()
            
            return {
                **assignment,
                "task_title": task_result.data[0]["title"] if task_result.data else "Unknown Task",
                "user_name": user_result.data[0]["full_name"] if user_result.data else "Unknown User",
                "user_email": user_result.data[0]["email"] if user_result.data else "Unknown Email",
            }
            
        except Exception as e:
            print(f"Error in get_assignment_with_details: {str(e)}")
            raise e

    async def update_assignment_status(self, assignment_id: str, is_active: bool) -> bool:
        """Update assignment active status"""
        try:
            result = self.supabase.table("task_assignments")\
                .update({"is_active": is_active, "updated_at": "now()"})\
                .eq("id", assignment_id)\
                .execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            print(f"Error in update_assignment_status: {str(e)}")
            raise e

    async def export_assignments_csv(self) -> str:
        """Export assignments as CSV"""
        try:
            assignments = await self.get_all_assignments_with_details(limit=1000)
            
            output = StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow([
                'Assignment ID', 'Task Title', 'User Name', 'User Email',
                'Progress', 'Status', 'Assigned At'
            ])
            
            # Write data
            for assignment in assignments:
                writer.writerow([
                    assignment['id'],
                    assignment['task_title'],
                    assignment['user_name'],
                    assignment['user_email'],
                    f"{assignment['completed_labels']}/{assignment.get('question_range_end', 1) - assignment.get('question_range_start', 1) + 1}",
                    'Active' if assignment['is_active'] else 'Inactive',
                    assignment['assigned_at']
                ])
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Error in export_assignments_csv: {str(e)}")
            raise e

    async def export_assignments_json(self) -> str:
        """Export assignments as JSON"""
        try:
            assignments = await self.get_all_assignments_with_details(limit=1000)
            return json.dumps(assignments, indent=2)
            
        except Exception as e:
            print(f"Error in export_assignments_json: {str(e)}")
            raise e
    
    async def get_user_assignments(self, user_id: str, active_only: bool = True) -> List[TaskAssignment]:
        """Get user's task assignments"""
        try:
            print(user_id)
            query = self.supabase.table("task_assignments").select("*").eq("user_id", user_id)
            if active_only:
                query = query.eq("is_active", True)
            
            result = query.execute()
            return [TaskAssignment(**assignment) for assignment in result.data]
        except Exception as e:
            raise Exception(f"Error fetching assignments: {str(e)}")
    
    async def create_task_assignment(self, assignment_data: TaskAssignmentRequest, task_id: str) -> TaskAssignment:
        """Create task assignment"""
        try:
            # Validate task exists
            from app.services.task_service import TaskService
            task_service = TaskService()
            task = await task_service.get_task_by_id(task_id)
            if not task:
                raise Exception("Task not found")
            
            # Validate user exists
            user_check = self.supabase.table("user_profiles").select("id").eq("id", assignment_data.user_id_to_assign).execute()
            if not user_check.data:
                raise Exception("User not found")
            
            
            assignment_dict = {
                "task_id": task_id,
                "user_id": assignment_data.user_id_to_assign,
                "question_range_start": assignment_data.question_range_start,
                "question_range_end": assignment_data.question_range_end,
                "completed_labels": 0,
                "is_active": True
            }
            
            result = self.supabase.table("task_assignments").insert(assignment_dict).execute()
            if result.data:
                return TaskAssignment(**result.data[0])
            raise Exception("Failed to create assignment")
            
        except Exception as e:
            raise Exception(f"Error creating assignment: {str(e)}")
    
    async def update_assignment_progress(self, assignment_id: str, completed_labels: int) -> TaskAssignment:
        """Update assignment progress"""
        try:
            result = self.supabase.table("task_assignments").update({
                "completed_labels": completed_labels
            }).eq("id", assignment_id).execute()
            
            if result.data:
                assignment = TaskAssignment(**result.data[0])
                
                # Mark as completed if target reached
                assignment_target = assignment.question_range_end - assignment.question_range_start + 1
                if assignment.completed_labels >= assignment_target:
                    self.supabase.table("task_assignments").update({
                        "completed_at": datetime.utcnow().isoformat()
                    }).eq("id", assignment_id).execute()
                
                return assignment
            raise Exception("Failed to update assignment progress")
        except Exception as e:
            raise self._handle_supabase_error("updating assignment progress", e)
    
    async def update_assignment_progress_from_response(self, assignment_id: str):
        """Update assignment progress when a response is submitted"""
        try:
            responses = self.supabase.table("question_responses").select("id").eq("task_assignment_id", assignment_id).execute()
            completed_count = len(responses.data)
            
            self.supabase.table("task_assignments").update({
                "completed_labels": completed_count
            }).eq("id", assignment_id).execute()
        except Exception as e:
            print(f"Error updating assignment progress: {str(e)}")
    
    # Private methods

# Create service instance
assignment_service = AssignmentService()