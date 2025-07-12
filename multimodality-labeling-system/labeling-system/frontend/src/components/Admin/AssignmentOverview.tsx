// 6. components/Admin/AssignmentOverview.tsx
import React from 'react';
import { 
  Box, 
  Typography,
  Alert
} from '@mui/material';

const AssignmentOverview: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Assignment Overview
      </Typography>
      
      <Alert severity="info">
        Assignment overview dashboard coming soon. This will show:
        <ul>
          <li>All current task assignments</li>
          <li>Progress tracking for each assignment</li>
          <li>User performance metrics</li>
          <li>Task completion statistics</li>
        </ul>
      </Alert>
    </Box>
  );
};

export default AssignmentOverview;