import React from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Chip
} from '@mui/material';
import {
  AdminPanelSettings,
  Assignment
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ViewModeSwitch: React.FC = () => {
  const { user, viewMode, switchViewMode } = useAuth();
  const navigate = useNavigate();

  // Only show to admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode && newMode !== viewMode) {
      switchViewMode(newMode as 'admin' | 'labeler');
      
      // Navigate to the appropriate dashboard
      if (newMode === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" color="inherit" sx={{ fontSize: '0.875rem', opacity: 0.8 }}>
        View as:
      </Typography>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleViewModeChange}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            px: 2,
            py: 0.5,
            fontSize: '0.75rem',
            textTransform: 'none',
            '&.Mui-selected': {
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
              }
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.4)',
            }
          }
        }}
      >
        <ToggleButton value="admin">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <AdminPanelSettings sx={{ fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              Admin
            </Typography>
          </Box>
        </ToggleButton>
        <ToggleButton value="labeler">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Assignment sx={{ fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              Labeler
            </Typography>
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ViewModeSwitch;