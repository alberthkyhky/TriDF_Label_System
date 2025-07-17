import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import MediaDisplay from '../MediaDisplay';

interface MediaFile {
  filename: string;
  file_path: string;
  media_type: 'image' | 'video' | 'audio';
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
}

interface MediaSectionProps {
  mediaFiles: MediaFile[];
  taskId: string;
  questionText: string;
}

export const MediaSection: React.FC<MediaSectionProps> = ({
  mediaFiles,
  taskId,
  questionText
}) => {
  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📱 Media Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare these {mediaFiles.length} media items to identify failures:
          </Typography>
          
          {/* Use the existing MediaDisplay component */}
          <MediaDisplay 
            mediaFiles={mediaFiles}
            taskId={taskId}
          />

          {/* Media Summary */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Media Summary:
            </Typography>
            <Typography variant="body2">
              Total files: {mediaFiles.length} • 
              Types: {[...new Set(mediaFiles.map(m => m.media_type))].join(', ')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};