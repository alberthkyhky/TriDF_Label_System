import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  IconButton
} from '@mui/material';
import {
  Save,
  Person,
  Assignment,
  Analytics,
  Info,
  Add,
  Delete
} from '@mui/icons-material';
import { TaskWithQuestionsData } from '../../../types/createTask';
import { TaskAssignment } from '../../../types/tasks';
import { api } from '../../../services/api';

interface TaskModificationDialogProps {
  open: boolean;
  task: TaskWithQuestionsData | null;
  onClose: () => void;
  onSave: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

interface LabelerProgress {
  user_id: string;
  user_name: string;
  user_email: string;
  assignment_id: string;
  target_labels: number;
  completed_labels: number;
  assigned_at: string;
  is_active: boolean;
  progress_percentage: number;
}

const TaskModificationDialog: React.FC<TaskModificationDialogProps> = ({
  open,
  task,
  onClose,
  onSave
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [editedTask, setEditedTask] = useState<TaskWithQuestionsData | null>(null);
  const [assignments, setAssignments] = useState<LabelerProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Add useCallback for fetchTaskProgress to fix ESLint warning
  const fetchTaskProgress = useCallback(async () => {
    if (!task) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching assignments for task:', task.id);
      console.log('Task:', task);
      
      let assignmentData;
      try {
        assignmentData = await api.getTaskAssignments(task.id);
        console.log('Raw assignment data:', assignmentData);
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        // If the endpoint doesn't exist or other errors occur, show a helpful message
        if (apiError?.message?.includes('404') || 
            apiError?.message?.includes('Not Found') ||
            apiError?.message?.includes('Failed to fetch') ||
            apiError?.name === 'TypeError') {
          console.log('Assignment endpoints not fully available, showing empty state');
          setError('Unable to fetch task assignments. This may indicate the assignment endpoints are not fully implemented in your backend.');
          setAssignments([]);
          return;
        }
        throw apiError;
      }
      
      // Ensure assignmentData is an array
      if (!Array.isArray(assignmentData)) {
        console.warn('Assignment data is not an array:', assignmentData);
        setAssignments([]);
        return;
      }
      
      // Transform assignment data to include progress
      const progressData: LabelerProgress[] = assignmentData.map((assignment: TaskAssignment & { user_name?: string; user_email?: string }) => ({
        user_id: assignment.user_id || 'unknown',
        user_name: assignment.user_name || 'Unknown User',
        user_email: assignment.user_email || 'unknown@example.com',
        assignment_id: assignment.id || 'unknown',
        target_labels: assignment.target_labels || 0,
        completed_labels: assignment.completed_labels || 0,
        assigned_at: assignment.assigned_at || new Date().toISOString(),
        is_active: assignment.is_active || false,
        progress_percentage: (assignment.target_labels && assignment.target_labels > 0) ? 
          (assignment.completed_labels / assignment.target_labels) * 100 : 0
      }));
      
      setAssignments(progressData);
    } catch (error) {
      console.error('Error fetching task progress:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch task progress data');
      setAssignments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [task]);

  // Fetch complete task data with question template
  const fetchCompleteTaskData = useCallback(async () => {
    if (!task) return;
    
    try {
      console.log('Fetching complete task data for:', task.id);
      console.log('Original task object:', task);
      
      // First check if the original task already has complete data
      if (task.question_template && task.question_template.question_text) {
        console.log('Task already has complete question template, using original data');
        setEditedTask({ ...task });
        return;
      }
      
      // Try to get the enhanced task data with questions
      try {
        const completeTask = await api.getTaskWithQuestions(task.id);
        console.log('Enhanced task data received:', completeTask);
        console.log('Question template in enhanced data:', completeTask.question_template);
        setEditedTask(completeTask);
      } catch (enhancedError) {
        console.error('Enhanced task API failed:', enhancedError);
        
        // Try to get basic task data as fallback
        try {
          const basicTask = await api.getTask(task.id);
          console.log('Basic task data received:', basicTask);
          setEditedTask(basicTask);
        } catch (basicError) {
          console.error('Basic task API also failed:', basicError);
          // Final fallback to original task data
          console.log('Using original task data as final fallback');
          setEditedTask({ ...task });
        }
      }
    } catch (error) {
      console.error('Error in fetchCompleteTaskData:', error);
      // Fallback to the original task data
      console.log('Final fallback to original task data:', task);
      setEditedTask({ ...task });
    }
  }, [task]);

  useEffect(() => {
    if (task) {
      fetchCompleteTaskData();
      fetchTaskProgress();
    }
  }, [task, fetchCompleteTaskData, fetchTaskProgress]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = async () => {
    if (!editedTask) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      console.log('Saving task with data:', editedTask);
      
      // Try to use the enhanced updateTaskWithQuestions endpoint first
      try {
        console.log('Attempting to update task with questions using enhanced API...');
        const updateResponse = await api.updateTaskWithQuestions(editedTask.id, editedTask);
        console.log('Task with questions update response:', updateResponse);
        
        setHasUnsavedChanges(false);
        setSuccess('Task information and question template saved successfully!');
        onSave();
        return;
      } catch (enhancedError) {
        console.error('Enhanced update failed:', enhancedError);
        console.error('Error details:', {
          name: enhancedError instanceof Error ? enhancedError.name : 'Unknown',
          message: enhancedError instanceof Error ? enhancedError.message : 'Unknown error'
        });
        
        // If the enhanced endpoint fails, fall back to basic update
        if (enhancedError instanceof Error && (
          enhancedError.message.includes('not implemented') || 
          enhancedError.message.includes('not found') ||
          enhancedError.message.includes('404') ||
          enhancedError.message.includes('Failed to fetch') ||
          enhancedError.message.includes('500') ||
          enhancedError.message.includes('Internal Server Error') ||
          enhancedError.name === 'TypeError'
        )) {
          console.log('Enhanced endpoint not available, falling back to basic update...');
          console.log('Detected error pattern:', {
            isTypError: enhancedError.name === 'TypeError',
            hasFetchError: enhancedError.message.includes('Failed to fetch'),
            has500Error: enhancedError.message.includes('500')
          });
          
          const basicUpdateData = {
            title: editedTask.title,
            description: editedTask.description,
            status: editedTask.status
          };
          
          console.log('Basic update data being sent:', basicUpdateData);
          const basicUpdateResponse = await api.updateTask(editedTask.id, basicUpdateData as any);
          console.log('Basic task update response:', basicUpdateResponse);
          
          setHasUnsavedChanges(false);
          setSuccess('Basic task information saved successfully!');
          setError('Note: Question template changes could not be saved. The enhanced endpoint (PUT /tasks/{id}/with-questions) is not implemented in your backend. Only title, description, and status were updated.');
          
          onSave();
          return;
        }
        
        // If it's a different error, rethrow it
        throw enhancedError;
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error instanceof Error ? error.message : 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = (updates: Partial<TaskWithQuestionsData>) => {
    setEditedTask(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
    // Clear messages when user makes changes
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmClose) return;
    }
    setHasUnsavedChanges(false);
    onClose();
  };

  if (!task || !editedTask) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Task: {task.title}
            {hasUnsavedChanges && (
              <Typography component="span" color="warning.main" sx={{ ml: 1, fontSize: '0.875rem' }}>
                (Unsaved changes)
              </Typography>
            )}
          </Typography>
          <Chip 
            label={task.status} 
            color={task.status === 'active' ? 'success' : task.status === 'paused' ? 'warning' : 'default'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Basic Info" icon={<Info />} />
          <Tab label="Questions" icon={<Assignment />} />
          <Tab label="Progress Tracking" icon={<Analytics />} />
        </Tabs>

        {/* Basic Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Task Information
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <TextField
                  fullWidth
                  label="Task Title"
                  value={editedTask.title}
                  onChange={(e) => handleTaskChange({ title: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={editedTask.description}
                  onChange={(e) => handleTaskChange({ description: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>Task Statistics</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      Total Questions: <strong>{task.questions_number}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Required Agreements: <strong>{task.required_agreements}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Created: <strong>{new Date(task.created_at).toLocaleDateString()}</strong>
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* Questions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Question Template</Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={fetchCompleteTaskData}
                disabled={loading}
              >
                Refresh Template
              </Button>
            </Box>
            
            {/* Debug Information */}
            {process.env.NODE_ENV === 'development' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  Debug: Question template exists: {editedTask?.question_template ? 'Yes' : 'No'}
                  {editedTask?.question_template && (
                    <>
                      <br />Question text: {editedTask.question_template.question_text ? 'Yes' : 'No'}
                      <br />Choices: {editedTask.question_template.choices ? Object.keys(editedTask.question_template.choices).length : 0} items
                    </>
                  )}
                </Typography>
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.75rem' }}>Raw Data (Click to expand)</summary>
                  <pre style={{ 
                    fontSize: '0.7rem', 
                    maxHeight: '200px', 
                    overflow: 'auto', 
                    backgroundColor: '#f5f5f5', 
                    padding: '8px', 
                    marginTop: '8px',
                    borderRadius: '4px'
                  }}>
                    {JSON.stringify(editedTask?.question_template, null, 2)}
                  </pre>
                </details>
              </Alert>
            )}
            
            {!editedTask?.question_template ? (
              <Alert severity="warning" sx={{ mb: 3 }}>
                No question template data available. This might indicate that:
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>The task was created without a question template</li>
                  <li>The backend API is not returning complete task data</li>
                  <li>There's an issue with the data structure</li>
                </ul>
                <Button variant="text" size="small" onClick={fetchCompleteTaskData} sx={{ mt: 1 }}>
                  Try Refreshing Template Data
                </Button>
              </Alert>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Question Text"
                  value={editedTask.question_template?.question_text || ''}
                  onChange={(e) => handleTaskChange({
                    question_template: {
                      ...editedTask.question_template,
                      question_text: e.target.value
                    }
                  })}
                  sx={{ mb: 3 }}
                />

                <Typography variant="subtitle1" gutterBottom>Answer Choices</Typography>
                {editedTask.question_template?.choices && typeof editedTask.question_template.choices === 'object' ? 
                  Object.entries(editedTask.question_template.choices).map(([key, choice]) => (
              <Card key={key} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Choice: {key}
                  </Typography>
                  <TextField
                    fullWidth
                    label="Choice Text"
                    value={choice.text}
                    onChange={(e) => {
                      const newChoices = { ...editedTask.question_template.choices };
                      newChoices[key] = { ...choice, text: e.target.value };
                      handleTaskChange({
                        question_template: {
                          ...editedTask.question_template,
                          choices: newChoices
                        }
                      });
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  {/* Options Editor */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Options:
                    </Typography>
                    {(Array.isArray(choice.options) ? choice.options : []).map((option, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          size="small"
                          value={option}
                          onChange={(e) => {
                            const newChoices = { ...editedTask.question_template.choices };
                            const currentOptions = Array.isArray(choice.options) ? choice.options : [];
                            const newOptions = [...currentOptions];
                            newOptions[index] = e.target.value;
                            newChoices[key] = { ...choice, options: newOptions };
                            handleTaskChange({
                              question_template: {
                                ...editedTask.question_template,
                                choices: newChoices
                              }
                            });
                          }}
                          sx={{ flexGrow: 1, mr: 1 }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            const newChoices = { ...editedTask.question_template.choices };
                            const currentOptions = Array.isArray(choice.options) ? choice.options : [];
                            const newOptions = currentOptions.filter((_, i) => i !== index);
                            newChoices[key] = { ...choice, options: newOptions };
                            handleTaskChange({
                              question_template: {
                                ...editedTask.question_template,
                                choices: newChoices
                              }
                            });
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => {
                        const newChoices = { ...editedTask.question_template.choices };
                        const newOptions = Array.isArray(choice.options) ? [...choice.options, ''] : [''];
                        newChoices[key] = { ...choice, options: newOptions };
                        handleTaskChange({
                          question_template: {
                            ...editedTask.question_template,
                            choices: newChoices
                          }
                        });
                      }}
                      variant="outlined"
                      sx={{ mt: 1 }}
                    >
                      Add Option
                    </Button>
                  </Box>

                  {/* Multiple Select Toggle */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={choice.multiple_select || false}
                        onChange={(e) => {
                          const newChoices = { ...editedTask.question_template.choices };
                          newChoices[key] = { ...choice, multiple_select: e.target.checked };
                          handleTaskChange({
                            question_template: {
                              ...editedTask.question_template,
                              choices: newChoices
                            }
                          });
                        }}
                      />
                    }
                    label="Allow Multiple Selection"
                  />
                </CardContent>
              </Card>
                )) : (
                  <Alert severity="info">
                    No question choices available or invalid format.
                  </Alert>
                )}
              </>
            )}
          </Box>
        </TabPanel>

        {/* Progress Tracking Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Labeler Progress</Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={fetchTaskProgress}
                disabled={loading}
              >
                Refresh Data
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Loading progress data...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : assignments.length === 0 ? (
              <Alert severity="info">
                No assignments found for this task. Assign labelers to see progress tracking.
              </Alert>
            ) : (
              <List>
                {assignments.map((labeler) => (
                  <ListItem key={labeler.assignment_id} divider >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Person fontSize="small" />
                          <Typography variant="subtitle1" component="span">{labeler.user_name}</Typography>
                          <Chip 
                            label={labeler.is_active ? 'Active' : 'Inactive'}
                            color={labeler.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom component="span">
                            {labeler.user_email}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="body2" component="span">
                              Progress: {labeler.completed_labels} / {labeler.target_labels}
                            </Typography>
                            <Typography variant="body2" color="primary" component="span">
                              {labeler.progress_percentage.toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={labeler.progress_percentage}
                            sx={{ height: 8, borderRadius: 4 }}
                            color={labeler.progress_percentage === 100 ? 'success' : 'primary'}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }} component="span">
                            Assigned: {new Date(labeler.assigned_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ my: 3 }} />
            
            {/* Overall Progress Summary */}
            <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle1" gutterBottom component="span">Overall Task Progress</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" component="span">
                    {assignments.filter(a => a.is_active).length}
                  </Typography>
                  <Typography variant="body2" component="span">Active Labelers</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" component="span">
                    {assignments.reduce((sum, a) => sum + (a.completed_labels || 0), 0)}
                  </Typography>
                  <Typography variant="body2" component="span">Total Completed</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" component="span">
                    {assignments.reduce((sum, a) => sum + (a.target_labels || 0), 0)}
                  </Typography>
                  <Typography variant="body2" component="span">Total Target</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" component="span">
                    {(() => {
                      if (assignments.length === 0) return '0';
                      const totalCompleted = assignments.reduce((sum, a) => sum + (a.completed_labels || 0), 0);
                      const totalTarget = assignments.reduce((sum, a) => sum + (a.target_labels || 0), 0);
                      if (totalTarget === 0) return '0';
                      return ((totalCompleted / totalTarget) * 100).toFixed(1);
                    })()}%
                  </Typography>
                  <Typography variant="body2" component="span">Overall Progress</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={loading || !hasUnsavedChanges}
          startIcon={<Save />}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskModificationDialog;