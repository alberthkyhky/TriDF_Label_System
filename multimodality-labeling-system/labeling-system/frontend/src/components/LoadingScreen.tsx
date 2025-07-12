import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen: React.FC = () => (
  <Box
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
  >
    <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
    <Typography variant="h6" sx={{ color: 'white' }}>
      Loading your workspace...
    </Typography>
  </Box>
);

export default LoadingScreen;