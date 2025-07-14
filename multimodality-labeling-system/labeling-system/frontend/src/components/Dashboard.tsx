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
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { TaskAssignment } from '../types/tasks';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setError(null);
      const data = await api.getMyAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch your assignments');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (assignment: TaskAssignment) => {
    const completed = assignment.completed_labels || 0;
    const total = assignment.target_labels || 1;
    return Math.min((completed / total) * 100, 100);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading your tasks...</Typography>
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
          <Button color="inherit" onClick={signOut}>
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
                    Task #{assignment.task_id.slice(0, 8)}
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