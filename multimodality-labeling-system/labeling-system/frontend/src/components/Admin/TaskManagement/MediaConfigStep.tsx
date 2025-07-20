import React from 'react';
import { 
  Box,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { TaskFormData } from '../../../types/createTask';

interface MediaConfigStepProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
}

const MediaConfigStep: React.FC<MediaConfigStepProps> = ({ formData, setFormData }) => {
  
  const updateMediaConfig = (field: string, value: number) => {
    setFormData({
      ...formData,
      media_config: {
        ...formData.media_config,
        [field]: value
      }
    });
  };

  const getTotalMediaFiles = () => {
    return formData.media_config.num_images + 
           formData.media_config.num_videos + 
           formData.media_config.num_audios;
  };

  const getEstimatedTaskLoad = () => {
    const totalMedia = getTotalMediaFiles();
    const totalQuestions = formData.questions_number;
    return totalMedia * totalQuestions;
  };

  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Media Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure how many media files of each type will be used per question.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Images
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Number of Images"
                value={formData.media_config.num_images}
                onChange={(e) => updateMediaConfig('num_images', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 20 }}
                helperText="Images per question (0-20)"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Supported formats: JPG, PNG, GIF, WebP
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Videos
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Number of Videos"
                value={formData.media_config.num_videos}
                onChange={(e) => updateMediaConfig('num_videos', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 10 }}
                helperText="Videos per question (0-10)"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Supported formats: MP4, AVI, MOV, WebM
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Audio
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Number of Audio Files"
                value={formData.media_config.num_audios}
                onChange={(e) => updateMediaConfig('num_audios', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 10 }}
                helperText="Audio files per question (0-10)"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Supported formats: MP3, WAV, AAC, OGG
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Configuration Summary
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ bgcolor: 'info.light' }}>
              <CardContent>
                <Typography variant="subtitle1" color="info.contrastText">
                  Media Files per Question
                </Typography>
                <Typography variant="h4" color="info.contrastText">
                  {getTotalMediaFiles()}
                </Typography>
                <Typography variant="body2" color="info.contrastText">
                  {formData.media_config.num_images} images, {formData.media_config.num_videos} videos, {formData.media_config.num_audios} audio
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ bgcolor: 'success.light' }}>
              <CardContent>
                <Typography variant="subtitle1" color="success.contrastText">
                  Total Media Files Needed
                </Typography>
                <Typography variant="h4" color="success.contrastText">
                  {getEstimatedTaskLoad()}
                </Typography>
                <Typography variant="body2" color="success.contrastText">
                  {getTotalMediaFiles()} × {formData.questions_number} questions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {getTotalMediaFiles() === 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          You must configure at least one media type for your task.
        </Alert>
      )}

      {getTotalMediaFiles() > 10 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          High media count detected. Consider the impact on labeler performance and loading times.
        </Alert>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Media Requirements:</strong> The system will randomly sample the specified number 
          of media files for each question. Ensure you have sufficient media files uploaded 
          to support this configuration.
        </Typography>
      </Box>
    </Box>
  );
};

export default MediaConfigStep;