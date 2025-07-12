# 🚀 Labeling System API Documentation

**Base URL**: `http://localhost:8000` (Development) | `https://your-domain.com` (Production)  
**API Version**: `v1`  
**API Prefix**: `/api/v1`

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Task Management](#task-management)
4. [Question Management](#question-management)
5. [File Management](#file-management)
6. [Quality Control](#quality-control)
7. [Analytics](#analytics)
8. [Error Handling](#error-handling)
9. [Data Models](#data-models)

---

## 🔐 Authentication

All API endpoints require authentication via JWT tokens from Supabase Auth.

### **Headers Required**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Authentication Flow**
1. User authenticates via Supabase Auth (frontend)
2. Frontend receives JWT token
3. Token included in API requests
4. Backend validates token and extracts user info

---

## 👤 User Management

### **GET /api/v1/auth/profile**
Get current user's profile information.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "labeler",
  "preferred_classes": ["uuid1", "uuid2"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:22:00Z"
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `404`: User profile not found

---

### **PUT /api/v1/auth/profile**
Update current user's profile.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "full_name": "John Smith",
  "preferred_classes": ["uuid1", "uuid3"]
}
```

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Smith",
  "role": "labeler",
  "preferred_classes": ["uuid1", "uuid3"],
  "updated_at": "2024-01-20T14:25:00Z"
}
```

---

### **GET /api/v1/auth/stats**
Get current user's performance statistics.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "user_id": "uuid",
  "total_questions_labeled": 150,
  "total_annotations": 150,
  "accuracy_score": 92.5,
  "labels_today": 25,
  "labels_this_week": 120,
  "labels_this_month": 450,
  "average_time_per_question": 45.2,
  "streak_days": 7,
  "last_active": "2024-01-20T14:25:00Z"
}
```

---

### **POST /api/v1/auth/refresh**
Refresh user session and update last active timestamp.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "Session refreshed successfully"
}
```

---

## 👥 User Administration (Admin Only)

### **GET /api/v1/users/**
Get all users with pagination.

**Headers**: `Authorization: Bearer <admin_token>`

**Query Parameters**:
- `limit` (optional): Number of users to return (default: 100, max: 1000)
- `offset` (optional): Number of users to skip (default: 0)

**Response**:
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "labeler",
    "created_at": "2024-01-15T10:30:00Z",
    "last_active": "2024-01-20T14:25:00Z"
  }
]
```

---

### **GET /api/v1/users/search**
Search users by email or name.

**Headers**: `Authorization: Bearer <admin_token>`

**Query Parameters**:
- `q`: Search query (minimum 2 characters)
- `limit` (optional): Number of results (default: 50, max: 100)

**Response**: Same as GET /users/

---

### **GET /api/v1/users/by-role/{role}**
Get users by specific role.

**Headers**: `Authorization: Bearer <admin_token>`

**Path Parameters**:
- `role`: One of `admin`, `labeler`, `reviewer`

**Response**: Same as GET /users/

---

### **GET /api/v1/users/active**
Get users active in the last N days.

**Headers**: `Authorization: Bearer <admin_token>`

**Query Parameters**:
- `days` (optional): Number of days to look back (default: 30, max: 365)

**Response**: Same as GET /users/

---

### **GET /api/v1/users/{user_id}**
Get specific user details.

**Headers**: `Authorization: Bearer <token>`  
**Access**: Users can view their own profile, admins can view any profile

**Response**: Same as GET /auth/profile

---

### **GET /api/v1/users/{user_id}/performance**
Get detailed user performance metrics.

**Headers**: `Authorization: Bearer <token>`  
**Access**: Users can view their own performance, admins can view any user's performance

**Response**:
```json
{
  "user_id": "uuid",
  "total_questions_labeled": 150,
  "accuracy_score": 92.5,
  "average_time_per_question": 45.2,
  "labels_today": 25,
  "labels_this_week": 120,
  "labels_this_month": 450,
  "streak_days": 7
}
```

---

### **GET /api/v1/users/{user_id}/activity**
Get comprehensive user activity summary.

**Headers**: `Authorization: Bearer <token>`  
**Access**: Users can view their own activity, admins can view any user's activity

**Response**:
```json
{
  "performance": {
    "user_id": "uuid",
    "total_questions_labeled": 150,
    "accuracy_score": 92.5
  },
  "assignments": {
    "active": 3,
    "completed": 7,
    "total": 10,
    "completion_rate": 85.2
  },
  "recent_activity": {
    "responses_last_30_days": 125,
    "avg_daily_labels": 4.2
  },
  "totals": {
    "target_labels": 500,
    "completed_labels": 450
  }
}
```

---

### **PUT /api/v1/users/{user_id}**
Update user (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "full_name": "Updated Name",
  "role": "reviewer",
  "preferred_classes": ["uuid1", "uuid2"]
}
```

**Response**: Updated user profile

---

### **PUT /api/v1/users/{user_id}/role**
Update user role (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "role": "admin"
}
```

**Response**:
```json
{
  "message": "User role updated successfully",
  "user": { /* updated user profile */ }
}
```

---

### **POST /api/v1/users/{user_id}/deactivate**
Deactivate user account (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:
```json
{
  "message": "User deactivated successfully"
}
```

---

### **POST /api/v1/users/{user_id}/reactivate**
Reactivate user account (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:
```json
{
  "message": "User reactivated successfully"
}
```

---

## 📋 Task Management

### **GET /api/v1/tasks/**
Get tasks based on user role and assignments.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": "uuid",
    "title": "Sample Image Labeling Task",
    "description": "Label objects in uploaded images",
    "status": "active",
    "rule_image_path": "/uploads/rules/example.jpg",
    "rule_description": "Label all visible objects...",
    "questions_per_user": 100,
    "required_agreements": 1,
    "created_by": "uuid",
    "created_at": "2024-01-15T10:30:00Z",
    "deadline": "2024-02-15T23:59:59Z"
  }
]
```

---

### **GET /api/v1/tasks/{task_id}**
Get specific task details.

**Headers**: `Authorization: Bearer <token>`  
**Access**: Users can view assigned tasks, admins can view all tasks

**Response**: Single task object (same structure as GET /tasks/)

---

### **POST /api/v1/tasks/**
Create new task (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "title": "New Labeling Task",
  "description": "Task description",
  "rule_image_path": "/uploads/rules/example.jpg",
  "rule_description": "Detailed labeling instructions...",
  "questions_per_user": 50,
  "required_agreements": 1,
  "deadline": "2024-03-15T23:59:59Z"
}
```

**Response**: Created task object

**Status Codes**:
- `201`: Task created successfully
- `400`: Invalid request data
- `403`: Admin access required

---

### **PUT /api/v1/tasks/{task_id}**
Update task (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**: Same as POST /tasks/ (all fields optional)

**Response**: Updated task object

---

### **DELETE /api/v1/tasks/{task_id}**
Delete task and all related data (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:
```json
{
  "message": "Task deleted successfully"
}
```

**Note**: This is a hard delete that removes the task and all associated questions, responses, and assignments.

---

## 📋 Task Assignments

### **GET /api/v1/tasks/assignments/my**
Get current user's task assignments.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": "uuid",
    "task_id": "uuid",
    "user_id": "uuid",
    "assigned_classes": ["uuid1", "uuid2"],
    "target_labels": 100,
    "completed_labels": 45,
    "assigned_at": "2024-01-15T10:30:00Z",
    "completed_at": null,
    "is_active": true
  }
]
```

---

### **POST /api/v1/tasks/{task_id}/assign**
Assign task to user (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "user_id_to_assign": "uuid",
  "assigned_classes": ["uuid1", "uuid2"],
  "target_labels": 100
}
```

**Response**:
```json
{
  "message": "Task assigned successfully",
  "assignment": {
    "id": "uuid",
    "task_id": "uuid",
    "user_id": "uuid",
    "assigned_classes": ["uuid1", "uuid2"],
    "target_labels": 100,
    "completed_labels": 0,
    "assigned_at": "2024-01-20T15:30:00Z",
    "is_active": true
  }
}
```

---

### **GET /api/v1/tasks/{task_id}/assignments**
Get all assignments for a task (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Response**: Array of assignment objects

---

## ❓ Question Management

### **GET /api/v1/tasks/{task_id}/questions**
Get questions for a task.

**Headers**: `Authorization: Bearer <token>`  
**Access**: Users can view questions from assigned tasks, admins can view all questions

**Response**:
```json
[
  {
    "id": "uuid",
    "task_id": "uuid",
    "question_text": "What objects do you see in this image?",
    "question_order": 1,
    "status": "pending",
    "target_classes": ["uuid1", "uuid2"],
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### **POST /api/v1/tasks/{task_id}/questions**
Create question for task (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "question_text": "What objects do you see in this media?",
  "question_order": 1,
  "target_classes": ["uuid1", "uuid2"]
}
```

**Response**: Created question object

---

### **GET /api/v1/questions/{question_id}/media**
Get media files for a question.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": "uuid",
    "question_id": "uuid",
    "file_path": "/uploads/images/image1.jpg",
    "media_type": "image",
    "file_size": 2048576,
    "mime_type": "image/jpeg",
    "display_order": 1,
    "duration_seconds": null,
    "width": 1920,
    "height": 1080,
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### **GET /api/v1/questions/{question_id}/choices**
Get answer choices for a question.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": "uuid",
    "question_id": "uuid",
    "label_class_id": "uuid",
    "choice_text": "Contains Person",
    "choice_value": "person",
    "display_order": 1,
    "is_correct": null,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## 📝 Question Responses

### **POST /api/v1/tasks/responses**
Submit response to a question.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "question_id": "uuid",
  "task_assignment_id": "uuid",
  "selected_choices": ["choice_uuid1", "choice_uuid2"],
  "confidence_level": 4,
  "time_spent_seconds": 45,
  "started_at": "2024-01-20T15:25:00Z"
}
```

**Response**:
```json
{
  "id": "uuid",
  "question_id": "uuid",
  "user_id": "uuid",
  "task_assignment_id": "uuid",
  "selected_choices": ["choice_uuid1", "choice_uuid2"],
  "confidence_level": 4,
  "time_spent_seconds": 45,
  "started_at": "2024-01-20T15:25:00Z",
  "submitted_at": "2024-01-20T15:26:00Z",
  "is_honeypot_response": false,
  "is_flagged": false
}
```

**Status Codes**:
- `201`: Response submitted successfully
- `400`: Invalid request data (missing required fields, invalid choices)
- `403`: User not assigned to this task
- `409`: Response already submitted for this question

---

### **GET /api/v1/tasks/responses/my**
Get current user's question responses.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `task_id` (optional): Filter responses by task

**Response**: Array of response objects

---

### **GET /api/v1/responses/{response_id}**
Get specific response details.

**Headers**: `Authorization: Bearer <token>`  
**Access**: Users can view their own responses, admins can view all responses

**Response**: Single response object

---

## 🏷️ Label Classes

### **GET /api/v1/tasks/label-classes**
Get all active label classes.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Person",
    "description": "Human beings in any form",
    "color_hex": "#ff5722",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### **POST /api/v1/tasks/label-classes**
Create new label class (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "name": "Furniture",
  "description": "Tables, chairs, beds, etc.",
  "color_hex": "#9c27b0",
  "is_active": true
}
```

**Response**: Created label class object

---

### **PUT /api/v1/tasks/label-classes/{class_id}**
Update label class (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**: Same as POST (all fields optional)

**Response**: Updated label class object

---

### **DELETE /api/v1/tasks/label-classes/{class_id}**
Soft delete label class (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:
```json
{
  "message": "Label class deleted successfully"
}
```

---

## 📁 File Management

### **POST /api/v1/files/upload**
Upload media file (admin only).

**Headers**: 
- `Authorization: Bearer <admin_token>`
- `Content-Type: multipart/form-data`

**Request Body** (Form Data):
- `file`: Media file (image, video, or audio)

**Response**:
```json
{
  "id": "uuid",
  "filename": "original_name.jpg",
  "file_type": "image",
  "file_size": 2048576,
  "file_path": "/uploads/images/unique_name.jpg",
  "message": "File uploaded successfully"
}
```

**Status Codes**:
- `201`: File uploaded successfully
- `400`: Invalid file type or size too large
- `413`: File too large
- `500`: Upload failed

**Supported File Types**:
- **Images**: .jpg, .jpeg, .png, .gif, .bmp, .webp
- **Videos**: .mp4, .avi, .mov, .wmv, .flv, .mkv  
- **Audio**: .mp3, .wav, .flac, .aac, .ogg, .m4a

**File Size Limit**: 100MB per file

---

### **GET /api/v1/files/list**
List uploaded files (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Query Parameters**:
- `file_type` (optional): Filter by type (`image`, `video`, `audio`)

**Response**:
```json
[
  {
    "id": "uuid",
    "filename": "original_name.jpg",
    "unique_filename": "uuid.jpg",
    "file_path": "/uploads/images/uuid.jpg",
    "file_type": "image",
    "file_size": 2048576,
    "mime_type": "image/jpeg",
    "uploaded_by": "uuid",
    "uploaded_at": "2024-01-15T10:30:00Z",
    "used_in_questions": 3,
    "is_deleted": false
  }
]
```

---

### **GET /api/v1/files/{file_id}**
Get file metadata.

**Headers**: `Authorization: Bearer <token>`  
**Access**: Users can view files from their assigned tasks, admins can view all files

**Response**: Single file object (same structure as in list response)

---

### **DELETE /api/v1/files/{file_id}**
Delete file (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:
```json
{
  "message": "File deleted successfully"
}
```

**Note**: This removes both the file and database record. Files in use by questions cannot be deleted.

---

### **GET /uploads/{file_path}**
Serve uploaded file.

**Headers**: `Authorization: Bearer <token>` (for access control)

**Response**: Binary file content with appropriate Content-Type header

**Note**: Files are served statically but with access control based on user permissions.

---

## 🎖️ Quality Control

### **POST /api/v1/quality/honeypot**
Create honeypot question (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "question_id": "uuid",
  "expected_choices": ["choice_uuid1", "choice_uuid2"]
}
```

**Response**:
```json
{
  "message": "Honeypot created successfully",
  "honeypot": {
    "id": "uuid",
    "question_id": "uuid",
    "is_honeypot": true,
    "expected_choices": ["choice_uuid1", "choice_uuid2"],
    "created_at": "2024-01-20T15:30:00Z"
  }
}
```

---

### **GET /api/v1/quality/metrics/{user_id}**
Get quality metrics for a user.

**Headers**: `Authorization: Bearer <token>`  
**Access**: Users can view their own metrics, admins can view any user's metrics

**Response**:
```json
{
  "honeypot_accuracy": 85.5,
  "total_honeypots": 20,
  "correct_honeypots": 17,
  "average_response_time": 42.3,
  "fast_response_rate": 5.2,
  "consistency_score": 88.7,
  "total_responses": 150,
  "quality_flags": [
    {
      "check_type": "speed_check",
      "passed": false,
      "flag_reason": "Responses too fast",
      "timestamp": "2024-01-18T14:20:00Z"
    }
  ]
}
```

---

### **POST /api/v1/quality/flag/{user_id}**
Flag user for suspicious activity (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "reason": "Inconsistent response patterns",
  "metadata": {
    "detection_method": "automated",
    "confidence": 0.85
  }
}
```

**Response**:
```json
{
  "message": "User flagged successfully"
}
```

---

## 📊 Analytics (Admin Only)

### **GET /api/v1/analytics/overview**
Get system overview analytics.

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:
```json
{
  "activeUsers": 45,
  "completedTasks": 12,
  "labelsToday": 1250,
  "avgAccuracy": 87.3,
  "avgTimePerLabel": 38.5
}
```

---

### **GET /api/v1/analytics/performance**
Get performance metrics over time.

**Headers**: `Authorization: Bearer <admin_token>`

**Query Parameters**:
- `days` (optional): Number of days to include (default: 30)

**Response**:
```json
[
  {
    "date": "2024-01-20",
    "labels": 450,
    "users": 23,
    "accuracy": 88.2,
    "speed": 42.1,
    "throughput": 67.5
  }
]
```

---

### **GET /api/v1/analytics/quality**
Get quality control analytics.

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:
```json
{
  "honeypotSuccessRate": 82.5,
  "consensusRate": 91.2,
  "alerts": [
    {
      "severity": "warning",
      "title": "Low Accuracy Alert",
      "message": "3 users below 70% accuracy threshold"
    }
  ],
  "accuracyDistribution": [
    {"name": "90-100%", "value": 45, "color": "#4caf50"},
    {"name": "80-89%", "value": 32, "color": "#ff9800"},
    {"name": "70-79%", "value": 18, "color": "#f44336"},
    {"name": "<70%", "value": 5, "color": "#9e9e9e"}
  ],
  "honeypotPerformance": [
    {
      "question": "Question 1",
      "success_rate": 85,
      "attempts": 120
    }
  ],
  "flaggedUsers": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "flag_reason": "Low accuracy",
      "accuracy": 65.2
    }
  ]
}
```

---

### **GET /api/v1/analytics/users**
Get user analytics.

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:
```json
{
  "topPerformers": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Jane Smith",
      "labels_this_week": 150,
      "accuracy": 94.2,
      "streak_days": 12
    }
  ]
}
```

---

### **GET /api/v1/analytics/tasks**
Get task analytics.

**Headers**: `Authorization: Bearer <admin_token>`

**Response**:
```json
[
  {
    "id": "uuid",
    "title": "Sample Task",
    "status": "active",
    "total_questions": 500,
    "completed_responses": 1250,
    "completion_rate": 83.3,
    "avg_accuracy": 89.1,
    "assigned_users": 15,
    "active_users": 12
  }
]
```

---

### **POST /api/v1/analytics/export**
Export analytics data.

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "format": "csv",
  "data_type": "performance",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

**Response**: File download with appropriate Content-Type header

**Supported Formats**: `csv`, `json`, `pdf`  
**Data Types**: `performance`, `quality`, `users`, `tasks`

---

## ⚠️ Error Handling

### **Standard Error Response Format**
```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "field": "Specific field error details"
  },
  "status_code": 400
}
```

### **HTTP Status Codes**

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | OK | Successful GET, PUT operations |
| `201` | Created | Successful POST operations |
| `204` | No Content | Successful DELETE operations |
| `400` | Bad Request | Invalid request data, validation errors |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | Valid auth but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists, business rule violation |
| `413` | Payload Too Large | File upload exceeds size limit |
| `422` | Unprocessable Entity | Valid JSON but business logic errors |
| `429` | Too Many Requests | Rate limiting (if implemented) |
| `500` | Internal Server Error | Unexpected server errors |

### **Common Error Examples**

**Authentication Error (401)**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid token: Token has expired",
  "status_code": 401
}
```

**Validation Error (400)**:
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": {
    "title": "Field is required",
    "questions_per_user": "Must be positive integer"
  },
  "status_code": 400
}
```

**Permission Error (403)**:
```json
{
  "error": "Forbidden",
  "message": "Admin access required",
  "status_code": 403
}
```

**Business Logic Error (422)**:
```json
{
  "error": "Business Rule Violation",
  "message": "Cannot delete task with active assignments",
  "details": {
    "active_assignments": 5,
    "task_id": "uuid"
  },
  "status_code": 422
}
```

---

## 📋 Data Models

### **User Profile Model**
```typescript
interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'labeler' | 'reviewer';
  preferred_classes?: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
```

### **Task Model**
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  rule_image_path?: string;
  rule_description?: string;
  questions_per_user: number;
  required_agreements: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  deadline?: string;
  metadata?: object;
}
```

### **Question Model**
```typescript
interface Question {
  id: string;
  task_id: string;
  question_text?: string;
  question_order: number;
  status: 'pending' | 'labeled' | 'reviewed' | 'approved';
  target_classes: string[];
  created_at: string;
  updated_at: string;
}
```

### **Question Response Model**
```typescript
interface QuestionResponse {
  id: string;
  question_id: string;
  user_id: string;
  task_assignment_id: string;
  selected_choices: string[];
  confidence_level?: number; // 1-5
  time_spent_seconds?: number;
  started_at?: string;
  submitted_at: string;
  is_honeypot_response: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  metadata?: object;
}
```

### **Label Class Model**
```typescript
interface LabelClass {
  id: string;
  name: string;
  description?: string;
  color_hex: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```