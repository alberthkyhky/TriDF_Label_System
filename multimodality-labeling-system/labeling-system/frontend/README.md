# 🎨 Labeling System Frontend

Modern React + TypeScript frontend with Material-UI components, real-time updates, responsive design, and role-based dashboards for multi-modal data labeling.

## 🎯 **Current Status: 85% Complete**

### ✅ **Completed Features**
- **Authentication System** - Enhanced login/signup with demo accounts
- **Role-based Dashboards** - Admin and labeler interfaces
- **Admin Task Management** - Create, edit, and manage tasks
- **User Assignment Interface** - Assign tasks to labelers
- **Labeler Task Cards** - Visual progress tracking
- **API Integration** - Complete FastAPI backend integration
- **Responsive Design** - Mobile-first Material-UI implementation

### 🚧 **In Progress**
- **Question Management** - Create questions with media upload
- **Labeling Interface** - Core data labeling functionality
- **Assignment Overview** - Comprehensive assignment dashboard

## 🏗️ Architecture

```
frontend/
├── public/                   # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── Auth/           # Authentication components
│   │   │   ├── LoginForm.tsx ✅ Enhanced with demo accounts
│   │   │   └── ProtectedRoute.tsx ✅ Role-based protection
│   │   ├── Admin/          # Admin-only components
│   │   │   ├── TaskManagement.tsx ✅ CRUD operations
│   │   │   ├── UserAssignment.tsx ✅ Assignment interface
│   │   │   └── AssignmentOverview.tsx 🚧 In progress
│   │   ├── Tasks/          # Task management (legacy)
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskCard.tsx  
│   │   │   └── TaskCreateDialog.tsx
│   │   ├── Dashboard/      # Dashboard components
│   │   │   ├── UserStats.tsx ✅ User statistics
│   │   │   ├── ProgressChart.tsx ✅ Visual progress
│   │   │   └── RecentActivity.tsx ✅ Activity tracking
│   │   ├── Labeling/       # Labeling interface
│   │   │   ├── ImageLabeler.tsx 🚧 Core functionality needed
│   │   │   ├── VideoLabeler.tsx 🚧 Core functionality needed
│   │   │   └── AudioLabeler.tsx 🚧 Core functionality needed
│   │   └── Common/         # Shared components
│   │       ├── LoadingScreen.tsx ✅ Loading states
│   │       ├── ErrorBoundary.tsx ✅ Error handling
│   │       └── Navbar.tsx ✅ Navigation
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx ✅ Complete auth management
│   │   ├── TaskContext.tsx 🚧 Task state management
│   │   └── ThemeContext.tsx ✅ Material-UI theming
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts ✅ Authentication hook
│   │   ├── useApi.ts ✅ API integration hook
│   │   └── useLocalStorage.ts ✅ Local storage utility
│   ├── services/           # API service layer
│   │   ├── api.ts ✅ Complete FastAPI integration
│   │   ├── auth.ts ✅ Auth services
│   │   └── tasks.ts ✅ Task services
│   ├── types/              # TypeScript definitions
│   │   ├── auth.ts ✅ Auth type definitions
│   │   ├── tasks.ts ✅ Task type definitions
│   │   └── api.ts ✅ API type definitions
│   ├── utils/              # Utility functions
│   │   ├── formatting.ts ✅ Data formatting
│   │   ├── validation.ts ✅ Input validation
│   │   └── constants.ts ✅ App constants
│   ├── lib/                # External library configs
│   │   ├── supabase.ts ✅ Supabase configuration
│   │   └── theme.ts ✅ Material-UI theme
│   ├── App.tsx ✅ Main app with role-based routing
│   └── index.tsx ✅ React entry point
├── package.json            # Dependencies
├── tsconfig.json          # TypeScript config
└── .env                   # Environment variables
```

## ⚡ Quick Start

### 1. Prerequisites
```bash
# Node.js 16+ required
node --version  # Should be 16.0.0 or higher
npm --version   # or yarn --version
```

### 2. Installation
```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# API Configuration  
REACT_APP_API_URL=http://localhost:8000

# App Configuration
REACT_APP_APP_NAME=Labeling System
REACT_APP_VERSION=1.0.0
REACT_APP_DEBUG=false
```

### 4. Development
```bash
# Start development server
npm start

# App will open at http://localhost:3000
```

### 5. Production Build
```bash
# Create production build
npm run build

# Serve build locally
npx serve -s build -l 3000
```

## 🎯 Key Features

### **Enhanced Authentication System**
- ✅ **Supabase Auth Integration** with JWT tokens and role-based access
- ✅ **Enhanced Login UI** with demo accounts and quick login buttons
- ✅ **Role-based Navigation** - Different dashboards for admin/labeler/reviewer
- ✅ **Protected Routes** with automatic redirects based on user role
- ✅ **Session Management** with auto-refresh and fallback profiles

### **Admin Dashboard**
- ✅ **Tabbed Interface** - Task Management, User Assignment, Assignment Overview
- ✅ **Task Management** - Create, edit, delete tasks with status management
- ✅ **User Assignment** - Assign tasks to labelers with target quotas
- ✅ **Real-time Updates** - Live progress tracking via Supabase realtime
- ✅ **Comprehensive Controls** - Full administrative functionality

### **Labeler Dashboard**
- ✅ **Task Cards Layout** - Visual representation of assigned tasks
- ✅ **Progress Tracking** - Completion progress with visual indicators
- ✅ **Status Management** - Active, completed, inactive task states
- ✅ **Assignment Details** - Target labels, completion status, deadlines
- ✅ **Navigation Ready** - Links to labeling interface (to be implemented)

### **Responsive Design & UX**
- ✅ **Mobile-first** approach with Material-UI components
- ✅ **Dark/Light themes** with consistent branding
- ✅ **Accessibility** compliance (WCAG 2.1 standards)
- ✅ **Loading States** - Skeleton screens and progress indicators
- ✅ **Error Handling** - User-friendly error messages and recovery

## 🎨 Component Library

### **Authentication Components**
```tsx
// Enhanced login with demo accounts
<LoginForm />

// Role-based route protection
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>

// Current user profile management
<UserProfile user={currentUser} onUpdate={handleUpdate} />
```

### **Admin Components**
```tsx
// Task management with CRUD operations
<TaskManagement />

// User assignment interface
<UserAssignment />

// Assignment overview dashboard
<AssignmentOverview />
```

### **Labeler Components**
```tsx
// Task cards with progress tracking
<TaskCard 
  assignment={assignment}
  onContinue={handleContinue}
  progress={calculateProgress(assignment)}
/>

// Dashboard with assigned tasks
<LaborerDashboard assignments={assignments} />
```

### **Labeling Interface (In Development)**
```tsx
// Image labeling interface
<ImageLabeler
  question={question}
  onSubmit={handleSubmit}
  onSkip={handleSkip}
/>

// Video timeline labeling
<VideoLabeler
  videoUrl={videoUrl}
  annotations={annotations}
  onAnnotate={handleAnnotate}
/>

// Audio waveform labeling
<AudioLabeler
  audioUrl={audioUrl}
  segments={segments}
  onSegmentCreate={handleSegmentCreate}
/>
```

## 🔧 State Management

### **Enhanced Context Providers**
```tsx
// App.tsx structure with role-based routing
<AuthProvider>
  <ThemeProvider>
    <TaskProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </TaskProvider>
  </ThemeProvider>
</AuthProvider>
```

### **Auth Context (Complete)**
```tsx
const { 
  user,           // Current user profile with role
  loading,        // Auth loading state
  signIn,         // Login function with fallback support
  signOut,        // Logout function
  updateProfile   // Profile update via FastAPI
} = useAuth();
```

### **API Integration (Complete)**
```tsx
// Centralized API service with timeout protection
const api = {
  // Auth endpoints
  getUserProfile: () => apiCall('/auth/profile'),
  updateUserProfile: (data) => apiCall('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  
  // Admin endpoints
  getTasks: () => apiCall('/tasks/'),
  createTask: (data) => apiCall('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  assignTask: (taskId, data) => apiCall(`/tasks/${taskId}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  
  // User endpoints
  getUsersByRole: (role) => apiCall(`/users/by-role/${role}`)
};
```

## 🔌 API Integration

### **Complete FastAPI Integration**
```tsx
// services/api.ts -