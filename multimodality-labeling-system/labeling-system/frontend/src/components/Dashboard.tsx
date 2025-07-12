import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Fab,
  Alert
} from '@mui/material';
import { Add, AccountCircle, ExitToApp, Assignment, Analytics } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Task, TaskAssignment, LabelClass } from '../types/tasks';
import TaskCreateDialog from '../components/Tasks/TaskCreateDialog';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, assignmentsData, labelClassesData] = await Promise.all([
        api.getTasks(),
        api.getMyAssignments(),
        api.getLabelClasses(),
      ]);
      setTasks(tasksData);
      setAssignments(assignmentsData);
      setLabelClasses(labelClassesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleMenuClose();
  };

  const getProgressPercentage = (assignment: TaskAssignment) => {
    return Math.round((assignment.completed_labels / assignment.target_labels) * 100);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🎯 Labeling System
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              Welcome, {user?.full_name || user?.email}
            </Typography>
            <Chip 
              label={user?.role} 
              color={isAdmin ? 'secondary' : 'primary'} 
              size="small" 
            />
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* User Stats */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Your Statistics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    Active Assignments: <strong>{assignments.length}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Total Labels: <strong>
                      {assignments.reduce((sum, a) => sum + a.completed_labels, 0)}
                    </strong>
                  </Typography>
                  <Typography variant="body2">
                    Average Progress: <strong>
                      {assignments.length > 0 
                        ? Math.round(assignments.reduce((sum, a) => sum + getProgressPercentage(a), 0) / assignments.length)
                        : 0}%
                    </strong>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🚀 Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    startIcon={<Assignment />}
                    onClick={() => {/* Navigate to labeling */}}
                  >
                    Start Labeling
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Analytics />}
                    onClick={() => {/* Navigate to stats */}}
                  >
                    View Analytics
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="outlined" 
                      color="secondary"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      Create Task
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Assignments */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h5" gutterBottom>
              📋 Your Active Assignments
            </Typography>
            {assignments.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography color="textSecondary" align="center">
                    No active assignments. Contact your admin to get started! 
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {assignments.map((assignment) => {
                  const task = tasks.find(t => t.id === assignment.task_id);
                  const progress = getProgressPercentage(assignment);
                  
                  return (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={assignment.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {task?.title || 'Loading...'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" paragraph>
                            {task?.description}
                          </Typography>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" gutterBottom>
                              Progress: {assignment.completed_labels} / {assignment.target_labels}
                            </Typography>
                            <Box sx={{ 
                              width: '100%', 
                              height: 8, 
                              bgcolor: '#e0e0e0', 
                              borderRadius: 1,
                              overflow: 'hidden'
                            }}>
                              <Box sx={{
                                width: `${progress}%`,
                                height: '100%',
                                bgcolor: progress >= 100 ? '#4caf50' : '#667eea',
                                transition: 'width 0.3s ease'
                              }} />
                            </Box>
                            <Typography variant="caption" color="textSecondary">
                              {progress}% complete
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {assignment.assigned_classes.map((classId) => {
                              const labelClass = labelClasses.find(lc => lc.id === classId);
                              return (
                                <Chip 
                                  key={classId}
                                  label={labelClass?.name || classId}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: labelClass?.color_hex || '#667eea',
                                    color: 'white'
                                  }}
                                />
                              );
                            })}
                          </Box>

                          <Button 
                            variant="contained" 
                            fullWidth
                            disabled={progress >= 100}
                            onClick={() => {/* Navigate to questions */}}
                          >
                            {progress >= 100 ? 'Completed ✅' : 'Continue Labeling →'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Grid>

          {/* Admin Section */}
          {isAdmin && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="h5" gutterBottom>
                🔧 Admin: All Tasks
              </Typography>
              <Grid container spacing={2}>
                {tasks.map((task) => (
                  <Grid size={{ xs: 12, md: 6 }} key={task.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {task.title}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" paragraph>
                              {task.description}
                            </Typography>
                            <Chip 
                              label={task.status} 
                              color={task.status === 'active' ? 'success' : 'default'}
                              size="small" 
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>

        {/* Admin FAB */}
        {isAdmin && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setCreateDialogOpen(true)}
          >
            <Add />
          </Fab>
        )}
      </Container>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <AccountCircle sx={{ mr: 1 }} /> Profile
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ExitToApp sx={{ mr: 1 }} /> Sign Out
        </MenuItem>
      </Menu>

      {/* Task Creation Dialog */}
      <TaskCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onTaskCreated={loadData}
        labelClasses={labelClasses}
      />
    </>
  );
};

export default Dashboard;