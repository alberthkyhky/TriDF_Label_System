import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, CheckCircle } from '@mui/icons-material';

interface FailureChoice {
  text: string;
  options: string[];
  multiple_select: boolean;
  order?: number;
}

interface FailureTypeSelectorProps {
  choices: Record<string, FailureChoice>;
  responses: Record<string, string[]>;
  onSelectionChange: (failureType: string, option: string, checked: boolean) => void;
}

const FailureTypeSelector: React.FC<FailureTypeSelectorProps> = ({
  choices,
  responses,
  onSelectionChange
}) => {
  // Track which failure types user explicitly said "Yes" to
  const [yesStates, setYesStates] = React.useState<Record<string, boolean>>({});

  // Helper function to check if a failure type should hide the Yes/No level
  const shouldHideYesNoLevel = useCallback((failureType: string) => {
    return failureType === 'Difficulty' || failureType === 'Success';
  }, []);

  // Helper function to detect DeepFake Success questions
  const isDeepFakeSuccess = useCallback((failureType: string) => {
    return failureType.includes('DeepFake Success');
  }, []);

  // Auto-initialize yes state for Difficulty and Success questions
  React.useEffect(() => {
    const autoYesStates: Record<string, boolean> = {};
    Object.keys(choices).forEach(failureType => {
      if (shouldHideYesNoLevel(failureType)) {
        autoYesStates[failureType] = true;
      }
    });
    setYesStates(prev => ({ ...prev, ...autoYesStates }));
  }, [choices, shouldHideYesNoLevel]);

  // Helper function to check if a failure type has only one detail option
  const hasSingleOption = useCallback((failureType: string) => {
    const choiceData = choices[failureType];
    if (!choiceData) return false;
    const detailOptions = choiceData.options.filter(option => option !== 'None');
    return detailOptions.length === 1;
  }, [choices]);

  // Memoize expensive selection summary calculations
  const selectionSummaries = useMemo(() => {
    const summaries: Record<string, string> = {};
    
    Object.keys(choices).forEach(failureType => {
      const selections = responses[failureType] || [];
      const isSpecialCategory = shouldHideYesNoLevel(failureType);
      const isDeepFake = isDeepFakeSuccess(failureType);
      
      if (isDeepFake) {
        // For DeepFake Success questions, show simple Yes/No status
        if (selections.includes('None')) {
          summaries[failureType] = 'No selected';
        } else if (yesStates[failureType] || selections.filter(s => s !== 'None').length > 0) {
          summaries[failureType] = 'Yes selected';
        } else {
          summaries[failureType] = 'No selection';
        }
      } else if (isSpecialCategory) {
        // For Difficulty/Success questions, show selection status directly
        const optionCount = selections.filter(s => s !== 'None').length;
        if (optionCount === 0) {
          summaries[failureType] = 'Please make a selection';
        } else {
          summaries[failureType] = `${optionCount} option${optionCount !== 1 ? 's' : ''} selected`;
        }
      } else if (selections.length === 0 && !yesStates[failureType]) {
        summaries[failureType] = 'No selection';
      } else if (selections.includes('None')) {
        summaries[failureType] = 'No failures detected';
      } else if (yesStates[failureType] && selections.filter(s => s !== 'None').length === 0) {
        // Handle single option case
        if (hasSingleOption(failureType)) {
          summaries[failureType] = 'Auto-selected single option';
        } else {
          summaries[failureType] = 'Ready to select failures';
        }
      } else {
        const failureCount = selections.filter(s => s !== 'None').length;
        summaries[failureType] = `${failureCount} failure${failureCount !== 1 ? 's' : ''} selected`;
      }
    });
    
    return summaries;
  }, [choices, responses, yesStates, hasSingleOption, shouldHideYesNoLevel, isDeepFakeSuccess]);

  const getFailureTypeColor = (failureType: string) => {
    if (failureType.includes('A-type')) return 'error';
    if (failureType.includes('B-type')) return 'warning';
    if (failureType.includes('C-type')) return 'info';
    return 'primary';
  };

  const getFailureTypeIcon = (index: number) => {
    return `${index + 1}.`;
  };

  // Check if user selected "No" (None)
  const hasSelectedNo = (failureType: string) => {
    const selections = responses[failureType] || [];
    return selections.includes('None');
  };

  // Check if user selected "Yes" (either explicitly or has failure selections)
  const hasSelectedYes = (failureType: string) => {
    const selections = responses[failureType] || [];
    const hasFailureSelections = selections.length > 0 && !selections.includes('None');
    return yesStates[failureType] || hasFailureSelections;
  };


  // Handle "No" checkbox click
  const handleNoSelection = (failureType: string, checked: boolean) => {
    if (checked) {
      // Clear yes state and all existing selections
      setYesStates(prev => ({ ...prev, [failureType]: false }));
      const currentSelections = responses[failureType] || [];
      currentSelections.forEach(selection => {
        onSelectionChange(failureType, selection, false);
      });
      // Then add "None"
      onSelectionChange(failureType, 'None', true);
    } else {
      // Remove "None"
      onSelectionChange(failureType, 'None', false);
    }
  };

  // Handle "Yes" checkbox click
  const handleYesSelection = (failureType: string, checked: boolean) => {
    if (checked) {
      // Set yes state and remove "None" if it exists
      setYesStates(prev => ({ ...prev, [failureType]: true }));
      if (hasSelectedNo(failureType)) {
        onSelectionChange(failureType, 'None', false);
      }
      
      // For DeepFake Success, selecting "Yes" is the final answer.
      if (isDeepFakeSuccess(failureType)) {
        onSelectionChange(failureType, 'Yes', true); // Add a 'Yes' value to the responses
      }

      // Auto-select single option if only one detail option exists
      if (hasSingleOption(failureType)) {
        const choiceData = choices[failureType];
        const singleOption = choiceData.options.filter(option => option !== 'None')[0];
        if (singleOption) {
          onSelectionChange(failureType, singleOption, true);
        }
      }
    } else {
      // Clear yes state and all failure selections
      setYesStates(prev => ({ ...prev, [failureType]: false }));
      const currentSelections = responses[failureType] || [];
      currentSelections.forEach(selection => {
        if (selection !== 'None') {
          onSelectionChange(failureType, selection, false);
        }
      });
    }
  };

  // Handle radio button selection for single-select mode
  const handleRadioSelection = (failureType: string, selectedOption: string) => {
    const currentSelections = responses[failureType] || [];
    
    // Clear all current selections first
    currentSelections.forEach(selection => {
      if (selection !== 'None') {
        onSelectionChange(failureType, selection, false);
      }
    });
    
    // Set the new selection
    if (selectedOption && selectedOption !== 'None') {
      onSelectionChange(failureType, selectedOption, true);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
        Failure Type Analysis
        <Chip 
          label={`${Object.keys(choices).length} categories`}
          size="small"
          variant="outlined"
        />
      </Typography>

      {Object.entries(choices)
        .sort(([,a], [,b]) => (a.order || 999) - (b.order || 999))
        .map(([failureType, choiceData], index) => (
        <Accordion 
          key={failureType}
          defaultExpanded={true}
          sx={{ 
            mb: 2,
            '&:before': { display: 'none' },
            boxShadow: 1
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMore />}
            sx={{ 
              bgcolor: hasSelectedYes(failureType) 
                ? `${getFailureTypeColor(failureType)}.50` 
                : hasSelectedNo(failureType) 
                  ? 'success.50' 
                  : 'grey.50',
              '&:hover': { 
                bgcolor: hasSelectedYes(failureType) 
                  ? `${getFailureTypeColor(failureType)}.100` 
                  : hasSelectedNo(failureType) 
                    ? 'success.100' 
                    : 'grey.100' 
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="h6">
                {getFailureTypeIcon(index)}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {choiceData.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectionSummaries[failureType]}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {hasSelectedYes(failureType) && (
                  <Chip 
                    icon={<CheckCircle />}
                    label={responses[failureType]?.filter(s => s !== 'None').length || 0}
                    size="small"
                    color={getFailureTypeColor(failureType) as any}
                  />
                )}
                {yesStates[failureType] && !hasSelectedNo(failureType) && 
                 (!responses[failureType] || responses[failureType].filter(s => s !== 'None').length === 0) && (
                  <Chip 
                    label="Ready"
                    size="small"
                    color={getFailureTypeColor(failureType) as any}
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            {/* Primary Yes/No Question - Hidden for Difficulty/Success questions */}
            {!shouldHideYesNoLevel(failureType) && (
              <Box sx={{ mb: 3 }}>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hasSelectedNo(failureType)}
                        onChange={(e) => handleNoSelection(failureType, e.target.checked)}
                        color="success"
                      />
                    }
                    label={
                      isDeepFakeSuccess(failureType) ? (
                        <Typography variant="body2">No</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">No</Typography>
                          <Chip label="No failures" size="small" variant="outlined" color="success" />
                        </Box>
                      )
                    }
                    sx={{ mr: 3 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hasSelectedYes(failureType)}
                        onChange={(e) => handleYesSelection(failureType, e.target.checked)}
                        color={getFailureTypeColor(failureType) as any}
                      />
                    }
                    label={
                      isDeepFakeSuccess(failureType) ? (
                        <Typography variant="body2">Yes</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">Yes</Typography>
                          <Chip label="Has failures" size="small" variant="outlined" color={getFailureTypeColor(failureType) as any} />
                        </Box>
                      )
                    }
                  />
                </FormGroup>
              </Box>
            )}

            {/* Show specific failure options if "Yes" is selected and not single option, OR if it's a Difficulty/Success question, BUT NOT for DeepFake Success */}
            {((hasSelectedYes(failureType) && !hasSingleOption(failureType)) || shouldHideYesNoLevel(failureType)) && !isDeepFakeSuccess(failureType) ? (
              <Box sx={{ 
                p: 2, 
                bgcolor: `${getFailureTypeColor(failureType)}.50`, 
                borderRadius: 1,
                border: '1px solid',
                borderColor: `${getFailureTypeColor(failureType)}.200`
              }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {failureType === 'Difficulty' 
                    ? 'What is the level of realism do you think?' 
                    : failureType === 'Success'
                    ? 'How would you rate the success level?'
                    : `What type of ${failureType} failures do you see?`}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  {choiceData.multiple_select ? 'Select all that apply:' : 'Select one option:'}
                </Typography>
                
                {choiceData.multiple_select ? (
                  <FormGroup>
                    {choiceData.options.filter(option => option !== 'None').map((option) => {
                      const isSelected = responses[failureType]?.includes(option) || false;
                      
                      return (
                        <FormControlLabel
                          key={option}
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => onSelectionChange(failureType, option, e.target.checked)}
                              color={getFailureTypeColor(failureType) as any}
                              size="small"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <Typography variant="body2" sx={{ flex: 1 }}>
                                {option}
                              </Typography>
                              {isSelected && (
                                <Chip 
                                  label="✓" 
                                  size="small"
                                  color={getFailureTypeColor(failureType) as any}
                                />
                              )}
                            </Box>
                          }
                          sx={{ 
                            mb: 0.5,
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: isSelected ? `${getFailureTypeColor(failureType)}.100` : 'transparent',
                            '&:hover': { bgcolor: `${getFailureTypeColor(failureType)}.200` }
                          }}
                        />
                      );
                    })}
                  </FormGroup>
                ) : (
                  <RadioGroup
                    value={responses[failureType]?.find(option => option !== 'None') || ''}
                    onChange={(e) => handleRadioSelection(failureType, e.target.value)}
                  >
                    {choiceData.options.filter(option => option !== 'None').map((option) => {
                      const isSelected = responses[failureType]?.includes(option) || false;
                      
                      return (
                        <FormControlLabel
                          key={option}
                          value={option}
                          control={
                            <Radio
                              color={getFailureTypeColor(failureType) as any}
                              size="small"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <Typography variant="body2" sx={{ flex: 1 }}>
                                {option}
                              </Typography>
                              {isSelected && (
                                <Chip 
                                  label="✓" 
                                  size="small"
                                  color={getFailureTypeColor(failureType) as any}
                                />
                              )}
                            </Box>
                          }
                          sx={{ 
                            mb: 0.5,
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: isSelected ? `${getFailureTypeColor(failureType)}.100` : 'transparent',
                            '&:hover': { bgcolor: `${getFailureTypeColor(failureType)}.200` }
                          }}
                        />
                      );
                    })}
                  </RadioGroup>
                )}
              </Box>
            ) : null}

            {/* Selection Summary */}
            {(hasSelectedYes(failureType) || hasSelectedNo(failureType) || shouldHideYesNoLevel(failureType)) && !isDeepFakeSuccess(failureType) && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: hasSelectedNo(failureType) ? 'success.50' : `${getFailureTypeColor(failureType)}.50`, 
                borderRadius: 1,
                border: '1px solid',
                borderColor: hasSelectedNo(failureType) ? 'success.200' : `${getFailureTypeColor(failureType)}.200`
              }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected for {failureType}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {responses[failureType]?.filter(selection => selection !== 'None').map((selection) => (
                    <Chip
                      key={selection}
                      label={selection}
                      size="small"
                      color={getFailureTypeColor(failureType) as any}
                      variant="filled"
                    />
                  ))}
                  {hasSelectedNo(failureType) && (
                    <Chip
                      label="No failures detected"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      
    </Box>
  );
};

// Memoize FailureTypeSelector to prevent unnecessary re-renders of this expensive component
export default React.memo(FailureTypeSelector, (prevProps, nextProps) => {
  // Compare choices object
  const prevChoicesKeys = Object.keys(prevProps.choices);
  const nextChoicesKeys = Object.keys(nextProps.choices);
  
  if (prevChoicesKeys.length !== nextChoicesKeys.length) {
    return false;
  }
  
  for (const key of prevChoicesKeys) {
    if (!nextProps.choices[key] || 
        prevProps.choices[key].text !== nextProps.choices[key].text ||
        prevProps.choices[key].multiple_select !== nextProps.choices[key].multiple_select ||
        JSON.stringify(prevProps.choices[key].options) !== JSON.stringify(nextProps.choices[key].options)) {
      return false;
    }
  }
  
  // Compare responses object deeply
  const prevResponseKeys = Object.keys(prevProps.responses);
  const nextResponseKeys = Object.keys(nextProps.responses);
  
  if (prevResponseKeys.length !== nextResponseKeys.length) {
    return false;
  }
  
  for (const key of prevResponseKeys) {
    if (JSON.stringify(prevProps.responses[key]) !== JSON.stringify(nextProps.responses[key])) {
      return false;
    }
  }
  
  // onSelectionChange function reference comparison (should be stable with useCallback)
  return prevProps.onSelectionChange === nextProps.onSelectionChange;
});