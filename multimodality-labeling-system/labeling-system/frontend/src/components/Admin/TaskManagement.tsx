import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Alert,
  Stack,
  Snackbar,
} from '@mui/material';
import { 
  Add,
  Upload
} from '@mui/icons-material';
import { api } from '../../services/api';
import { Task } from '../../types/tasks';
import { TaskWithQuestionsData } from '../../types/createTask';
import { useTaskFormData, defaultTaskFormData } from './formDataHook';
import TaskList from './TaskManagement/TaskList';
import TaskCreationStepper from './TaskManagement/TaskCreationStepper';
import TaskModificationDialog from './TaskManagement/TaskModificationDialog';
import TaskDeleteDialog from './TaskManagement/TaskDeleteDialog';

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<TaskWithQuestionsData[]>([]);
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithQuestionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithQuestionsData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { formData, setFormData } = useTaskFormData();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      // Read file content
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // Validate JSON structure
      validateTaskJson(jsonData);

      // Create task using the API
      const createdTask = await api.createTaskWithQuestions(jsonData);
      
      setUploadSuccess(`Task "${createdTask.title}" created successfully from JSON!`);
      fetchTasks(); // Refresh the task list
      
    } catch (error: any) {
      console.error('Error uploading JSON:', error);
      
      // Check if it's a duplicate name error  
      if (error.message && error.message.includes('already exists')) {
        // Extract task name from the error message or use a generic message
        const taskNameMatch = error.message.match(/'([^']+)' already exists/);
        const taskName = taskNameMatch ? taskNameMatch[1] : 'Unknown';
        setDuplicateAlert(taskName);
      } else {
        setError(error.message || 'Failed to create task from JSON file');
      }
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateTaskJson = (jsonData: any) => {
    // Required fields validation
    const requiredFields = [
      'title', 'description', 'instructions', 'questions_number', 
      'required_agreements', 'question_template', 'media_config'
    ];

    for (const field of requiredFields) {
      if (!jsonData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate question_template structure
    if (!jsonData.question_template.question_text || !jsonData.question_template.choices) {
      throw new Error('Invalid question_template structure. Must have question_text and choices.');
    }

    // Validate media_config structure
    const mediaConfig = jsonData.media_config;
    if (typeof mediaConfig.num_images !== 'number' || 
        typeof mediaConfig.num_videos !== 'number' || 
        typeof mediaConfig.num_audios !== 'number') {
      throw new Error('Invalid media_config structure. Must have num_images, num_videos, and num_audios as numbers.');
    }

    // Validate choices structure
    const choices = jsonData.question_template.choices;
    for (const [key, choice] of Object.entries(choices)) {
      if (typeof choice !== 'object' || !choice) {
        throw new Error(`Invalid choice structure for key: ${key}`);
      }
      const choiceObj = choice as any;
      if (!choiceObj.text || !Array.isArray(choiceObj.options) || typeof choiceObj.multiple_select !== 'boolean') {
        throw new Error(`Choice "${key}" must have text (string), options (array), and multiple_select (boolean)`);
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadAnswers = async (taskId: string, taskTitle: string) => {
    try {
      setLoading(true);
      setError(null);

      // Download as CSV format
      const blob = await api.exportTaskResponses(taskId, 'csv');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with task title and current date
      const sanitizedTitle = taskTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const currentDate = new Date().toISOString().split('T')[0];
      link.download = `${sanitizedTitle}_responses_${currentDate}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setUploadSuccess(`Downloaded responses for "${taskTitle}" successfully!`);
      
    } catch (error: any) {
      console.error('Error downloading task responses:', error);
      setError(error.message || 'Failed to download task responses');
    } finally {
      setLoading(false);
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

  const handleEditTask = (task: TaskWithQuestionsData) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTask(null);
  };

  const handleSaveTask = () => {
    fetchTasks(); // Refresh the task list
    handleCloseEditDialog();
  };

  const handleDeleteTask = (task: TaskWithQuestionsData) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleConfirmDelete = async (taskId: string) => {
    try {
      setDeleteLoading(true);
      setError(null);
      
      await api.deleteTask(taskId);
      
      // Close dialog and refresh tasks
      handleCloseDeleteDialog();
      fetchTasks();
      
      // Show success message
      setUploadSuccess(`Task "${taskToDelete?.title}" has been deleted successfully.`);
      
    } catch (error: any) {
      console.error('Error deleting task:', error);
      setError(error.message || 'Failed to delete task');
    } finally {
      setDeleteLoading(false);
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
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<Upload />}
            onClick={triggerFileUpload}
            disabled={loading}
          >
            Upload JSON
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            Create New Task
          </Button>
        </Stack>
      </Box>

      {/* Hidden file input for JSON upload */}
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleJsonUpload}
        style={{ display: 'none' }}
      />

      <TaskList 
        tasks={tasks} 
        onStatusChange={handleStatusChange} 
        onEditTask={handleEditTask}
        onDownloadAnswers={handleDownloadAnswers}
        onDeleteTask={handleDeleteTask}
      />

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
            onDuplicateError={(taskName) => {
              setOpen(false);
              setDuplicateAlert(taskName);
            }}
          />
        </DialogContent>
        
      </Dialog>

      {/* Task Modification Dialog */}
      <TaskModificationDialog
        open={editDialogOpen}
        task={selectedTask}
        onClose={handleCloseEditDialog}
        onSave={handleSaveTask}
        onDuplicateError={(taskName) => {
          handleCloseEditDialog();
          setDuplicateAlert(taskName);
        }}
      />

      {/* Task Delete Dialog */}
      <TaskDeleteDialog
        open={deleteDialogOpen}
        task={taskToDelete}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={!!uploadSuccess}
        autoHideDuration={6000}
        onClose={() => setUploadSuccess(null)}
        message={uploadSuccess}
      />

      {/* Duplicate Name Alert Snackbar */}
      <Snackbar
        open={!!duplicateAlert}
        autoHideDuration={8000}
        onClose={() => setDuplicateAlert(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="warning" 
          onClose={() => setDuplicateAlert(null)}
          sx={{ width: '100%' }}
        >
          <strong>⚠️ Task Name Already Exists</strong><br />
          A task with the name "{duplicateAlert}" already exists. Please choose a different name.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskManagement;