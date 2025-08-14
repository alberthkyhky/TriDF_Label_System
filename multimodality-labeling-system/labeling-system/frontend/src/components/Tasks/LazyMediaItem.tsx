import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Skeleton
} from '@mui/material';
import {
  VolumeUp,
  Error as ErrorIcon
} from '@mui/icons-material';
import { MediaFile } from '../../types/createTask';

interface LazyMediaItemProps {
  mediaFile: MediaFile;
  taskId: string;
  onMediaClick?: (mediaFile: MediaFile) => void;
  onMediaError?: (filename: string) => void;
  onBlobUrlReady?: (filename: string, blobUrl: string) => void;
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
  onBlobUrlReady,
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
      
      // Notify parent about the blob URL
      if (blobUrl && onBlobUrlReady) {
        onBlobUrlReady(mediaFile.filename, blobUrl);
      }
    } catch (error) {
      console.error(`Error loading media ${mediaFile.filename}:`, error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        hasError: true
      }));
      onMediaError?.(mediaFile.filename);
    }
  }, [mediaFile, fetchMediaWithAuth, onMediaError, onBlobUrlReady, state.isLoading, state.blobUrl, state.hasError]);

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

  // Load media when it becomes visible (skip loading for text files)
  useEffect(() => {
    if (mediaFile.media_type === 'text') {
      // Text files don't need blob URLs, mark as ready
      setState(prev => ({ ...prev, blobUrl: 'ready' }));
      // Notify parent that text content is ready (use file_path as content)
      if (onBlobUrlReady) {
        onBlobUrlReady(mediaFile.filename, 'ready');
      }
      return;
    }
    
    if (state.shouldLoad && !state.blobUrl && !state.isLoading && !state.hasError) {
      // Add slight delay for images, immediate for other media types
      const delay = mediaFile.media_type === 'image' ? 100 : 0;
      const timer = setTimeout(loadMedia, delay);
      return () => clearTimeout(timer);
    }
  }, [state.shouldLoad, state.blobUrl, state.isLoading, state.hasError, loadMedia, mediaFile.media_type, mediaFile.filename, onBlobUrlReady]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (state.blobUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(state.blobUrl);
      }
    };
  }, [state.blobUrl]);

  const handleMediaClick = () => {
    if ((state.blobUrl || mediaFile.media_type === 'text') && onMediaClick) {
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

    if (state.isLoading || (!state.blobUrl && mediaFile.media_type !== 'text')) {
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
          <img
            src={state.blobUrl || ''}
            alt={mediaFile.filename}
            style={{
              width: '100%',
              height: 'auto',
              minHeight: '200px',
              maxHeight: '400px',
              objectFit: 'contain'
            }}
            loading="lazy"
          />
        );

      case 'video':
        return (
          <video
            src={state.blobUrl || ''}
            controls
            preload="metadata"
            style={{
              width: '100%',
              height: 'auto',
              minHeight: '200px',
              maxHeight: '400px',
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
            height: 150,
            width: '100%',
            bgcolor: 'grey.200',
            p: 2
          }}>
            <VolumeUp sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <audio
              src={state.blobUrl || ''}
              controls
              style={{ width: '100%', maxWidth: '300px' }}
              onError={() => setState(prev => ({ ...prev, hasError: true }))}
            >
              Your browser does not support audio playback.
            </audio>
            <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>
              {mediaFile.filename}
            </Typography>
          </Box>
        );

      case 'text':
        return (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            minHeight: 150,
            maxHeight: 200,
            width: '100%',
            p: 2,
            bgcolor: 'grey.50',
            overflow: 'auto'
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                textAlign: 'left',
                width: '100%',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.5,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: 'text.primary'
              }}
            >
              {mediaFile.file_path}
            </Typography>
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
    <Box>
      {/* Key as H2 text above media */}
      {mediaFile.key && (
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          {mediaFile.key}
        </Typography>
      )}
      
      <Box
        ref={elementRef}
        sx={{
          position: 'relative',
          // Dynamic height based on media type
          ...(mediaFile.media_type === 'text' || mediaFile.media_type === 'audio' ? {
            height: 'auto',
            minHeight: 150
          } : {
            minHeight: 200,
            height: 'auto',
            cursor: ['image', 'video'].includes(mediaFile.media_type) ? 'pointer' : 'default'
          }),
          bgcolor: 'grey.100',
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'grey.300',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => ['image', 'video'].includes(mediaFile.media_type) ? handleMediaClick() : undefined}
      >
      {!state.isVisible ? renderPlaceholder() : renderMediaContent()}
      </Box>
    </Box>
  );
};

export default LazyMediaItem;