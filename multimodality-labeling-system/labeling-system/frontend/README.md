# 🎨 Labeling System Frontend

React + TypeScript frontend with Material-UI components and role-based dashboards.

## 🎯 **Status: 90% Complete**

### ✅ **Working Features**
- **Authentication** - Login/logout with role-based routing
- **Admin Dashboard** - Task management, user assignment, assignment overview
- **Labeler Dashboard** - Task cards with progress tracking
- **API Integration** - Complete FastAPI backend integration

### 🚧 **In Progress**
- **Question Management** - Media upload interface
- **Labeling Interface** - Core labeling functionality

## ⚡ Quick Start

### Prerequisites
- Node.js 16+
- Backend running on port 8000

### Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Start development
npm start
# Opens http://localhost:3000
```

### Environment Variables
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:8000
```

## 🏗️ Key Components

### **Admin Components**
- `AdminDashboard.tsx` - Main admin interface with tabs
- `TaskManagement.tsx` - Create and manage tasks
- `UserAssignment.tsx` - Assign tasks to users
- `AssignmentOverview.tsx` - Monitor all assignments

### **Labeler Components**
- `Dashboard.tsx` - Labeler main interface
- `TaskCard.tsx` - Individual task display with progress

### **Auth Components**
- `LoginForm.tsx` - Enhanced login with demo accounts
- `ProtectedRoute.tsx` - Role-based access control

## 🔧 Recent Updates

### ✅ **Fixed This Week**
- **App.tsx Routing** - Role-based dashboard redirects
- **Assignment API** - Fixed field naming issues
- **Assignment Overview** - Complete admin monitoring dashboard

### 🎯 **Next Priority**
1. **Question Management** - Media upload and question creation
2. **Labeling Interface** - Image/video/audio labeling components

## 🧪 Demo Accounts
- **Admin**: admin@example.com / password123
- **Labeler**: labeler@example.com / password123

## 📁 Project Structure
```
src/
├── components/
│   ├── Auth/           # Authentication
│   ├── Admin/          # Admin dashboard
│   ├── Dashboard/      # User dashboard
│   └── Labeling/       # Labeling interface (next)
├── contexts/           # React contexts
├── services/           # API integration
├── types/              # TypeScript definitions
└── App.tsx            # Main app with routing
```

## 🔗 API Integration
- **30+ endpoints** integrated with error handling
- **Role-based access** with JWT tokens
- **Real-time updates** ready for implementation

## 🚀 Build & Deploy
```bash
# Production build
npm run build

# Test build locally
npx serve -s build
```

---

**Status**: Ready for Question Management implementation
**Next**: Complete media upload and labeling interface