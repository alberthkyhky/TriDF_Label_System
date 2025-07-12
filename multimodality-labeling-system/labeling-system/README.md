# 🎯 Labeling System

A comprehensive, production-ready labeling system for images, videos, and audio files with advanced quality control, user management, and analytics.

## ✨ Key Features

- 🎵 **Multi-Modal Support** - Images, videos, and audio labeling
- 🔐 **Advanced Authentication** - Role-based access with Supabase
- 📋 **Question-Based Tasks** - Structured labeling with multiple choice
- 🎖️ **Quality Control** - Honeypot tasks and accuracy tracking
- 📊 **Analytics Dashboard** - Performance metrics and leaderboards
- 🚀 **Real-time Updates** - Live progress tracking and notifications

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Frontend    │    │     Backend     │    │    Database     │
│   React + TS    │◄──►│  FastAPI + JWT  │◄──►│   Supabase      │
│   Material-UI   │    │  File Upload    │    │  PostgreSQL     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **Frontend**: React with TypeScript, Material-UI components
- **Backend**: FastAPI with JWT authentication, file management
- **Database**: Supabase PostgreSQL with real-time capabilities

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
├── docker-compose.yml        # Docker setup
├── docs/                     # Documentation
│   ├── database-setup.md
│   ├── deployment.md
│   └── api-reference.md
├── backend/                  # FastAPI backend
│   ├── README.md            # Backend-specific docs
│   ├── main.py              # Application entry
│   ├── requirements.txt     # Python dependencies
│   └── app/                 # Application code
├── frontend/                 # React frontend
│   ├── README.md            # Frontend-specific docs
│   ├── package.json         # Node dependencies
│   └── src/                 # React components
└── scripts/                  # Utility scripts
    ├── setup.sh             # Automated setup
    └── deploy.sh            # Deployment script
```

## 🎯 Core Workflows

### **For Labelers**
1. **Login** → View assigned tasks
2. **Select task** → Read labeling guidelines  
3. **Label questions** → Submit responses
4. **Track progress** → View personal statistics

### **For Admins**
1. **Create tasks** → Upload media files
2. **Assign users** → Set quotas and classes
3. **Monitor quality** → Review accuracy scores
4. **Export data** → Download labeled datasets

## 🔧 Key Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React + TypeScript | User interface |
| **UI Library** | Material-UI | Component library |
| **Backend** | FastAPI | RESTful API |
| **Database** | Supabase (PostgreSQL) | Data storage |
| **Auth** | Supabase Auth + JWT | User authentication |
| **File Storage** | Local filesystem | Media file storage |
| **Real-time** | Supabase realtime | Live updates |

## 🚀 Deployment Options

### **Development**
```bash
# Using Docker Compose
docker-compose up --build

# Manual setup (see individual README files)
```

### **Production**
- **Docker**: `docker-compose -f docker-compose.prod.yml up -d`
- **Manual**: See [Deployment Guide](./docs/deployment.md)
- **Cloud**: Deploy to AWS, GCP, or Azure

## 📊 System Capabilities

### **Labeling Features**
- ✅ **Image annotation** with bounding boxes and classification
- ✅ **Video labeling** with timeline-based annotations
- ✅ **Audio tagging** with waveform visualization
- ✅ **Multi-choice questions** with predefined options
- ✅ **Batch processing** for efficient workflows

### **Quality Assurance**
- ✅ **Honeypot tasks** for accuracy validation
- ✅ **Consensus requirements** with multiple labelers
- ✅ **Speed checks** to detect rushed work
- ✅ **Performance analytics** with detailed metrics
- ✅ **Feedback system** for continuous improvement

### **User Management**
- ✅ **Role-based access** (Admin, Labeler, Reviewer)
- ✅ **Task assignment** with workload balancing
- ✅ **Progress tracking** with quotas and deadlines
- ✅ **Performance monitoring** with accuracy scores
- ✅ **Gamification** with leaderboards and streaks

## 🔒 Security & Compliance

- **Authentication**: JWT tokens with Supabase Auth
- **Authorization**: Role-based access control (RBAC)
- **Data Security**: Row-level security in database
- **File Validation**: Type and size restrictions
- **API Security**: CORS protection and rate limiting

## 📈 Performance Features

- **Real-time Updates**: Instant progress synchronization
- **Efficient Storage**: Optimized file organization
- **Scalable Architecture**: Handles growing datasets
- **Caching Strategy**: Fast data retrieval
- **Database Optimization**: Proper indexing and queries

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md):

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support & Resources

- **Documentation**: [docs/](./docs/)
- **API Reference**: http://localhost:8000/docs
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

**🚀 Ready to start labeling? Follow the setup guides in each directory!**

| Component | Quick Start | Documentation |
|-----------|-------------|---------------|
| 🗄️ **Backend** | `cd backend && python main.py` | [Backend README](./backend/README.md) |
| 🎨 **Frontend** | `cd frontend && npm start` | [Frontend README](./frontend/README.md) |
| 🐳 **Docker** | `docker-compose up` | [Docker Guide](./docs/docker.md) |