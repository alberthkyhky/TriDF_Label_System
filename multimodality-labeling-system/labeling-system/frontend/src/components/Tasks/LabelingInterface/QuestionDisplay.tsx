import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import FailureTypeSelector from '../FailureTypeSelector';

interface FailureChoice {
  text: string;
  options: string[];
  multiple_select: boolean;
  order?: number;
}

interface QuestionDisplayProps {
  questionText: string;
  questionId: string;
  questionStatus: string;
  choices: {
    [key: string]: FailureChoice;
  };
  responses: {
    [failureType: string]: string[];
  };
  onSelectionChange: (failureType: string, option: string, checked: boolean) => void;
  isResponseValid: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questionText,
  questionId,
  questionStatus,
  choices,
  responses,
  onSelectionChange,
  isResponseValid
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          {questionText}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          For each failure type, first indicate if failures are present, then specify the types.
        </Typography>

        {/* Use FailureTypeSelector component with real data */}
        <FailureTypeSelector
          choices={choices}
          responses={responses}
          onSelectionChange={onSelectionChange}
        />

        {/* Response Summary */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Selections:
          </Typography>
          {Object.entries(responses).length > 0 ? (
            Object.entries(responses).map(([failureType, selections]) => (
              selections && selections.length > 0 && (
                <Typography key={failureType} variant="caption" display="block">
                  <strong>{failureType}:</strong> {selections.join(', ')}
                </Typography>
              )
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              No selections made yet.
            </Typography>
          )}
          {!isResponseValid && (
            <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
              Please make a selection for each failure type.
            </Typography>
          )}
        </Box>

        {/* Question Metadata */}
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Question ID: {questionId} • Status: {questionStatus}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};