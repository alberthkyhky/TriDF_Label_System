import React from 'react';
import { 
  Box,
  TextField,
  Typography
} from '@mui/material';
import { TaskFormData } from '../../../types/createTask';

interface BasicInfoStepProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formData, setFormData }) => {
  const handleChange = (field: keyof TaskFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Basic Task Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide the fundamental details about your labeling task.
      </Typography>

      <TextField
        fullWidth
        label="Task Title"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        sx={{ mb: 3 }}
        required
        helperText="A clear, descriptive title for this labeling task"
        placeholder="e.g., 'Image Quality Assessment for Product Photos'"
      />
      
      <TextField
        fullWidth
        label="Description"
        multiline
        rows={3}
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        sx={{ mb: 3 }}
        required
        helperText="Brief description of what this task involves"
        placeholder="Describe the purpose and scope of this labeling task..."
      />

      <TextField
        fullWidth
        label="Instructions"
        multiline
        rows={4}
        value={formData.instructions}
        onChange={(e) => handleChange('instructions', e.target.value)}
        sx={{ mb: 3 }}
        required
        helperText="Detailed instructions for labelers on how to complete this task"
        placeholder="Provide step-by-step instructions for labelers..."
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: '300px' }}>
          <TextField
            fullWidth
            label="Total Questions"
            type="number"
            value={formData.questions_number}
            onChange={(e) => handleChange('questions_number', parseInt(e.target.value) || 10)}
            inputProps={{ min: 1, max: 1000 }}
            helperText="Number of questions to generate for this task"
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: '300px' }}>
          <TextField
            fullWidth
            label="Priority"
            select
            value={'medium'}
            onChange={(e) => {/* Priority not supported in current type */}}
            helperText="Task priority level"
            SelectProps={{
              native: true,
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </TextField>
        </Box>
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" color="info.contrastText">
          <strong>Tip:</strong> Clear instructions and descriptions help labelers understand 
          the task better and produce higher quality results.
        </Typography>
      </Box>
    </Box>
  );
};

// Memoize BasicInfoStep to prevent unnecessary re-renders during form editing
export default React.memo(BasicInfoStep, (prevProps, nextProps) => {
  // Compare formData object properties that affect this step
  return prevProps.formData.title === nextProps.formData.title &&
         prevProps.formData.description === nextProps.formData.description &&
         prevProps.formData.instructions === nextProps.formData.instructions &&
         prevProps.formData.questions_number === nextProps.formData.questions_number &&
         prevProps.setFormData === nextProps.setFormData;
});