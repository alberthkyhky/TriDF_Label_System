# app/services/assignment_service.py
from typing import List, Dict, Any
import json
import csv
from io import StringIO
from app.database import get_supabase_client

class AssignmentService:
    def __init__(self):
        self.supabase = get_supabase_client()

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
                
                # Get label class names from IDs
                class_names = []
                if assignment.get("assigned_classes"):
                    try:
                        # Try to get label class names
                        classes_result = self.supabase.table("label_classes")\
                            .select("name")\
                            .in_("id", assignment["assigned_classes"])\
                            .execute()
                        class_names = [c["name"] for c in classes_result.data]
                    except:
                        # Fallback: use the IDs as names
                        class_names = assignment["assigned_classes"]
                
                assignment_data = {
                    **assignment,
                    "task_title": task_result.data[0]["title"] if task_result.data else "Unknown Task",
                    "user_name": user_result.data[0]["full_name"] if user_result.data else "Unknown User",
                    "user_email": user_result.data[0]["email"] if user_result.data else "Unknown Email",
                    "assigned_classes": class_names,  # Convert to names for display
                    "accuracy": None,  # Can be calculated later
                    "time_spent": None,  # Can be calculated later
                }
                assignments.append(assignment_data)
            
            return assignments
            
        except Exception as e:
            print(f"Error in get_all_assignments_with_details: {str(e)}")
            raise e

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
            completed = len([a for a in assignments if a.get("completed_labels", 0) >= a.get("target_labels", 1)])
            
            total_completed = sum(a.get("completed_labels", 0) for a in assignments)
            total_target = sum(a.get("target_labels", 0) for a in assignments)
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
                'Progress', 'Status', 'Label Classes', 'Assigned At'
            ])
            
            # Write data
            for assignment in assignments:
                writer.writerow([
                    assignment['id'],
                    assignment['task_title'],
                    assignment['user_name'],
                    assignment['user_email'],
                    f"{assignment['completed_labels']}/{assignment['target_labels']}",
                    'Active' if assignment['is_active'] else 'Inactive',
                    ', '.join(assignment['assigned_classes']),
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

# Create service instance
assignment_service = AssignmentService()