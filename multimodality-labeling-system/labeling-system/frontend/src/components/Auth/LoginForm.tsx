import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Assignment,
  RateReview
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const LoginForm: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (tab === 0) {
        console.log('Signing in:', email);
        await signIn(email, password);
      } else {
        console.log('Signing up:', email, fullName);
        await signUp(email, password, fullName);
        setSuccess('Account created successfully! Please check your email for verification.');
        // Reset form
        setEmail('');
        setPassword('');
        setFullName('');
        // Switch to login tab after successful signup
        setTimeout(() => {
          setTab(0);
          setSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Demo accounts section
  const DemoAccounts = () => (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Demo Accounts (for testing):
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettings fontSize="small" color="primary" />
          <Typography variant="caption">
            Admin: admin@example.com
          </Typography>
          <Chip label="Full Access" size="small" color="primary" />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment fontSize="small" color="success" />
          <Typography variant="caption">
            Labeler: labeler@example.com
          </Typography>
          <Chip label="Labeling Tasks" size="small" color="success" />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RateReview fontSize="small" color="warning" />
          <Typography variant="caption">
            Reviewer: reviewer@example.com
          </Typography>
          <Chip label="Review Tasks" size="small" color="warning" />
        </Box>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Password for all demo accounts: password123
      </Typography>
    </Box>
  );

  // Quick login buttons for demo accounts
  const QuickLoginButtons = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Quick Demo Login:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AdminPanelSettings />}
          onClick={() => {
            setEmail('admin@example.com');
            setPassword('password123');
          }}
        >
          Admin
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Assignment />}
          onClick={() => {
            setEmail('labeler@example.com');
            setPassword('password123');
          }}
        >
          Labeler
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RateReview />}
          onClick={() => {
            setEmail('reviewer@example.com');
            setPassword('password123');
          }}
        >
          Reviewer
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Paper elevation={10} sx={{ width: '100%', maxWidth: 450, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography 
            variant="h4" 
            align="center" 
            gutterBottom
            sx={{ 
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Labeling System
          </Typography>
          <Typography variant="subtitle1" align="center" color="text.secondary">
            Multi-modal Data Annotation Platform
          </Typography>
        </Box>

        <Tabs 
          value={tab} 
          onChange={(e, newValue) => {
            setTab(newValue);
            setError('');
            setSuccess('');
          }} 
          centered
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
        </Tabs>

        <form onSubmit={handleSubmit}>
          <TabPanel value={tab} index={0}>
            <Typography variant="h5" align="center" gutterBottom>
              Welcome Back! 👋
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
              Sign in to access your labeling tasks
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              placeholder="Enter your email address"
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                }
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <QuickLoginButtons />
            <DemoAccounts />
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Typography variant="h5" align="center" gutterBottom>
              Join Our Team! 🚀
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
              Create an account to start labeling data
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              margin="normal"
              required
              autoComplete="name"
              placeholder="Enter your full name"
            />
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              placeholder="Enter your email address"
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="new-password"
              placeholder="Create a strong password"
              helperText="Password must be at least 6 characters"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                New accounts are assigned the <strong>labeler</strong> role by default. 
                Contact an administrator to change your role if needed.
              </Typography>
            </Alert>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 2, 
                mb: 2, 
                py: 1.5,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                }
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>

            <Typography variant="body2" color="text.secondary" align="center">
              Already have an account?{' '}
              <Button 
                color="primary" 
                onClick={() => setTab(0)}
                sx={{ textTransform: 'none' }}
              >
                Sign in here
              </Button>
            </Typography>
          </TabPanel>
        </form>

        {/* Footer */}
        <Box sx={{ p: 2, pt: 0 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Secure authentication powered by Supabase
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
            <Chip label="Images" size="small" variant="outlined" />
            <Chip label="Videos" size="small" variant="outlined" />
            <Chip label="Audio" size="small" variant="outlined" />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;