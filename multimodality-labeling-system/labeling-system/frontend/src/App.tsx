import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard';
import LoadingScreen from './components/LoadingScreen';
import AdminDashboard from './components/AdminDashboard';
import ApiTest from './components/ApiTest';

const theme = createTheme({
  palette: {
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' },
  },
});

// Protected route component with optional role-based access
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: string;
}) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  // If a specific role is required, check if user has that role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = user.role === 'admin' ? '/admin' : '/';
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};

// Component to handle root route redirection based on user role
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  // Redirect based on user role
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

const AppContent = () => {
  const { user, loading } = useAuth();
  
  return (
    <Router>
      <Routes>
        {/* Login route - redirect to appropriate dashboard if already logged in */}
        <Route 
          path="/login" 
          element={
            user ? (
              user.role === 'admin' ? 
                <Navigate to="/admin" replace /> : 
                <Navigate to="/dashboard" replace />
            ) : (
              <LoginForm />
            )
          } 
        />
        
        {/* Root route - redirect based on user role */}
        <Route 
          path="/" 
          element={<RoleBasedRedirect />}
        />
        <Route 
          path="/api-test" 
          element={
            <ProtectedRoute>
              <ApiTest />
            </ProtectedRoute>
          } 
        />
        {/* Admin dashboard - admin only */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Regular dashboard - labelers and other non-admin users */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback route - redirect to appropriate dashboard */}
        <Route 
          path="*" 
          element={<RoleBasedRedirect />}
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;