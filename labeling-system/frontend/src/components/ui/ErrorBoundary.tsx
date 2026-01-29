import React, { Component, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Stack,
  Collapse
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  ExpandMore,
  ExpandLess,
  BugReport
} from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  showErrorDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      showErrorDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      showErrorDetails: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleErrorDetails = () => {
    this.setState(prev => ({ showErrorDetails: !prev.showErrorDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component', showDetails = process.env.NODE_ENV === 'development' } = this.props;
      const { error, errorInfo, showErrorDetails } = this.state;

      // Different layouts based on error boundary level
      const containerProps = {
        page: { minHeight: '50vh', p: 4 },
        section: { minHeight: '300px', p: 3 },
        component: { minHeight: '200px', p: 2 }
      };

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            ...containerProps[level]
          }}
        >
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              maxWidth: 600, 
              width: '100%',
              textAlign: 'center'
            }}
          >
            <Stack spacing={2} alignItems="center">
              <ErrorOutline 
                sx={{ 
                  fontSize: level === 'page' ? 64 : level === 'section' ? 48 : 32,
                  color: 'error.main'
                }} 
              />
              
              <Typography 
                variant={level === 'page' ? 'h4' : level === 'section' ? 'h5' : 'h6'}
                color="error.main"
                gutterBottom
              >
                Something went wrong
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ maxWidth: 400 }}
              >
                {level === 'page' 
                  ? 'We encountered an unexpected error while loading this page.'
                  : level === 'section'
                  ? 'This section failed to load properly.'
                  : 'This component encountered an error.'
                }
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRetry}
                  size={level === 'component' ? 'small' : 'medium'}
                >
                  Try Again
                </Button>
                
                {level === 'page' && (
                  <Button
                    variant="outlined"
                    onClick={this.handleReload}
                  >
                    Reload Page
                  </Button>
                )}
              </Stack>

              {/* Error Details (Development only or when showDetails is true) */}
              {showDetails && error && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Button
                    variant="text"
                    startIcon={<BugReport />}
                    endIcon={showErrorDetails ? <ExpandLess /> : <ExpandMore />}
                    onClick={this.toggleErrorDetails}
                    size="small"
                    color="error"
                  >
                    {showErrorDetails ? 'Hide' : 'Show'} Error Details
                  </Button>
                  
                  <Collapse in={showErrorDetails}>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mt: 1, 
                        textAlign: 'left',
                        '& .MuiAlert-message': {
                          width: '100%'
                        }
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Error: {error.name}
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace'
                      }}>
                        {error.message}
                      </Typography>
                      {errorInfo?.componentStack && (
                        <>
                          <Typography variant="subtitle2" sx={{ mt: 1 }}>
                            Component Stack:
                          </Typography>
                          <Typography variant="body2" component="pre" sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            maxHeight: 200,
                            overflow: 'auto'
                          }}>
                            {errorInfo.componentStack}
                          </Typography>
                        </>
                      )}
                    </Alert>
                  </Collapse>
                </Box>
              )}
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;