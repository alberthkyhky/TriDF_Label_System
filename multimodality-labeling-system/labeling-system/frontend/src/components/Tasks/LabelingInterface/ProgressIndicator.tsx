import React from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';

interface ProgressIndicatorProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  taskTitle: string;
  questionOrder: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentQuestionIndex,
  totalQuestions,
  taskTitle,
}) => {
  const getProgressPercentage = () => {
    return totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label={"Task: " + taskTitle}
            variant="outlined"
            sx={{ maxWidth: 300 }}
          />
        </Box>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={getProgressPercentage()}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
};