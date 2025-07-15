import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Paper,
  Grid,
} from '@mui/material';
import { 
  Edit, 
  Add, 
  ExpandMore, 
  Delete,
  ArrowBack,
  ArrowForward
} from '@mui/icons-material';
import { api } from '../../services/api';
import { Task } from '../../types/tasks';
import { TaskWithQuestionsData } from '../../types/createTask';
import { useTaskFormData, defaultTaskFormData } from './formDataHook';

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<TaskWithQuestionsData[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  const { formData, setFormData } = useTaskFormData();

  const steps = ['Basic Info', 'Question Template', 'Media Configuration', 'Review & Create'];

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
    setActiveStep(0);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    if (formData.questions_number === 0) {
      setError('At least one question is required');
      return;
    }

    if (Object.keys(formData.question_template.choices).length === 0) {
      setError('At least one failure category is required');
      return;
    }

    // Validate that at least one media type is specified
    const totalMediaTypes = formData.media_config.num_images + 
                           formData.media_config.num_videos + 
                           formData.media_config.num_audios;
    if (totalMediaTypes === 0) {
      setError('At least one media type (image, video, or audio) is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Transform data to match backend API structure
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.trim(),
        example_media: formData.example_media.filter(media => media.trim()),
        required_agreements: formData.required_agreements,
        question_template: formData.question_template,
        media_config: formData.media_config,
        questions_number: formData.questions_number
      };
      
      const result = await api.createTaskWithQuestions(taskData);
      
      // Show success message
      setError(null);
      
      // Close dialog and reset form
      setOpen(false);
      resetForm();
      
      // Refresh task list
      await fetchTasks();
      
      // Optional: Show success notification
      alert(`Task "${result.title}" created successfully with ${result.total_questions_generated} questions!`);
      
    } catch (error: any) {
      console.error('Error creating task:', error);
      
      // Display user-friendly error message
      if (error.message) {
        setError(error.message);
      } else if (error.detail) {
        setError(error.detail);
      } else {
        setError('Failed to create task. Please check your input and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions_number: formData.questions_number + 1
    });
  };

  const removeQuestion = () => {
    if (formData.questions_number > 0) {
      setFormData({
        ...formData,
        questions_number: formData.questions_number - 1
      });
    }
  };

  // Category management functions
  const addFailureType = () => {
    const existingKeys = Object.keys(formData.question_template.choices);
    const newTypeKey = `Type-${existingKeys.length + 1}`;
    setFormData({
      ...formData,
      question_template: {
        ...formData.question_template,
        choices: {
          ...formData.question_template.choices,
          [newTypeKey]: {
            text: `${newTypeKey} failures (Category)`,
            options: ['None'],
            multiple_select: true
          }
        }
      }
    });
  };

  const removeFailureType = (typeKey: string) => {
    const { [typeKey]: removed, ...remainingChoices } = formData.question_template.choices;
    setFormData({
      ...formData,
      question_template: {
        ...formData.question_template,
        choices: remainingChoices
      }
    });
  };

  const updateFailureTypeKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey || !newKey.trim()) return;
    
    // Check if new key already exists
    if (formData.question_template.choices[newKey]) {
      setError(`Category "${newKey}" already exists`);
      return;
    }
    
    const choices = { ...formData.question_template.choices };
    const choice = choices[oldKey];
    delete choices[oldKey];
    choices[newKey] = choice;
    
    setFormData({
      ...formData,
      question_template: {
        ...formData.question_template,
        choices
      }
    });
  };

  const updateFailureType = (typeKey: string, field: string, value: any) => {
    setFormData({
      ...formData,
      question_template: {
        ...formData.question_template,
        choices: {
          ...formData.question_template.choices,
          [typeKey]: {
            ...formData.question_template.choices[typeKey],
            [field]: value
          }
        }
      }
    });
  };

  const addFailureOption = (typeKey: string, option: string) => {
    if (!option.trim()) return;
    
    const currentOptions = formData.question_template.choices[typeKey].options;
    if (!currentOptions.includes(option.trim())) {
      updateFailureType(typeKey, 'options', [...currentOptions, option.trim()]);
    }
  };

  const removeFailureOption = (typeKey: string, optionIndex: number) => {
    const currentOptions = formData.question_template.choices[typeKey].options;
    const updatedOptions = currentOptions.filter((_, i) => i !== optionIndex);
    updateFailureType(typeKey, 'options', updatedOptions);
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: return formData.title.trim() && formData.description.trim() && formData.instructions.trim();
      case 1: return formData.question_template.question_text.trim() && Object.keys(formData.question_template.choices).length > 0;
      case 2: return formData.media_config.num_images + formData.media_config.num_videos + formData.media_config.num_audios > 0;
      case 3: return true;
      default: return false;
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

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Task Title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              sx={{ mb: 3 }}
              required
              helperText="A clear, descriptive title for this labeling task"
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              sx={{ mb: 3 }}
              required
              helperText="Brief description of what this task involves"
            />

            <TextField
              fullWidth
              label="Instructions"
              multiline
              rows={4}
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              sx={{ mb: 3 }}
              helperText="Detailed instructions for labelers on how to complete this task"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Total Questions"
                  type="number"
                  value={formData.questions_number}
                  onChange={(e) => setFormData({
                    ...formData,
                    questions_number: parseInt(e.target.value) || 10
                  })}
                  inputProps={{ min: 1, max: 1000 }}
                  helperText="Total number of questions in this task"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Required Agreements"
                  type="number"
                  value={formData.required_agreements}
                  onChange={(e) => setFormData({...formData, required_agreements: parseInt(e.target.value) || 1})}
                  inputProps={{ min: 1 }}
                  helperText="Number of labelers needed per question"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6">
                  Question Template
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Define the failure categories and options. Each question will use this template with different media.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addFailureType}
                size="small"
              >
                Add Category
              </Button>
            </Box>

            <TextField
              fullWidth
              label="Question Text"
              value={formData.question_template.question_text}
              onChange={(e) => setFormData({
                ...formData,
                question_template: {
                  ...formData.question_template,
                  question_text: e.target.value
                }
              })}
              sx={{ mb: 3 }}
              helperText="The question text that will appear for every question"
            />

            {Object.entries(formData.question_template.choices).map(([typeKey, choice]) => (
              <Accordion key={typeKey} sx={{ mb: 2 }}>
                <AccordionSummary 
                  expandIcon={<ExpandMore />}
                  sx={{ 
                    '& .MuiAccordionSummary-content': { 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      pr: 1
                    }
                  }}
                >
                  <Typography variant="subtitle1">
                    {choice.text} ({choice.options.length} options)
                  </Typography>
                  <IconButton
                    component="span"
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (Object.keys(formData.question_template.choices).length > 1) {
                        removeFailureType(typeKey);
                      }
                    }}
                    disabled={Object.keys(formData.question_template.choices).length <= 1}
                    sx={{ mr: 1 }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    label="Category Key"
                    value={typeKey}
                    onChange={(e) => updateFailureTypeKey(typeKey, e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Unique identifier for this failure category (e.g., A-type, B-type, Structural, etc.)"
                  />

                  <TextField
                    fullWidth
                    label="Category Description"
                    value={choice.text}
                    onChange={(e) => updateFailureType(typeKey, 'text', e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Display text shown to labelers"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={choice.multiple_select}
                        onChange={(e) => updateFailureType(typeKey, 'multiple_select', e.target.checked)}
                      />
                    }
                    label="Allow multiple selections"
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="subtitle2" gutterBottom>
                    Options:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {choice.options.map((option, optionIndex) => (
                      <Chip
                        key={optionIndex}
                        label={option}
                        onDelete={option !== 'None' ? () => removeFailureOption(typeKey, optionIndex) : undefined}
                        color={option === 'None' ? 'default' : 'primary'}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add new option"
                      sx={{ flexGrow: 1 }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addFailureOption(typeKey, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button
                      size="small"
                      onClick={(e) => {
                        const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                        if (input) {
                          addFailureOption(typeKey, input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}

            {Object.keys(formData.question_template.choices).length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please add at least one failure category
              </Alert>
            )}

            {Object.keys(formData.question_template.choices).length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Current categories:</strong> {Object.keys(formData.question_template.choices).join(', ')}
                  <br />
                  You can add more categories, rename them, or modify their options as needed.
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Media Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure the media composition for your questions. The backend will randomly sample media files from available datasets.
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Media Types per Question
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Specify how many of each media type should appear in each question for comparison.
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 4 }}>
                  <TextField
                    fullWidth
                    label="Images"
                    type="number"
                    value={formData.media_config.num_images}
                    onChange={(e) => setFormData({
                      ...formData,
                      media_config: {
                        ...formData.media_config,
                        num_images: Math.max(0, parseInt(e.target.value) || 0)
                      }
                    })}
                    inputProps={{ min: 0, max: 5 }}
                    helperText="Number of images per question"
                  />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField
                    fullWidth
                    label="Videos"
                    type="number"
                    value={formData.media_config.num_videos}
                    onChange={(e) => setFormData({
                      ...formData,
                      media_config: {
                        ...formData.media_config,
                        num_videos: Math.max(0, parseInt(e.target.value) || 0)
                      }
                    })}
                    inputProps={{ min: 0, max: 5 }}
                    helperText="Number of videos per question"
                  />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField
                    fullWidth
                    label="Audio Files"
                    type="number"
                    value={formData.media_config.num_audios}
                    onChange={(e) => setFormData({
                      ...formData,
                      media_config: {
                        ...formData.media_config,
                        num_audios: Math.max(0, parseInt(e.target.value) || 0)
                      }
                    })}
                    inputProps={{ min: 0, max: 5 }}
                    helperText="Number of audio files per question"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total media per question:</strong> {formData.media_config.num_images + formData.media_config.num_videos + formData.media_config.num_audios} files
                </Typography>
              </Box>
            </Paper>

            

            {(formData.media_config.num_images + formData.media_config.num_videos + formData.media_config.num_audios) === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please specify at least one media type (image, video, or audio)
              </Alert>
            )}

            {formData.questions_number === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please specify at least one question
              </Alert>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Media files will be randomly sampled from the backend dataset. 
                Each question will receive {formData.media_config.num_images + formData.media_config.num_videos + formData.media_config.num_audios} media files 
                ({formData.media_config.num_images} images, {formData.media_config.num_videos} videos, {formData.media_config.num_audios} audio files) 
                for labelers to compare and analyze.
              </Typography>
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review & Create Task
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Task Details</Typography>
              <Typography><strong>Title:</strong> {formData.title}</Typography>
              <Typography><strong>Description:</strong> {formData.description}</Typography>
              <Typography><strong>Total Questions:</strong> {formData.questions_number}</Typography>
              <Typography><strong>Required Agreements:</strong> {formData.required_agreements}</Typography>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Question Template</Typography>
              <Typography><strong>Question:</strong> {formData.question_template.question_text}</Typography>
              <Typography><strong>Failure Categories:</strong> {Object.keys(formData.question_template.choices).length}</Typography>
              <Box sx={{ mt: 1 }}>
                {Object.entries(formData.question_template.choices).map(([key, choice]) => (
                  <Chip
                    key={key}
                    label={`${key} (${choice.options.length} options)`}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Media Configuration</Typography>
              <Typography><strong>Images per question:</strong> {formData.media_config.num_images}</Typography>
              <Typography><strong>Videos per question:</strong> {formData.media_config.num_videos}</Typography>
              <Typography><strong>Audio files per question:</strong> {formData.media_config.num_audios}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Media files will be randomly sampled from backend datasets
              </Typography>
            </Paper>
          </Box>
        );

      default:
        return null;
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

      <List>
        {tasks.map((task) => {
          console.log(task)
          return <ListItem key={task.id} divider>
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
          </ListItem>
})}
      </List>

      {tasks.length === 0 && !error && (
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          No tasks created yet. Click "Create New Task" to get started.
        </Typography>
      )}

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          Create New Task
          <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </DialogTitle>
        
        <DialogContent sx={{ flex: 1, overflow: 'auto' }}>
          {renderStepContent()}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          
          {activeStep > 0 && (
            <Button
              startIcon={<ArrowBack />}
              onClick={() => setActiveStep(activeStep - 1)}
            >
              Back
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={!canProceed()}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskManagement;