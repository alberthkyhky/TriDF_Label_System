# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py  # Starts server on http://localhost:8000
```

### Frontend (React + TypeScript)
```bash
cd frontend
npm install
npm start  # Starts development server on http://localhost:3000
```

### Testing and Quality
- **Frontend**: `npm test` (React test suite), `npm run build` (production build)
- **Backend**: No test framework configured yet
- **Linting**: ESLint configured for frontend via react-scripts

## Architecture Overview

### Core Technology Stack
- **Frontend**: React 19 + TypeScript + Material-UI + React Router
- **Backend**: FastAPI + Python 3.8+ + Uvicorn
- **Database**: Supabase (PostgreSQL) with JWT authentication
- **Authentication**: Supabase Auth with JWT tokens

### Project Structure
```
labeling-system/
├── backend/                 # FastAPI backend
│   ├── main.py             # Application entry point
│   ├── app/
│   │   ├── config.py       # Settings and environment variables
│   │   ├── database.py     # Supabase client
│   │   ├── routers/        # API endpoints (auth, tasks, users, assignments)
│   │   ├── services/       # Business logic layer
│   │   ├── models/         # Pydantic data models
│   │   └── auth/           # JWT authentication utilities
│   └── uploads/            # Media file storage
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # React components organized by feature
    │   ├── contexts/       # AuthContext for state management
    │   ├── services/       # API integration (api.ts)
    │   ├── types/          # TypeScript interfaces
    │   └── App.tsx         # Main application with routing
    └── package.json
```

### Application Architecture

**Multi-Modal Labeling System** for images, videos, and audio with failure detection workflow:

1. **Role-Based Access**: Admin, Labeler, Reviewer roles with different interfaces
2. **Task Management**: Admins create tasks, assign to labelers with quotas
3. **Labeling Workflow**: Progressive disclosure UI (Yes/No → Detailed failure types)
4. **Failure Categories**: A-type (Structural), B-type (Functional), C-type (Quality)
5. **Media Support**: Images, videos, audio files (currently with placeholder UI)

### Key Components

#### Backend Services
- **TaskService**: Task CRUD, assignment creation, progress tracking
- **UserService**: User management, role-based access control  
- **AssignmentService**: Assignment tracking, progress analytics
- **AuthService**: JWT validation, authentication middleware

#### Frontend Components
- **AdminDashboard**: Task management, user assignment, assignment overview
- **Dashboard**: User dashboard with assigned task cards
- **LabelingInterface**: Main labeling workflow with question navigation
- **FailureTypeSelector**: Progressive disclosure UI for failure detection
- **TaskIntroduction**: Task instructions and examples

### API Structure
- **30+ endpoints** with comprehensive CRUD operations
- **JWT authentication** on all protected routes
- **Role-based permissions** (admin-only vs authenticated user)
- **API Documentation**: Auto-generated at http://localhost:8000/docs

### Authentication Flow
1. Frontend authenticates with Supabase Auth
2. Backend validates JWT tokens using Supabase JWT secret
3. User roles control access to endpoints and UI components
4. AuthContext manages user state across React components

## Development Environment Setup

### Quick Setup using .env.example files

1. **Copy the example files:**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   
   # Frontend environment  
   cp frontend/.env.example frontend/.env
   ```

2. **Get your Supabase credentials** from https://supabase.com:
   - Create a new project or use existing one
   - Go to Project Settings → API
   - Copy URL, anon key, service role key, and JWT secret

3. **Update your .env files** with actual values:
   - Replace `your-project.supabase.co` with your actual Supabase URL
   - Replace placeholder keys with your actual Supabase keys
   - Update API URLs if deploying to production

### Required Environment Variables

**Backend (.env in backend/)**:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
BACKEND_CORS_ORIGINS=http://localhost:3000
API_V1_STR=/api/v1
MAX_FILE_SIZE=104857600
UPLOAD_DIR=uploads
ENVIRONMENT=development
ROOT_DIR=/path/to/your/project/backend/taskData
```

**Frontend (.env in frontend/)**:
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:8000
```

### Demo Accounts (Development)
- **Admin**: admin@example.com / password123
- **Labeler**: labeler@example.com / password123
- **Reviewer**: reviewer@example.com / password123

## Current Development Status

### Completed (100% MVP - Production Ready)
- Authentication system with role-based access
- Admin dashboard with task management
- Complete labeling workflow UI (TaskIntroduction → LabelingInterface)
- Progressive disclosure failure detection interface
- Backend API with 30+ endpoints
- Database schema with user profiles, tasks, assignments
- **Real media file integration** with full image/video/audio players
- **Authenticated media access** with secure file serving
- **Complete question management** with response tracking
- **Question/response database models** fully implemented
- **Backend API integration** for complete labeling workflow
- **Media serving endpoints** with authentication and blob URL management

### Production Ready Features
- Multi-modal media players with authentication
- Complete question/response system
- Detailed progress tracking and analytics
- Secure file serving with proper authentication
- Comprehensive error handling and validation

### Technical Patterns

#### State Management
- **React Context** for authentication state
- **Local useState** for component state
- **No external state library** (Redux/Zustand not used)

#### Error Handling
- **Frontend**: Try-catch blocks with user-friendly error messages
- **Backend**: Comprehensive exception handlers with proper HTTP status codes
- **API Integration**: Centralized error handling in services/api.ts

#### Code Conventions
- **TypeScript**: Strict typing throughout frontend
- **Material-UI**: Consistent design system with sx prop styling
- **Functional Components**: React hooks pattern (no class components)
- **FastAPI**: Python type hints and Pydantic models
- **File Organization**: Feature-based component organization

## Working with This Codebase

### Making Changes
1. **Backend changes**: Restart `python main.py` after model/router changes
2. **Frontend changes**: Hot reload works for most component changes
3. **Environment changes**: Restart both frontend and backend after .env updates
4. **Database changes**: Check Supabase dashboard for schema updates

### Adding New Features
1. **New API endpoints**: Add to appropriate router in backend/app/routers/
2. **New components**: Follow existing pattern in frontend/src/components/
3. **Database models**: Update Pydantic models in backend/app/models/
4. **UI components**: Use Material-UI components with existing theme

### Media File System (Complete)
- **Implementation**: Full media file serving with authentication
- **Storage**: Local filesystem in backend/uploads/ organized by media type
- **Security**: Authenticated access with JWT validation
- **Players**: Complete image/video/audio players with:
  - Image zoom dialog with full-screen preview
  - Video controls with native HTML5 player
  - Audio playback with visual feedback
  - Blob URL management with automatic cleanup
- **Limits**: 100MB max file size configured
- **Future**: Ready for cloud storage integration

### API Endpoints (Complete)
- **Media Access**: `POST /api/v1/tasks/{task_id}/media` - Authenticated file serving
- **Questions**: `GET /api/v1/tasks/{task_id}/questions-with-media` - Questions with media
- **Responses**: `POST /api/v1/tasks/responses/detailed` - Detailed response submission
- **Progress**: Comprehensive assignment and progress tracking

This system is production-ready with comprehensive authentication, role-based access control, full media integration, and scalable architecture for multi-modal data labeling workflows.