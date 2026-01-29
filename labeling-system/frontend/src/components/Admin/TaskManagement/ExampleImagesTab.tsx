import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  PhotoCamera,
  ZoomIn
} from '@mui/icons-material';
import { TaskWithQuestionsData, ExampleImage } from '../../../types/createTask';
import { api } from '../../../services/api';

interface ExampleImagesTabProps {
  task: TaskWithQuestionsData;
  onTaskChange: (updates: Partial<TaskWithQuestionsData>) => void;
}

const ExampleImagesTab: React.FC<ExampleImagesTabProps> = ({ task, onTaskChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [localCaptions, setLocalCaptions] = useState<{ [key: number]: string }>({});

  // Memoize currentImages to prevent unnecessary re-renders
  const currentImages = useMemo(() => task.example_images || [], [task.example_images]);
  
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
    setSuccess(null);

    try {
      const uploadPromises: Promise<ExampleImage>[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }
        
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 10MB)`);
        }

        // Upload to backend
        uploadPromises.push(api.uploadTaskExampleImage(task.id, file, ''));
      }

      const uploadedImages = await Promise.all(uploadPromises);
      
      // Update task with new images
      const updatedImages = [...currentImages, ...uploadedImages];
      onTaskChange({ example_images: updatedImages });
      
      setSuccess(`Successfully uploaded ${uploadedImages.length} image(s)`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  }, [currentImages, task.id, onTaskChange]);

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

  // Immediate caption change (UI only)
  const handleCaptionChange = useCallback((index: number, caption: string) => {
    // Update local captions immediately for responsive UI
    setLocalCaptions(prev => ({ ...prev, [index]: caption }));
    
    // Clear existing timeout for this image
    if (captionTimeouts.current[index]) {
      clearTimeout(captionTimeouts.current[index]);
    }
    
    // Set new debounced timeout to save to backend
    captionTimeouts.current[index] = setTimeout(async () => {
      try {
        const updatedImages = [...currentImages];
        updatedImages[index] = { ...updatedImages[index], caption };
        
        // Update backend
        await api.updateTaskExampleImages(task.id, updatedImages);
        
        // Update local state
        onTaskChange({ example_images: updatedImages });
        
        // Clear local caption state since it's now saved
        setLocalCaptions(prev => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });
        
        setSuccess('Caption saved');
        setTimeout(() => setSuccess(null), 2000); // Clear success message
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update caption');
        // Keep local caption on error
      }
    }, 1500); // 1.5 second debounce
    
  }, [currentImages, task.id, onTaskChange]);

  // Save caption on blur (immediate save)
  const handleCaptionBlur = useCallback(async (index: number) => {
    const localCaption = localCaptions[index];
    if (localCaption === undefined) return; // No local changes
    
    // Clear timeout since we're saving immediately
    if (captionTimeouts.current[index]) {
      clearTimeout(captionTimeouts.current[index]);
    }
    
    try {
      const updatedImages = [...currentImages];
      updatedImages[index] = { ...updatedImages[index], caption: localCaption };
      
      // Update backend immediately
      await api.updateTaskExampleImages(task.id, updatedImages);
      
      // Update local state
      onTaskChange({ example_images: updatedImages });
      
      // Clear local caption state
      setLocalCaptions(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save caption');
    }
  }, [localCaptions, currentImages, task.id, onTaskChange]);

  const handleDeleteImage = useCallback(async (index: number) => {
    try {
      const imageToDelete = currentImages[index];
      
      // Delete from backend
      await api.deleteTaskExampleImage(task.id, imageToDelete.filename);
      
      // Update local state
      const updatedImages = currentImages.filter((_, i) => i !== index);
      onTaskChange({ example_images: updatedImages });
      
      setSuccess('Image deleted successfully');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  }, [currentImages, task.id, onTaskChange]);

  const handleMoveImage = useCallback(async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= currentImages.length) return;
    
    try {
      const updatedImages = [...currentImages];
      const [movedImage] = updatedImages.splice(fromIndex, 1);
      updatedImages.splice(toIndex, 0, movedImage);
      
      // Update backend
      await api.updateTaskExampleImages(task.id, updatedImages);
      
      // Update local state
      onTaskChange({ example_images: updatedImages });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder images');
    }
  }, [currentImages, task.id, onTaskChange]);

  const handlePreviewImage = useCallback((image: ExampleImage) => {
    // Use direct Supabase URL stored in file_path
    setPreviewImage({
      src: image.file_path,
      alt: image.caption || `Example image: ${image.filename}`
    });
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Example Images
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage example images that help labelers understand the task. These images are shown in the task introduction.
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
        onClick={() => document.getElementById('modify-image-upload-input')?.click()}
      >
        <input
          id="modify-image-upload-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Add More Images
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drop images here or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Support: JPG, PNG, GIF, WebP • Max size: 10MB per image
        </Typography>
        
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Uploading...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Current Images */}
      {currentImages.length > 0 ? (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">
              Current Images ({currentImages.length})
            </Typography>
            <Chip label="Drag to reorder" size="small" variant="outlined" />
          </Box>
          
          <Grid container spacing={2}>
            {currentImages.map((image, index) => (
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
                    image={image.file_path}  // Use direct Supabase URL
                    alt={image.caption || `Example ${index + 1}`}
                    sx={{ 
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={() => handlePreviewImage(image)}
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
                      onClick={() => handlePreviewImage(image)}
                      sx={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                    >
                      <ZoomIn />
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
                          disabled={index === currentImages.length - 1}
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
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <PhotoCamera sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Example Images
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload some example images to help labelers understand the task better.
          </Typography>
        </Box>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.9)' } }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          Image Preview
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 2 }}>
          {previewImage && (
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} sx={{ color: 'white' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Text */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" color="info.contrastText">
          <strong>💡 Tips:</strong> Example images help labelers by showing:
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

export default ExampleImagesTab;