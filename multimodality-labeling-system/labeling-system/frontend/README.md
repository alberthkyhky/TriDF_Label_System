# 🎨 Labeling System Frontend

Modern React + TypeScript frontend with Material-UI components, real-time updates, and responsive design.

## 🏗️ Architecture

```
frontend/
├── public/                   # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── Auth/           # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── Tasks/          # Task management
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskCreateDialog.tsx
│   │   ├── Dashboard/      # Main dashboard
│   │   │   ├── UserStats.tsx
│   │   │   ├── ProgressChart.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── Labeling/       # Labeling interface
│   │   │   ├── ImageLabeler.tsx
│   │   │   ├── VideoLabeler.tsx
│   │   │   └── AudioLabeler.tsx
│   │   └── Common/         # Shared components
│   │       ├── LoadingScreen.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── Navbar.tsx
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── TaskContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useLocalStorage.ts
│   ├── services/           # API service layer
│   │   ├── api.ts          # Main API client
│   │   ├── auth.ts         # Auth services
│   │   └── tasks.ts        # Task services
│   ├── types/              # TypeScript definitions
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   └── api.ts
│   ├── utils/              # Utility functions
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   ├── lib/                # External library configs
│   │   ├── supabase.ts
│   │   └── theme.ts
│   ├── App.tsx             # Main app component
│   └── index.tsx           # React entry point
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

### **Authentication & Navigation**
- ✅ **Supabase Auth Integration** with JWT tokens
- ✅ **Role-based Navigation** (Admin, Labeler, Reviewer)
- ✅ **Protected Routes** with automatic redirects
- ✅ **Session Management** with auto-refresh
- ✅ **User Profile** management

### **Dashboard & Analytics**
- ✅ **Personal Statistics** with progress tracking
- ✅ **Task Assignment** overview
- ✅ **Performance Metrics** (accuracy, speed, streaks)
- ✅ **Leaderboards** for gamification
- ✅ **Real-time Updates** via Supabase realtime

### **Task Management**
- ✅ **Task Creation** (Admin only)
- ✅ **Assignment Tracking** with progress bars
- ✅ **Class-based Filtering** 
- ✅ **Deadline Management**
- ✅ **Bulk Operations**

### **Labeling Interface**
- ✅ **Multi-modal Support** (Image, Video, Audio)
- ✅ **Intuitive Controls** with keyboard shortcuts
- ✅ **Progress Tracking** within tasks
- ✅ **Auto-save** functionality
- ✅ **Quality Feedback** system

### **Responsive Design**
- ✅ **Mobile-first** approach
- ✅ **Tablet optimization**
- ✅ **Desktop enhanced** features
- ✅ **Dark/Light themes**
- ✅ **Accessibility** (WCAG 2.1)

## 🎨 Component Library

### **Authentication Components**
```tsx
// Login/Signup with validation
<LoginForm onSuccess={handleLogin} />

// Protected route wrapper
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// User profile management
<UserProfile user={currentUser} onUpdate={handleUpdate} />
```

### **Task Components**
```tsx
// Task creation dialog
<TaskCreateDialog 
  open={isOpen}
  onClose={handleClose}
  onTaskCreated={refreshTasks}
/>

// Task list with filtering
<TaskList 
  tasks={tasks}
  filter={filter}
  onTaskSelect={handleTaskSelect}
/>

// Assignment progress card
<AssignmentCard 
  assignment={assignment}
  onContinue={handleContinue}
/>
```

### **Labeling Components**
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

### **Context Providers**
```tsx
// App.tsx structure
<AuthProvider>
  <ThemeProvider>
    <TaskProvider>
      <Router>
        <App />
      </Router>
    </TaskProvider>
  </ThemeProvider>
</AuthProvider>
```

### **Auth Context**
```tsx
const { 
  user,           // Current user profile
  loading,        // Auth loading state
  signIn,         // Login function
  signOut,        // Logout function
  updateProfile   // Profile update
} = useAuth();
```

### **Task Context**
```tsx
const {
  tasks,          // User's tasks
  assignments,    // User's assignments
  labelClasses,   // Available label classes
  currentTask,    // Selected task
  loading,        // Loading state
  createTask,     // Create new task (admin)
  assignTask,     // Assign task to user (admin)
  submitResponse  // Submit question response
} = useTask();
```

## 🔌 API Integration

### **API Service Layer**
```tsx
// services/api.ts
export const api = {
  // Authentication
  async getProfile(): Promise<UserProfile> { ... },
  async updateProfile(data: UserProfileUpdate): Promise<UserProfile> { ... },
  async getStats(): Promise<UserStats> { ... },

  // Tasks
  async getTasks(): Promise<Task[]> { ... },
  async createTask(data: TaskCreate): Promise<Task> { ... },
  async getAssignments(): Promise<TaskAssignment[]> { ... },

  // Responses
  async submitResponse(data: QuestionResponseCreate): Promise<QuestionResponse> { ... },
  async getResponses(taskId?: string): Promise<QuestionResponse[]> { ... },

  // Label Classes
  async getLabelClasses(): Promise<LabelClass[]> { ... },
  async createLabelClass(data: LabelClassCreate): Promise<LabelClass> { ... }
};
```

### **Custom Hooks**
```tsx
// hooks/useApi.ts
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
};

// Usage
const { execute, loading, error } = useApi();
const handleSubmit = async () => {
  const result = await execute(() => api.createTask(taskData));
  if (result) {
    // Success handling
  }
};
```

## 🎨 UI Components & Styling

### **Material-UI Theme**
```tsx
// lib/theme.ts
export const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#a8b5ff',
      dark: '#2349b7'
    },
    secondary: {
      main: '#764ba2',
      light: '#a97dd4',
      dark: '#472373'
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    button: { textTransform: 'none' }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderRadius: 12
        }
      }
    }
  }
});
```

### **Common Components**
```tsx
// components/Common/LoadingScreen.tsx
const LoadingScreen: React.FC = () => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
    <CircularProgress size={60} />
    <Typography variant="h6" sx={{ mt: 2 }}>Loading...</Typography>
  </Box>
);

// components/Common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

## 📱 Responsive Design

### **Breakpoint Strategy**
```tsx
// utils/breakpoints.ts
export const breakpoints = {
  xs: 0,      // Mobile portrait
  sm: 600,    // Mobile landscape  
  md: 900,    // Tablet
  lg: 1200,   // Desktop
  xl: 1536    // Large desktop
};

// Usage in components
const useStyles = () => {
  const theme = useTheme();
  return {
    container: {
      padding: theme.spacing(2),
      [theme.breakpoints.up('md')]: {
        padding: theme.spacing(4)
      }
    }
  };
};
```

### **Mobile-First Components**
```tsx
// Responsive task grid
<Grid container spacing={2}>
  {tasks.map(task => (
    <Grid 
      item 
      xs={12}        // Full width on mobile
      sm={6}         // Half width on small screens
      md={4}         // Third width on medium screens
      lg={3}         // Quarter width on large screens
      key={task.id}
    >
      <TaskCard task={task} />
    </Grid>
  ))}
</Grid>
```

## 🔄 Real-time Updates

### **Supabase Realtime**
```tsx
// hooks/useRealtime.ts
export const useRealtime = (table: string, callback: (payload: any) => void) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, callback]);
};

// Usage in components
const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Real-time task updates
  useRealtime('tasks', (payload) => {
    if (payload.eventType === 'INSERT') {
      setTasks(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setTasks(prev => prev.map(task => 
        task.id === payload.new.id ? payload.new : task
      ));
    }
  });

  return <TaskGrid tasks={tasks} />;
};
```

### **Progress Updates**
```tsx
// Real-time progress tracking
const ProgressTracker: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useRealtime('task_assignments', (payload) => {
    if (payload.new.user_id === currentUser.id) {
      const completion = (payload.new.completed_labels / payload.new.target_labels) * 100;
      setProgress(completion);
    }
  });

  return (
    <LinearProgress 
      variant="determinate" 
      value={progress}
      sx={{ height: 8, borderRadius: 4 }}
    />
  );
};
```

## 🧪 Testing

### **Testing Setup**
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test TaskCard.test.tsx
```

### **Test Structure**
```
src/
├── __tests__/              # Test files
│   ├── components/
│   │   ├── Auth/
│   │   │   └── LoginForm.test.tsx
│   │   ├── Tasks/
│   │   │   └── TaskCard.test.tsx
│   │   └── Dashboard/
│   │       └── UserStats.test.tsx
│   ├── hooks/
│   │   └── useAuth.test.ts
│   ├── services/
│   │   └── api.test.ts
│   └── utils/
│       └── formatting.test.ts
├── __mocks__/              # Mock files
│   ├── supabase.ts
│   └── api.ts
└── setupTests.ts           # Test configuration
```

### **Component Testing**
```tsx
// __tests__/components/Tasks/TaskCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../../../components/Tasks/TaskCard';

const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'active'
};

describe('TaskCard', () => {
  it('renders task information correctly', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const handleSelect = jest.fn();
    render(<TaskCard task={mockTask} onSelect={handleSelect} />);
    
    fireEvent.click(screen.getByText('Test Task'));
    expect(handleSelect).toHaveBeenCalledWith(mockTask);
  });
});
```

### **Hook Testing**
```tsx
// __tests__/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });
});
```

## 📈 Performance Optimization

### **Code Splitting**
```tsx
// Lazy load components
const TaskLabeler = lazy(() => import('../components/Labeling/TaskLabeler'));
const AdminPanel = lazy(() => import('../components/Admin/AdminPanel'));

// Usage with Suspense
<Suspense fallback={<LoadingScreen />}>
  <TaskLabeler />
</Suspense>
```

### **Memoization**
```tsx
// Memoize expensive components
const TaskCard = memo(({ task, onSelect }: TaskCardProps) => {
  return (
    <Card onClick={() => onSelect(task)}>
      <CardContent>
        <Typography variant="h6">{task.title}</Typography>
        <Typography color="textSecondary">{task.description}</Typography>
      </CardContent>
    </Card>
  );
});

// Memoize callback functions
const TaskList = ({ tasks }: TaskListProps) => {
  const handleTaskSelect = useCallback((task: Task) => {
    // Handle task selection
  }, []);

  const memoizedTasks = useMemo(() => 
    tasks.filter(task => task.status === 'active'),
    [tasks]
  );

  return (
    <Grid container>
      {memoizedTasks.map(task => (
        <TaskCard key={task.id} task={task} onSelect={handleTaskSelect} />
      ))}
    </Grid>
  );
};
```

### **Image Optimization**
```tsx
// Lazy loading images
const OptimizedImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box position="relative">
      {!isLoaded && <Skeleton variant="rectangular" width="100%" height={200} />}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ display: isLoaded ? 'block' : 'none' }}
        />
      )}
    </Box>
  );
};
```

## 🔒 Security & Best Practices

### **Input Validation**
```tsx
// Form validation with react-hook-form
const TaskCreateForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskCreateData>({
    resolver: yupResolver(taskCreateSchema)
  });

  const onSubmit = (data: TaskCreateData) => {
    // Validated data
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        {...register('title')}
        error={!!errors.title}
        helperText={errors.title?.message}
        label="Task Title"
        required
      />
    </form>
  );
};
```

### **XSS Prevention**
```tsx
// Safe HTML rendering
import DOMPurify from 'dompurify';

const SafeHTML: React.FC<{ html: string }> = ({ html }) => {
  const sanitizedHTML = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
};
```

### **Environment Variables**
```tsx
// utils/config.ts
export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL!,
  supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY!,
  debug: process.env.REACT_APP_DEBUG === 'true'
};

// Validate required environment variables
const requiredEnvVars = ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

## 🚀 Build & Deployment

### **Build Configuration**
```bash
# Environment-specific builds
npm run build:dev      # Development build
npm run build:staging   # Staging build  
npm run build:prod     # Production build

# Analyze bundle size
npm run analyze
```

### **Docker Deployment**
```dockerfile
# Dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **Deployment Checklist**
- [ ] Environment variables configured
- [ ] Build optimization enabled
- [ ] Bundle size analyzed and optimized
- [ ] Error boundaries implemented
- [ ] Analytics/monitoring setup
- [ ] Performance metrics tracking
- [ ] Accessibility testing completed
- [ ] Cross-browser testing done

## 🐛 Debugging & Troubleshooting

### **Debug Tools**
```tsx
// Debug component
const DebugPanel: React.FC = () => {
  const { user } = useAuth();
  const { tasks } = useTask();

  if (!config.debug) return null;

  return (
    <Paper sx={{ p: 2, m: 2, bgcolor: 'grey.100' }}>
      <Typography variant="h6">Debug Info</Typography>
      <pre>{JSON.stringify({ user, tasks }, null, 2)}</pre>
    </Paper>
  );
};
```

### **Error Tracking**
```tsx
// Error reporting
const reportError = (error: Error, errorInfo: ErrorInfo) => {
  if (config.debug) {
    console.error('Error caught by boundary:', error, errorInfo);
  } else {
    // Send to error tracking service
    // analytics.track('error', { error: error.message, stack: error.stack });
  }
};
```

### **Common Issues**

**API Connection Problems**
```bash
# Check API endpoint
curl http://localhost:8000/health

# Verify environment variables
echo $REACT_APP_API_URL
```

**Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

**Performance Issues**
```bash
# Analyze bundle
npm run analyze

# Check for memory leaks
# Use React DevTools Profiler
```

## 📞 Support & Resources

- **Component Library**: [Material-UI Documentation](https://mui.com/)
- **React Documentation**: [React Docs](https://reactjs.org/docs)
- **TypeScript Guide**: [TS Handbook](https://www.typescriptlang.org/docs/)
- **Testing Guide**: [Testing Library](https://testing-library.com/docs/)

## 🔄 Development Commands

```bash
# Development
npm start              # Start dev server
npm run type-check     # TypeScript checking
npm run lint           # ESLint checking
npm run lint:fix       # Fix linting issues

# Testing  
npm test               # Run tests
npm run test:coverage  # Test with coverage
npm run test:watch     # Watch mode

# Building
npm run build          # Production build
npm run analyze        # Bundle analysis
npm run serve          # Serve build locally

# Utilities
npm run format         # Prettier formatting
npm run clean          # Clean build files
npm audit              # Security audit
```

---

**🎨 Frontend is ready! Combined with the backend, you have a complete labeling system.**