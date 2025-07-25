import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  ZoomIn,
  VolumeUp,
  Error as ErrorIcon
} from '@mui/icons-material';

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

interface LazyMediaItemProps {
  mediaFile: MediaFile;
  taskId: string;
  onMediaClick?: (mediaFile: MediaFile) => void;
  onMediaError?: (filename: string) => void;
  loadingThreshold?: number;
  rootMargin?: string;
}

interface LazyMediaItemState {
  isVisible: boolean;
  isLoading: boolean;
  hasError: boolean;
  blobUrl: string | null;
  shouldLoad: boolean;
}

const LazyMediaItem: React.FC<LazyMediaItemProps> = ({
  mediaFile,
  taskId,
  onMediaClick,
  onMediaError,
  loadingThreshold = 0.1,
  rootMargin = '100px'
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<LazyMediaItemState>({
    isVisible: false,
    isLoading: false,
    hasError: false,
    blobUrl: null,
    shouldLoad: false
  });

  const fetchMediaWithAuth = useCallback(async (mediaFile: MediaFile): Promise<string> => {
    // Import api dynamically to avoid circular dependencies
    const { api } = await import('../../services/api');
    return api.getMediaFile(taskId, mediaFile);
  }, [taskId]);

  const loadMedia = useCallback(async () => {
    if (state.isLoading || state.blobUrl || state.hasError) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const blobUrl = await fetchMediaWithAuth(mediaFile);
      setState(prev => ({ 
        ...prev, 
        blobUrl,
        isLoading: false,
        hasError: false
      }));
    } catch (error) {
      console.error(`Error loading media ${mediaFile.filename}:`, error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        hasError: true
      }));
      onMediaError?.(mediaFile.filename);
    }
  }, [mediaFile, fetchMediaWithAuth, onMediaError, state.isLoading, state.blobUrl, state.hasError]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, isVisible: true, shouldLoad: true }));
          observer.disconnect();
        }
      },
      {
        threshold: loadingThreshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [loadingThreshold, rootMargin]);

  // Load media when it becomes visible
  useEffect(() => {
    if (state.shouldLoad && !state.blobUrl && !state.isLoading && !state.hasError) {
      // Add slight delay for images, immediate for other media types
      const delay = mediaFile.media_type === 'image' ? 100 : 0;
      const timer = setTimeout(loadMedia, delay);
      return () => clearTimeout(timer);
    }
  }, [state.shouldLoad, state.blobUrl, state.isLoading, state.hasError, loadMedia, mediaFile.media_type]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (state.blobUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(state.blobUrl);
      }
    };
  }, [state.blobUrl]);

  const handleMediaClick = () => {
    if (state.blobUrl && onMediaClick) {
      onMediaClick(mediaFile);
    }
  };

  const renderMediaContent = () => {
    if (state.hasError) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'error.main'
        }}>
          <ErrorIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body2" textAlign="center">
            Failed to load {mediaFile.media_type}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {mediaFile.filename}
          </Typography>
        </Box>
      );
    }

    if (state.isLoading || !state.blobUrl) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading {mediaFile.media_type}...
          </Typography>
        </Box>
      );
    }

    // Render actual media content
    switch (mediaFile.media_type) {
      case 'image':
        return (
          <Box sx={{ position: 'relative', height: '100%' }}>
            <img
              src={state.blobUrl}
              alt={mediaFile.filename}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                cursor: 'pointer'
              }}
              onClick={handleMediaClick}
              loading="lazy"
            />
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
              }}
              size="small"
              onClick={handleMediaClick}
            >
              <ZoomIn />
            </IconButton>
          </Box>
        );

      case 'video':
        return (
          <video
            src={state.blobUrl}
            controls
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            onError={() => setState(prev => ({ ...prev, hasError: true }))}
          >
            Your browser does not support video playback.
          </video>
        );

      case 'audio':
        return (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            p: 3
          }}>
            <VolumeUp sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom textAlign="center">
              {mediaFile.filename}
            </Typography>
            <audio
              src={state.blobUrl}
              controls
              style={{ width: '100%', maxWidth: 300 }}
              onError={() => setState(prev => ({ ...prev, hasError: true }))}
            >
              Your browser does not support audio playback.
            </audio>
            {mediaFile.duration_seconds && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Duration: {Math.round(mediaFile.duration_seconds)}s
              </Typography>
            )}
          </Box>
        );

      default:
        return (
          <Alert severity="warning">
            Unsupported media type: {mediaFile.media_type}
          </Alert>
        );
    }
  };

  const renderPlaceholder = () => {
    return (
      <Box sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height="70%"
          sx={{ borderRadius: 1 }}
        />
        <Box sx={{ mt: 1 }}>
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="60%" height={16} />
        </Box>
      </Box>
    );
  };

  return (
    <Box
      ref={elementRef}
      sx={{
        position: 'relative',
        height: 480,
        bgcolor: 'grey.100',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'grey.300',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* File info chip */}
      <Box sx={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 1,
        bgcolor: 'rgba(0,0,0,0.7)',
        color: 'white',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        fontSize: '0.75rem'
      }}>
        {mediaFile.media_type.toUpperCase()}
        {mediaFile.file_size && ` • ${Math.round(mediaFile.file_size / 1024)}KB`}
      </Box>

      {!state.isVisible ? renderPlaceholder() : renderMediaContent()}
    </Box>
  );
};

export default LazyMediaItem;