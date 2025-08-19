// 7. Enhanced components/Dashboard.tsx - For labelers
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  LinearProgress, 
  Button, 
  Chip,
  AppBar,
  Toolbar,
  Alert
} from '@mui/material';
import { PlayArrow, CheckCircle } from '@mui/icons-material';
import { Skeleton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { TaskAssignment } from '../types/tasks';
import { useNavigate } from 'react-router-dom';
import ViewModeSwitch from './ui/ViewModeSwitch';

interface EnhancedTaskAssignment extends TaskAssignment {
  task_title?: string;
}

const Dashboard: React.FC = () => {
  const { user, signOut, viewMode } = useAuth();
  const [assignments, setAssignments] = useState<EnhancedTaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to determine if assignment is completed
  const getIsAssignmentCompleted = (assignment: EnhancedTaskAssignment) => {
    // All assignments are now ranges, calculate completion based on range size
    const rangeSize = assignment.question_range_end && assignment.question_range_start 
      ? assignment.question_range_end - assignment.question_range_start + 1 
      : 0;
    return assignment.completed_labels >= rangeSize;
  };

  // Helper function to get assignment target display
  const getAssignmentTarget = (assignment: EnhancedTaskAssignment) => {
    // All assignments use range logic now
    return assignment.question_range_end && assignment.question_range_start 
      ? assignment.question_range_end - assignment.question_range_start + 1 
      : 0;
  };

  const fetchAssignments = useCallback(async () => {
    try {
      setError(null);
      console.log('🚀 Fetching assignments...');
      
      const assignmentData = await api.getMyAssignments();
      console.log(`📊 Retrieved ${assignmentData.length} assignments`);
      
      // Show assignments immediately with basic info
      const basicAssignments = assignmentData.map(assignment => ({
        ...assignment,
        task_title: undefined // Will be loaded progressively
      }));
      setAssignments(basicAssignments);
      setLoading(false); // Show UI immediately
      
      // Progressive loading: Load task titles in batches to avoid overwhelming server
      const BATCH_SIZE = 3; // Process 3 tasks at a time
      const batches = [];
      for (let i = 0; i < assignmentData.length; i += BATCH_SIZE) {
        batches.push(assignmentData.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} assignments each`);
      
      for (const [batchIndex, batch] of batches.entries()) {
        try {
          console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length}`);
          
          // Add delay between batches to prevent overwhelming the server
          if (batchIndex > 0) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
          }
          
          const batchPromises = batch.map(async (assignment) => {
            try {
              // Use lightweight task fetch - only get what we need
              const task = await api.getTask(assignment.task_id);
              return {
                assignmentId: assignment.id,
                taskTitle: task.title
              };
            } catch (taskError) {
              console.warn(`⚠️ Failed to load task title for ${assignment.task_id}:`, taskError);
              return {
                assignmentId: assignment.id,
                taskTitle: `Task #${assignment.task_id.slice(0, 8)}`
              };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          
          // Update assignments with task titles from this batch
          setAssignments(prevAssignments => 
            prevAssignments.map(assignment => {
              const batchResult = batchResults.find(result => result.assignmentId === assignment.id);
              return batchResult 
                ? { ...assignment, task_title: batchResult.taskTitle }
                : assignment;
            })
          );
          
        } catch (batchError) {
          console.error(`❌ Error processing batch ${batchIndex + 1}:`, batchError);
        }
      }
      
      console.log('✅ All assignment titles loaded');
      
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
      setError('Failed to fetch your assignments. Please try again.');
      setLoading(false);
    }
  }, []);

  // Retry function for failed requests
  const retryFetch = useCallback(async () => {
    if (retryCount < 3) {
      console.log(`🔄 Retrying fetch (attempt ${retryCount + 1}/3)...`);
      setRetryCount(prev => prev + 1);
      setLoading(true);
      setError(null);
      
      // Add exponential backoff delay
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      
      await fetchAssignments();
    } else {
      console.error('💀 Max retry attempts reached');
      setError('Failed to load assignments after multiple attempts. Please refresh the page.');
    }
  }, [retryCount, fetchAssignments]);

  const calculateProgress = (assignment: EnhancedTaskAssignment) => {
    const completed = assignment.completed_labels || 0;
    const total = getAssignmentTarget(assignment) || 1;
    return Math.min((completed / total) * 100, 100);
  };

  const handleHomeClick = () => {
    // Navigate to home dashboard based on user role and view mode
    if (user?.role === 'admin') {
      navigate(viewMode === 'admin' ? '/admin' : '/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Skeleton card component for loading state
  const AssignmentCardSkeleton = () => (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 4 }} />
          </Box>

          <Skeleton variant="rounded" width={60} height={24} sx={{ mb: 2 }} />

          <Skeleton variant="text" width="50%" height={16} sx={{ mb: 2 }} />

          <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1 }} />
        </CardContent>
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        {/* Top Navigation */}
        <AppBar position="static">
          <Toolbar>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              onClick={handleHomeClick}
            >
              Labeler Dashboard - {user?.full_name || user?.email}
            </Typography>
            <Button color="inherit" onClick={signOut}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Assigned Tasks
          </Typography>
          
          <Grid container spacing={3}>
            {/* Show 6 skeleton cards to simulate typical assignment load */}
            {Array.from({ length: 6 }).map((_, index) => (
              <AssignmentCardSkeleton key={index} />
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Navigation */}
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={handleHomeClick}
          >
            Labeler Dashboard - {user?.full_name || user?.email}
          </Typography>
          <ViewModeSwitch />
          <Button color="inherit" onClick={signOut} sx={{ ml: 2 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Assigned Tasks
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={retryFetch}
                disabled={loading}
              >
                {loading ? 'Retrying...' : 'Retry'}
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {assignments.map((assignment) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={assignment.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {assignment.task_title ? (
                      assignment.task_title
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="text" width="60%" height={24} />
                        <Typography variant="caption" color="text.secondary">
                          Loading...
                        </Typography>
                      </Box>
                    )}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Progress: {assignment.completed_labels || 0} / {getAssignmentTarget(assignment)}
                      {assignment.question_range_start && assignment.question_range_end && 
                        ` (Questions ${assignment.question_range_start}-${assignment.question_range_end})`
                      }
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateProgress(assignment)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={assignment.is_active ? 'Active' : 'Inactive'}
                      color={assignment.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                  </Typography>

                  <Button 
                    variant="contained" 
                    fullWidth
                    disabled={!assignment.is_active || getIsAssignmentCompleted(assignment)}
                    startIcon={getIsAssignmentCompleted(assignment) ? <CheckCircle /> : <PlayArrow />}
                    onClick={() => {
                      // Navigate to labeling interface - you'll implement this later
                      navigate(`/task/${assignment.task_id}`);
                    }}
                  >
                    {getIsAssignmentCompleted(assignment)
                      ? 'Completed' 
                      : 'Start Labeling'
                    }
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {assignments.length === 0 && !error && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tasks assigned yet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Contact your administrator to get assigned to labeling tasks.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;