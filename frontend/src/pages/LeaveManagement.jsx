import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Check,
  Close,
  Event,
  Pending,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const LeaveManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch leave requests
  const { data, isLoading } = useQuery({
    queryKey: ['leaveRequests', selectedYear],
    queryFn: async () => {
      const response = await apiClient.get('/leave', {
        params: { year: selectedYear }
      });
      return response.data;
    },
  });

  // Fetch leave balance (for employees)
  const { data: balance } = useQuery({
    queryKey: ['leaveBalance', selectedYear],
    queryFn: async () => {
      // Get current employee ID
      const empResponse = await apiClient.get('/employees');
      if (empResponse.data.employees && empResponse.data.employees.length > 0) {
        const employeeId = empResponse.data.employees[0].id;
        const response = await apiClient.get(`/leave/balance/${employeeId}`, {
          params: { year: selectedYear }
        });
        return response.data.balance;
      }
      return null;
    },
    enabled: user?.role === 'employee',
  });

  // Create leave request mutation
  const createLeaveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/leave', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request submitted successfully!');
      queryClient.invalidateQueries(['leaveRequests']);
      queryClient.invalidateQueries(['leaveBalance']);
      setOpenDialog(false);
      setFormData({ leaveType: 'vacation', startDate: '', endDate: '', reason: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to submit leave request');
    },
  });

  // Approve/Reject mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, status, approvalNotes }) => {
      const response = await apiClient.put(`/leave/${id}/approve`, { status, approvalNotes });
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Leave request ${variables.status}!`);
      queryClient.invalidateQueries(['leaveRequests']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process request');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.put(`/leave/${id}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Leave request cancelled');
      queryClient.invalidateQueries(['leaveRequests']);
      queryClient.invalidateQueries(['leaveBalance']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to cancel request');
    },
  });

  const handleSubmit = () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    createLeaveMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Pending />,
      approved: <Check />,
      rejected: <Close />,
      cancelled: <CancelIcon />,
    };
    return icons[status];
  };

  const leaveTypeLabels = {
    sick: 'Sick Leave',
    vacation: 'Vacation',
    personal: 'Personal Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    unpaid: 'Unpaid Leave',
    other: 'Other',
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Leave Management
        </Typography>
        {(user?.role === 'employee' || user?.role === 'admin' || user?.role === 'hr') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Request Leave
          </Button>
        )}
      </Box>

      {/* Leave Balance (for employees) */}
      {balance && (
        <Grid container spacing={2} mb={3}>
          {Object.entries(balance.breakdown).map(([type, data]) => (
            <Grid item xs={12} sm={6} md={3} key={type}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="textSecondary">
                    {leaveTypeLabels[type]}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {data.remaining}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    days remaining
                  </Typography>
                  <Box mt={1}>
                    <LinearProgress
                      variant="determinate"
                      value={((data.allowed - data.remaining) / data.allowed) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                      {data.used} used / {data.allowed} allowed
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Year Filter */}
      <Box mb={2}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {[2024, 2025, 2026].map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Leave Requests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Days</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              {['admin', 'hr', 'manager'].includes(user?.role) && (
                <TableCell>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.leaveRequests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No leave requests found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data?.leaveRequests?.map((leave) => {
                const days = Math.ceil(
                  (new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)
                ) + 1;

                return (
                  <TableRow key={leave.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {leave.employee_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {leave.employee_code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={leaveTypeLabels[leave.leave_type]} size="small" />
                    </TableCell>
                    <TableCell>{format(new Date(leave.start_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(leave.end_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{days} days</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {leave.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={leave.status}
                        color={getStatusColor(leave.status)}
                        size="small"
                        icon={getStatusIcon(leave.status)}
                      />
                    </TableCell>
                    {['admin', 'hr', 'manager'].includes(user?.role) && (
                      <TableCell>
                        {leave.status === 'pending' && (
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              color="success"
                              onClick={() => approveMutation.mutate({ id: leave.id, status: 'approved' })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => approveMutation.mutate({ id: leave.id, status: 'rejected' })}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                        {user?.role === 'employee' && leave.status === 'pending' && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => cancelMutation.mutate(leave.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Leave Request Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={formData.leaveType}
                label="Leave Type"
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              >
                {Object.entries(leaveTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Reason"
              multiline
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a reason for your leave request..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createLeaveMutation.isLoading}
          >
            {createLeaveMutation.isLoading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveManagement;

