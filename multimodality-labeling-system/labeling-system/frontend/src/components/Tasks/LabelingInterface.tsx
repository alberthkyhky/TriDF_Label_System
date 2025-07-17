/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { ProgressIndicator } from './LabelingInterface/ProgressIndicator';
import { MediaSection } from './LabelingInterface/MediaSection';
import { ResponseForm } from './LabelingInterface/ResponseForm';
import { NavigationControls } from './LabelingInterface/NavigationControls';

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
        setCurrentQuestionIndex(assignmentData.completed_labels);
        setTotalQuestions(assignmentData.target_labels);
      } catch (error: any) {
        console.error('Error fetching assignment:', error);
        setError(error.message || 'Failed to load assignment');
      }
    };
    if (currentQuestionIndex === -1) {
      fetchAssignment();
    }
  }, []);

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
        const questionsData = await api.getTaskQuestionsWithMedia(taskId, currentQuestionIndex);
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
  }, [taskId, currentQuestionIndex]);

  // Reset timer when question changes
  useEffect(() => {
    setQuestionStartTime(new Date());
  }, [currentQuestionIndex]);

  const currentQuestion = questions[0];
  const currentResponse = responses[currentQuestion?.id] || {
    question_id: currentQuestion?.id || '',
    task_id: taskId || '',
    responses: {},
    media_files: currentQuestion?.media_files?.map(f => f.file_path) || [],
    started_at: questionStartTime.toISOString()
  };

  const handleFailureTypeChange = (failureType: string, option: string, checked: boolean) => {
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
  };

  const handleSubmitResponse = async () => {
    if (!currentQuestion) return;

    setSubmitting(true);
    
    try {
      // Calculate time spent on this question
      const timeSpent = Math.round((Date.now() - questionStartTime.getTime()) / 1000);
      
      const responseData = {
        question_id: currentQuestionIndex,
        task_id: taskId!,
        responses: currentResponse.responses,
        time_spent_seconds: timeSpent,
        started_at: questionStartTime.toISOString()
      };

      console.log('Submitting response:', responseData);
      
      // Submit response to backend
      await api.createDetailedQuestionResponse(responseData);
      
      // Move to next question or complete task
      if (currentQuestionIndex < totalQuestions) {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestions([]);
        setError(null);
      } else {
        alert('Task completed successfully! Redirecting to dashboard...');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error submitting response:', error);
      setError(error.message || 'Error submitting response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setError(null); // Clear any error when navigating
    }
  };

  const handleBackToTask = () => {
    navigate(`/task/${taskId}`);
  };


  const isResponseValid = () => {
    if (!currentQuestion) return false;
    
    // Check if at least one failure type has a selection
    const failureTypes = Object.keys(currentQuestion.choices || {});
    return failureTypes.every(failureType => {
      const selections = currentResponse.responses[failureType];
      return selections && selections.length > 0;
    });
  };

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
          taskId={taskId!}
          questionOrder={currentQuestion.question_order}
        />

        <Grid container spacing={3}>
          {/* Media Display Section */}
          <MediaSection
            mediaFiles={currentQuestion.media_files}
            taskId={taskId!}
            questionText={currentQuestion.question_text}
          />

          {/* Question and Choices Section */}
          <ResponseForm
            currentQuestion={currentQuestion}
            currentResponse={currentResponse}
            onFailureTypeChange={handleFailureTypeChange}
            isResponseValid={isResponseValid}
          />
        </Grid>

        {/* Navigation Controls */}
        <NavigationControls
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          isResponseValid={isResponseValid()}
          isSubmitting={submitting}
          onPrevious={handlePreviousQuestion}
          onSubmit={handleSubmitResponse}
        />
      </Container>
    </Box>
  );
};

export default LabelingInterface;