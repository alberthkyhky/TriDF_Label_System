import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  LinearProgress,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import { ArrowBack, ArrowForward, CheckCircle, NavigateBefore } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import MediaDisplay from './MediaDisplay';
import FailureTypeSelector from './FailureTypeSelector';

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());

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
        
        // Fetch questions with media from backend
        const questionsData = await api.getTaskQuestionsWithMedia(taskId);
        setQuestions(questionsData);
        setQuestionStartTime(new Date());
        
        console.log('Fetched questions:', questionsData);
        
        if (questionsData.length === 0) {
          setError('No questions found for this task. Please contact your administrator.');
        }
        
      } catch (error: any) {
        console.error('Error fetching questions:', error);
        setError(error.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [taskId]);

  // Reset timer when question changes
  useEffect(() => {
    setQuestionStartTime(new Date());
  }, [currentQuestionIndex]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestion?.id] || {
    question_id: currentQuestion?.id || '',
    task_id: taskId || '',
    responses: {},
    media_files: currentQuestion?.media_files?.map(m => m.file_path) || [],
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
        question_id: currentQuestion.id,
        task_id: taskId!,
        responses: currentResponse.responses,
        media_files: currentQuestion.media_files.map(m => m.file_path),
        time_spent_seconds: timeSpent,
        started_at: questionStartTime.toISOString()
      };

      console.log('Submitting response:', responseData);
      
      // Submit response to backend
      await api.createDetailedQuestionResponse(responseData);
      
      console.log('Response submitted successfully');
      
      // Move to next question or complete task
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        // Clear any previous error
        setError(null);
      } else {
        // Task completed
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

  const getProgressPercentage = () => {
    return questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
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
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={`Task: ${taskId?.slice(0, 8)}...`}
                variant="outlined"
              />
              <Chip 
                label={`Order: ${currentQuestion.question_order}`}
                variant="outlined"
                color="primary"
              />
            </Box>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getProgressPercentage()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Media Display Section */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📱 Media Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Compare these {currentQuestion.media_files.length} media items to identify failures:
                </Typography>
                
                {/* Use the new MediaDisplay component */}
                <MediaDisplay 
                  mediaFiles={currentQuestion.media_files}
                  taskId={taskId!}
                />

                {/* Media Summary */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Media Summary:
                  </Typography>
                  <Typography variant="body2">
                    Total files: {currentQuestion.media_files.length} • 
                    Types: {[...new Set(currentQuestion.media_files.map(m => m.media_type))].join(', ')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Question and Choices Section */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ❓ {currentQuestion.question_text}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  For each failure type, first indicate if failures are present, then specify the types.
                </Typography>

                {/* Use FailureTypeSelector component with real data */}
                <FailureTypeSelector
                  choices={currentQuestion.choices}
                  responses={currentResponse.responses}
                  onSelectionChange={handleFailureTypeChange}
                />

                {/* Response Summary */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Selections:
                  </Typography>
                  {Object.entries(currentResponse.responses).length > 0 ? (
                    Object.entries(currentResponse.responses).map(([failureType, selections]) => (
                      selections && selections.length > 0 && (
                        <Typography key={failureType} variant="caption" display="block">
                          <strong>{failureType}:</strong> {selections.join(', ')}
                        </Typography>
                      )
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No selections made yet.
                    </Typography>
                  )}
                  {!isResponseValid() && (
                    <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                      Please make a selection for each failure type.
                    </Typography>
                  )}
                </Box>

                {/* Question Metadata */}
                <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Question ID: {currentQuestion.id} • Status: {currentQuestion.status}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Navigation Controls */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mt: 4,
          p: 3,
          bgcolor: 'grey.50',
          borderRadius: 2
        }}>
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous Question
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentQuestionIndex === questions.length - 1 ? 'Final question' : 'Continue to next question'}
            </Typography>
            {submitting && (
              <Typography variant="caption" color="primary" display="block">
                Submitting response...
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            endIcon={currentQuestionIndex === questions.length - 1 ? <CheckCircle /> : <ArrowForward />}
            onClick={handleSubmitResponse}
            disabled={!isResponseValid() || submitting}
            sx={{ minWidth: 160 }}
          >
            {submitting ? 'Submitting...' : 
             currentQuestionIndex === questions.length - 1 ? 'Complete Task' : 'Next Question'}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LabelingInterface;