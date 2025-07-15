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
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { api } from '../../services/api';
import { TaskWithQuestionsData } from '../../types/createTask';

interface LabelClass {
  id: string;
  name: string;
  description?: string;
}

const UserAssignment: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskWithQuestionsData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>([]);
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
      setLoading(true);
      const [tasksData, usersData, labelClassesData] = await Promise.all([
        api.getTasks(),
        api.getUsersByRole('labeler'),
        api.getLabelClasses().catch(() => []) // Fallback to empty array if endpoint doesn't exist
      ]);
      setTasks(tasksData.filter(task => task.status === 'active'));
      setUsers(usersData);
      setLabelClasses(labelClassesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignedClassesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      assigned_classes: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleAssign = async () => {
    if (!formData.task_id || !formData.user_id) {
      setError('Please select both task and user');
      return;
    }

    // If no label classes are available, use a default one
    const assignedClasses = formData.assigned_classes.length > 0 
      ? formData.assigned_classes 
      : ['general']; // Fallback to a default class

    setLoading(true);
    setError(null);

    try {
      // Fix the field name: user_id -> user_id_to_assign
      await api.assignTask(formData.task_id, {
        user_id_to_assign: formData.user_id, // ← Fixed field name
        assigned_classes: assignedClasses,
        target_labels: formData.target_labels
      });
      
      setOpen(false);
      setFormData({
        task_id: '',
        user_id: '',
        target_labels: 10,
        assigned_classes: []
      });
      
      // Show success message
      setError(null);
      
    } catch (error) {
      console.error('Error assigning task:', error);
      setError('Failed to assign task. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>Loading assignments...</Typography>
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
                  {user.full_name || 'Unknown'} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Label Classes Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Assigned Label Classes</InputLabel>
            <Select
              multiple
              value={formData.assigned_classes}
              onChange={handleAssignedClassesChange}
              input={<OutlinedInput label="Assigned Label Classes" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {labelClasses.length > 0 ? (
                labelClasses.map((labelClass) => (
                  <MenuItem key={labelClass.id} value={labelClass.name}>
                    {labelClass.name}
                  </MenuItem>
                ))
              ) : (
                // Fallback options if no label classes are loaded
                ['general', 'person', 'vehicle', 'animal', 'object'].map((className) => (
                  <MenuItem key={className} value={className}>
                    {className}
                  </MenuItem>
                ))
              )}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {labelClasses.length === 0 && 'Using default label classes. Create custom ones in Task Management.'}
              {formData.assigned_classes.length === 0 && 'At least one class must be selected.'}
            </Typography>
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