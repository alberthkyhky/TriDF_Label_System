import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowForward, CheckCircle, NavigateBefore } from '@mui/icons-material';

interface NavigationControlsProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  isResponseValid: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onSubmit: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentQuestionIndex,
  totalQuestions,
  isResponseValid,
  isSubmitting,
  onPrevious,
  onSubmit
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
        <Typography variant="caption" color="text.secondary">
          {isFinalQuestion ? 'Final question' : 'Continue to next question'}
        </Typography>
        {isSubmitting && (
          <Typography variant="caption" color="primary" display="block">
            Submitting response...
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        endIcon={isFinalQuestion ? <CheckCircle /> : <ArrowForward />}
        onClick={onSubmit}
        disabled={!isResponseValid || isSubmitting}
        sx={{ minWidth: 160 }}
      >
        {isSubmitting ? 'Submitting...' : 
         isFinalQuestion ? 'Complete Task' : 'Next Question'}
      </Button>
    </Box>
  );
};