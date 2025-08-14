/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { PlayArrow, ArrowBack, ZoomIn, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { TaskWithQuestionsData } from '../../types/createTask';

const TaskIntroduction: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [task, setTask] = useState<TaskWithQuestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string; caption?: string } | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setError('No task ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch enhanced task data from backend
        const taskData = await api.getTaskWithQuestions(taskId);
        setTask(taskData);
        
        console.log('Fetched task data:', taskData);
        
      } catch (error: any) {
        console.error('Error fetching task:', error);
        setError(error.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  // Reset current image index when task changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [task?.id]);


  const handleStartLabeling = () => {
    navigate(`/task/${taskId}/label`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleImageClick = useCallback((imageSrc: string, caption?: string, index?: number) => {
    setPreviewImage({
      src: imageSrc,
      alt: caption || `Example image ${index !== undefined ? index + 1 : ''}`,
      caption
    });
    // Sync the preview with the current image index
    if (index !== undefined) {
      setCurrentImageIndex(index);
    }
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewImage(null);
    setIsImageZoomed(false);
    setImageNaturalSize(null);
  }, []);

  const handleImageDoubleClick = useCallback(() => {
    setIsImageZoomed(prev => !prev);
  }, []);

  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImageNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  }, []);

  const handlePreviousImage = useCallback(() => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : (task?.example_images?.length || 1) - 1);
  }, [task?.example_images?.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex(prev => prev < (task?.example_images?.length || 1) - 1 ? prev + 1 : 0);
  }, [task?.example_images?.length]);

  const handleImageStackClick = useCallback((clickedIndex: number) => {
    setCurrentImageIndex(clickedIndex);
  }, []);

  const handlePreviewPrevious = useCallback(() => {
    if (!task?.example_images) return;
    
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : task.example_images.length - 1;
    setCurrentImageIndex(newIndex);
    
    // Update preview image
    const newImage = task.example_images[newIndex];
    setPreviewImage({
      src: newImage.file_path,
      alt: newImage.caption || `Example ${newIndex + 1}`,
      caption: newImage.caption
    });
    setIsImageZoomed(false); // Reset zoom when changing images
    setImageNaturalSize(null); // Reset size calculation
  }, [currentImageIndex, task?.example_images]);

  const handlePreviewNext = useCallback(() => {
    if (!task?.example_images) return;
    
    const newIndex = currentImageIndex < task.example_images.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    
    // Update preview image
    const newImage = task.example_images[newIndex];
    setPreviewImage({
      src: newImage.file_path,
      alt: newImage.caption || `Example ${newIndex + 1}`,
      caption: newImage.caption
    });
    setIsImageZoomed(false); // Reset zoom when changing images
    setImageNaturalSize(null); // Reset size calculation
  }, [currentImageIndex, task?.example_images]);

  // Add keyboard navigation for full-screen preview
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!previewImage || !task?.example_images || task.example_images.length <= 1) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePreviewPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handlePreviewNext();
          break;
        case 'Escape':
          event.preventDefault();
          handleClosePreview();
          break;
      }
    };

    if (previewImage) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewImage, task?.example_images, handlePreviewPrevious, handlePreviewNext, handleClosePreview]);

  // Calculate optimal image size for preview
  const imageDisplaySize = useMemo(() => {
    if (!imageNaturalSize) return null;
    
    const maxViewportWidth = window.innerWidth - 80; // Account for dialog padding
    const maxViewportHeight = window.innerHeight * 0.9 - 200; // Account for dialog header/footer
    
    const { width: naturalWidth, height: naturalHeight } = imageNaturalSize;
    
    // Calculate fit-to-screen dimensions (proportionally scaled to fit viewport)
    const widthRatio = maxViewportWidth / naturalWidth;
    const heightRatio = maxViewportHeight / naturalHeight;
    const fitToScreenScale = Math.min(widthRatio, heightRatio, 1); // Never scale up to fit
    
    const fitToScreenWidth = naturalWidth * fitToScreenScale;
    const fitToScreenHeight = naturalHeight * fitToScreenScale;
    
    if (isImageZoomed) {
      // When zoomed, ensure we have a meaningful zoom:
      // - If image is large (requires scaling down): show at actual size (scale = 1)
      // - If image is small (no scaling needed): zoom to 200% of fit-to-screen size
      const zoomedScale = fitToScreenScale < 1 ? 1 : fitToScreenScale * 2;
      return {
        width: naturalWidth * zoomedScale,
        height: naturalHeight * zoomedScale
      };
    }
    
    // Initially, show at fit-to-screen size
    return {
      width: fitToScreenWidth,
      height: fitToScreenHeight
    };
  }, [imageNaturalSize, isImageZoomed]);

  // Memoize expensive calculations to prevent re-computation on every render
  // Note: These need to be called before any early returns
  const failureCategories = useMemo(() => 
    task ? Object.entries(task.question_template.choices || {}) : [], 
    [task?.question_template.choices]
  );


  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">Loading task...</Typography>
        <Typography variant="body2" color="text.secondary">
          Fetching task details and question information
        </Typography>
      </Box>
    );
  }

  console.log(task)
  console.log(error)

  // Error state
  if (error || !task) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Task not found. Please return to your dashboard.'}
        </Alert>
        <Button 
          variant="contained" 
          onClick={handleBackToDashboard}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Navigation */}
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBack />}
            onClick={handleBackToDashboard}
            sx={{ mr: 2 }}
          >
            Dashboard
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Introduction - {user?.full_name || user?.email}
          </Typography>
          <Button color="inherit" onClick={signOut}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Task Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`Task ID: ${task.id}`} 
              variant="outlined" 
            />
            <Chip 
              label={`Status: ${task.status}`} 
              color={task.status === 'active' ? 'success' : 'default'}
              variant="outlined" 
            />
            <Chip 
              label={`${task.questions_number} Questions Available`} 
              color="primary"
              variant="outlined" 
            />
          </Box>
          <Typography variant="h6" color="text.secondary" paragraph>
            {task.description}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Instructions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  1. Instructions
                </Typography>
                <Typography variant="body1" paragraph>
                  {task.instructions || 'Please review the media items and identify any failures according to the categories provided.'}
                </Typography>

                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom>
                  Task Details:
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" paragraph>
                    <strong>Question:</strong> {task.question_template.question_text}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Total questions in task:</strong> {task.questions_number}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Required agreements per question:</strong> {task.required_agreements}
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  What you'll be doing:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2" paragraph>
                    Answer: "{task.question_template.question_text}"
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Select appropriate failure types from {failureCategories.length} categories
                  </Typography>
                  <Typography component="li" variant="body2" paragraph>
                    Use the Back button to review previous questions if needed
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Failure Categories:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {failureCategories.map(([key, choice], index) => {
                    // Color mapping for different categories
                    const colors = ['error', 'warning', 'info', 'success', 'primary'] as const;
                    const color = colors[index % colors.length];
                    
                    return (
                      <Chip 
                        key={key}
                        label={`${key}: ${choice.text} (${choice.options.length} options)`}
                        color={color}
                        variant="outlined"
                        sx={{ mb: 1, mr: 1 }}
                      />
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Example Images */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  2. Example Images
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Review these examples to understand the type of content you'll be analyzing:
                </Typography>

                {/* Example Images Display - Book Stack Style */}
                {task.example_images && task.example_images.length > 0 ? (
                  <Box sx={{ mb: 2 }}>
                    {/* Current Image Caption and Page Indicator */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="h3">
                        {task.example_images[currentImageIndex]?.caption || `Example ${currentImageIndex + 1}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentImageIndex + 1} / {task.example_images.length}
                      </Typography>
                    </Box>

                    {/* Navigation Controls */}
                    {task.example_images.length > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                        <Button
                          size="small"
                          onClick={handlePreviousImage}
                          startIcon={<NavigateBefore />}
                          disabled={task.example_images.length <= 1}
                        >
                          Previous
                        </Button>
                        <Button
                          size="small"
                          onClick={handleNextImage}
                          endIcon={<NavigateNext />}
                          disabled={task.example_images.length <= 1}
                        >
                          Next
                        </Button>
                      </Box>
                    )}

                    {/* Book Stack Container */}
                    <Box
                      sx={{
                        position: 'relative',
                        height: 300,
                        width: '100%',
                        perspective: '1000px',
                        mb: 2
                      }}
                    >
                      {task.example_images.map((image, index) => {
                        const isTopImage = index === currentImageIndex;
                        const stackPosition = index - currentImageIndex;
                        
                        // Calculate rotation and positioning for stack effect
                        const rotation = stackPosition === 0 ? 0 : 
                          stackPosition > 0 ? Math.min(stackPosition * 2, 6) : 
                          Math.max(stackPosition * 2, -6);
                        
                        const translateY = Math.abs(stackPosition) * 4;
                        const scale = isTopImage ? 1 : Math.max(0.95 - Math.abs(stackPosition) * 0.02, 0.85);
                        const zIndex = task.example_images.length - Math.abs(stackPosition);

                        return (
                          <Box
                            key={index}
                            onClick={() => {
                              if (!isTopImage) {
                                handleImageStackClick(index);
                              } else {
                                handleImageClick(image.file_path, image.caption, index);
                              }
                            }}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: '50%',
                              width: '90%',
                              maxWidth: 400,
                              transform: `
                                translateX(-50%) 
                                translateY(${translateY}px) 
                                rotate(${rotation}deg) 
                                scale(${scale})
                              `,
                              transformOrigin: 'center bottom',
                              zIndex,
                              cursor: isTopImage ? 'pointer' : 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              bgcolor: 'grey.100',
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: '1px solid',
                              borderColor: isTopImage ? 'grey.300' : 'grey.200',
                              boxShadow: isTopImage ? 3 : 1,
                              '&:hover': isTopImage ? {
                                borderColor: 'primary.main',
                                boxShadow: 4,
                                transform: `
                                  translateX(-50%) 
                                  translateY(${translateY - 2}px) 
                                  rotate(${rotation}deg) 
                                  scale(${scale})
                                `
                              } : {
                                transform: `
                                  translateX(-50%) 
                                  translateY(${translateY - 1}px) 
                                  rotate(${rotation}deg) 
                                  scale(${Math.min(scale + 0.02, 1)})
                                `
                              },
                              '&:hover .magnifier-icon': {
                                opacity: isTopImage ? 1 : 0
                              }
                            }}
                          >
                            <img
                              src={image.file_path}
                              alt={image.caption || `Example ${index + 1}`}
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                maxHeight: '250px',
                                objectFit: 'cover'
                              }}
                            />
                            
                            {/* Magnifier Icon - only on top image */}
                            {isTopImage && (
                              <Box
                                className="magnifier-icon"
                                sx={{
                                  position: 'absolute',
                                  bottom: 8,
                                  right: 8,
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: '50%',
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0,
                                  transition: 'opacity 0.2s ease',
                                  backdropFilter: 'blur(4px)',
                                  boxShadow: 1
                                }}
                              >
                                <ZoomIn sx={{ fontSize: 18, color: 'primary.main' }} />
                              </Box>
                            )}

                            {/* Stack Position Indicator for non-top images */}
                            {!isTopImage && Math.abs(stackPosition) <= 2 && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                  color: 'white',
                                  borderRadius: 1,
                                  px: 1,
                                  py: 0.5,
                                  fontSize: '0.75rem',
                                  fontWeight: 'medium'
                                }}
                              >
                                {index + 1}
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>

                  </Box>
                ) : (
                  // Show generic placeholder
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      bgcolor: 'grey.100',
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed',
                      borderColor: 'grey.400',
                      mb: 2
                    }}
                  >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Example Images
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      The administrator has not provided example images for this task.
                    </Typography>
                  </Box>
                )}

                {/* Task Info */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Task Overview:
                  </Typography>
                  <Typography variant="body2">
                    You'll analyze similar media to identify failure types according to the provided categories. 
                    Use the examples above as reference for the content types and quality standards expected.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Task Status and Start Button */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
          {task.status !== 'active' && (
            <Alert severity="warning" sx={{ mb: 2, maxWidth: 600 }}>
              This task is currently {task.status}. You may not be able to complete labeling at this time.
            </Alert>
          )}
          
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartLabeling}
            disabled={task.status !== 'active'}
            sx={{ 
              px: 4, 
              py: 2, 
              fontSize: '1.2rem',
              minWidth: 200
            }}
          >
            Start Labeling
          </Button>

          {task.questions_number === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              No questions have been generated for this task yet. Please contact your administrator.
            </Typography>
          )}
        </Box>
      </Container>

      {/* Full Page Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={handleClosePreview}
        maxWidth={false}
        fullWidth
        PaperProps={{ 
          sx: { 
            backgroundColor: 'white',
            minHeight: '90vh',
            margin: 1
          } 
        }}
      >
        <DialogTitle sx={{ color: 'black', borderBottom: '1px solid', borderColor: 'grey.200', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h2" sx={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>
              {previewImage?.caption || previewImage?.alt}
            </Typography>
            {task?.example_images && task.example_images.length > 1 && (
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '60px', textAlign: 'right' }}>
                {currentImageIndex + 1} / {task.example_images.length}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent 
          sx={{ 
            textAlign: 'center', 
            p: 3, 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto' // Always allow scrolling for full-size images
          }}
        >
          {previewImage && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                minHeight: 'calc(90vh - 200px)'
              }}
              onDoubleClick={handleImageDoubleClick}
            >
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                onLoad={handleImageLoad}
                style={{
                  // Use calculated dimensions to show proper size
                  width: imageDisplaySize?.width || 'auto',
                  height: imageDisplaySize?.height || 'auto',
                  borderRadius: 8,
                  transition: 'all 0.3s ease',
                  // Ensure image doesn't exceed viewport when not zoomed
                  maxWidth: isImageZoomed ? 'none' : 'calc(100vw - 80px)',
                  maxHeight: isImageZoomed ? 'none' : 'calc(90vh - 200px)'
                }}
              />
            </Box>
          )}
          
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', pb: 3, px: 3, borderTop: '1px solid', borderColor: 'grey.200' }}>
          {/* Navigation Controls - only show if multiple images */}
          {task?.example_images && task.example_images.length > 1 ? (
            <>
              <Button 
                onClick={handlePreviewPrevious} 
                startIcon={<NavigateBefore />}
                size="large"
                sx={{ minWidth: 100 }}
              >
                Previous
              </Button>
              
              <Button 
                onClick={handleClosePreview} 
                variant="contained" 
                size="large"
                sx={{ minWidth: 120 }}
              >
                Close
              </Button>
              
              <Button 
                onClick={handlePreviewNext} 
                endIcon={<NavigateNext />}
                size="large"
                sx={{ minWidth: 100 }}
              >
                Next
              </Button>
            </>
          ) : (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Button 
                onClick={handleClosePreview} 
                variant="contained" 
                size="large"
                sx={{ minWidth: 120 }}
              >
                Close
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskIntroduction;