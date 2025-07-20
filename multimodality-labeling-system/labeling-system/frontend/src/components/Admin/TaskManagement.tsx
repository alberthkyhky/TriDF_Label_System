import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Alert,
} from '@mui/material';
import { 
  Add
} from '@mui/icons-material';
import { api } from '../../services/api';
import { Task } from '../../types/tasks';
import { TaskWithQuestionsData } from '../../types/createTask';
import { useTaskFormData, defaultTaskFormData } from './formDataHook';
import TaskList from './TaskManagement/TaskList';
import TaskCreationStepper from './TaskManagement/TaskCreationStepper';

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<TaskWithQuestionsData[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { formData, setFormData } = useTaskFormData();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultTaskFormData);
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

  if (loading && !open) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>Loading tasks...</Typography>
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

      <TaskList tasks={tasks} onStatusChange={handleStatusChange} />

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          Create New Task
        </DialogTitle>
        
        <DialogContent sx={{ flex: 1, overflow: 'auto' }}>
          <TaskCreationStepper 
            formData={formData}
            setFormData={setFormData}
            onSuccess={() => {
              setOpen(false);
              resetForm();
              fetchTasks();
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
        
      </Dialog>
    </Box>
  );
};

export default TaskManagement;