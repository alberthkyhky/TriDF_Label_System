import React from 'react';
import { 
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import { TaskFormData } from '../../../types/createTask';

interface ReviewStepProps {
  formData: TaskFormData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
  

  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review & Create Task
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all task details before creating the task.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Basic Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Title
                </Typography>
                <Typography variant="body1">
                  {formData.title || 'No title provided'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {formData.description || 'No description provided'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Instructions
                </Typography>
                <Typography variant="body1" sx={{ 
                  maxHeight: 100, 
                  overflow: 'auto',
                  fontSize: '0.875rem'
                }}>
                  {formData.instructions || 'No instructions provided'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${formData.questions_number} Questions`} 
                  color="primary" 
                  size="small"
                />
                <Chip 
                  label={'Medium Priority'} 
                  color="secondary" 
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Question Template */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Question Template
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Question Text
                </Typography>
                <Typography variant="body1">
                  {formData.question_template.question_text || 'No question text provided'}
                </Typography>
              </Box>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Failure Categories ({Object.keys(formData.question_template.choices).length})
              </Typography>
              
              <List dense>
                {Object.entries(formData.question_template.choices)
                  .sort(([,a], [,b]) => (a.order || 999) - (b.order || 999))
                  .map(([key, choice]) => (
                  <ListItem key={key} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {key}:
                          </Typography>
                          <Typography variant="body2">
                            {choice.text}
                          </Typography>
                          {choice.multiple_select && (
                            <Chip label="Multi-select" size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={`${choice.options.length} options: ${choice.options.join(', ')}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>


        {/* Task Summary */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Card sx={{ bgcolor: 'primary.light' }}>
            <CardContent>
              <Typography variant="h6" color="primary.contrastText" gutterBottom>
                Task Summary
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary.contrastText">
                      {formData.questions_number}
                    </Typography>
                    <Typography variant="body2" color="primary.contrastText">
                      Total Questions
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary.contrastText">
                      {formData.priority}
                    </Typography>
                    <Typography variant="body2" color="primary.contrastText">
                      Priority Level
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Validation Messages */}
      <Box sx={{ mt: 3 }}>
        {!formData.title && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Task title is required
          </Alert>
        )}
        {!formData.description && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Task description is required
          </Alert>
        )}
        {!formData.question_template.question_text && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Question text is required
          </Alert>
        )}
        {Object.keys(formData.question_template.choices).length === 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            At least one failure category is required
          </Alert>
        )}
        
        {formData.title && formData.description && formData.question_template.question_text && 
         Object.keys(formData.question_template.choices).length > 0 && (
          <Alert severity="success">
            Task configuration is valid and ready to create!
          </Alert>
        )}
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Once created, some task properties cannot be modified. 
          Please ensure all details are correct before proceeding.
        </Typography>
      </Box>
    </Box>
  );
};

export default ReviewStep;