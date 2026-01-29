# Multimodality Labeling System

A comprehensive, production-ready labeling system for images, videos, and audio files with advanced quality control, user management, and analytics.

## Overview

This system enables structured data labeling workflows with:
- **Multi-modal support** for images, videos, and audio files
- **Role-based access** for admins, labelers, and reviewers
- **Progressive disclosure UI** for efficient failure detection workflows
- **Real-time progress tracking** and analytics

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React + TypeScript + Material-UI | Modern, type-safe user interface |
| **Backend** | FastAPI + Python + JWT | High-performance API with security |
| **Database** | Supabase (PostgreSQL) | Scalable database with real-time |
| **Authentication** | Supabase Auth + JWT | Secure user authentication |

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Frontend    │    │     Backend     │    │    Database     │
│   React + TS    │◄──►│  FastAPI + JWT  │◄──►│   Supabase      │
│   Material-UI   │    │  File Upload    │    │  PostgreSQL     │
│   Admin + User  │    │  30+ Endpoints  │    │  RLS + Triggers │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.8+ for backend
- Node.js 16+ for frontend
- Supabase account for database

### 1. Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project credentials from Project Settings > API

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your Supabase credentials
python main.py            # Starts on http://localhost:8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env      # Add your API endpoint
npm start                 # Starts on http://localhost:3000
```


## Project Structure

```
labeling-system/
├── README.md                 # This file
├── backend/                  # FastAPI backend
│   ├── README.md            # Backend documentation
│   ├── main.py              # Application entry
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   ├── app/
│   │   ├── config.py        # Configuration
│   │   ├── database.py      # Supabase client
│   │   ├── routers/         # API endpoints
│   │   ├── models/          # Pydantic models
│   │   ├── services/        # Business logic
│   │   └── auth/            # Authentication
│   └── uploads/             # Media file storage
├── frontend/                 # React frontend
│   ├── README.md            # Frontend documentation
│   ├── package.json         # Node dependencies
│   ├── .env.example         # Environment template
│   └── src/
│       ├── components/      # React components
│       ├── contexts/        # React contexts
│       ├── services/        # API services
│       ├── types/           # TypeScript types
│       └── App.tsx          # Main application
└── ngrok.yml                # ngrok tunnel config
```

## Core Workflows

### Admin Workflow
1. **Login** - Access admin dashboard
2. **Create Tasks** - Define labeling tasks with question templates
3. **Assign Users** - Assign tasks to labelers with quotas
4. **Monitor Progress** - Track completion and accuracy
5. **Export Data** - Download labeled datasets

### Labeler Workflow
1. **Login** - View assigned tasks as cards
2. **Select Task** - See task progress and requirements
3. **Review Instructions** - Task introduction with examples
4. **Label Data** - Answer questions about media files
5. **Complete Tasks** - Submit all required labels

## Development

### Running Both Services
```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend
cd frontend && npm start
```

### Testing Commands
```bash
# Frontend
cd frontend
npm test           # Run test suite
npm run build      # Production build

# Backend
cd backend
python main.py     # Development server with auto-reload
```

### Code Conventions
- **TypeScript**: Strict typing throughout frontend
- **Material-UI**: Consistent design system with sx prop styling
- **Functional Components**: React hooks pattern (no class components)
- **FastAPI**: Python type hints and Pydantic models

## Deployment

### Development
```bash
# Backend
cd backend && python main.py

# Frontend
cd frontend && npm start
```

### Production
```bash
# Backend with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend production build
cd frontend && npm run build
npx serve -s build
```

### Internet Access with ngrok

For remote access during development or demos, use ngrok to expose your local services.

#### Setup Steps

1. **Create ngrok account**: Visit https://ngrok.com/signup
2. **Get auth token**: https://dashboard.ngrok.com/get-started/your-authtoken
3. **Update ngrok.yml** with your auth token

#### Start Tunnels

```bash
# Terminal 1: Start backend
cd backend && python main.py

# Terminal 2: Start frontend
cd frontend && npm start

# Terminal 3: Start ngrok tunnels
ngrok start --all --config ./ngrok.yml
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8000 (backend)
Forwarding  https://def456.ngrok-free.app -> http://localhost:3000 (frontend)
```

#### Configure for Remote Access

Update `frontend/.env` with your backend ngrok URL:
```bash
REACT_APP_API_URL=https://your-backend-url.ngrok-free.app
```

Restart the frontend, then share the frontend ngrok URL with users.

#### ngrok.yml Configuration
```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN_HERE

tunnels:
  backend:
    addr: 8000
    proto: http

  frontend:
    addr: 3000
    proto: http
```

## Admin Guide

### Creating Tasks via JSON Upload

The admin dashboard supports creating tasks by uploading JSON files for batch task setup.

#### How to Use
1. Navigate to the admin dashboard
2. Click "Upload JSON" next to "Create New Task"
3. Select a properly formatted JSON file
4. The task is created automatically if valid

#### JSON Structure

```json
{
  "title": "Task Title",
  "description": "Task description",
  "instructions": "Instructions for labelers",
  "questions_number": 50,
  "required_agreements": 2,
  "example_media": [],
  "question_template": {
    "question_text": "Question to ask",
    "choices": {
      "choice_key": {
        "text": "Choice label",
        "order": 1,
        "options": ["None", "Option1", "Option2"],
        "multiple_select": true
      }
    }
  },
  "media_config": {
    "num_images": 0,
    "num_videos": 0,
    "num_audios": 2
  }
}
```

#### Example: Audio Quality Assessment Task
```json
{
  "title": "Audio Quality Assessment Task",
  "description": "Evaluate the quality of generated audio samples.",
  "instructions": "Listen to both audio samples and identify quality issues.",
  "questions_number": 50,
  "required_agreements": 2,
  "example_media": ["example_audio_1.wav", "example_audio_2.wav"],
  "question_template": {
    "question_text": "Compare the audio. What quality issues do you observe?",
    "choices": {
      "structural_issues": {
        "text": "Structural Issues (A-type failures)",
        "order": 1,
        "options": ["None", "Audio truncation", "Silent segments", "Incomplete generation"],
        "multiple_select": true
      },
      "quality_issues": {
        "text": "Quality Issues (C-type failures)",
        "order": 2,
        "options": ["None", "Background noise", "Audio artifacts", "Volume inconsistency"],
        "multiple_select": true
      }
    }
  },
  "media_config": {
    "num_images": 0,
    "num_videos": 0,
    "num_audios": 2
  }
}
```

#### Validation Rules
- All required fields must be present
- Question template must have `question_text` and `choices`
- Each choice must have `text`, `options` array, and `multiple_select` boolean
- Media config must have numeric values for all media types
- "None" is added as first option automatically if missing

## API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| Auth | `GET /api/v1/auth/profile` | Get current user profile |
| Tasks | `GET /api/v1/tasks/` | List tasks (role-filtered) |
| Tasks | `POST /api/v1/tasks/` | Create task (admin) |
| Tasks | `POST /api/v1/tasks/{id}/assign` | Assign task to user |
| Questions | `GET /api/v1/tasks/{id}/questions-with-media` | Get questions with media |
| Responses | `POST /api/v1/tasks/responses/detailed` | Submit labeling response |
| Users | `GET /api/v1/users/` | List users (admin) |
| Assignments | `GET /api/v1/assignments/my` | Get user's assignments |

### Health Checks
- `GET /health` - Basic health check
- `GET /health/db` - Database connectivity
- `GET /health/auth` - Authentication service

## Environment Variables

### Backend (.env)
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# API Configuration
BACKEND_CORS_ORIGINS=http://localhost:3000
API_V1_STR=/api/v1

# File Upload Settings
MAX_FILE_SIZE=104857600  # 100MB
UPLOAD_DIR=uploads

# Environment
ENVIRONMENT=development
ROOT_DIR=/path/to/backend/taskData
```

### Frontend (.env)
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
REACT_APP_API_URL=http://localhost:8000
```

## Troubleshooting

### Common Issues

**Backend won't start**
- Check Python version (3.8+ required)
- Verify `.env` file exists with correct Supabase credentials
- Ensure virtual environment is activated

**Frontend can't connect to backend**
- Verify backend is running on port 8000
- Check `REACT_APP_API_URL` in frontend `.env`
- Check browser console for CORS errors

**Authentication failures**
- Verify Supabase credentials in both `.env` files
- Ensure JWT secret matches between Supabase and backend
- Check that demo accounts exist in Supabase Auth

**ngrok tunnel issues**
- Verify auth token in `ngrok.yml`
- Install ngrok: `brew install ngrok`
- Run `ngrok config add-authtoken YOUR_TOKEN`

## Security

- **JWT Authentication**: All protected endpoints require valid tokens
- **Role-based Access**: Admin-only operations are protected
- **CORS Protection**: Restricted to configured origins
- **Input Validation**: Pydantic models validate all inputs
- **Secure Media Access**: Authenticated file serving

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

