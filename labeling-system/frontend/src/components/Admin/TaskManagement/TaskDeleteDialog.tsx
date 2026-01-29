import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Box,
  Chip
} from '@mui/material';
import { Warning, Delete } from '@mui/icons-material';
import { TaskWithQuestionsData } from '../../../types/createTask';

interface TaskDeleteDialogProps {
  open: boolean;
  task: TaskWithQuestionsData | null;
  onClose: () => void;
  onConfirm: (taskId: string) => void;
  loading?: boolean;
}

const TaskDeleteDialog: React.FC<TaskDeleteDialogProps> = ({
  open,
  task,
  onClose,
  onConfirm,
  loading = false
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setConfirmationText('');
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!task) return;

    // Check if user typed the exact task name
    if (confirmationText.trim() !== task.title.trim()) {
      setError('Task name does not match. Please type the exact task name to confirm deletion.');
      return;
    }

    // Clear error and proceed with deletion
    setError(null);
    onConfirm(task.id);
  };

  const isConfirmationValid = confirmationText.trim() === task?.title.trim();

  if (!task) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { 
          border: '2px solid #f44336',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: 'error.main',
        pb: 1
      }}>
        <Warning color="error" />
        Delete Task Permanently
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>⚠️ This action cannot be undone!</strong><br />
          All associated data will be permanently deleted including:
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
            <li>Task questions and media</li>
            <li>User assignments</li>
            <li>All submitted responses</li>
            <li>Progress and statistics</li>
          </ul>
        </Alert>

        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Task to be deleted:
          </Typography>
          <Typography variant="h6" color="error.main" gutterBottom>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Chip label={task.status} size="small" />
            <Chip label={`${task.questions_number} questions`} size="small" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {task.description || 'No description'}
          </Typography>
        </Box>

        <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
          To confirm deletion, please type the task name exactly:
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            p: 1, 
            bgcolor: 'grey.100', 
            borderRadius: 1, 
            fontFamily: 'monospace',
            mb: 1
          }}
        >
          {task.title}
        </Typography>

        <TextField
          fullWidth
          label="Type task name to confirm"
          value={confirmationText}
          onChange={(e) => {
            setConfirmationText(e.target.value);
            setError(null);
          }}
          error={!!error}
          helperText={error || 'Case-sensitive exact match required'}
          disabled={loading}
          autoComplete="off"
          autoFocus
        />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!isConfirmationValid || loading}
          startIcon={loading ? undefined : <Delete />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Deleting...' : 'Delete Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDeleteDialog;