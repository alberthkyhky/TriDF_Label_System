import React, { useState } from 'react';
import { 
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { api } from '../../../services/api';
import { TaskFormData } from '../../../types/createTask';
import BasicInfoStep from './BasicInfoStep';
import ExampleImagesStep from './ExampleImagesStep';
import QuestionTemplateStep from './QuestionTemplateStep';
import ReviewStep from './ReviewStep';

interface TaskCreationStepperProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
  onSuccess: () => void;
  onCancel: () => void;
  onDuplicateError: (taskName: string) => void;
}

const TaskCreationStepper: React.FC<TaskCreationStepperProps> = ({
  formData,
  setFormData,
  onSuccess,
  onCancel,
  onDuplicateError
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = ['Basic Info', 'Example Images', 'Question Template', 'Review & Create'];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate form data
      if (!formData.title || !formData.description) {
        throw new Error('Please fill in all required fields');
      }


      if (Object.keys(formData.question_template.choices).length === 0) {
        throw new Error('At least one failure type must be configured');
      }

      // Prepare task data for API
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.trim(),
        example_images: formData.example_images,  // UPDATED to use example_images
        priority: formData.priority,
        required_agreements: formData.required_agreements,
        question_template: formData.question_template,
        questions_number: formData.questions_number
      };

      console.log('Task data being sent to API:', JSON.stringify(taskData, null, 2));
      const result = await api.createTaskWithQuestions(taskData);
      console.log('Task created successfully:', result);
      onSuccess();

    } catch (err: any) {
      console.error('Error creating task:', err);
      
      // Check if it's a duplicate name error
      if (err.message && err.message.includes('already exists')) {
        // Close the dialog and show popup alert
        onCancel();
        onDuplicateError(formData.title);
      } else {
        setError(err.message || 'Failed to create task');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <BasicInfoStep
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 1:
        return (
          <ExampleImagesStep
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 2:
        return (
          <QuestionTemplateStep
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 3:
        return (
          <ReviewStep
            formData={formData}
          />
        );
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return formData.title && formData.description && formData.instructions;
      case 1:
        return true; // Example images step is optional
      case 2:
        return formData.question_template.question_text && 
               Object.keys(formData.question_template.choices).length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Box sx={{ width: '100%', pt: 2 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ minHeight: 400 }}>
        {renderStepContent()}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
        >
          Cancel
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !isStepValid()}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid()}
              endIcon={<ArrowForward />}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TaskCreationStepper;