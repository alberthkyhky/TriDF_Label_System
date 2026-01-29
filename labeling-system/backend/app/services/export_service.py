import csv
import json
import io
from typing import List, Dict, Tuple, Any
from datetime import datetime
from app.database import get_supabase_client
from app.models.tasks import QuestionResponseDetailed


class ExportService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def export_task_responses_csv(self, task_id: str) -> Tuple[str, str]:
        """
        Export task responses as CSV format.
        
        Returns:
            Tuple of (csv_content, filename)
        """
        # Get task details
        task = await self._get_task_details(task_id)
        if not task:
            raise Exception(f"Task {task_id} not found")
        
        # Get all responses for this task
        responses = await self._get_task_responses(task_id)
        
        if not responses:
            # Return empty CSV with headers
            headers = ["response_id", "user_id", "task_assignment_id", "question_id", "submitted_at", "time_spent_seconds"]
            content = ",".join(headers) + "\n"
            filename = f"{self._sanitize_filename(task['title'])}_responses_{datetime.now().strftime('%Y-%m-%d')}.csv"
            return content, filename
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        headers = [
            "response_id", "user_id", "task_assignment_id", "question_id", 
            "submitted_at", "time_spent_seconds", "responses_json"
        ]
        
        # Add dynamic headers for each failure category
        if responses:
            first_response = responses[0]
            if first_response.get('responses'):
                response_data = first_response['responses']
                if isinstance(response_data, str):
                    try:
                        response_data = json.loads(response_data)
                    except json.JSONDecodeError:
                        response_data = {}
                
                if isinstance(response_data, dict):
                    for category in response_data.keys():
                        headers.append(f"response_{category}")
        
        writer.writerow(headers)
        
        # Write data rows
        for response in responses:
            row = [
                response.get('id', ''),
                response.get('user_id', ''),
                response.get('task_assignment_id', ''),
                response.get('question_id', ''),
                response.get('submitted_at', ''),
                response.get('time_spent_seconds', ''),
                json.dumps(response.get('responses', {})) if response.get('responses') else ''
            ]
            
            # Add response data for each category
            if response.get('responses'):
                response_data = response['responses']
                if isinstance(response_data, str):
                    try:
                        response_data = json.loads(response_data)
                    except json.JSONDecodeError:
                        response_data = {}
                
                if isinstance(response_data, dict) and first_response.get('responses'):
                    first_data = first_response['responses']
                    if isinstance(first_data, str):
                        try:
                            first_data = json.loads(first_data)
                        except json.JSONDecodeError:
                            first_data = {}
                    
                    if isinstance(first_data, dict):
                        for category in first_data.keys():
                            category_responses = response_data.get(category, [])
                            if isinstance(category_responses, list):
                                row.append(';'.join(category_responses) if category_responses else '')
                            else:
                                row.append(str(category_responses) if category_responses else '')
            
            writer.writerow(row)
        
        content = output.getvalue()
        filename = f"{self._sanitize_filename(task['title'])}_responses_{datetime.now().strftime('%Y-%m-%d')}.csv"
        
        return content, filename
    
    async def export_task_responses_json(self, task_id: str) -> Tuple[str, str]:
        """
        Export task responses as JSON format.
        
        Returns:
            Tuple of (json_content, filename)
        """
        # Get task details
        task = await self._get_task_details(task_id)
        if not task:
            raise Exception(f"Task {task_id} not found")
        
        # Get all responses for this task
        responses = await self._get_task_responses(task_id)
        
        # Process responses to ensure proper JSON serialization
        processed_responses = []
        for response in responses:
            processed_response = dict(response)
            
            # Parse JSON string responses if needed
            if response.get('responses') and isinstance(response['responses'], str):
                try:
                    processed_response['responses'] = json.loads(response['responses'])
                except json.JSONDecodeError:
                    processed_response['responses'] = response['responses']
            
            processed_responses.append(processed_response)
        
        # Create export data structure
        export_data = {
            "task_info": {
                "task_id": task_id,
                "title": task["title"],
                "description": task.get("description", ""),
                "exported_at": datetime.now().isoformat(),
                "total_responses": len(responses)
            },
            "responses": processed_responses
        }
        
        content = json.dumps(export_data, indent=2, default=str)
        filename = f"{self._sanitize_filename(task['title'])}_responses_{datetime.now().strftime('%Y-%m-%d')}.json"
        
        return content, filename
    
    async def _get_task_details(self, task_id: str) -> Dict[str, Any]:
        """Get task details from database."""
        try:
            result = self.supabase.table("tasks").select("*").eq("id", task_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Error fetching task details: {str(e)}")
    
    async def _get_task_responses(self, task_id: str) -> List[Dict[str, Any]]:
        """Get all responses for a specific task."""
        try:
            # First, get all task_assignment_ids for this task
            assignments_result = self.supabase.table("task_assignments").select("id").eq("task_id", task_id).execute()
            
            if not assignments_result.data:
                return []
            
            assignment_ids = [assignment["id"] for assignment in assignments_result.data]
            
            # Then get all responses for these assignments
            result = self.supabase.table("question_responses").select(
                "id, user_id, question_id, responses, submitted_at, time_spent_seconds, task_assignment_id"
            ).in_("task_assignment_id", assignment_ids).order("submitted_at").execute()
            
            return result.data if result.data else []
        except Exception as e:
            raise Exception(f"Error fetching task responses: {str(e)}")
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename by removing/replacing invalid characters."""
        import re
        # Remove/replace characters that aren't valid in filenames
        sanitized = re.sub(r'[^\w\s-]', '', filename)
        sanitized = re.sub(r'[-\s]+', '_', sanitized)
        return sanitized.strip('_')