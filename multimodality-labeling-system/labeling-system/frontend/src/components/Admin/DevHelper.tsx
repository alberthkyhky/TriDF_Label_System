// Create this component: src/components/Admin/DevHelper.tsx
// Add this to your AdminDashboard as a new tab for development/testing

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload,
  Visibility,
  Refresh,
} from '@mui/icons-material';
import { api } from '../../services/api';

interface MediaFile {
  filename: string;
  file_path: string;
  media_type: 'image' | 'video' | 'audio';
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  tags: string[];
  metadata: Record<string, any>;
}

interface MediaAvailableResponse {
  images: MediaFile[];
  videos: MediaFile[];
  audios: MediaFile[];
  total_counts: {
    images: number;
    videos: number;
    audios: number;
    total: number;
  };
}

const DevHelper: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mediaInfo, setMediaInfo] = useState<MediaAvailableResponse | null>(null);

  const handleCreateSampleMedia = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await api.createSampleMediaFiles();
      setSuccess(result.message || 'Sample media files created successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to create sample media files');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAvailableMedia = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getAvailableMedia();
      setMediaInfo(result);
      setSuccess(`Found ${result.total_counts.total} media files total`);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch available media');
      setMediaInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleMedia = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.sampleMediaFiles({
        num_images: 2,
        num_videos: 1,
        num_audios: 1
      });
      setSuccess(`Sampled ${result.sampled_media.length} media files successfully`);
      console.log('Sampled media:', result);
    } catch (error: any) {
      setError(error.message || 'Failed to sample media files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Development Helper
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Tools for testing and development. Use these to set up sample data and test the backend integration.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Media Management Section */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Media File Management
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={handleCreateSampleMedia}
              disabled={loading}
            >
              Create Sample Media
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={handleCheckAvailableMedia}
              disabled={loading}
            >
              Check Available Media
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleSampleMedia}
              disabled={loading}
            >
              Test Media Sampling
            </Button>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Processing...</Typography>
            </Box>
          )}

          {mediaInfo && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Available Media Files:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  label={`${mediaInfo.total_counts.images} Images`} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  label={`${mediaInfo.total_counts.videos} Videos`} 
                  color="secondary" 
                  variant="outlined" 
                />
                <Chip 
                  label={`${mediaInfo.total_counts.audios} Audio Files`} 
                  color="info" 
                  variant="outlined" 
                />
                <Chip 
                  label={`${mediaInfo.total_counts.total} Total`} 
                  color="success" 
                  variant="filled" 
                />
              </Box>

              {mediaInfo.total_counts.total === 0 && (
                <Alert severity="warning">
                  No media files found. Click "Create Sample Media" to generate test files.
                </Alert>
              )}
            </Box>
          )}
        </Paper>

        {/* API Testing Section */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            API Testing
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current backend endpoint: {process.env.REACT_APP_API_URL || 'http://localhost:8000'}
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Testing Steps:</strong>
              <br />1. Create sample media files first
              <br />2. Check available media to verify files exist
              <br />3. Create a task using the main interface
              <br />4. Backend will automatically sample media for questions
            </Typography>
          </Alert>
        </Paper>

        {/* Debug Information */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Debug Information
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
            API URL: {process.env.REACT_APP_API_URL || 'http://localhost:8000'}
            <br />
            Auth Token: {localStorage.getItem('authToken') ? 'Present' : 'Missing'}
            <br />
            Environment: {process.env.NODE_ENV}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default DevHelper;