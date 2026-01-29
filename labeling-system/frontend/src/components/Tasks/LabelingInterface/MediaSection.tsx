import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent, Grid, useTheme, useMediaQuery } from '@mui/material';
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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Memoize expensive media type aggregation calculation
  const mediaTypesSummary = useMemo(() => {
    const uniqueTypes = [...new Set(mediaFiles.map(m => m.media_type))];
    return `Total files: ${mediaFiles.length} • Types: ${uniqueTypes.join(', ')}`;
  }, [mediaFiles]);

  // Calculate sticky positioning styles
  const stickyStyles = useMemo(() => {
    if (!isDesktop) {
      // No sticky behavior on mobile/tablet - use normal flow
      return {};
    }
    
    return {
      position: 'sticky' as const,
      top: 80, // AppBar height (64px) + some padding (16px)
      zIndex: 10,
      maxHeight: 'calc(100vh - 96px)', // Full height minus top offset and some bottom padding
      overflowY: 'auto' as const,
      // Add subtle shadow to distinguish sticky section
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      borderRadius: 2,
    };
  }, [isDesktop]);

  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <Card sx={stickyStyles}>
        <CardContent sx={{ 
          maxHeight: isDesktop ? 'calc(100vh - 160px)' : 'none',
          overflowY: isDesktop ? 'auto' : 'visible',
          // Ensure padding is maintained even with internal scrolling
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(0,0,0,0.5)',
            }
          }
        }}>
          <Typography variant="h6" gutterBottom>
            📱 Media Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare these {mediaFiles.length} media items to identify failures:
          </Typography>
          
          {/* Use the existing MediaDisplay component with lazy loading enabled */}
          <MediaDisplay 
            mediaFiles={mediaFiles}
            taskId={taskId}
            useLazyLoading={true}
          />

          {/* Media Summary */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Media Summary:
            </Typography>
            <Typography variant="body2">
              {mediaTypesSummary}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};