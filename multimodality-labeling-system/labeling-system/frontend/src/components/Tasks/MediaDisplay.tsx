import React, { useState, useEffect } from 'react';
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

interface MediaDisplayProps {
  mediaFiles: MediaFile[];
  taskId: string;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({ mediaFiles, taskId }) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, boolean>>({});
  const [mediaBlobUrls, setMediaBlobUrls] = useState<Record<string, string>>({});

  // Fetch media with authentication using POST with file path
  const fetchMediaWithAuth = async (mediaFile: MediaFile): Promise<string> => {
    const response = await api.getMediaFile(taskId, mediaFile);
    return response;
  };

  // Load media file with authentication
  useEffect(() => {
    const loadMediaFiles = async () => {
      for (const mediaFile of mediaFiles) {
        if (!mediaBlobUrls[mediaFile.filename] && !loadingStates[mediaFile.filename]) {
          setLoadingStates(prev => ({ ...prev, [mediaFile.filename]: true }));
          
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
        }
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
  }, [mediaFiles, taskId]);

  const handleMediaError = (filename: string) => {
    setLoadingStates(prev => ({ ...prev, [filename]: false }));
    setErrorStates(prev => ({ ...prev, [filename]: true }));
  };

  const openMediaDialog = (mediaFile: MediaFile) => {
    setSelectedMedia(mediaFile);
    setDialogOpen(true);
  };

  const closeMediaDialog = () => {
    setSelectedMedia(null);
    setDialogOpen(false);
  };

  const renderMediaItem = (mediaFile: MediaFile, index: number) => {
    const blobUrl = mediaBlobUrls[mediaFile.filename];
    const isLoading = loadingStates[mediaFile.filename];
    const hasError = errorStates[mediaFile.filename];

    return (
      <Box
        key={index}
        sx={{
          position: 'relative',
          height: 180,
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
                  style={{ width: '100%' }}
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
    );
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {mediaFiles.length === 0 ? (
          <Alert severity="warning">
            No media files available for this question.
          </Alert>
        ) : (
          mediaFiles.map((mediaFile, index) => renderMediaItem(mediaFile, index))
        )}
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
                    maxHeight: '70vh',
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
                    maxHeight: '70vh'
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
                    style={{ width: '100%' }}
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

export default MediaDisplay;