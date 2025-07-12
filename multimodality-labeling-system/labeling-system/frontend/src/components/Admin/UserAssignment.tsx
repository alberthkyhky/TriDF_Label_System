// 5. components/Admin/UserAssignment.tsx
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
  CardContent
} from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { api } from '../../services/api';
import { Task, TaskAssignment } from '../../types/tasks';

const UserAssignment: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    task_id: '',
    user_id: '',
    target_labels: 10,
    assigned_classes: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [tasksData, usersData] = await Promise.all([
        api.getTasks(),
        api.getUsersByRole('labeler')
      ]);
      setTasks(tasksData.filter(task => task.status === 'active'));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    }
  };

  const handleAssign = async () => {
    if (!formData.task_id || !formData.user_id) {
      setError('Please select both task and user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.assignTask(formData.task_id, {
        user_id: formData.user_id,
        assigned_classes: formData.assigned_classes,
        target_labels: formData.target_labels
      });
      
      setOpen(false);
      setFormData({
        task_id: '',
        user_id: '',
        target_labels: 10,
        assigned_classes: []
      });
      
      // Could refresh assignments here if you have an endpoint
    } catch (error) {
      console.error('Error assigning task:', error);
      setError('Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

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
        <Grid size={{xs: 12, md: 6}}>
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
                      secondary={`${task.questions_per_user} questions per user`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs: 12, md: 6}}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Labelers ({users.length})
              </Typography>
              <List dense>
                {users.slice(0, 5).map((user) => (
                  <ListItem key={user.id}>
                    <ListItemText
                      primary={user.full_name || 'Unknown'}
                      secondary={user.email}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Task to User</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Select Task</InputLabel>
            <Select
              value={formData.task_id}
              onChange={(e) => setFormData({...formData, task_id: e.target.value})}
            >
              {tasks.map((task) => (
                <MenuItem key={task.id} value={task.id}>
                  {task.title} ({task.questions_per_user} questions)
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
                  {user.full_name || 'Unknown'} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Target Labels"
            type="number"
            value={formData.target_labels}
            onChange={(e) => setFormData({...formData, target_labels: parseInt(e.target.value) || 10})}
            sx={{ mb: 2 }}
            inputProps={{ min: 1 }}
            helperText="Number of labels this user should complete"
          />
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

