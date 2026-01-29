import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  TextField,
  IconButton,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Chip
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  DragHandle
} from '@mui/icons-material';
import { TaskFormData, ExampleImage } from '../../../types/createTask';

interface ExampleImagesStepProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
}

const ExampleImagesStep: React.FC<ExampleImagesStepProps> = ({ formData, setFormData }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localCaptions, setLocalCaptions] = useState<{ [key: number]: string }>({});
  
  // Debounce timer refs for each image caption
  const captionTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = captionTimeouts.current;
    return () => {
      Object.values(timeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const newImages: ExampleImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }
        
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 10MB)`);
        }
        
        // Create blob URL for preview
        const blobUrl = URL.createObjectURL(file);
        
        // Create ExampleImage object (for preview, actual upload will happen during task creation)
        const exampleImage: ExampleImage = {
          filename: file.name,
          file_path: blobUrl, // Temporary blob URL for preview
          caption: ''
        };
        
        newImages.push(exampleImage);
      }
      
      // Add new images to form data
      setFormData({
        ...formData,
        example_images: [...formData.example_images, ...newImages]
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process images');
    } finally {
      setUploading(false);
    }
  }, [formData, setFormData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e.target.files);
  }, [handleImageUpload]);

  // Immediate caption change (UI only) - no backend calls during creation
  const handleCaptionChange = useCallback((index: number, caption: string) => {
    // Update local captions immediately for responsive UI
    setLocalCaptions(prev => ({ ...prev, [index]: caption }));
    
    // Clear existing timeout for this image
    if (captionTimeouts.current[index]) {
      clearTimeout(captionTimeouts.current[index]);
    }
    
    // Set debounced timeout to update form data
    captionTimeouts.current[index] = setTimeout(() => {
      const updatedImages = [...formData.example_images];
      updatedImages[index] = { ...updatedImages[index], caption };
      setFormData({
        ...formData,
        example_images: updatedImages
      });
      
      // Clear local caption state since it's now in form data
      setLocalCaptions(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }, 500); // Shorter debounce for local form data
    
  }, [formData, setFormData]);

  // Save caption on blur (immediate save to form data)
  const handleCaptionBlur = useCallback((index: number) => {
    const localCaption = localCaptions[index];
    if (localCaption === undefined) return; // No local changes
    
    // Clear timeout since we're saving immediately
    if (captionTimeouts.current[index]) {
      clearTimeout(captionTimeouts.current[index]);
    }
    
    const updatedImages = [...formData.example_images];
    updatedImages[index] = { ...updatedImages[index], caption: localCaption };
    setFormData({
      ...formData,
      example_images: updatedImages
    });
    
    // Clear local caption state
    setLocalCaptions(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  }, [localCaptions, formData, setFormData]);

  const handleDeleteImage = useCallback((index: number) => {
    const imageToDelete = formData.example_images[index];
    
    // Revoke blob URL to prevent memory leaks
    if (imageToDelete.file_path.startsWith('blob:')) {
      URL.revokeObjectURL(imageToDelete.file_path);
    }
    
    const updatedImages = formData.example_images.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      example_images: updatedImages
    });
  }, [formData, setFormData]);

  const handleMoveImage = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.example_images.length) return;
    
    const updatedImages = [...formData.example_images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    setFormData({
      ...formData,
      example_images: updatedImages
    });
  }, [formData, setFormData]);

  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Example Images (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload example images to help labelers understand the task. These will be shown in the task introduction.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Area */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mb: 3,
          textAlign: 'center',
          border: dragOver ? '2px dashed primary.main' : '2px dashed grey.300',
          backgroundColor: dragOver ? 'action.hover' : 'background.default',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('image-upload-input')?.click()}
      >
        <input
          id="image-upload-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Drop images here or click to browse
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Support: JPG, PNG, GIF, WebP • Max size: 10MB per image
        </Typography>
        
        {uploading && (
          <CircularProgress size={24} />
        )}
      </Paper>

      {/* Current Images */}
      {formData.example_images.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">
              Example Images ({formData.example_images.length})
            </Typography>
            <Chip label="Drag to reorder" size="small" variant="outlined" />
          </Box>
          
          <Grid container spacing={2}>
            {formData.example_images.map((image, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    position: 'relative',
                    '&:hover .image-actions': {
                      opacity: 1
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="150"
                    image={image.file_path}
                    alt={image.caption || `Example ${index + 1}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  
                  {/* Image Actions Overlay */}
                  <Box
                    className="image-actions"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      gap: 0.5,
                      opacity: 0,
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleMoveImage(index, index - 1)}
                      disabled={index === 0}
                      sx={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                    >
                      <DragHandle />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteImage(index)}
                      sx={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Caption (optional)"
                      value={localCaptions[index] !== undefined ? localCaptions[index] : (image.caption || '')}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      onBlur={() => handleCaptionBlur(index)}
                      variant="outlined"
                      size="small"
                      placeholder="Describe this example..."
                      helperText={localCaptions[index] !== undefined ? "Changes will be saved..." : ""}
                    />
                    
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Position {index + 1}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button
                          size="small"
                          onClick={() => handleMoveImage(index, index - 1)}
                          disabled={index === 0}
                        >
                          ←
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleMoveImage(index, index + 1)}
                          disabled={index === formData.example_images.length - 1}
                        >
                          →
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Help Text */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" color="info.contrastText">
          <strong>💡 Tips:</strong> Good example images help labelers understand:
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
            <li>What types of content they'll be analyzing</li>
            <li>Common failure patterns to look for</li>
            <li>Quality standards and expectations</li>
            <li>Edge cases or difficult scenarios</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
};

export default ExampleImagesStep;