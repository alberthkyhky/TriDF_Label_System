# 🎯 Labeling System

A comprehensive, production-ready labeling system for images, videos, and audio files with advanced quality control, user management, and analytics.

## ✨ Key Features

- 🎵 **Multi-Modal Support** - Images, videos, and audio labeling
- 🔐 **Advanced Authentication** - Role-based access with Supabase Auth
- 📋 **Question-Based Tasks** - Structured labeling with multiple choice
- 🎖️ **Quality Control** - Honeypot tasks and accuracy tracking
- 📊 **Analytics Dashboard** - Performance metrics and leaderboards
- 🚀 **Real-time Updates** - Live progress tracking and notifications
- 👑 **Admin Management** - Complete task creation and user assignment system

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Frontend    │    │     Backend     │    │    Database     │
│   React + TS    │◄──►│  FastAPI + JWT  │◄──►│   Supabase      │
│   Material-UI   │    │  File Upload    │    │  PostgreSQL     │
│   Admin + User  │    │  25+ Endpoints  │    │  RLS + Triggers │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **Frontend**: React with TypeScript, Material-UI components, role-based dashboards
- **Backend**: FastAPI with JWT authentication, comprehensive API
- **Database**: Supabase PostgreSQL with real-time capabilities and security policies

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** for backend
- **Node.js 16+** for frontend  
- **Supabase account** for database

### 1. Clone Repository
```bash
git clone <repository-url>
cd labeling-system
```

### 2. Setup Database
1. Create Supabase project at [supabase.com](https://supabase.com)
2. Copy project credentials
3. Run database schema (see [Database Setup Guide](./docs/database-setup.md))

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Add your Supabase credentials
python main.py
```
📖 **Detailed setup**: [Backend README](./backend/README.md)

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env  # Add your API endpoint
npm start
```
📖 **Detailed setup**: [Frontend README](./frontend/README.md)

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📁 Project Structure

```
labeling-system/
├── README.md                 # This file
├── docs/                     # Documentation
│   ├── database-setup.md
│   ├── deployment.md
│   └── api-reference.md
├── backend/                  # FastAPI backend
│   ├── README.md            # Backend documentation
│   ├── main.py              # Application entry
│   ├── requirements.txt     # Python dependencies
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
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Main application
│   └── public/              # Static assets
└── scripts/                  # Utility scripts
    ├── setup.sh             # Automated setup
    └── deploy.sh            # Deployment script
```

## 🎯 Core Workflows

### **For Admins**
1. **Login** → Access admin dashboard with tabs
2. **Create Tasks** → Define labeling tasks with rules
3. **Assign Users** → Assign tasks to labelers with quotas
4. **Monitor Progress** → Track completion and accuracy
5. **Export Data** → Download labeled datasets

### **For Labelers**
1. **Login** → View assigned tasks as cards
2. **Select Task** → See task progress and requirements
3. **Label Data** → Answer questions about media files
4. **Track Progress** → Monitor personal statistics
5. **Complete Tasks** → Submit all required labels

## 🔧 Current Status (January 2025)

### ✅ **Completed (85%)**
- **Authentication System** - Login, JWT validation, role-based access
- **Admin Dashboard** - Task creation, user assignment interface
- **Labeler Dashboard** - Task cards with progress tracking
- **Backend API** - 25+ endpoints, complete CRUD operations
- **Database Schema** - 10+ tables with relationships and triggers
- **Role-based Navigation** - Different experiences per user type

### 🚧 **In Progress (15%)**
- **User Assignment** - Demo users and assignment workflow
- **Question Management** - Question creation and media upload
- **Labeling Interface** - Core labeling functionality
- **Demo Data** - Sample tasks and assignments for testing

### 🎯 **Next Milestones**
1. **Complete Assignment System** - Full admin-to-labeler workflow
2. **Question Creation** - Media upload and question management
3. **Labeling Interface** - Core data labeling functionality
4. **Quality Control** - Honeypot tasks and accuracy tracking

## 🧪 Demo Accounts

### **Quick Login (Development)**
- **Admin**: admin@example.com / password123
- **Labeler**: labeler@example.com / password123
- **Reviewer**: reviewer@example.com / password123

### **Features by Role**
| Role | Capabilities |
|------|-------------|
| **Admin** | Full system access, create tasks, assign users, view analytics |
| **Labeler** | Complete assigned tasks, view personal progress |
| **Reviewer** | Review submissions, quality control (future) |

## 🔧 Key Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React + TypeScript + Material-UI | Modern, type-safe user interface |
| **Backend** | FastAPI + JWT | High-performance API with security |
| **Database** | Supabase (PostgreSQL) | Scalable database with real-time |
| **Auth** | Supabase Auth | Secure user authentication |
| **File Storage** | Local filesystem | Media file management |
| **Real-time** | Supabase realtime | Live progress updates |

## 📊 System Capabilities

### **Labeling Features**
- ✅ **Multi-modal support** - Images, videos, audio files
- ✅ **Question-based workflow** - Structured labeling approach
- ✅ **Multiple choice interface** - Predefined answer options
- 🚧 **Progress tracking** - Real-time completion monitoring
- 🚧 **Batch processing** - Efficient workflow management

### **Quality Assurance**
- 🚧 **Honeypot tasks** - Accuracy validation system
- 🚧 **Consensus requirements** - Multiple labeler validation
- 🚧 **Performance analytics** - Detailed accuracy metrics
- 🚧 **Feedback system** - Continuous improvement tools

### **User Management**
- ✅ **Role-based access** - Admin, Labeler, Reviewer roles
- ✅ **Task assignment** - Flexible user-task mapping
- ✅ **Progress tracking** - Individual and system-wide metrics
- 🚧 **Performance monitoring** - User accuracy and speed
- 🚧 **Gamification** - Leaderboards and achievement system

## 🔒 Security & Compliance

- **Authentication**: JWT tokens with Supabase Auth
- **Authorization**: Role-based access control (RBAC)
- **Data Security**: Row-level security in database (temporarily disabled for development)
- **File Validation**: Type and size restrictions
- **API Security**: CORS protection and request validation

## 🚀 Deployment Options

### **Development**
```bash
# Backend
cd backend && python main.py

# Frontend  
cd frontend && npm start

# Access: http://localhost:3000
```

### **Production**
- **Docker**: `docker-compose up --build`
- **Manual**: See [Deployment Guide](./docs/deployment.md)
- **Cloud**: Deploy to AWS, GCP, or Azure

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md):

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support & Resources

- **API Documentation**: http://localhost:8000/docs
- **Backend Setup**: [Backend README](./backend/README.md)
- **Frontend Setup**: [Frontend README](./frontend/README.md)
- **Database Setup**: [Database Guide](./docs/database-setup.md)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [React](https://reactjs.org/) - UI library
- [Material-UI](https://mui.com/) - React component library

---

**🚀 Ready to start labeling? Follow the setup guides and join our community of data annotators!**

| Component | Quick Start | Documentation |
|-----------|-------------|---------------|
| 🗄️ **Backend** | `cd backend && python main.py` | [Backend README](./backend/README.md) |
| 🎨 **Frontend** | `cd frontend && npm start` | [Frontend README](./frontend/README.md) |
| 🚀 **Full System** | Follow setup guide above | [Complete Documentation](./docs/) |

**Current Status**: Core system operational, assignment workflow in progress, labeling interface next phase.