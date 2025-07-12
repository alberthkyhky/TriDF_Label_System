// 4. components/Admin/TaskManagement.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { api } from '../../services/api';
import { Task } from '../../types/tasks';

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions_per_user: 10,
    required_agreements: 1
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setError(null);
      const data = await api.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await api.createTask(formData);
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        questions_per_user: 10,
        required_agreements: 1
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await api.updateTask(taskId, { status: status as Task['status'] });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Tasks ({tasks.length})</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Create New Task
        </Button>
      </Box>

      <List>
        {tasks.map((task) => (
          <ListItem key={task.id} divider>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {task.title}
                  <Chip 
                    label={task.status} 
                    color={getStatusColor(task.status) as any}
                    size="small"
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {task.description || 'No description'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.questions_per_user} questions per user • Created: {new Date(task.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <FormControl size="small" sx={{ minWidth: 100, mr: 1 }}>
                <Select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
              <IconButton size="small">
                <Edit />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {tasks.length === 0 && !error && (
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          No tasks created yet. Click "Create New Task" to get started.
        </Typography>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            sx={{ mb: 2, mt: 1 }}
            required
          />
          
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Questions per User"
            type="number"
            value={formData.questions_per_user}
            onChange={(e) => setFormData({...formData, questions_per_user: parseInt(e.target.value) || 10})}
            sx={{ mb: 2 }}
            inputProps={{ min: 1 }}
          />

          <TextField
            fullWidth
            label="Required Agreements"
            type="number"
            value={formData.required_agreements}
            onChange={(e) => setFormData({...formData, required_agreements: parseInt(e.target.value) || 1})}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formData.title.trim()}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskManagement;