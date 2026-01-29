import React from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { ArrowForward, CheckCircle, NavigateBefore, Edit, Schedule } from '@mui/icons-material';

interface NavigationControlsProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  isResponseValid: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onSubmit: () => void;
  hasExistingResponse: boolean;
  existingResponseData: any;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentQuestionIndex,
  totalQuestions,
  isResponseValid,
  isSubmitting,
  onPrevious,
  onSubmit,
  hasExistingResponse,
  existingResponseData
}) => {
  const isFinalQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mt: 4,
      p: 3,
      bgcolor: 'grey.50',
      borderRadius: 2
    }}>
      <Button
        variant="outlined"
        startIcon={<NavigateBefore />}
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
      >
        Previous Question
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Typography>
        {hasExistingResponse && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <Chip
              icon={<Edit />}
              label={`Previously answered ${existingResponseData?.submitted_at ? new Date(existingResponseData.submitted_at).toLocaleDateString() : ''}`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Chip
              icon={<Schedule />}
              label={`${existingResponseData?.time_spent_seconds || 0}s spent`}
              size="small"
              color="default"
              variant="outlined"
            />
          </Box>
        )}
        <Typography variant="caption" color="text.secondary">
          {hasExistingResponse 
            ? 'Modify your previous answer' 
            : isFinalQuestion ? 'Final question' : 'Continue to next question'
          }
        </Typography>
        {isSubmitting && (
          <Typography variant="caption" color="primary" display="block">
            {hasExistingResponse ? 'Updating response...' : 'Submitting response...'}
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        endIcon={hasExistingResponse ? <Edit /> : isFinalQuestion ? <CheckCircle /> : <ArrowForward />}
        onClick={onSubmit}
        disabled={!isResponseValid || isSubmitting}
        sx={{ minWidth: 160 }}
        color={hasExistingResponse ? "secondary" : "primary"}
      >
        {isSubmitting ? (hasExistingResponse ? 'Updating...' : 'Submitting...') : 
         hasExistingResponse ? 'Update Answer' :
         isFinalQuestion ? 'Complete Task' : 'Next Question'}
      </Button>
    </Box>
  );
};