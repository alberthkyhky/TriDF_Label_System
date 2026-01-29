import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

// Data interfaces based on existing LabelingInterface
interface MediaFile {
  filename: string;
  file_path: string;
  media_type: 'image' | 'video' | 'audio';
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
}

interface FailureChoice {
  text: string;
  options: string[];
  multiple_select: boolean;
  order?: number;
}

interface QuestionWithMedia {
  id: string;
  task_id: string;
  question_text: string;
  question_order: number;
  status: string;
  target_classes: string[];
  media_files: MediaFile[];
  choices: {
    [key: string]: FailureChoice;
  };
  created_at: string;
  updated_at?: string;
}

interface QuestionResponse {
  question_id: string;
  task_id: string;
  responses: {
    [failureType: string]: string[];
  };
  media_files: string[];
  time_spent_seconds?: number;
  started_at?: string;
}

interface ProgressInfo {
  currentQuestionIndex: number;
  totalQuestions: number;
  completedQuestions: number;
  targetLabels: number;
  progressPercentage: number;
}

interface LabelingState {
  taskId: string | null;
  questions: QuestionWithMedia[];
  currentQuestion: QuestionWithMedia | null;
  currentQuestionIndex: number;
  responses: Record<string, QuestionResponse>;
  progress: ProgressInfo;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  questionStartTime: Date;
  assignment: any;
}

interface LabelingContextType extends LabelingState {
  // Navigation actions
  navigateToQuestion: (index: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  
  // Response actions
  updateResponse: (questionId: string, response: QuestionResponse) => void;
  submitResponse: (questionId: string) => Promise<void>;
  
  // State management actions
  clearError: () => void;
  setError: (error: string) => void;
  refreshData: () => Promise<void>;
  
  // Utility functions
  getResponseForQuestion: (questionId: string) => QuestionResponse | null;
  isQuestionCompleted: (questionId: string) => boolean;
  canNavigateNext: () => boolean;
  canNavigatePrevious: () => boolean;
}

// Action types for reducer
type LabelingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASK_ID'; payload: string }
  | { type: 'SET_QUESTIONS'; payload: QuestionWithMedia[] }
  | { type: 'SET_CURRENT_QUESTION_INDEX'; payload: number }
  | { type: 'SET_RESPONSES'; payload: Record<string, QuestionResponse> }
  | { type: 'UPDATE_RESPONSE'; payload: { questionId: string; response: QuestionResponse } }
  | { type: 'SET_ASSIGNMENT'; payload: any }
  | { type: 'SET_QUESTION_START_TIME'; payload: Date }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: LabelingState = {
  taskId: null,
  questions: [],
  currentQuestion: null,
  currentQuestionIndex: -1,
  responses: {},
  progress: {
    currentQuestionIndex: -1,
    totalQuestions: 0,
    completedQuestions: 0,
    targetLabels: 0,
    progressPercentage: 0
  },
  loading: true,
  submitting: false,
  error: null,
  questionStartTime: new Date(),
  assignment: null
};

// Reducer function
function labelingReducer(state: LabelingState, action: LabelingAction): LabelingState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'SET_TASK_ID':
      return { ...state, taskId: action.payload };
      
    case 'SET_QUESTIONS':
      const questions = action.payload;
      const currentQuestion = questions[state.currentQuestionIndex] || null;
      return { ...state, questions, currentQuestion };
      
    case 'SET_CURRENT_QUESTION_INDEX':
      const newIndex = action.payload;
      const newCurrentQuestion = state.questions[newIndex] || null;
      const progress = {
        currentQuestionIndex: newIndex,
        totalQuestions: state.questions.length,
        completedQuestions: Object.keys(state.responses).length,
        targetLabels: state.assignment?.question_range_end && state.assignment?.question_range_start 
          ? (state.assignment.question_range_end - state.assignment.question_range_start + 1)
          : 0,
        progressPercentage: (state.assignment?.question_range_end && state.assignment?.question_range_start)
          ? Math.round((Object.keys(state.responses).length / (state.assignment.question_range_end - state.assignment.question_range_start + 1)) * 100)
          : 0
      };
      return { 
        ...state, 
        currentQuestionIndex: newIndex, 
        currentQuestion: newCurrentQuestion,
        progress
      };
      
    case 'SET_RESPONSES':
      return { ...state, responses: action.payload };
      
    case 'UPDATE_RESPONSE':
      const updatedResponses = {
        ...state.responses,
        [action.payload.questionId]: action.payload.response
      };
      const updatedProgress = {
        ...state.progress,
        completedQuestions: Object.keys(updatedResponses).length,
        progressPercentage: (state.assignment?.question_range_end && state.assignment?.question_range_start)
          ? Math.round((Object.keys(updatedResponses).length / (state.assignment.question_range_end - state.assignment.question_range_start + 1)) * 100)
          : 0
      };
      return { 
        ...state, 
        responses: updatedResponses,
        progress: updatedProgress
      };
      
    case 'SET_ASSIGNMENT':
      return { ...state, assignment: action.payload };
      
    case 'SET_QUESTION_START_TIME':
      return { ...state, questionStartTime: action.payload };
      
    case 'RESET_STATE':
      return { ...initialState };
      
    default:
      return state;
  }
}

// Context creation
const LabelingContext = createContext<LabelingContextType | undefined>(undefined);

// Provider component
export const LabelingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(labelingReducer, initialState);
  const { user } = useAuth();
  const { taskId } = useParams<{ taskId: string }>();

  // Initialize task ID
  React.useEffect(() => {
    if (taskId && taskId !== state.taskId) {
      dispatch({ type: 'SET_TASK_ID', payload: taskId });
    }
  }, [taskId, state.taskId]);

  // Navigation actions
  const navigateToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < state.questions.length) {
      dispatch({ type: 'SET_CURRENT_QUESTION_INDEX', payload: index });
      dispatch({ type: 'SET_QUESTION_START_TIME', payload: new Date() });
    }
  }, [state.questions.length]);

  const goToNextQuestion = useCallback(() => {
    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex < state.questions.length) {
      navigateToQuestion(nextIndex);
    }
  }, [state.currentQuestionIndex, state.questions.length, navigateToQuestion]);

  const goToPreviousQuestion = useCallback(() => {
    const prevIndex = state.currentQuestionIndex - 1;
    if (prevIndex >= 0) {
      navigateToQuestion(prevIndex);
    }
  }, [state.currentQuestionIndex, navigateToQuestion]);

  // Response actions
  const updateResponse = useCallback((questionId: string, response: QuestionResponse) => {
    dispatch({ type: 'UPDATE_RESPONSE', payload: { questionId, response } });
  }, []);

  const submitResponse = useCallback(async (questionId: string) => {
    const response = state.responses[questionId];
    if (!response || !state.taskId) return;

    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Calculate time spent
      const timeSpent = Math.floor((new Date().getTime() - state.questionStartTime.getTime()) / 1000);
      const responseWithTiming = {
        ...response,
        time_spent_seconds: timeSpent,
        started_at: state.questionStartTime.toISOString()
      };

      // Create API payload with number question_id
      const apiPayload = {
        ...responseWithTiming,
        question_id: parseInt(response.question_id)
      };

      await api.createDetailedQuestionResponse(apiPayload);
      
      // Update the response with timing info (keeping string question_id for state)
      dispatch({ 
        type: 'UPDATE_RESPONSE', 
        payload: { questionId, response: responseWithTiming }
      });

    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to submit response' });
      throw error;
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [state.responses, state.taskId, state.questionStartTime]);

  // State management actions
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const refreshData = useCallback(async () => {
    if (!state.taskId) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Fetch assignment data
      const assignmentData = await api.getTaskAssignment(state.taskId);
      dispatch({ type: 'SET_ASSIGNMENT', payload: assignmentData });
      dispatch({ type: 'SET_CURRENT_QUESTION_INDEX', payload: assignmentData.completed_labels });

      // Fetch questions with media
      const questionsData = await api.getTaskQuestionsWithMedia(state.taskId);
      dispatch({ type: 'SET_QUESTIONS', payload: questionsData });

    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.taskId]);

  // Auto-load data when task ID changes
  React.useEffect(() => {
    if (state.taskId && state.currentQuestionIndex === -1) {
      refreshData();
    }
  }, [state.taskId, state.currentQuestionIndex, refreshData]);

  // Utility functions
  const getResponseForQuestion = useCallback((questionId: string): QuestionResponse | null => {
    return state.responses[questionId] || null;
  }, [state.responses]);

  const isQuestionCompleted = useCallback((questionId: string): boolean => {
    return !!state.responses[questionId];
  }, [state.responses]);

  const canNavigateNext = useCallback((): boolean => {
    return state.currentQuestionIndex < state.questions.length - 1;
  }, [state.currentQuestionIndex, state.questions.length]);

  const canNavigatePrevious = useCallback((): boolean => {
    return state.currentQuestionIndex > 0;
  }, [state.currentQuestionIndex]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo((): LabelingContextType => ({
    ...state,
    navigateToQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    updateResponse,
    submitResponse,
    clearError,
    setError,
    refreshData,
    getResponseForQuestion,
    isQuestionCompleted,
    canNavigateNext,
    canNavigatePrevious
  }), [
    state,
    navigateToQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    updateResponse,
    submitResponse,
    clearError,
    setError,
    refreshData,
    getResponseForQuestion,
    isQuestionCompleted,
    canNavigateNext,
    canNavigatePrevious
  ]);

  return (
    <LabelingContext.Provider value={contextValue}>
      {children}
    </LabelingContext.Provider>
  );
};

// Custom hook to use the context
export const useLabeling = (): LabelingContextType => {
  const context = useContext(LabelingContext);
  if (context === undefined) {
    throw new Error('useLabeling must be used within a LabelingProvider');
  }
  return context;
};

export default LabelingContext;