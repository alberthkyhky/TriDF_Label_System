import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { api } from '../../services/api';
import { LabelClass } from '../../types/tasks';

interface Props {
  open: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  labelClasses: LabelClass[];
  onDuplicateError?: (taskName: string) => void;
}

const TaskCreateDialog: React.FC<Props> = ({ open, onClose, onTaskCreated, labelClasses, onDuplicateError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rule_description: '',
    questions_per_user: 100,
    required_agreements: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.createTask(formData);
      onTaskCreated();
      onClose();
      setFormData({
        title: '',
        description: '',
        rule_description: '',
        questions_per_user: 100,
        required_agreements: 1,
      });
    } catch (err: any) {
      // Check if it's a duplicate name error
      if (err.message && err.message.includes('already exists')) {
        // Close dialog and show popup alert if handler is provided
        if (onDuplicateError) {
          onClose();
          onDuplicateError(formData.title);
        } else {
          // Fallback to inline error if no handler provided
          setError(`⚠️ Task Name Already Exists\n\nA task with the name "${formData.title}" already exists. Please choose a different name to continue.`);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Labeling Task</DialogTitle>
        
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Task Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            
            <TextField
              label="Labeling Rules & Instructions"
              value={formData.rule_description}
              onChange={(e) => setFormData({ ...formData, rule_description: e.target.value })}
              multiline
              rows={4}
              fullWidth
              placeholder="Provide clear instructions on how to label the data..."
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Questions per User"
                type="number"
                value={formData.questions_per_user}
                onChange={(e) => setFormData({ ...formData, questions_per_user: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
                fullWidth
              />
              
              <TextField
                label="Required Agreements"
                type="number"
                value={formData.required_agreements}
                onChange={(e) => setFormData({ ...formData, required_agreements: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 5 }}
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !formData.title}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskCreateDialog;