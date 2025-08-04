// 2. components/AdminDashboard.tsx - Main admin interface
import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab,
  AppBar,
  Toolbar,
  Button 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TaskManagement from './Admin/TaskManagement';
import UserAssignment from './Admin/UserAssignment';
import AssignmentOverview from './Admin/AssignmentOverview';
import { ErrorBoundary } from './ui/ErrorBoundary';
import ViewModeSwitch from './ui/ViewModeSwitch';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user, signOut, viewMode } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleHomeClick = () => {
    // Navigate to home dashboard based on user role and view mode
    if (user?.role === 'admin') {
      navigate(viewMode === 'admin' ? '/admin' : '/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Navigation */}
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={handleHomeClick}
          >
            Admin Dashboard - {user?.full_name || user?.email}
          </Typography>
          <ViewModeSwitch />
          <Button color="inherit" onClick={signOut} sx={{ ml: 2 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Labeling System Administration
        </Typography>
        
        {/* Tab Navigation */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Task Management" />
            <Tab label="User Assignment" />
            <Tab label="Assignment Overview" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <ErrorBoundary level="section">
            <TaskManagement />
          </ErrorBoundary>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <ErrorBoundary level="section">
            <UserAssignment />
          </ErrorBoundary>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <ErrorBoundary level="section">
            <AssignmentOverview />
          </ErrorBoundary>
        </TabPanel>
      </Container>
    </Box>
  );
};

export default AdminDashboard;