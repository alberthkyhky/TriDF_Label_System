import React, { useMemo } from 'react';
import { 
  Box,
  Button,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  IconButton,
  Alert
} from '@mui/material';
import { 
  Add, 
  ExpandMore, 
  Delete 
} from '@mui/icons-material';
import { TaskFormData } from '../../../types/createTask';

interface QuestionTemplateStepProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
}

const QuestionTemplateStep: React.FC<QuestionTemplateStepProps> = ({ formData, setFormData }) => {
  
  // Memoize expensive Object operations on choices
  const choicesEntries = useMemo(() => 
    Object.entries(formData.question_template.choices), 
    [formData.question_template.choices]
  );

  const choicesKeys = useMemo(() => 
    Object.keys(formData.question_template.choices), 
    [formData.question_template.choices]
  );

  const choicesCount = useMemo(() => 
    choicesKeys.length, 
    [choicesKeys]
  );

  const addFailureType = () => {
    const existingKeys = choicesKeys;
    const newTypeKey = `Type-${existingKeys.length + 1}`;
    
    setFormData({
      ...formData,
      question_template: {
        ...formData.question_template,
        choices: {
          ...formData.question_template.choices,
          [newTypeKey]: {
            text: `Failure Category ${existingKeys.length + 1}`,
            options: ['Option 1', 'Option 2'],
            multiple_select: false
          }
        }
      }
    });
  };

  const removeFailureType = (typeKey: string) => {
    const newChoices = { ...formData.question_template.choices };
    delete newChoices[typeKey];
    
    setFormData({
      ...formData,
      question_template: {
        ...formData.question_template,
        choices: newChoices
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

  const updateFailureTypeKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey || !newKey.trim()) return;
    
    const choices = { ...formData.question_template.choices };
    const choiceData = choices[oldKey];
    delete choices[oldKey];
    choices[newKey] = choiceData;
    
    setFormData({
      ...formData,
      question_template: {
        ...formData.question_template,
        choices
      }
    });
  };

  const addOption = (typeKey: string) => {
    const currentChoice = formData.question_template.choices[typeKey];
    const newOptions = [...currentChoice.options, `Option ${currentChoice.options.length + 1}`];
    updateFailureType(typeKey, 'options', newOptions);
  };

  const removeOption = (typeKey: string, optionIndex: number) => {
    const currentChoice = formData.question_template.choices[typeKey];
    if (currentChoice.options.length <= 1) return;
    
    const newOptions = currentChoice.options.filter((_, index) => index !== optionIndex);
    updateFailureType(typeKey, 'options', newOptions);
  };

  const updateOption = (typeKey: string, optionIndex: number, value: string) => {
    const currentChoice = formData.question_template.choices[typeKey];
    const newOptions = [...currentChoice.options];
    newOptions[optionIndex] = value;
    updateFailureType(typeKey, 'options', newOptions);
  };

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
        required
        helperText="The question text that will appear for every question"
        placeholder="e.g., 'What types of failures can you identify in this media?'"
      />

      {choicesCount === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Click "Add Category" to create your first failure category.
        </Alert>
      )}

      {choicesEntries.map(([typeKey, choice]) => (
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
                if (choicesCount > 1) {
                  removeFailureType(typeKey);
                }
              }}
              disabled={choicesCount <= 1}
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
            
            <Box sx={{ mb: 2 }}>
              {choice.options.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    value={option}
                    onChange={(e) => updateOption(typeKey, index, e.target.value)}
                    sx={{ flexGrow: 1 }}
                    placeholder={`Option ${index + 1}`}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeOption(typeKey, index)}
                    disabled={choice.options.length <= 1}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => addOption(typeKey)}
                variant="outlined"
              >
                Add Option
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
        <Typography variant="body2" color="warning.contrastText">
          <strong>Note:</strong> These categories and options will be used for all questions in this task. 
          Make sure they are comprehensive and clearly defined.
        </Typography>
      </Box>
    </Box>
  );
};

export default QuestionTemplateStep;