import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import {
  ZoomIn,
  VolumeUp,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import LazyMediaItem from './LazyMediaItem';

interface MediaFile {
  filename: string;
  file_path: string;
  media_type: 'image' | 'video' | 'audio';
  file_size?: number;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  key?: string; // The original key from the data (e.g., 'output_wav', 'other_wav')
  caption?: string; // Alternative to key field (from backend)
  display_name?: string; // Human-readable display name
}

interface MediaDisplayProps {
  mediaFiles: MediaFile[];
  taskId: string;
  useLazyLoading?: boolean;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({ 
  mediaFiles, 
  taskId, 
  useLazyLoading = true 
}) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, boolean>>({});
  const [mediaBlobUrls, setMediaBlobUrls] = useState<Record<string, string>>({});

  // Fetch media with authentication using POST with file path
  const fetchMediaWithAuth = useCallback(async (mediaFile: MediaFile): Promise<string> => {
    const response = await api.getMediaFile(taskId, mediaFile);
    return response;
  }, [taskId]);

  // Load media files with authentication (only for eager loading mode)
  useEffect(() => {
    if (useLazyLoading) {
      // Skip eager loading when using lazy loading
      return;
    }

    const loadMediaFiles = async () => {
      // Prioritize images over videos/audio for faster perceived loading
      const prioritizedFiles = [...mediaFiles].sort((a, b) => {
        const priority = { image: 0, video: 1, audio: 2 };
        return priority[a.media_type] - priority[b.media_type];
      });

      // Load images immediately in parallel
      const imageFiles = prioritizedFiles.filter(f => f.media_type === 'image');
      const otherFiles = prioritizedFiles.filter(f => f.media_type !== 'image');

      // Set loading state for all files
      const filesToLoad = prioritizedFiles.filter(
        file => !mediaBlobUrls[file.filename] && !loadingStates[file.filename]
      );

      if (filesToLoad.length === 0) return;

      // Set loading states
      filesToLoad.forEach(file => {
        setLoadingStates(prev => ({ ...prev, [file.filename]: true }));
      });

      // Load images first (parallel)
      const imagePromises = imageFiles
        .filter(file => !mediaBlobUrls[file.filename])
        .map(async (mediaFile) => {
          try {
            const blobUrl = await fetchMediaWithAuth(mediaFile);
            setMediaBlobUrls(prev => ({ ...prev, [mediaFile.filename]: blobUrl }));
            setLoadingStates(prev => ({ ...prev, [mediaFile.filename]: false }));
            setErrorStates(prev => ({ ...prev, [mediaFile.filename]: false }));
          } catch (error) {
            console.error(`Error loading media ${mediaFile.filename}:`, error);
            setLoadingStates(prev => ({ ...prev, [mediaFile.filename]: false }));
            setErrorStates(prev => ({ ...prev, [mediaFile.filename]: true }));
          }
        });

      await Promise.all(imagePromises);

      // Load videos/audio with slight delay (parallel)
      if (otherFiles.length > 0) {
        setTimeout(() => {
          const otherPromises = otherFiles
            .filter(file => !mediaBlobUrls[file.filename])
            .map(async (mediaFile) => {
              try {
                const blobUrl = await fetchMediaWithAuth(mediaFile);
                setMediaBlobUrls(prev => ({ ...prev, [mediaFile.filename]: blobUrl }));
                setLoadingStates(prev => ({ ...prev, [mediaFile.filename]: false }));
                setErrorStates(prev => ({ ...prev, [mediaFile.filename]: false }));
              } catch (error) {
                console.error(`Error loading media ${mediaFile.filename}:`, error);
                setLoadingStates(prev => ({ ...prev, [mediaFile.filename]: false }));
                setErrorStates(prev => ({ ...prev, [mediaFile.filename]: true }));
              }
            });

          Promise.all(otherPromises);
        }, 100);
      }
    };

    loadMediaFiles();

    // Cleanup blob URLs when component unmounts
    return () => {
      Object.values(mediaBlobUrls).forEach(blobUrl => {
        if (blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
      });
    };
  }, [mediaFiles, taskId, useLazyLoading, mediaBlobUrls, loadingStates, fetchMediaWithAuth]);

  const handleMediaError = useCallback((filename: string) => {
    setLoadingStates(prev => ({ ...prev, [filename]: false }));
    setErrorStates(prev => ({ ...prev, [filename]: true }));
  }, []);

  const openMediaDialog = useCallback((mediaFile: MediaFile) => {
    setSelectedMedia(mediaFile);
    setDialogOpen(true);
  }, []);

  const closeMediaDialog = useCallback(() => {
    setSelectedMedia(null);
    setDialogOpen(false);
  }, []);

  const renderMediaItem = (mediaFile: MediaFile, index: number) => {
    const blobUrl = mediaBlobUrls[mediaFile.filename];
    const isLoading = loadingStates[mediaFile.filename];
    const hasError = errorStates[mediaFile.filename];

    // Debug logging for media file rendering
    console.log(`🎨 Rendering media item ${index}:`, {
      filename: mediaFile.filename,
      has_key: !!mediaFile.key,
      has_caption: !!mediaFile.caption,
      has_display_name: !!mediaFile.display_name,
      key_value: mediaFile.key,
      caption_value: mediaFile.caption,
      display_name: mediaFile.display_name
    });

    return (
      <Box key={index}>
        {/* Key as H2 text above media */}
        {mediaFile.key && (
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            {mediaFile.key}
          </Typography>
        )}
        
        <Box
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
        {/* Loading State */}
        {isLoading && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            bgcolor: 'rgba(255,255,255,0.8)',
            borderRadius: 1,
            p: 2
          }}>
            <CircularProgress size={30} />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Loading...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {hasError && (
          <Box sx={{ textAlign: 'center', color: 'error.main' }}>
            <ErrorIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="caption" display="block">
              Failed to load
            </Typography>
            <Typography variant="caption" display="block">
              {mediaFile.filename}
            </Typography>
          </Box>
        )}

        {/* Media Content */}
        {!hasError && blobUrl && (
          <>
            {mediaFile.media_type === 'image' && (
              <img
                src={blobUrl}
                alt={mediaFile.filename}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  cursor: 'pointer'
                }}
                onError={() => handleMediaError(mediaFile.filename)}
                onClick={() => openMediaDialog(mediaFile)}
              />
            )}

            {mediaFile.media_type === 'video' && (
              <video
                src={blobUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                controls
                preload="metadata"
                onError={() => handleMediaError(mediaFile.filename)}
              >
                Your browser does not support the video tag.
              </video>
            )}

            {mediaFile.media_type === 'audio' && (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'grey.200',
                p: 2
              }}>
                <VolumeUp sx={{ fontSize: 40, mb: 2, color: 'primary.main' }} />
                <audio
                  src={blobUrl}
                  controls
                  style={{ width: '100%', minWidth: '300px' }}
                  onError={() => handleMediaError(mediaFile.filename)}
                >
                  Your browser does not support the audio tag.
                </audio>
                <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>
                  {mediaFile.filename}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Media Info Overlay */}
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 0.5
        }}>
          <Chip 
            label={`${index + 1}`}
            size="small"
            color="primary"
          />
          {mediaFile.media_type === 'image' && blobUrl && (
            <IconButton
              size="small"
              sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
              onClick={() => openMediaDialog(mediaFile)}
            >
              <ZoomIn fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Media Type Badge */}
        <Chip
          label={mediaFile.media_type.toUpperCase()}
          size="small"
          color={
            mediaFile.media_type === 'image' ? 'success' :
            mediaFile.media_type === 'video' ? 'warning' : 'info'
          }
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8
          }}
        />

        {/* Duration Badge for Video/Audio */}
        {mediaFile.duration_seconds && (
          <Chip
            label={`${Math.round(mediaFile.duration_seconds)}s`}
            size="small"
            variant="outlined"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(255,255,255,0.9)'
            }}
          />
        )}
        </Box>
      </Box>
    );
  };

  // Render method selection based on lazy loading preference
  const renderMediaList = () => {
    if (mediaFiles.length === 0) {
      return (
        <Alert severity="warning">
          No media files available for this question.
        </Alert>
      );
    }

    if (useLazyLoading) {
      // Use lazy loading components
      return mediaFiles.map((mediaFile, index) => (
        <ErrorBoundary key={index} level="component">
          <LazyMediaItem
            mediaFile={mediaFile}
            taskId={taskId}
            onMediaClick={openMediaDialog}
            onMediaError={handleMediaError}
            loadingThreshold={0.1}
            rootMargin="100px"
          />
        </ErrorBoundary>
      ));
    } else {
      // Use traditional eager loading (fallback)
      return mediaFiles.map((mediaFile, index) => (
        <ErrorBoundary key={index} level="component">
          {renderMediaItem(mediaFile, index)}
        </ErrorBoundary>
      ));
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {renderMediaList()}
      </Box>

      {/* Media Preview Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeMediaDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedMedia?.filename}
          <Typography variant="body2" color="text.secondary">
            {selectedMedia?.media_type} • {selectedMedia?.file_size ? `${Math.round(selectedMedia.file_size / 1024)} KB` : 'Unknown size'}
            {selectedMedia?.width && selectedMedia?.height && ` • ${selectedMedia.width}×${selectedMedia.height}`}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedMedia && (
            <Box sx={{ textAlign: 'center' }}>
              {selectedMedia.media_type === 'image' && mediaBlobUrls[selectedMedia.filename] && (
                <img
                  src={mediaBlobUrls[selectedMedia.filename]}
                  alt={selectedMedia.filename}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '140vh',
                    objectFit: 'contain'
                  }}
                />
              )}
              {selectedMedia.media_type === 'video' && mediaBlobUrls[selectedMedia.filename] && (
                <video
                  src={mediaBlobUrls[selectedMedia.filename]}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '140vh'
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {selectedMedia.media_type === 'audio' && mediaBlobUrls[selectedMedia.filename] && (
                <Box sx={{ p: 4 }}>
                  <VolumeUp sx={{ fontSize: 80, mb: 2, color: 'primary.main' }} />
                  <audio
                    src={mediaBlobUrls[selectedMedia.filename]}
                    controls
                    style={{ width: '100%', minWidth: '300px' }}
                    autoPlay
                  >
                    Your browser does not support the audio tag.
                  </audio>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMediaDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Memoize MediaDisplay to prevent unnecessary re-renders of this expensive component
export default React.memo(MediaDisplay, (prevProps, nextProps) => {
  // Compare mediaFiles array deeply (by length and file paths)
  if (prevProps.mediaFiles.length !== nextProps.mediaFiles.length) {
    return false;
  }
  
  for (let i = 0; i < prevProps.mediaFiles.length; i++) {
    if (prevProps.mediaFiles[i].file_path !== nextProps.mediaFiles[i].file_path) {
      return false;
    }
  }
  
  // Compare taskId
  if (prevProps.taskId !== nextProps.taskId) {
    return false;
  }
  
  return true; // Props are equal, skip re-render
});