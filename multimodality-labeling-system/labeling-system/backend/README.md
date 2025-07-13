# 🚀 Labeling System Backend

FastAPI backend with Supabase integration and JWT authentication.

## 🎯 **Status: 95% Complete**

### ✅ **Working Features**
- **Authentication** - JWT with Supabase Auth
- **30+ API Endpoints** - Complete CRUD operations
- **Task Management** - Create, assign, and track tasks
- **User Management** - Role-based access control
- **Assignment Tracking** - Real-time progress monitoring

### 🚧 **In Progress**
- **Media Upload** - File handling for questions
- **Advanced Analytics** - Enhanced reporting

## ⚡ Quick Start

### Prerequisites
- Python 3.8+
- Supabase account

### Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run server
python main.py
# Server starts on http://localhost:8000
```

### Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# API Configuration
BACKEND_CORS_ORIGINS=http://localhost:3000
MAX_FILE_SIZE=104857600  # 100MB
```

## 🔗 Key API Endpoints

### **Authentication** (`/api/v1/auth/`)
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile
- `GET /auth/stats` - User statistics

### **Tasks** (`/api/v1/tasks/`)
- `GET /tasks/` - Get tasks (role-filtered)
- `POST /tasks/` - Create task (admin)
- `POST /tasks/{id}/assign` - Assign task to user (admin)
- `GET /tasks/assignments/my` - Get user assignments

### **Users** (`/api/v1/users/`)
- `GET /users/` - Get all users (admin)
- `GET /users/by-role/{role}` - Get users by role (admin)
- `PUT /users/{id}/role` - Update user role (admin)

### **Assignments** (`/api/v1/assignments/`)
- `GET /assignments/all` - Get all assignments (admin)
- `GET /assignments/stats` - Assignment statistics (admin)
- `PUT /assignments/{id}/status` - Update assignment status (admin)

## 🏗️ Project Structure

```
app/
├── routers/           # API endpoints
│   ├── auth.py       # Authentication
│   ├── tasks.py      # Task management
│   ├── users.py      # User management
│   └── assignments.py # Assignment tracking
├── services/         # Business logic
│   ├── auth_service.py
│   ├── task_service.py
│   └── assignment_service.py
├── models/           # Pydantic models
├── auth/             # Authentication utilities
└── database.py       # Supabase client
```

## 🔐 Authentication & Roles

### **JWT Flow**
1. Frontend authenticates with Supabase Auth
2. Backend validates JWT tokens
3. User roles control access to endpoints

### **Role Permissions**
- **Admin**: Full access, create tasks, manage users
- **Labeler**: View assignments, submit responses
- **Reviewer**: Review submissions (planned)

## 🗄️ Database Schema

### **Core Tables**
- `user_profiles` - User information with roles
- `tasks` - Labeling tasks
- `task_assignments` - User-task assignments with progress
- `questions` - Questions within tasks
- `question_responses` - User responses
- `label_classes` - Available label categories

## 🔧 Recent Updates

### ✅ **Fixed This Week**
- **Assignment API** - Fixed field name conflicts (`user_id_to_assign`)
- **Assignment Service** - Complete progress tracking and analytics
- **Label Class Support** - Convert names to IDs automatically

### 🎯 **Next Priority**
1. **Media Upload Endpoints** - File handling for questions
2. **Question Management** - Create questions with media

## 📁 File Storage

### **Hybrid Approach**
- **Database**: Metadata, assignments, responses
- **Local Files**: Media files (images, videos, audio)

### **File Organization**
```
uploads/
├── tasks/
│   ├── task-001/
│   │   └── media/
│   │       ├── image1.jpg
│   │       └── video1.mp4
└── exports/
```

## 🧪 Testing & Documentation

- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Interactive API**: http://localhost:8000/redoc

## 🚀 Production Deploy

```bash
# With Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# With Docker
docker build -t labeling-backend .
docker run -p 8000:8000 labeling-backend
```

---

**Status**: Production-ready API with 30+ endpoints
**Next**: Complete media upload for question management