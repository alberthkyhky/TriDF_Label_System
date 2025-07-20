import React, { useEffect, useState, useMemo } from 'react';
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
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import { PlayArrow, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { TaskWithQuestionsData } from '../../types/createTask';

const TaskIntroduction: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [task, setTask] = useState<TaskWithQuestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setError('No task ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch enhanced task data from backend
        const taskData = await api.getTaskWithQuestions(taskId);
        setTask(taskData);
        
        console.log('Fetched task data:', taskData);
        
      } catch (error: any) {
        console.error('Error fetching task:', error);
        setError(error.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleStartLabeling = () => {
    navigate(`/task/${taskId}/label`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Memoize expensive calculations to prevent re-computation on every render
  // Note: These need to be called before any early returns
  const failureCategories = useMemo(() => 
    task ? Object.entries(task.question_template.choices || {}) : [], 
    [task?.question_template.choices]
  );

  const totalMediaFiles = useMemo(() => 
    task ? task.media_config.num_images + task.media_config.num_videos + task.media_config.num_audios : 0,
    [task?.media_config]
  );

  const placeholderExamples = useMemo(() => {
    if (!task) return [];
    return [
      ...Array.from({ length: task.media_config.num_images }, (_, i) => ({ type: 'image', index: i })),
      ...Array.from({ length: task.media_config.num_videos }, (_, i) => ({ type: 'video', index: i })),
      ...Array.from({ length: task.media_config.num_audios }, (_, i) => ({ type: 'audio', index: i }))
    ];
  }, [task?.media_config]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">Loading task...</Typography>
        <Typography variant="body2" color="text.secondary">
          Fetching task details and question information
        </Typography>
      </Box>
    );
  }

  console.log(task)
  console.log(error)

  // Error state
  if (error || !task) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Task not found. Please return to your dashboard.'}
        </Alert>
        <Button 
          variant="contained" 
          onClick={handleBackToDashboard}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
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
            onClick={handleBackToDashboard}
            sx={{ mr: 2 }}
          >
            Dashboard
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Introduction - {user?.full_name || user?.email}
          </Typography>
          <Button color="inherit" onClick={signOut}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Task Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`Task ID: ${task.id}`} 
              variant="outlined" 
            />
            <Chip 
              label={`Status: ${task.status}`} 
              color={task.status === 'active' ? 'success' : 'default'}
              variant="outlined" 
            />
            <Chip 
              label={`${task.questions_number} Questions Available`} 
              color="primary"
              variant="outlined" 
            />
          </Box>
          <Typography variant="h6" color="text.secondary" paragraph>
            {task.description}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Instructions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  📋 Instructions
                </Typography>
                <Typography variant="body1" paragraph>
                  {task.instructions || 'Please review the media items and identify any failures according to the categories provided.'}
                </Typography>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Task Details:
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" paragraph>
                    <strong>Question:</strong> {task.question_template.question_text}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Media per question:</strong> {task.media_config.num_images} images, {task.media_config.num_videos} videos, {task.media_config.num_audios} audio files
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Total questions in task:</strong> {task.questions_number}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Required agreements per question:</strong> {task.required_agreements}
                  </Typography>
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  What you'll be doing:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2" paragraph>
                    Review {totalMediaFiles} media items per question
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Answer: "{task.question_template.question_text}"
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Select appropriate failure types from {failureCategories.length} categories
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Use the Back button to review previous questions if needed
                  </Typography>
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Failure Categories:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {failureCategories.map(([key, choice], index) => {
                    // Color mapping for different categories
                    const colors = ['error', 'warning', 'info', 'success', 'primary'] as const;
                    const color = colors[index % colors.length];
                    
                    return (
                      <Chip 
                        key={key}
                        label={`${key}: ${choice.text} (${choice.options.length} options)`}
                        color={color}
                        variant="outlined"
                        sx={{ mb: 1, mr: 1 }}
                      />
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Example Media */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  📸 Example Media
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Here's an example of the type of media you'll be analyzing:
                </Typography>

                {/* Example Media Display */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2, 
                  alignItems: 'center',
                  bgcolor: 'grey.100',
                  p: 3,
                  borderRadius: 2
                }}>
                  {task.example_media && task.example_media.length > 0 ? (
                    task.example_media.map((media: string, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          width: '100%',
                          height: 120,
                          bgcolor: 'grey.300',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed',
                          borderColor: 'grey.400'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {media} (Example)
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    // Generate placeholder examples based on media config
                    <>
                      {placeholderExamples.map((example) => {
                        const icons = { image: '📷', video: '🎥', audio: '🎵' };
                        const labels = { image: 'Image', video: 'Video', audio: 'Audio' };
                        
                        return (
                          <Box
                            key={`${example.type}-${example.index}`}
                            sx={{
                              width: '100%',
                              height: 120,
                              bgcolor: 'grey.300',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px dashed',
                              borderColor: 'grey.400'
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {icons[example.type as keyof typeof icons]} Example {labels[example.type as keyof typeof labels]} {example.index + 1}
                            </Typography>
                          </Box>
                        );
                      })}
                    </>
                  )}
                </Box>

                <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center' }}>
                  You'll analyze similar media items to identify various failure types
                </Typography>

                {/* Media Configuration Info */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Media Configuration:
                  </Typography>
                  <Typography variant="body2">
                    Each question will contain {totalMediaFiles} media files for comparison and analysis.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Task Status and Start Button */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
          {task.status !== 'active' && (
            <Alert severity="warning" sx={{ mb: 2, maxWidth: 600 }}>
              This task is currently {task.status}. You may not be able to complete labeling at this time.
            </Alert>
          )}
          
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartLabeling}
            disabled={task.status !== 'active'}
            sx={{ 
              px: 4, 
              py: 2, 
              fontSize: '1.2rem',
              minWidth: 200
            }}
          >
            Start Labeling
          </Button>

          {task.questions_number === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No questions have been generated for this task yet. Please contact your administrator.
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default TaskIntroduction;