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
  Alert,
  Chip
} from '@mui/material';
import { PlayArrow, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getFakeTask } from '../../services/fakeData';
import { Task } from '../../types/labeling';

const TaskIntroduction: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskId) {
      // Simulate API call delay
      setTimeout(() => {
        const taskData = getFakeTask(taskId);
        setTask(taskData);
        setLoading(false);
      }, 500);
    }
  }, [taskId]);

  const handleStartLabeling = () => {
    navigate(`/task/${taskId}/label`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading task...</Typography>
      </Box>
    );
  }

  if (!task) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Task not found. Please return to your dashboard.
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
          <Chip 
            label={`Task ID: ${task.id}`} 
            variant="outlined" 
            sx={{ mb: 2 }}
          />
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
                  {task.instructions}
                </Typography>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  What you'll be doing:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2" paragraph>
                    Review 2-3 media items (images, videos, or audio) per question
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Identify failures across three categories: A-type (Structural), B-type (Functional), and C-type (Quality)
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Select multiple options if you see multiple failure types
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Use the Back button to review previous questions if needed
                  </Typography>
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Failure Types:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label="A-type: Structural (Cracks, Corrosion, Deformation)"
                    color="error"
                    variant="outlined"
                    sx={{ mb: 1, mr: 1 }}
                  />
                  <Chip 
                    label="B-type: Functional (Electrical, Mechanical, Software)"
                    color="warning"
                    variant="outlined"
                    sx={{ mb: 1, mr: 1 }}
                  />
                  <Chip 
                    label="C-type: Quality (Safety, Performance, Aesthetic)"
                    color="info"
                    variant="outlined"
                    sx={{ mb: 1, mr: 1 }}
                  />
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
                  {task.example_media?.map((media: string, index: number) => (
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
                  ))}
                  
                  {/* Placeholder if no example media */}
                  {(!task.example_media || task.example_media.length === 0) && (
                    <>
                      <Box
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
                          Example Image 1
                        </Typography>
                      </Box>
                      <Box
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
                          Example Video 1
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>

                <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center' }}>
                  You'll analyze similar media items to identify various failure types
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Start Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartLabeling}
            sx={{ 
              px: 4, 
              py: 2, 
              fontSize: '1.2rem',
              minWidth: 200
            }}
          >
            Start Labeling
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default TaskIntroduction;