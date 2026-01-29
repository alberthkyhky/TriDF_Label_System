/* eslint-disable react-hooks/exhaustive-deps */
// components/Admin/AssignmentOverview.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Stack,
  Skeleton,
  TextField,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Task as TaskIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Refresh as RefreshIconMui,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { useDebouncedSearch } from '../../hooks/useDebounce';
import AssignmentDeleteDialog from './AssignmentDeleteDialog';

interface AssignmentData {
  id: string;
  task_id: string;
  task_title: string;
  user_id: string;
  user_name: string;
  user_email: string;
  question_range_start: number;
  question_range_end: number;
  completed_labels: number;
  is_active: boolean;
  assigned_at: string;
  updated_at: string;
  deadline?: string;
  accuracy?: number;
  time_spent?: number;
}

interface AssignmentStats {
  total_assignments: number;
  in_progress_assignments: number;
  completed_assignments: number;
  inactive_assignments: number;
  avg_completion_rate: number;
  total_labels_completed: number;
  total_labels_target: number;
}

const AssignmentOverview: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentData[]>([]);
  
  // Filter state
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Combined filtering function
  const applyFilters = useCallback((query: string, userFilter: string | null, taskFilter: string | null) => {
    let filtered = assignments;

    // Apply text search filter
    if (query.trim()) {
      filtered = filtered.filter(assignment => 
        assignment.task_title.toLowerCase().includes(query.toLowerCase()) ||
        assignment.user_name.toLowerCase().includes(query.toLowerCase()) ||
        assignment.user_email.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply user filter
    if (userFilter) {
      filtered = filtered.filter(assignment => assignment.user_id === userFilter);
    }

    // Apply task filter
    if (taskFilter) {
      filtered = filtered.filter(assignment => assignment.task_id === taskFilter);
    }

    setFilteredAssignments(filtered);
  }, [assignments]);

  // Debounced search functionality
  const { isSearching } = useDebouncedSearch(
    searchQuery,
    useCallback((query: string) => {
      applyFilters(query, selectedUser, selectedTask);
    }, [applyFilters, selectedUser, selectedTask]),
    300
  );

  // Update filtered assignments when assignments or filters change
  useEffect(() => {
    applyFilters(searchQuery, selectedUser, selectedTask);
  }, [assignments, searchQuery, selectedUser, selectedTask, applyFilters]);

  // Helper functions for assignment calculations
  const getAssignmentTarget = (assignment: AssignmentData) => {
    // All assignments are now ranges
    return assignment.question_range_end - assignment.question_range_start + 1;
  };

  const isAssignmentCompleted = (assignment: AssignmentData) => {
    const target = getAssignmentTarget(assignment);
    return assignment.completed_labels >= target;
  };

  // Memoize unique users and tasks for filter dropdowns
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    assignments.forEach(assignment => {
      if (!userMap.has(assignment.user_id)) {
        userMap.set(assignment.user_id, {
          id: assignment.user_id,
          name: assignment.user_name,
          email: assignment.user_email,
          label: `${assignment.user_name} (${assignment.user_email})`
        });
      }
    });
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);

  const uniqueTasks = useMemo(() => {
    const taskMap = new Map();
    assignments.forEach(assignment => {
      if (!taskMap.has(assignment.task_id)) {
        taskMap.set(assignment.task_id, {
          id: assignment.task_id,
          title: assignment.task_title,
          label: assignment.task_title
        });
      }
    });
    return Array.from(taskMap.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [assignments]);

  // Memoize expensive statistical calculations
  const stats = useMemo((): AssignmentStats => {
    if (assignments.length === 0) {
      return {
        total_assignments: 0,
        in_progress_assignments: 0,
        completed_assignments: 0,
        inactive_assignments: 0,
        avg_completion_rate: 0,
        total_labels_completed: 0,
        total_labels_target: 0,
      };
    }

    const total = assignments.length;
    
    // Use mutually exclusive categories
    const completed = assignments.filter(isAssignmentCompleted).length;
    const inProgress = assignments.filter(a => a.is_active && !isAssignmentCompleted(a)).length;
    const inactive = assignments.filter(a => !a.is_active && !isAssignmentCompleted(a)).length;
    
    const totalCompleted = assignments.reduce((sum, a) => sum + a.completed_labels, 0);
    const totalTarget = assignments.reduce((sum, a) => sum + getAssignmentTarget(a), 0);
    const avgCompletion = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;

    return {
      total_assignments: total,
      in_progress_assignments: inProgress,
      completed_assignments: completed,
      inactive_assignments: inactive,
      avg_completion_rate: avgCompletion,
      total_labels_completed: totalCompleted,
      total_labels_target: totalTarget,
    };
  }, [assignments]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch all assignments
      const assignmentsData = await api.getAllAssignments();
      
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAssignments();
    setRefreshing(false);
  }, []);


  const getProgressPercentage = (completed: number, target: number): number => {
    return target > 0 ? Math.min((completed / target) * 100, 100) : 0;
  };

  const getStatusColor = (assignment: AssignmentData): 'success' | 'warning' | 'error' | 'info' => {
    if (!assignment.is_active) return 'error';
    if (isAssignmentCompleted(assignment)) return 'success';
    if (assignment.completed_labels > 0) return 'warning';
    return 'info';
  };

  const getStatusText = (assignment: AssignmentData): string => {
    if (!assignment.is_active) return 'Inactive';
    if (isAssignmentCompleted(assignment)) return 'Completed';
    if (assignment.completed_labels > 0) return 'In Progress';
    return 'Not Started';
  };

  const handleToggleActive = useCallback(async (assignmentId: string, currentStatus: boolean) => {
    try {
      await api.updateAssignmentStatus(assignmentId, !currentStatus);
      await fetchAssignments(); // Refresh data
    } catch (error) {
      console.error('Error updating assignment status:', error);
      setError('Failed to update assignment status');
    }
  }, []);

  const handleViewDetails = useCallback((assignment: AssignmentData) => {
    setSelectedAssignment(assignment);
    setDetailsOpen(true);
  }, []);

  const handleDeleteClick = useCallback((assignment: AssignmentData) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async (assignmentId: string) => {
    try {
      setDeleting(true);
      await api.deleteAssignment(assignmentId);
      await fetchAssignments(); // Refresh data
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError('Failed to delete assignment');
    } finally {
      setDeleting(false);
    }
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  }, []);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = React.memo(({ title, value, subtitle, icon, color = 'primary' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  ));

  // Skeleton components for loading state
  const StatCardSkeleton = () => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={28} />
            <Skeleton variant="text" width="50%" height={20} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const TableRowSkeleton = () => (
    <TableRow>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
      <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
      <TableCell><Skeleton variant="text" width="40%" /></TableCell>
      <TableCell><Skeleton variant="rectangular" width="100%" height={6} /></TableCell>
      <TableCell><Skeleton variant="rounded" width={50} height={24} /></TableCell>
      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
      <TableCell>
        <Stack direction="row" spacing={1}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Stack>
      </TableCell>
    </TableRow>
  );

  if (loading) {
    return (
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Assignment Overview</Typography>
          <Button
            startIcon={<RefreshIconMui />}
            disabled
          >
            Refresh
          </Button>
        </Box>

        {/* Statistics Cards Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCardSkeleton />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCardSkeleton />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCardSkeleton />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCardSkeleton />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 2.4 }}>
            <StatCardSkeleton />
          </Grid>
        </Grid>

        {/* Assignments Table Skeleton */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                All Assignments
              </Typography>
              <Skeleton variant="text" width={120} height={20} />
            </Box>
            
            {/* Filters Skeleton */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              flexWrap: 'wrap',
              mb: 3
            }}>
              <Skeleton variant="rounded" width={250} height={40} />
              <Skeleton variant="rounded" width={250} height={40} />
              <Skeleton variant="rounded" width={250} height={40} />
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Assigned</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <TableRowSkeleton key={index} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Assignment Overview</Typography>
        <Button
          startIcon={<RefreshIconMui />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard
              title="Total Assignments"
              value={stats.total_assignments}
              icon={<AssignmentIcon />}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard
              title="In Progress"
              value={stats.in_progress_assignments}
              icon={<PlayArrowIcon />}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard
              title="Completed"
              value={stats.completed_assignments}
              icon={<CheckCircleIcon />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard
              title="Inactive/Paused"
              value={stats.inactive_assignments}
              subtitle={stats.inactive_assignments > 0 ? "Assignments paused or disabled" : "All assignments active"}
              icon={<PauseIcon />}
              color="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 2.4 }}>
            <StatCard
              title="Overall Progress"
              value={`${stats.avg_completion_rate.toFixed(1)}%`}
              subtitle={`${stats.total_labels_completed} / ${stats.total_labels_target} labels completed`}
              icon={<TaskIcon />}
              color="secondary"
            />
          </Grid>
        </Grid>
      )}

      {/* Assignments Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              All Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(searchQuery.trim() || selectedUser || selectedTask)
                ? `${filteredAssignments.length} of ${assignments.length} assignments`
                : `${assignments.length} assignments`
              }
            </Typography>
          </Box>
          
          {/* Filters */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            flexWrap: 'wrap',
            mb: 3
          }}>
            <TextField
              size="small"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                ...(isSearching && {
                  endAdornment: (
                    <InputAdornment position="end">
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        Searching...
                      </span>
                    </InputAdornment>
                  )
                })
              }}
              sx={{ minWidth: 250 }}
            />
            
            <Autocomplete
              size="small"
              options={uniqueUsers}
              value={uniqueUsers.find(user => user.id === selectedUser) || null}
              onChange={(event, value) => setSelectedUser(value?.id || null)}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Filter by user..." 
                />
              )}
              sx={{ minWidth: 250 }}
              clearOnEscape
            />
            
            <Autocomplete
              size="small"
              options={uniqueTasks}
              value={uniqueTasks.find(task => task.id === selectedTask) || null}
              onChange={(event, value) => setSelectedTask(value?.id || null)}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Filter by task..." 
                />
              )}
              sx={{ minWidth: 250 }}
              clearOnEscape
            />
            
            {(selectedUser || selectedTask) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedTask(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Task</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {assignment.user_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.user_email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {assignment.task_title}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ minWidth: 120 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            {assignment.completed_labels} / {getAssignmentTarget(assignment)}
                          </Typography>
                          <Typography variant="body2">
                            {getProgressPercentage(assignment.completed_labels, getAssignmentTarget(assignment)).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={getProgressPercentage(assignment.completed_labels, getAssignmentTarget(assignment))}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getStatusText(assignment)}
                        color={getStatusColor(assignment)}
                        size="small"
                      />
                    </TableCell>


                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(assignment.assigned_at)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(assignment)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={assignment.is_active ? "Pause Assignment" : "Activate Assignment"}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(assignment.id, assignment.is_active)}
                            color={assignment.is_active ? "warning" : "success"}
                          >
                            {assignment.is_active ? <PauseIcon /> : <PlayArrowIcon />}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Assignment">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(assignment)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Assignment Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAssignment && (
          <>
            <DialogTitle>
              Assignment Details - {selectedAssignment.user_name}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>Assignment Info</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Task</Typography>
                      <Typography variant="body1">{selectedAssignment.task_title}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">User</Typography>
                      <Typography variant="body1">
                        {selectedAssignment.user_name} ({selectedAssignment.user_email})
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Progress</Typography>
                      <Typography variant="body1">
                        {selectedAssignment.completed_labels} / {getAssignmentTarget(selectedAssignment)} labels
                        ({getProgressPercentage(selectedAssignment.completed_labels, getAssignmentTarget(selectedAssignment)).toFixed(1)}%)
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip
                        label={getStatusText(selectedAssignment)}
                        color={getStatusColor(selectedAssignment)}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>Additional Details</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Assigned</Typography>
                      <Typography variant="body1">{formatDate(selectedAssignment.assigned_at)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                      <Typography variant="body1">{formatDate(selectedAssignment.updated_at)}</Typography>
                    </Box>
                    {selectedAssignment.accuracy && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Accuracy</Typography>
                        <Typography variant="body1">{selectedAssignment.accuracy.toFixed(1)}%</Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              <Button 
                variant="contained"
                onClick={() => handleToggleActive(selectedAssignment.id, selectedAssignment.is_active)}
              >
                {selectedAssignment.is_active ? 'Pause Assignment' : 'Activate Assignment'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Assignment Dialog */}
      <AssignmentDeleteDialog
        open={deleteDialogOpen}
        assignment={assignmentToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </Box>
  );
};

export default AssignmentOverview;