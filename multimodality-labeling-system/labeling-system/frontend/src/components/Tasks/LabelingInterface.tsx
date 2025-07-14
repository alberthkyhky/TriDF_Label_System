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
  Chip
} from '@mui/material';
import { ArrowBack, ArrowForward, CheckCircle, NavigateBefore } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getFakeQuestions } from '../../services/fakeData';
import { Question, QuestionResponse } from '../../types/labeling';
import FailureTypeSelector from './FailureTypeSelector';

const LabelingInterface: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (taskId) {
      // Simulate API call
      setTimeout(() => {
        const questionsData = getFakeQuestions(taskId);
        setQuestions(questionsData);
        setLoading(false);
      }, 500);
    }
  }, [taskId]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses[currentQuestion?.id] || {
    question_id: currentQuestion?.id || '',
    task_id: taskId || '',
    responses: {},
    media_files: currentQuestion?.media_files || []
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
    
    // Simulate API call to submit response
    try {
      console.log('Submitting response:', currentResponse);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Move to next question or complete task
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Task completed
        alert('Task completed! Redirecting to dashboard...');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleBackToTask = () => {
    navigate(`/task/${taskId}`);
  };

  const getProgressPercentage = () => {
    return questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  };

  const isResponseValid = () => {
    // Check if at least one failure type has a selection
    return Object.values(currentResponse.responses).some(
      selections => selections && selections.length > 0
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading questions...</Typography>
      </Box>
    );
  }

  if (!currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          No questions found for this task.
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
        {/* Progress Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Typography>
            <Chip 
              label={`Task: ${taskId?.slice(0, 8)}...`}
              variant="outlined"
            />
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
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {currentQuestion.media_files.map((mediaFile: string, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        height: 160,
                        bgcolor: 'grey.100',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        position: 'relative'
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                          {mediaFile}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {mediaFile.includes('.jpg') || mediaFile.includes('.png') ? 'Image' :
                           mediaFile.includes('.mp4') || mediaFile.includes('.avi') ? 'Video' :
                           mediaFile.includes('.wav') || mediaFile.includes('.mp3') ? 'Audio' : 'Media'}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`Item ${index + 1}`}
                        size="small"
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      />
                    </Box>
                  ))}
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

                {/* Import and use FailureTypeSelector component */}
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
                  {Object.entries(currentResponse.responses).map(([failureType, selections]) => (
                    selections && selections.length > 0 && (
                      <Typography key={failureType} variant="caption" display="block">
                        <strong>{failureType}:</strong> {selections.join(', ')}
                      </Typography>
                    )
                  ))}
                  {!isResponseValid() && (
                    <Typography variant="caption" color="error">
                      Please make a selection for each failure type.
                    </Typography>
                  )}
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