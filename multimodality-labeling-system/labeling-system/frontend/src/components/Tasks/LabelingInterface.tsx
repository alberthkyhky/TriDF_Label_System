/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  AppBar,
  Toolbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ArrowBack, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { ProgressIndicator } from './LabelingInterface/ProgressIndicator';
import { MediaSection } from './LabelingInterface/MediaSection';
import { ResponseForm } from './LabelingInterface/ResponseForm';
import { NavigationControls } from './LabelingInterface/NavigationControls';
import { ErrorBoundary } from '../ui/ErrorBoundary';

// Updated interfaces for real API data
interface MediaFile {
  filename: string;
  file_path: string;
  media_type: 'image' | 'video' | 'audio';
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  key?: string; // The original key from the data (e.g., 'output_wav', 'other_wav')
  caption?: string; // Alternative to key field (from backend)
  display_name?: string; // Human-readable display name
}

interface FailureChoice {
  text: string;
  options: string[];
  multiple_select: boolean;
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

const LabelingInterface: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [questions, setQuestions] = useState<QuestionWithMedia[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [totalQuestions, setTotalQuestions] = useState(-1);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [assignment, setAssignment] = useState<any>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');

  // Completion dialog handlers
  const handleCompletionDialogClose = useCallback(() => {
    setShowCompletionDialog(false);
    navigate('/dashboard');
  }, [navigate]);

  const showCompletionMessage = useCallback((message: string) => {
    setCompletionMessage(message);
    setShowCompletionDialog(true);
  }, []);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!taskId) {
        setError('No task ID provided');
        setLoading(true);
        return;
      }
      try {
        setError(null);
        const assignmentData = await api.getTaskAssignment(taskId);
        setAssignment(assignmentData);
        // Calculate total questions from assignment range
        const totalQuestions = assignmentData.question_range_end - assignmentData.question_range_start + 1;
        setTotalQuestions(totalQuestions);
        
        // Set current question index to completed_labels (this represents progress within assignment)
        setCurrentQuestionIndex(assignmentData.completed_labels);
        // Set task title from assignment data
        setTaskTitle(assignmentData.task_title || 'Unknown Task');
        
        // Check if assignment is already complete
        if (assignmentData.completed_labels >= totalQuestions) {
          showCompletionMessage('You have already completed this assignment! You will be redirected to the dashboard.');
          return;
        }
      } catch (error: any) {
        console.error('Error fetching assignment:', error);
        setError(error.message || 'Failed to load assignment');
      }
    };
    if (currentQuestionIndex === -1) {
      fetchAssignment();
    }
  }, [showCompletionMessage, navigate]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!taskId) {
        setError('No task ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Convert relative progress to actual question ID based on assignment range
        const actualQuestionId = assignment ? (assignment.question_range_start - 1) + currentQuestionIndex : currentQuestionIndex;
        const questionsData = await api.getTaskQuestionsWithMedia(taskId, actualQuestionId);
        console.log('Fetched questions:', questionsData);
        setQuestions(questionsData);
        setQuestionStartTime(new Date());
      } catch (error: any) {
        console.error('Error fetching questions:', error);
        setError(error.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    if (currentQuestionIndex !== -1) {
      fetchQuestions();
    }
  }, [taskId, currentQuestionIndex, assignment]);

  // Reset timer when question changes
  useEffect(() => {
    setQuestionStartTime(new Date());
  }, [currentQuestionIndex]);

  // Memoize expensive calculations to prevent re-computation on every render
  const currentQuestion = useMemo(() => questions[0], [questions]);
  
  const currentResponse = useMemo(() => {
    if (!currentQuestion) {
      return {
        question_id: '',
        task_id: taskId || '',
        responses: {},
        media_files: [],
        started_at: questionStartTime.toISOString()
      };
    }
    return responses[currentQuestion.id] || {
      question_id: currentQuestion.id,
      task_id: taskId || '',
      responses: {},
      media_files: currentQuestion.media_files?.map(f => f.file_path) || [],
      started_at: questionStartTime.toISOString()
    };
  }, [currentQuestion, responses, taskId, questionStartTime]);

  const handleFailureTypeChange = useCallback((failureType: string, option: string, checked: boolean) => {
    if (!currentQuestion) return;
    const updatedResponse = { ...currentResponse };
    
    if (!updatedResponse.responses[failureType]) {
      updatedResponse.responses[failureType] = [];
    }

    if (checked) {
      // Add option if not already present
      if (!updatedResponse.responses[failureType].includes(option)) {
        updatedResponse.responses[failureType] = [...updatedResponse.responses[failureType], option];
      }
    } else {
      // Remove option
      updatedResponse.responses[failureType] = updatedResponse.responses[failureType].filter(
        item => item !== option
      );
    }

    // Special handling for "None" - if selected, clear ALL other options
    if (option === "None" && checked) {
      updatedResponse.responses[failureType] = ["None"];
    } else if (option !== "None" && checked) {
      // If any other option is selected, remove "None"
      updatedResponse.responses[failureType] = updatedResponse.responses[failureType].filter(
        item => item !== "None"
      );
    }

    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: updatedResponse
    }));
  }, [currentResponse, currentQuestion]);

  const handleSubmitResponse = useCallback(async () => {
    if (!currentQuestion) return;

    setSubmitting(true);
    
    try {
      // Calculate time spent on this question
      const timeSpent = Math.round((Date.now() - questionStartTime.getTime()) / 1000);
      
      // Convert relative progress to actual question ID for submission
      const actualQuestionId = assignment ? (assignment.question_range_start - 1) + currentQuestionIndex : currentQuestionIndex;
      
      const responseData = {
        question_id: actualQuestionId,
        task_id: taskId!,
        responses: currentResponse.responses,
        time_spent_seconds: timeSpent,
        started_at: questionStartTime.toISOString()
      };

      console.log('Submitting response:', responseData);
      
      // Submit response to backend
      await api.createDetailedQuestionResponse(responseData);
      
      // Fetch updated assignment data to check completion status
      const updatedAssignment = await api.getTaskAssignment(taskId!);
      setAssignment(updatedAssignment);
      
      // Calculate assignment target
      const assignmentTarget = updatedAssignment.question_range_end - updatedAssignment.question_range_start + 1;
      
      // Check if assignment is now complete
      if (updatedAssignment.completed_labels >= assignmentTarget) {
        showCompletionMessage('Assignment completed successfully! You have finished all your assigned questions. You will be redirected to the dashboard.');
        return;
      }
      
      // Move to next question if assignment is not complete
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestions([]);
      setResponses({});
      setError(null);
    } catch (error: any) {
      console.error('Error submitting response:', error);
      const errorMessage = error.message || 'Error submitting response. Please try again.';
      
      // Check if error indicates assignment completion
      if (errorMessage.includes('Assignment already completed') || errorMessage.includes('exceed your assigned question limit')) {
        showCompletionMessage('Assignment completed! You have finished all your assigned questions. You will be redirected to the dashboard.');
        return;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [currentQuestion, currentQuestionIndex, totalQuestions, currentResponse, questionStartTime, taskId, navigate, assignment, showCompletionMessage]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setError(null); // Clear any error when navigating
    }
  }, [currentQuestionIndex]);

  const handleBackToTask = useCallback(() => {
    navigate(`/task/${taskId}`);
  }, [navigate, taskId]);


  // Memoize response validation to prevent expensive validation on every render
  const isResponseValid = useCallback(() => {
    if (!currentQuestion) return false;
    
    // Check if at least one failure type has a selection
    const failureTypes = Object.keys(currentQuestion.choices || {});
    return failureTypes.every(failureType => {
      const selections = currentResponse.responses[failureType];
      return selections && selections.length > 0;
    });
  }, [currentQuestion, currentResponse]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">Loading questions...</Typography>
        <Typography variant="body2" color="text.secondary">
          Fetching questions and media files for this task
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error || !currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'No questions found for this task.'}
        </Alert>
        <Button variant="contained" onClick={handleBackToTask} sx={{ mt: 2 }}>
          Back to Task
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Navigation */}
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBack />}
            onClick={handleBackToTask}
            sx={{ mr: 2 }}
          >
            Task Info
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Labeling Interface - {user?.full_name || user?.email}
          </Typography>
          <Button color="inherit" onClick={signOut}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Progress Header */}
        <ProgressIndicator
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          taskTitle={taskTitle}
          questionOrder={currentQuestion.question_order}
        />

        <Grid container spacing={3}>
          {/* Media Display Section */}
          <ErrorBoundary level="section">
            <MediaSection
              mediaFiles={currentQuestion.media_files}
              taskId={taskId!}
              questionText={currentQuestion.question_text}
            />
          </ErrorBoundary>

          {/* Question and Choices Section */}
          <ErrorBoundary level="section">
            <ResponseForm
              currentQuestion={currentQuestion}
              currentResponse={currentResponse}
              onFailureTypeChange={handleFailureTypeChange}
              isResponseValid={isResponseValid}
            />
          </ErrorBoundary>
        </Grid>

        {/* Navigation Controls */}
        <ErrorBoundary level="component">
          <NavigationControls
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            isResponseValid={isResponseValid()}
            isSubmitting={submitting}
            onPrevious={handlePreviousQuestion}
            onSubmit={handleSubmitResponse}
          />
        </ErrorBoundary>
      </Container>

      {/* Assignment Completion Dialog */}
      <Dialog
        open={showCompletionDialog}
        onClose={handleCompletionDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mr: 1 }} />
          </Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'success.main' }}>
            Assignment Complete!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {completionMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Great job on completing your assigned questions!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="contained"
            onClick={handleCompletionDialogClose}
            size="large"
            sx={{ px: 4 }}
          >
            Go to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabelingInterface;