# Labeling System Frontend

React + TypeScript frontend with Material-UI components for multi-modal data labeling workflows.

## Overview

This frontend provides:
- **Admin Dashboard**: Task creation, user assignment, progress monitoring
- **Labeler Interface**: Progressive disclosure UI for failure detection
- **Multi-modal Media**: Full image/video/audio players with authentication
- **Real-time Tracking**: Progress updates and response validation

## Quick Start

### Prerequisites
- Node.js 16+
- Backend running on port 8000

### Setup
```bash
npm install
cp .env.example .env    # Configure your settings
npm start               # Opens http://localhost:3000
```

### Environment Variables
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL
REACT_APP_API_URL=http://localhost:8000
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with hot reload |
| `npm test` | Run test suite |
| `npm run build` | Create optimized production build |
| `npm run analyze` | Analyze bundle size (if configured) |

## Project Structure

```
src/
├── components/
│   ├── Auth/                    # Authentication components
│   │   └── LoginForm.tsx        # Login with demo accounts
│   ├── Admin/                   # Admin dashboard components
│   │   ├── AssignmentOverview.tsx   # Monitor assignments
│   │   ├── TaskManagement.tsx       # Task creation wizard
│   │   ├── UserAssignment.tsx       # Assign tasks to users
│   │   ├── DevHelper.tsx            # Development utilities
│   │   └── TaskManagement/          # Task creation steps
│   │       ├── BasicInfoStep.tsx
│   │       ├── QuestionTemplateStep.tsx
│   │       ├── ExampleImagesStep.tsx
│   │       └── ReviewStep.tsx
│   ├── Tasks/                   # Labeling workflow components
│   │   ├── TaskIntroduction.tsx     # Task overview and instructions
│   │   ├── LabelingInterface.tsx    # Main labeling workflow
│   │   ├── MediaDisplay.tsx         # Multi-media display
│   │   ├── LazyMediaItem.tsx        # Lazy-loaded media items
│   │   ├── FailureTypeSelector.tsx  # Progressive disclosure UI
│   │   └── LabelingInterface/       # Labeling sub-components
│   │       ├── MediaSection.tsx
│   │       ├── QuestionDisplay.tsx
│   │       ├── ResponseForm.tsx
│   │       ├── NavigationControls.tsx
│   │       └── ProgressIndicator.tsx
│   ├── ui/                      # Reusable UI components
│   │   ├── DataTable.tsx
│   │   ├── StatusChip.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── ErrorBoundary.tsx
│   ├── AdminDashboard.tsx       # Main admin interface
│   ├── Dashboard.tsx            # User dashboard with task cards
│   └── LoadingScreen.tsx        # Loading state component
├── contexts/
│   ├── AuthContext.tsx          # Authentication state management
│   └── LabelingContext.tsx      # Labeling workflow state
├── services/
│   ├── api.ts                   # Complete API client (30+ endpoints)
│   └── fakeData.ts              # Demo data for development
├── types/
│   ├── auth.ts                  # Authentication interfaces
│   ├── tasks.ts                 # Task management interfaces
│   ├── labeling.ts              # Labeling workflow interfaces
│   └── createTask.ts            # Task creation interfaces
├── hooks/
│   ├── useApiCall.ts            # API call helper
│   ├── useLoadingState.ts       # Loading state management
│   ├── useDebounce.ts           # Debounced values
│   └── useMediaAuthentication.ts # Authenticated media loading
├── utils/
│   └── mediaUtils.ts            # Media file utilities
├── lib/
│   └── supabase.ts              # Supabase client configuration
├── App.tsx                      # Main app with routing
└── index.tsx                    # Application entry point
```

## Component Architecture

### Admin Components

**AdminDashboard.tsx**
- Tabbed interface for task management, user assignment, and monitoring
- Role-based access control

**TaskManagement.tsx**
- Multi-step task creation wizard
- JSON file upload for batch task creation
- Task editing and deletion

**AssignmentOverview.tsx**
- Real-time assignment monitoring
- Progress statistics and analytics
- User performance tracking

### Labeling Components

**TaskIntroduction.tsx**
- Task instructions and examples
- "Start Labeling" flow
- Failure type explanations with color coding

**LabelingInterface.tsx**
- Question-by-question navigation (Back/Next)
- Progress tracking (Question X of Y)
- Response validation before submission
- Auto-save and completion handling

**FailureTypeSelector.tsx**
- Progressive disclosure UI for failure detection
- Yes/No primary questions with immediate feedback
- Expandable detailed options on "Yes" selection
- Multi-selection within failure categories

**MediaDisplay.tsx**
- Multi-media type support (image/video/audio)
- Image zoom dialog with full-screen preview
- Video controls with native HTML5 player
- Audio playback with visual feedback
- Blob URL management with automatic cleanup

## State Management

### AuthContext
- User authentication and profile management
- Role-based routing (admin/labeler/reviewer)
- Session persistence with Supabase

### LabelingContext
- Question navigation state
- Response tracking and validation
- Progress calculation

### Local State
- Component-specific state with optimized re-rendering
- React.memo for expensive components
- useMemo for calculations, useCallback for handlers

## Labeling Workflow

### User Experience Flow
1. **Dashboard** - Click "Start Labeling" on assigned task card
2. **Task Introduction** - Review instructions and examples
3. **Labeling Interface** - Complete failure detection workflow:
   - View 2-3 media items for comparison
   - Answer "Are there any X-type failures?" (Yes/No)
   - Select specific failure types when "Yes" is chosen
   - Navigate between questions with Back/Next
   - Submit responses with validation
4. **Completion** - Return to dashboard with updated progress

### Progressive Disclosure UI
- **Initial View**: Clean Yes/No options only
- **After "Yes"**: Detailed failure options expand immediately
- **After "No"**: Options hidden, "None" selected automatically
- **Visual Feedback**: Color-coded sections, status chips, progress

### Failure Detection Categories
| Category | Theme | Examples |
|----------|-------|----------|
| A-type (Structural) | Red/Error | Crack, Corrosion, Deformation |
| B-type (Functional) | Orange/Warning | Electrical, Mechanical, Software |
| C-type (Quality) | Blue/Info | Safety, Performance, Aesthetic |

## API Integration

### Endpoints Used
```typescript
// User assignments
GET /api/v1/tasks/assignments/my

// Task details
GET /api/v1/tasks/{task_id}

// Questions with media
GET /api/v1/tasks/{task_id}/questions-with-media

// Submit responses
POST /api/v1/tasks/responses/detailed

// Authenticated media access
POST /api/v1/tasks/{task_id}/media
```

### Data Flow
```
Frontend State → API Service → FastAPI Backend → Supabase Database
     ↓              ↓              ↓                ↓
React Hooks   →  api.ts   →  30+ Endpoints  →  PostgreSQL
```

## Development

### Code Conventions
- **TypeScript**: Strict typing with comprehensive interfaces
- **Material-UI**: Consistent design with sx prop styling
- **Functional Components**: React hooks pattern
- **API Calls**: Centralized in services/api.ts

### Performance Optimizations
- **React.memo**: Prevents unnecessary re-renders
- **useMemo**: Caches expensive calculations
- **useCallback**: Stabilizes function references
- **Lazy Loading**: Deferred media loading

### Build Commands
```bash
npm start          # Development server with hot reload
npm test           # Run test suite
npm run build      # Production build in /build
npx serve -s build # Test production build locally
```

## Troubleshooting

### Hot Reload Issues

If hot reload stops working:

1. **Check for StrictMode** - Can cause double-mounting in development
2. **Verify initialization guards** - Prevent AuthContext re-initialization
3. **Check console logs** for:
   - `AuthContext: Initializing authentication...` (should appear once)
   - `AuthContext: Auth state changed` (only on actual changes)

### Common Issues

**API Connection Errors**
- Verify backend is running on port 8000
- Check `REACT_APP_API_URL` in `.env`
- Look for CORS errors in browser console

**Authentication Issues**
- Verify Supabase credentials in `.env`
- Check that demo accounts exist in Supabase
- Clear browser storage and retry

**Media Loading Failures**
- Ensure backend media endpoints are accessible
- Check authentication token validity
- Verify file paths in backend uploads directory

### Debug Mode
```bash
REACT_APP_DEBUG=true npm start  # Enable debug logging
```

## Demo & Testing

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Labeler | labeler@example.com | password123 |

### Test Scenarios
1. **Complete Workflow**: Dashboard → Introduction → Labeling → Completion
2. **Progressive Disclosure**: Test Yes/No → Detailed options flow
3. **Navigation**: Use Back/Next with state preservation
4. **Multi-Selection**: Select multiple failures per category
5. **Validation**: Try submitting incomplete responses
6. **Responsive**: Test on mobile devices

## Technology Stack

- **React 18** with TypeScript
- **Material-UI (MUI) v5** for components
- **React Router v6** for navigation
- **Supabase** for auth and API
- **Create React App** for build tooling

## Contributing

1. Follow existing component patterns
2. Add TypeScript types for all new code
3. Use Material-UI components consistently
4. Test on multiple screen sizes
5. Update types in `src/types/` as needed
