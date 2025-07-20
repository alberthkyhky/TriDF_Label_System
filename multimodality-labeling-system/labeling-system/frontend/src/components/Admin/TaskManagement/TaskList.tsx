import React from 'react';
import { 
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Chip
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { TaskWithQuestionsData } from '../../../types/createTask';

interface TaskListProps {
  tasks: TaskWithQuestionsData[];
  loading?: boolean;
  onRefresh?: () => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, loading, onRefresh, onStatusChange }) => {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  if (tasks.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
        No tasks created yet. Click "Create New Task" to get started.
      </Typography>
    );
  }

  return (
    <List>
      {tasks.map((task) => (
        <ListItem key={task.id} divider>
          <ListItemText
            disableTypography
            primary={
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {task.title}
                <Chip 
                  label={task.status} 
                  color={getStatusColor(task.status) as any}
                  size="small"
                />
              </Box>
            }
            secondary={
              <Box component="span">
                <Typography variant="body2" color="text.secondary">
                  {task.description || 'No description'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {task.questions_number} questions • Created: {new Date(task.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            }
          />
          <FormControl size="small" sx={{ minWidth: 100, mr: 1 }}>
            <Select
              value={task.status}
              onChange={(e) => onStatusChange?.(task.id, e.target.value)}
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
        </ListItem>
      ))}
    </List>
  );
};

// Memoize TaskList to prevent unnecessary re-renders when task data hasn't changed
export default React.memo(TaskList, (prevProps, nextProps) => {
  // Compare tasks array by length and task IDs
  if (prevProps.tasks.length !== nextProps.tasks.length) {
    return false;
  }
  
  for (let i = 0; i < prevProps.tasks.length; i++) {
    const prevTask = prevProps.tasks[i];
    const nextTask = nextProps.tasks[i];
    
    // Compare key properties that affect rendering
    if (prevTask.id !== nextTask.id ||
        prevTask.title !== nextTask.title ||
        prevTask.status !== nextTask.status ||
        prevTask.description !== nextTask.description ||
        prevTask.questions_number !== nextTask.questions_number ||
        prevTask.created_at !== nextTask.created_at) {
      return false;
    }
  }
  
  // Compare other props
  if (prevProps.loading !== nextProps.loading ||
      prevProps.onRefresh !== nextProps.onRefresh ||
      prevProps.onStatusChange !== nextProps.onStatusChange) {
    return false;
  }
  
  return true; // Props are equal, skip re-render
});