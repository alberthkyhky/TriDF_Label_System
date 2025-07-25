// 7. Enhanced components/Dashboard.tsx - For labelers
import React, { useEffect, useState } from 'react';
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
  const { user, signOut } = useAuth();
  const [assignments, setAssignments] = useState<EnhancedTaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setError(null);
      const assignmentData = await api.getMyAssignments();
      
      // Fetch task details for each assignment to get task titles
      const enhancedAssignments = await Promise.all(
        assignmentData.map(async (assignment) => {
          try {
            const task = await api.getTask(assignment.task_id);
            return {
              ...assignment,
              task_title: task.title
            };
          } catch (taskError) {
            console.error(`Error fetching task ${assignment.task_id}:`, taskError);
            return {
              ...assignment,
              task_title: undefined
            };
          }
        })
      );
      
      setAssignments(enhancedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch your assignments');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (assignment: EnhancedTaskAssignment) => {
    const completed = assignment.completed_labels || 0;
    const total = assignment.target_labels || 1;
    return Math.min((completed / total) * 100, 100);
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
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {assignments.map((assignment) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={assignment.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {assignment.task_title || `Task #${assignment.task_id.slice(0, 8)}`}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Progress: {assignment.completed_labels || 0} / {assignment.target_labels}
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
                    disabled={!assignment.is_active || assignment.completed_labels >= assignment.target_labels}
                    startIcon={assignment.completed_labels >= assignment.target_labels ? <CheckCircle /> : <PlayArrow />}
                    onClick={() => {
                      // Navigate to labeling interface - you'll implement this later
                      navigate(`/task/${assignment.task_id}`);
                    }}
                  >
                    {assignment.completed_labels >= assignment.target_labels 
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