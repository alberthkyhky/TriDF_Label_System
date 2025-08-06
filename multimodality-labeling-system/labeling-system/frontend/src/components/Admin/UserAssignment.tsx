// components/Admin/UserAssignment.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Collapse,
  IconButton,
  LinearProgress,
  Divider,
  Stack
} from '@mui/material';
import { Assignment, ExpandMore, ExpandLess, Schedule } from '@mui/icons-material';
import { api } from '../../services/api';
import { TaskWithQuestionsData } from '../../types/createTask';


interface UserAssignmentStats {
  assignment_id: string;
  task_id: string;
  task_title: string;
  completed_labels: number;
  question_range_start: number;
  question_range_end: number;
  is_active: boolean;
}

interface EnhancedUser {
  id: string;
  email: string;
  full_name?: string;
  userRole: 'labeler' | 'admin';
  currentAssignments?: UserAssignmentStats[];
}

const UserAssignment: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskWithQuestionsData[]>([]);
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    task_id: '',
    user_id: '',
    question_range_start: 1,
    question_range_end: 10
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const startTime = performance.now();
      console.log('🔄 Fetching user assignment overview...');
      
      // Use the new optimized endpoint for a single API call
      const overviewData = await api.getUserAssignmentOverview();
      
      console.log('📊 Received overview data:', {
        tasks: overviewData.tasks?.length || 0,
        users: overviewData.users?.length || 0,
        usersWithAssignments: overviewData.users?.filter((u: any) => u.currentAssignments && u.currentAssignments.length > 0).length || 0
      });
      
      // Log detailed assignment data for debugging
      overviewData.users?.forEach((user: any) => {
        if (user.currentAssignments && user.currentAssignments.length > 0) {
          console.log(`👤 User ${user.full_name} has ${user.currentAssignments.length} assignments:`, 
            user.currentAssignments.map((a: any) => `${a.task_title}: ${a.question_range_start}-${a.question_range_end}`)
          );
        }
      });
      
      // Data is already processed by the backend
      setTasks(overviewData.tasks || []);
      setUsers(overviewData.users || []);
      
      const endTime = performance.now();
      console.log(`✅ Fetched user assignment overview in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error('❌ Error fetching user assignment overview:', error);
      setError('Failed to fetch user assignment overview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };


  const handleAssign = async () => {
    if (!formData.task_id || !formData.user_id) {
      setError('Please select both task and user');
      return;
    }

    // Validate assignment data
    if (!formData.question_range_start || !formData.question_range_end || 
        formData.question_range_start <= 0 || formData.question_range_end <= 0 ||
        formData.question_range_start > formData.question_range_end) {
      setError('Please enter a valid question range (start ≤ end, both > 0)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assignmentData = {
        user_id_to_assign: formData.user_id,
        question_range_start: formData.question_range_start,
        question_range_end: formData.question_range_end
      };

      console.log('🔥 Creating assignment:', {
        taskId: formData.task_id,
        userId: formData.user_id,
        userName: users.find(u => u.id === formData.user_id)?.full_name,
        taskTitle: tasks.find(t => t.id === formData.task_id)?.title,
        range: `${formData.question_range_start}-${formData.question_range_end}`,
        assignmentData
      });

      const result = await api.assignTask(formData.task_id, assignmentData);
      console.log('✅ Assignment created successfully:', result);
      
      // Close dialog first
      setOpen(false);
      
      // Reset form data
      setFormData({
        task_id: '',
        user_id: '',
        question_range_start: 1,
        question_range_end: 10
      });
      
      // Small delay to ensure backend has processed the assignment
      setTimeout(async () => {
        console.log('📊 Refreshing assignment data after successful assignment...');
        // Force refresh to avoid any caching issues
        const overviewData = await api.getUserAssignmentOverview(true);
        
        console.log('📊 Forced refresh data:', {
          tasks: overviewData.tasks?.length || 0,
          users: overviewData.users?.length || 0,
          usersWithAssignments: overviewData.users?.filter((u: any) => u.currentAssignments && u.currentAssignments.length > 0).length || 0
        });
        
        setTasks(overviewData.tasks || []);
        setUsers(overviewData.users || []);
        console.log('✅ Assignment data refreshed successfully');
      }, 500);
      
    } catch (error) {
      console.error('❌ Error assigning task:', error);
      setError('Failed to assign task. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for assignment calculations
  const getAssignmentTarget = (assignment: UserAssignmentStats) => {
    // All assignments are now ranges, calculate the range size
    if (assignment.question_range_start && assignment.question_range_end) {
      return assignment.question_range_end - assignment.question_range_start + 1;
    }
    return 0;
  };

  const isAssignmentIncomplete = (assignment: UserAssignmentStats) => {
    const target = getAssignmentTarget(assignment);
    return assignment.completed_labels < target;
  };

  const handleSetFullTask = () => {
    const selectedTask = tasks.find(task => task.id === formData.task_id);
    if (selectedTask) {
      setFormData({
        ...formData,
        question_range_start: 1,
        question_range_end: selectedTask.questions_number
      });
    }
  };

  // Skeleton components for loading state
  const ListItemSkeleton = () => (
    <ListItem>
      <ListItemText
        primary={<Skeleton variant="text" width="70%" height={20} />}
        secondary={<Skeleton variant="text" width="50%" height={16} />}
      />
      <Skeleton variant="rounded" width={60} height={24} />
    </ListItem>
  );

  if (loading) {
    return (
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Task Assignment</Typography>
          <Button 
            variant="contained" 
            startIcon={<Assignment />}
            disabled
          >
            Assign Task to User
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Tasks Card Skeleton */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Tasks
                </Typography>
                <List>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <ListItemSkeleton key={index} />
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Users Card Skeleton */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Users
                </Typography>
                <List>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <ListItemSkeleton key={index} />
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Task Assignment</Typography>
        <Button 
          variant="contained" 
          startIcon={<Assignment />}
          onClick={() => setOpen(true)}
          disabled={tasks.length === 0 || users.length === 0}
        >
          Assign Task to User
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Tasks ({tasks.length})
              </Typography>
              <List dense>
                {tasks.slice(0, 5).map((task) => (
                  <ListItem key={task.id}>
                    <ListItemText
                      primary={task.title}
                      secondary={`${task.questions_number} questions per user`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Users ({users.length})
              </Typography>
              <List dense>
                {users.slice(0, 8).map((user) => {
                  const isExpanded = expandedUsers.has(user.id);
                  const incompleteAssignments = user.currentAssignments?.filter(isAssignmentIncomplete) || [];
                  const totalAssignedQuestions = incompleteAssignments.reduce((sum, a) => sum + getAssignmentTarget(a), 0);
                  const completedAssignedQuestions = incompleteAssignments.reduce((sum, a) => sum + a.completed_labels, 0);
                  
                  return (
                    <React.Fragment key={user.id}>
                      <ListItem 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => toggleUserExpansion(user.id)}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" component="span">
                                {user.full_name || 'Unknown'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Chip 
                                  label={user.userRole} 
                                  size="small" 
                                  color={user.userRole === 'admin' ? 'primary' : 'secondary'}
                                />
                                {incompleteAssignments.length > 0 && (
                                  <Chip 
                                    label={`${incompleteAssignments.length} incomplete`}
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box component="span">
                              <Typography variant="body2" color="text.secondary" component={"div"}>
                                {user.email}
                              </Typography>
                              {incompleteAssignments.length > 0 ? (
                                <Typography variant="caption" color="primary">
                                  {completedAssignedQuestions}/{totalAssignedQuestions} questions completed across {incompleteAssignments.length} task{incompleteAssignments.length !== 1 ? 's' : ''}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="success.main">
                                  No incomplete assignments
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <IconButton size="small">
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </ListItem>
                      
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
                          {incompleteAssignments.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Schedule fontSize="small" />
                                Incomplete Assignments
                              </Typography>
                              {incompleteAssignments.map((assignment) => {
                                const assignmentTarget = getAssignmentTarget(assignment);
                                const progress = assignmentTarget > 0 ? (assignment.completed_labels / assignmentTarget) * 100 : 0;
                                
                                return (
                                  <Box key={assignment.assignment_id} sx={{ mb: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                          {assignment.task_title}
                                        </Typography>
                                        {!assignment.is_active && (
                                          <Chip 
                                            label="Inactive" 
                                            size="small" 
                                            color="warning" 
                                            variant="outlined"
                                            sx={{ fontSize: '0.6rem', height: '16px' }}
                                          />
                                        )}
                                      </Box>
                                      <Typography 
                                        variant="caption" 
                                        color={progress === 0 ? "error" : "text.secondary"}
                                        sx={{ fontWeight: progress === 0 ? 600 : 400 }}
                                      >
                                        {assignment.completed_labels}/{assignmentTarget}
                                      </Typography>
                                    </Box>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={progress}
                                      color={progress === 0 ? "error" : progress > 50 ? "success" : "warning"}
                                      sx={{ height: 4, borderRadius: 2 }}
                                    />
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                          
                          {incompleteAssignments.length === 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              All assignments completed or no assignments found
                            </Typography>
                          )}
                        </Box>
                        <Divider />
                      </Collapse>
                    </React.Fragment>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Task to User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            You can assign tasks to both labelers and admins. Admins can switch to labeler view to complete assigned tasks.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Select Task</InputLabel>
            <Select
              value={formData.task_id}
              onChange={(e) => setFormData({...formData, task_id: e.target.value})}
            >
              {tasks.map((task) => (
                <MenuItem key={task.id} value={task.id}>
                  {task.title} ({task.questions_number} questions)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select User</InputLabel>
            <Select
              value={formData.user_id}
              onChange={(e) => setFormData({...formData, user_id: e.target.value})}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Box>
                      <Typography variant="body1">
                        {user.full_name || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                    <Chip 
                      label={user.userRole} 
                      size="small" 
                      color={user.userRole === 'admin' ? 'primary' : 'secondary'}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>


          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TextField
                label="Start Question"
                type="number"
                value={formData.question_range_start}
                onChange={(e) => setFormData({...formData, question_range_start: parseInt(e.target.value) || 1})}
                inputProps={{ min: 1 }}
                sx={{ flex: 1 }}
              />
              <Typography variant="body1" sx={{ px: 1 }}>~</Typography>
              <TextField
                label="End Question"
                type="number"
                value={formData.question_range_end}
                onChange={(e) => setFormData({...formData, question_range_end: parseInt(e.target.value) || 10})}
                inputProps={{ min: 1 }}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleSetFullTask}
                disabled={!formData.task_id}
                size="small"
              >
                Full Task
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Assign questions from {formData.question_range_start} to {formData.question_range_end}
              {formData.question_range_end >= formData.question_range_start && 
                ` (${formData.question_range_end - formData.question_range_start + 1} questions)`
              }
              {formData.task_id && (
                <> • Task has {tasks.find(t => t.id === formData.task_id)?.questions_number || 0} questions total</>
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAssign} 
            variant="contained"
            disabled={loading || !formData.task_id || !formData.user_id}
          >
            {loading ? 'Assigning...' : 'Assign Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserAssignment;