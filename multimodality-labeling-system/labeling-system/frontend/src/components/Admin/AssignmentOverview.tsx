/* eslint-disable react-hooks/exhaustive-deps */
// components/Admin/AssignmentOverview.tsx
import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { api } from '../../services/api';

interface AssignmentData {
  id: string;
  task_id: string;
  task_title: string;
  user_id: string;
  user_name: string;
  user_email: string;
  assigned_classes: string[];
  target_labels: number;
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
  active_assignments: number;
  completed_assignments: number;
  avg_completion_rate: number;
  total_labels_completed: number;
  total_labels_target: number;
}

const AssignmentOverview: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch all assignments
      const assignmentsData = await api.getAllAssignments();
      
      // Calculate stats
      const stats = calculateStats(assignmentsData);
      
      setAssignments(assignmentsData);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
    setRefreshing(false);
  };

  const calculateStats = (assignmentsData: AssignmentData[]): AssignmentStats => {
    const total = assignmentsData.length;
    const active = assignmentsData.filter(a => a.is_active).length;
    const completed = assignmentsData.filter(a => a.completed_labels >= a.target_labels).length;
    const totalCompleted = assignmentsData.reduce((sum, a) => sum + a.completed_labels, 0);
    const totalTarget = assignmentsData.reduce((sum, a) => sum + a.target_labels, 0);
    const avgCompletion = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;

    return {
      total_assignments: total,
      active_assignments: active,
      completed_assignments: completed,
      avg_completion_rate: avgCompletion,
      total_labels_completed: totalCompleted,
      total_labels_target: totalTarget,
    };
  };

  const getProgressPercentage = (completed: number, target: number): number => {
    return target > 0 ? Math.min((completed / target) * 100, 100) : 0;
  };

  const getStatusColor = (assignment: AssignmentData): 'success' | 'warning' | 'error' | 'info' => {
    if (!assignment.is_active) return 'error';
    if (assignment.completed_labels >= assignment.target_labels) return 'success';
    if (assignment.completed_labels > 0) return 'warning';
    return 'info';
  };

  const getStatusText = (assignment: AssignmentData): string => {
    if (!assignment.is_active) return 'Inactive';
    if (assignment.completed_labels >= assignment.target_labels) return 'Completed';
    if (assignment.completed_labels > 0) return 'In Progress';
    return 'Not Started';
  };

  const handleToggleActive = async (assignmentId: string, currentStatus: boolean) => {
    try {
      await api.updateAssignmentStatus(assignmentId, !currentStatus);
      await fetchAssignments(); // Refresh data
    } catch (error) {
      console.error('Error updating assignment status:', error);
      setError('Failed to update assignment status');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
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
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>Loading assignments...</Typography>
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
        <Box>
          <Button
            startIcon={<RefreshIconMui />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Assignments"
              value={stats.total_assignments}
              icon={<AssignmentIcon />}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Assignments"
              value={stats.active_assignments}
              icon={<PlayArrowIcon />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Completed"
              value={stats.completed_assignments}
              icon={<CheckCircleIcon />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Overall Progress"
              value={`${stats.avg_completion_rate.toFixed(1)}%`}
              subtitle={`${stats.total_labels_completed} / ${stats.total_labels_target} labels`}
              icon={<TaskIcon />}
              color="warning"
            />
          </Grid>
        </Grid>
      )}

      {/* Assignments Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Assignments ({assignments.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Task</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Label Classes</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
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
                            {assignment.completed_labels} / {assignment.target_labels}
                          </Typography>
                          <Typography variant="body2">
                            {getProgressPercentage(assignment.completed_labels, assignment.target_labels).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={getProgressPercentage(assignment.completed_labels, assignment.target_labels)}
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
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {assignment.assigned_classes.slice(0, 2).map((className) => (
                          <Chip key={className} label={className} size="small" variant="outlined" />
                        ))}
                        {assignment.assigned_classes.length > 2 && (
                          <Chip 
                            label={`+${assignment.assigned_classes.length - 2}`} 
                            size="small" 
                            variant="outlined" 
                          />
                        )}
                      </Box>
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
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setDetailsOpen(true);
                            }}
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
                        {selectedAssignment.completed_labels} / {selectedAssignment.target_labels} labels
                        ({getProgressPercentage(selectedAssignment.completed_labels, selectedAssignment.target_labels).toFixed(1)}%)
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
                      <Typography variant="body2" color="text.secondary">Label Classes</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {selectedAssignment.assigned_classes.map((className) => (
                          <Chip key={className} label={className} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
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
    </Box>
  );
};

export default AssignmentOverview;