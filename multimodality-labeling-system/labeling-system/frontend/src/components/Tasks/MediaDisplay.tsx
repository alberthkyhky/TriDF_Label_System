import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Grid
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  Image as ImageIcon,
  VideoLibrary,
  AudioFile,
  Fullscreen
} from '@mui/icons-material';

interface MediaDisplayProps {
  mediaFiles: string[];
  onMediaLoad?: (mediaFile: string) => void;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({ mediaFiles, onMediaLoad }) => {
  const getMediaType = (filename: string): 'image' | 'video' | 'audio' | 'unknown' => {
    const ext = filename.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext || '')) return 'video';
    if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext || '')) return 'audio';
    return 'unknown';
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon />;
      case 'video': return <VideoLibrary />;
      case 'audio': return <AudioFile />;
      default: return <ImageIcon />;
    }
  };

  const getMediaColor = (type: string) => {
    switch (type) {
      case 'image': return 'info';
      case 'video': return 'secondary';
      case 'audio': return 'warning';
      default: return 'default';
    }
  };

  const MediaItem: React.FC<{ mediaFile: string; index: number }> = ({ mediaFile, index }) => {
    const mediaType = getMediaType(mediaFile);
    const [isPlaying, setIsPlaying] = React.useState(false);

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" noWrap sx={{ flex: 1, mr: 1 }}>
              {mediaFile}
            </Typography>
            <Chip 
              icon={getMediaIcon(mediaType)}
              label={mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
              size="small"
              color={getMediaColor(mediaType) as any}
              variant="outlined"
            />
          </Box>

          {/* Media Content Area */}
          <Box
            sx={{
              height: 200,
              bgcolor: 'grey.100',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed',
              borderColor: 'grey.300',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'grey.200',
                borderColor: 'primary.main'
              }
            }}
            onClick={() => onMediaLoad?.(mediaFile)}
          >
            {/* Media Type Specific Content */}
            {mediaType === 'image' && (
              <Box sx={{ textAlign: 'center' }}>
                <ImageIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Click to view image
                </Typography>
              </Box>
            )}

            {mediaType === 'video' && (
              <Box sx={{ textAlign: 'center' }}>
                <VideoLibrary sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Click to play video
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    sx={{ bgcolor: 'background.paper' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(!isPlaying);
                    }}
                  >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <IconButton size="small" sx={{ bgcolor: 'background.paper' }}>
                    <Fullscreen />
                  </IconButton>
                </Box>
              </Box>
            )}

            {mediaType === 'audio' && (
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <AudioFile sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Click to play audio
                </Typography>
                
                {/* Audio Waveform Placeholder */}
                <Box sx={{ 
                  width: '100%', 
                  height: 40, 
                  bgcolor: 'grey.300', 
                  borderRadius: 1, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="caption" color="text.secondary">
                    Audio Waveform
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    sx={{ bgcolor: 'background.paper' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(!isPlaying);
                    }}
                  >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <IconButton size="small" sx={{ bgcolor: 'background.paper' }}>
                    <VolumeUp />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Item Number Badge */}
            <Chip 
              label={`${index + 1}`}
              size="small"
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8,
                bgcolor: 'primary.main',
                color: 'white'
              }}
            />
          </Box>

          {/* Media Info */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {mediaType === 'image' && 'Image file for analysis'}
              {mediaType === 'video' && 'Video file for analysis'}
              {mediaType === 'audio' && 'Audio file for analysis'}
            </Typography>
            
            {mediaType !== 'image' && (
              <Typography variant="caption" color="text.secondary">
                {isPlaying ? 'Playing...' : 'Ready'}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          📱 Media Analysis ({mediaFiles.length} items)
        </Typography>
        <Chip 
          label={`${mediaFiles.length} files to analyze`}
          size="small"
          variant="outlined"
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Compare these media items to identify any failures. Click on each item to interact with it.
      </Typography>

      <Grid container spacing={2}>
        {mediaFiles.map((mediaFile, index) => (
          <Grid size={{ xs: 12, sm: 6, md: mediaFiles.length === 2 ? 6 : 4 }} key={index}>
            <MediaItem mediaFile={mediaFile} index={index} />
          </Grid>
        ))}
      </Grid>

      {/* Comparison Helper */}
      {mediaFiles.length > 1 && (
        <Box sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: 'info.50', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'info.200'
        }}>
          <Typography variant="subtitle2" color="info.dark" gutterBottom>
            💡 Comparison Tips:
          </Typography>
          <Typography variant="body2" color="info.dark">
            • Look for differences between the media items
            • Check for structural issues (cracks, deformation, missing parts)
            • Identify functional problems (electrical, mechanical, software)
            • Notice quality issues (safety, performance, aesthetic)
          </Typography>
        </Box>
      )}
    </Box>);
};