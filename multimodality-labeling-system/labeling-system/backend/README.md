# 🚀 Labeling System Backend

FastAPI-based backend with Supabase integration, JWT authentication, and comprehensive labeling management.

## 🏗️ Architecture

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables
├── app/
│   ├── config.py          # App configuration
│   ├── database.py        # Supabase client
│   ├── models/            # Pydantic data models
│   │   ├── auth.py        # Auth models
│   │   ├── tasks.py       # Task models
│   │   └── users.py       # User models
│   ├── auth/              # Authentication logic
│   │   ├── dependencies.py # Auth dependencies
│   │   └── utils.py       # Auth utilities
│   ├── routers/           # API endpoints
│   │   ├── auth.py        # /auth/* endpoints
│   │   ├── tasks.py       # /tasks/* endpoints
│   │   └── users.py       # /users/* endpoints
│   ├── services/          # Business logic layer
│   │   ├── auth_service.py
│   │   ├── task_service.py
│   │   └── user_service.py
│   └── utils/             # Helper functions
└── uploads/               # File storage
    ├── images/
    ├── videos/
    └── audio/
```

## ⚡ Quick Start

### 1. Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate environment
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables
```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# API Configuration
API_V1_STR=/api/v1
BACKEND_CORS_ORIGINS=http://localhost:3000

# File Upload Settings
MAX_FILE_SIZE=104857600  # 100MB
UPLOAD_DIR=uploads
```

### 3. Database Setup
Ensure your Supabase database has the required schema:
1. Go to Supabase SQL Editor
2. Run the database schema script
3. Verify tables are created

### 4. Run Application
```bash
# Development mode
python main.py

# Production mode with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 5. Verify Installation
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔗 API Endpoints

### **Authentication** (`/api/v1/auth/`)
```bash
GET    /auth/profile          # Get current user profile
PUT    /auth/profile          # Update user profile
GET    /auth/stats            # Get user statistics
GET    /auth/me               # Get current user info
POST   /auth/refresh          # Refresh user session
```

### **Tasks** (`/api/v1/tasks/`)
```bash
# Task Management
GET    /tasks/                # Get user's tasks
POST   /tasks/                # Create task (admin)
GET    /tasks/{id}            # Get specific task
PUT    /tasks/{id}            # Update task (admin)
DELETE /tasks/{id}            # Delete task (admin)

# Task Assignments
GET    /tasks/assignments/my  # Get user assignments
POST   /tasks/{id}/assign     # Assign task to user (admin)
GET    /tasks/{id}/assignments # Get task assignments (admin)

# Questions & Responses
GET    /tasks/{id}/questions  # Get task questions
POST   /tasks/{id}/questions  # Create question (admin)
POST   /tasks/responses       # Submit question response
GET    /tasks/responses/my    # Get user responses

# Label Classes
GET    /tasks/label-classes   # Get all label classes
POST   /tasks/label-classes   # Create label class (admin)
PUT    /tasks/label-classes/{id} # Update label class (admin)
DELETE /tasks/label-classes/{id} # Delete label class (admin)
```

### **Users** (`/api/v1/users/`)
```bash
GET    /users/                    # Get all users (admin)
GET    /users/search              # Search users (admin)
GET    /users/by-role/{role}      # Get users by role (admin)
GET    /users/active              # Get active users (admin)
GET    /users/{id}                # Get user details
GET    /users/{id}/performance    # Get user performance
GET    /users/{id}/activity       # Get user activity summary
PUT    /users/{id}                # Update user (admin)
PUT    /users/{id}/role           # Update user role (admin)
POST   /users/{id}/deactivate     # Deactivate user (admin)
POST   /users/{id}/reactivate     # Reactivate user (admin)
```

## 🔐 Authentication & Authorization

### **JWT Token Flow**
1. User authenticates via Supabase Auth
2. Frontend receives JWT token
3. Token included in API requests via `Authorization: Bearer <token>`
4. Backend validates token using Supabase JWT secret
5. User permissions checked based on role

### **Role-Based Access Control**
```python
# Admin only endpoints
@router.post("/tasks/", dependencies=[Depends(require_admin)])

# Admin or reviewer access
@router.get("/reviews/", dependencies=[Depends(require_admin_or_reviewer)])

# Authenticated users
@router.get("/profile", dependencies=[Depends(get_current_user)])
```

### **Roles & Permissions**
| Role | Permissions |
|------|------------|
| **Admin** | Full system access, user management, task creation |
| **Reviewer** | Review submissions, quality control |
| **Labeler** | Submit responses, view assigned tasks |

## 📊 Data Models

### **User Profile**
```python
class UserProfile(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str]
    role: str = "labeler"
    preferred_classes: Optional[List[str]] = []
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
```

### **Task**
```python
class Task(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: TaskStatus
    rule_image_path: Optional[str]
    rule_description: Optional[str]
    questions_per_user: int
    required_agreements: int
    created_by: str
    created_at: datetime
    deadline: Optional[datetime]
```

### **Question Response**
```python
class QuestionResponse(BaseModel):
    id: str
    question_id: str
    user_id: str
    task_assignment_id: str
    selected_choices: List[str]
    confidence_level: Optional[int]
    time_spent_seconds: Optional[int]
    submitted_at: datetime
```

## 🗄️ Database Schema

### **Core Tables**
- **`user_profiles`** - Extended user information
- **`tasks`** - Labeling tasks with configuration
- **`questions`** - Individual questions within tasks
- **`question_media`** - Media files for questions
- **`answer_choices`** - Multiple choice options
- **`question_responses`** - User submissions
- **`task_assignments`** - User task assignments
- **`label_classes`** - Labeling categories
- **`user_stats`** - Performance metrics
- **`quality_control`** - Quality assurance data

### **Key Relationships**
```
Tasks 1:N Questions 1:N QuestionMedia
Tasks 1:N TaskAssignments N:1 Users
Questions 1:N AnswerChoices
Questions 1:N QuestionResponses N:1 Users
```

## 🔧 Services Layer

### **AuthService**
```python
# Core functionality
auth_service.get_user_profile(user_id)
auth_service.update_user_stats(user_id, stats)
auth_service.increment_user_labels(user_id)
auth_service.update_user_accuracy(user_id, is_correct)

# Admin functions
auth_service.get_all_users(limit, offset)
auth_service.update_user_role(user_id, role)
auth_service.get_user_leaderboard(limit, metric)
```

### **TaskService**
```python
# Task management
task_service.create_task(task_data, created_by)
task_service.get_tasks_for_user(user_id, user_role)
task_service.create_task_assignment(assignment_data, task_id)

# Question handling
task_service.get_questions_for_task(task_id)
task_service.create_question_response(response_data, user_id)

# Label classes
task_service.get_label_classes()
task_service.create_label_class(label_class_data)
```

### **UserService**
```python
# User management
user_service.get_all_users(limit, offset)
user_service.search_users(query, limit)
user_service.get_user_performance(user_id)
user_service.get_user_activity_summary(user_id)
```

## 📁 File Management

### **Supported File Types**
```python
# Images
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}

# Videos
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv"}

# Audio
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"}
```

### **File Organization**
```
uploads/
├── images/
│   └── task_001/
│       ├── image1.jpg
│       └── image2.png
├── videos/
│   └── task_002/
│       └── video1.mp4
├── audio/
│   └── task_003/
│       └── audio1.wav
└── rules/
    └── example_task.jpg
```

### **Upload Configuration**
```python
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
UPLOAD_DIR = "uploads"
```

## 🧪 Testing

### **Setup Test Environment**
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx pytest-cov

# Create test database (separate from main)
# Update test configuration
```

### **Run Tests**
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

### **Test Structure**
```
tests/
├── conftest.py              # Test configuration
├── test_auth.py             # Authentication tests
├── test_tasks.py            # Task management tests
├── test_users.py            # User management tests
└── test_api/                # API endpoint tests
    ├── test_auth_routes.py
    ├── test_task_routes.py
    └── test_user_routes.py
```

## 📈 Performance Optimization

### **Database Optimization**
```sql
-- Key indexes for performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_annotations_user_id ON annotations(user_id);
CREATE INDEX idx_quality_checks_timestamp ON quality_checks(timestamp);
```

### **Caching Strategy**
```python
# Consider implementing:
# - Redis for session caching
# - Database query result caching
# - File metadata caching
```

### **File Optimization**
```python
# Automatic file optimization
# - Image compression for web delivery
# - Video thumbnails generation
# - Audio waveform pre-computation
```

## 🔒 Security Considerations

### **Input Validation**
- All inputs validated with Pydantic models
- File type and size restrictions enforced
- SQL injection prevention via Supabase client

### **Authentication Security**
- JWT tokens with proper expiration
- Role-based access control (RBAC)
- Row-level security in database

### **File Security**
- File type validation
- Virus scanning (recommended for production)
- Secure file serving with access controls

## 🚀 Deployment

### **Environment Variables**
```bash
# Production environment
ENVIRONMENT=production
DEBUG=False

# Security
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=your-domain.com

# Database
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=0

# File storage
UPLOAD_DIR=/var/uploads
MAX_FILE_SIZE=104857600
```

### **Docker Deployment**
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### **Production Checklist**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] File upload directories secured
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Rate limiting configured

## 🐛 Troubleshooting

### **Common Issues**

**Database Connection**
```bash
# Check Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_JWT_SECRET

# Test connection
python -c "from app.database import get_supabase_client; print(get_supabase_client())"
```

**Authentication Problems**
```bash
# Verify JWT secret
# Check token expiration
# Validate CORS settings
```

**File Upload Issues**
```bash
# Check directory permissions
ls -la uploads/

# Verify file size limits
# Check available disk space
```

### **Debug Mode**
```bash
# Enable debug logging
export DEBUG=1
export LOG_LEVEL=DEBUG

# Run with detailed output
python main.py
```

### **Health Checks**
```bash
# API health
curl http://localhost:8000/health

# Database connectivity
curl http://localhost:8000/api/v1/auth/profile -H "Authorization: Bearer <token>"
```

## 📞 Support

- **API Documentation**: http://localhost:8000/docs
- **Issues**: Create GitHub issue with logs
- **Performance**: Check database indexes and query optimization

## 🔄 Development Workflow

1. **Create feature branch**: `git checkout -b feature/new-endpoint`
2. **Write tests**: Add tests for new functionality
3. **Implement feature**: Follow existing patterns
4. **Update documentation**: Keep README current
5. **Submit PR**: Include test coverage and documentation

---

**🚀 Backend is ready! Start the frontend to complete the system.**