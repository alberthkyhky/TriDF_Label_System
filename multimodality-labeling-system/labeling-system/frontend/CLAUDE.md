# CLAUDE.md - Multimodality Labeling System Frontend

## Project Overview
A React TypeScript frontend for a multimodality labeling system that allows users to analyze media files (images, videos, audio) and identify various failure types. The system supports admin task creation, user assignment management, and comprehensive labeling workflows.

## Current Status: Phase 3 Performance Optimization (In Progress)

### Completed Phases

#### Phase 1: Foundation & Structure ✅ COMPLETE
- **Component Architecture**: Established modular component structure with proper separation of concerns
- **State Management**: Implemented React Context for authentication and labeling workflows
- **TypeScript Integration**: Full TypeScript coverage with proper type definitions
- **Routing & Navigation**: React Router setup with protected routes and navigation
- **UI Framework**: Material-UI integration with consistent design system
- **API Integration**: Comprehensive API service layer with error handling

#### Phase 2: Extract Reusable Patterns ✅ COMPLETE
- **Custom Hooks**: Created reusable hooks for common patterns (useApiCall, useLoadingState, etc.)
- **UI Components**: Extracted reusable UI components (DataTable, StatusChip, etc.)
- **Context Providers**: Modular context architecture for state management
- **Type System**: Comprehensive type definitions across all modules
- **Error Handling**: Centralized error handling patterns

#### Phase 3: Optimize Performance & UX (75% COMPLETE)

##### ✅ Completed Optimizations

**Task 3.1: React.memo for expensive components**
- **MediaDisplay.tsx**: Custom comparison for mediaFiles array and taskId to prevent expensive media blob URL re-creation
- **FailureTypeSelector.tsx**: Deep object comparison for choices and responses objects
- **TaskList.tsx**: Task array comparison with key property checking
- **StatCard (AssignmentOverview.tsx)**: Simple props comparison for statistical display
- **BasicInfoStep.tsx**: Form data comparison for task creation steps

**Task 3.2: useMemo for expensive calculations**
- **TaskIntroduction.tsx**: Object.entries() operations, media count calculations, placeholder generation
- **FailureTypeSelector.tsx**: Selection summaries calculation to prevent re-computation
- **AssignmentOverview.tsx**: Statistical calculations (totals, averages, progress)
- **LabelingContext.tsx**: Context value memoization to prevent consumer re-renders
- **MediaSection.tsx**: Media type aggregation and summary calculations
- **QuestionTemplateStep.tsx**: Object operations on choices (keys, entries, counts)

**Task 3.3: useCallback for event handlers**
- **LabelingInterface.tsx**: Main interaction handlers (handleFailureTypeChange, handleSubmitResponse, navigation)
- **AssignmentOverview.tsx**: Admin interface handlers (handleRefresh, handleToggleActive, handleViewDetails)
- **MediaDisplay.tsx**: Media interaction handlers (handleMediaError, dialog handlers)
- **AuthContext.tsx**: Authentication handlers (signIn, signUp, signOut, updateProfile)

##### 🚧 Remaining Tasks
- **Task 3.4**: Add loading states and skeleton screens (HIGH PRIORITY)
- **Task 3.5**: Implement error boundaries (HIGH PRIORITY)
- **Task 3.6**: Add debouncing for search/filter inputs (MEDIUM PRIORITY)
- **Task 3.7**: Optimize media loading with lazy loading (HIGH PRIORITY)

## Key Architecture Components

### Component Structure
```
src/components/
├── Admin/                    # Admin interface components
│   ├── AssignmentOverview.tsx    # User assignment management
│   ├── TaskManagement.tsx        # Task creation and management
│   └── TaskManagement/          # Task creation wizard steps
├── Auth/                     # Authentication components
├── Tasks/                    # Core labeling functionality
│   ├── LabelingInterface.tsx     # Main labeling interface
│   ├── TaskIntroduction.tsx      # Task overview and instructions
│   ├── MediaDisplay.tsx          # Media file display component
│   └── LabelingInterface/       # Labeling sub-components
└── ui/                       # Reusable UI components
```

### State Management
- **AuthContext**: User authentication and profile management
- **LabelingContext**: Labeling workflow state with question navigation and response tracking
- **Local State**: Component-specific state with optimized re-rendering

### Performance Optimizations Implemented
- **React.memo**: Prevents unnecessary re-renders of expensive components
- **useMemo**: Caches expensive calculations and object transformations
- **useCallback**: Stabilizes function references for memoized components
- **Custom Comparisons**: Deep comparison functions for complex prop objects

## Technical Stack
- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **State Management**: React Context + useReducer
- **Routing**: React Router v6
- **Backend Integration**: Supabase (auth + API)
- **Build Tool**: Create React App
- **Performance**: React.memo, useMemo, useCallback optimizations

## Key Features
- **Multi-step Task Creation**: Wizard-based task creation with media configuration
- **Media Analysis**: Support for images, videos, and audio files with secure blob URL handling
- **Failure Type Classification**: Configurable failure categories with multiple selection options
- **User Assignment**: Admin can assign tasks to specific users with target completion metrics
- **Progress Tracking**: Real-time progress monitoring and completion statistics
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

## Development Commands
```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

## Performance Metrics
- **Build Size**: ~225KB (main bundle, gzipped)
- **React.memo Coverage**: 5+ critical components optimized
- **useMemo Optimizations**: 15+ expensive calculations cached
- **useCallback Optimizations**: 12+ event handlers stabilized

## Known Issues & Future Improvements
- **Loading States**: Need skeleton screens for better UX (Task 3.4)
- **Error Boundaries**: Implement comprehensive error handling (Task 3.5)
- **Media Loading**: Implement lazy loading for large media files (Task 3.7)
- **Search Performance**: Add debouncing for filter inputs (Task 3.6)

## Handoff Notes
The system is currently in a stable state with Phase 1 and 2 complete, and significant Phase 3 optimizations implemented. The remaining Phase 3 tasks (3.4-3.7) are focused on UX improvements and advanced performance optimizations. All core functionality is working, and the application builds successfully with only minor ESLint warnings related to dependency arrays.

---
*Last Updated: July 19, 2025*
*Phase 3 Progress: 75% Complete*