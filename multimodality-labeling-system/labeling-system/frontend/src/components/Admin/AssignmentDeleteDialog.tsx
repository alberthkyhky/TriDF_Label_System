import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Chip,
  Avatar
} from '@mui/material';
import { Warning, Delete, Person as PersonIcon } from '@mui/icons-material';

interface AssignmentData {
  id: string;
  task_id: string;
  task_title: string;
  user_id: string;
  user_name: string;
  user_email: string;
  question_range_start: number;
  question_range_end: number;
  completed_labels: number;
  is_active: boolean;
  assigned_at: string;
  updated_at: string;
  deadline?: string;
  accuracy?: number;
  time_spent?: number;
}

interface AssignmentDeleteDialogProps {
  open: boolean;
  assignment: AssignmentData | null;
  onClose: () => void;
  onConfirm: (assignmentId: string) => void;
  loading?: boolean;
}

const AssignmentDeleteDialog: React.FC<AssignmentDeleteDialogProps> = ({
  open,
  assignment,
  onClose,
  onConfirm,
  loading = false
}) => {
  const handleConfirm = () => {
    if (!assignment) return;
    onConfirm(assignment.id);
  };

  if (!assignment) return null;

  // Calculate assignment target and progress
  const assignmentTarget = assignment.question_range_end - assignment.question_range_start + 1;
  const progressPercentage = assignmentTarget > 0 ? Math.min((assignment.completed_labels / assignmentTarget) * 100, 100) : 0;
  const isCompleted = assignment.completed_labels >= assignmentTarget;

  const getStatusText = (): string => {
    if (!assignment.is_active) return 'Inactive';
    if (isCompleted) return 'Completed';
    if (assignment.completed_labels > 0) return 'In Progress';
    return 'Not Started';
  };

  const getStatusColor = (): 'success' | 'warning' | 'error' | 'info' => {
    if (!assignment.is_active) return 'error';
    if (isCompleted) return 'success';
    if (assignment.completed_labels > 0) return 'warning';
    return 'info';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        Delete Assignment Permanently
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>⚠️ This action cannot be undone!</strong><br />
          All associated data will be permanently deleted including:
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
            <li>Assignment progress and status</li>
            <li>All submitted responses for this assignment</li>
            <li>User's access to this task</li>
            <li>Assignment statistics and history</li>
          </ul>
        </Alert>

        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Assignment to be deleted:
          </Typography>
          
          {/* Task Information */}
          <Typography variant="h6" color="error.main" gutterBottom>
            {assignment.task_title}
          </Typography>
          
          {/* User Information */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="body1" fontWeight="bold">
                {assignment.user_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assignment.user_email}
              </Typography>
            </Box>
          </Box>
          
          {/* Status and Progress */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={getStatusText()} 
              color={getStatusColor()} 
              size="small" 
            />
            <Chip 
              label={`${assignment.completed_labels}/${assignmentTarget} completed`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={`${progressPercentage.toFixed(0)}% progress`} 
              size="small" 
              variant="outlined" 
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            Question range: {assignment.question_range_start} - {assignment.question_range_end}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assigned: {new Date(assignment.assigned_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ fontWeight: 500, color: 'error.main' }}>
          Are you sure you want to delete this assignment?
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? undefined : <Delete />}
          sx={{ minWidth: 140 }}
        >
          {loading ? 'Deleting...' : 'Delete Assignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentDeleteDialog;