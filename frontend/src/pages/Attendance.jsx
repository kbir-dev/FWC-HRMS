import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  AccessTime,
  Event,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Attendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingRecord, setEditingRecord] = useState(null);

  // Fetch attendance records
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', selectedMonth, selectedYear],
    queryFn: async () => {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      const response = await apiClient.get('/attendance', {
        params: { startDate, endDate }
      });
      return response.data;
    },
  });

  // Fetch attendance summary
  const { data: summary } = useQuery({
    queryKey: ['attendanceSummary', selectedMonth, selectedYear],
    queryFn: async () => {
      // Get current employee ID
      const empResponse = await apiClient.get('/employees');
      if (empResponse.data.employees && empResponse.data.employees.length > 0) {
        const employeeId = empResponse.data.employees[0].id;
        const response = await apiClient.get(`/attendance/summary/${employeeId}`, {
          params: { month: selectedMonth, year: selectedYear }
        });
        return response.data.summary;
      }
      return null;
    },
    enabled: user?.role === 'employee',
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (location) => {
      const response = await apiClient.post('/attendance/check-in', { location });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Checked in successfully!');
      queryClient.invalidateQueries(['attendance']);
      queryClient.invalidateQueries(['attendanceSummary']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Check-in failed');
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/attendance/check-out');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Checked out successfully!');
      queryClient.invalidateQueries(['attendance']);
      queryClient.invalidateQueries(['attendanceSummary']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Check-out failed');
    },
  });

  const handleCheckIn = () => {
    // Get location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          checkInMutation.mutate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          checkInMutation.mutate({});
        }
      );
    } else {
      checkInMutation.mutate({});
    }
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'success',
      absent: 'error',
      late: 'warning',
      'half-day': 'info',
      leave: 'secondary',
      holiday: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      present: <CheckCircle />,
      absent: <Cancel />,
      late: <AccessTime />,
      'half-day': <AccessTime />,
      leave: <Event />,
      holiday: <Event />,
    };
    return icons[status] || <CheckCircle />;
  };

  // Check if user has checked in today
  const todayRecord = data?.attendance?.find(
    (record) => record.date === new Date().toISOString().split('T')[0]
  );
  const hasCheckedIn = todayRecord && todayRecord.check_in_time;
  const hasCheckedOut = todayRecord && todayRecord.check_out_time;

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
          Attendance Management
        </Typography>
        {user?.role === 'employee' && (
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleCheckIn}
              disabled={hasCheckedIn || checkInMutation.isLoading}
            >
              {hasCheckedIn ? 'Checked In' : 'Check In'}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Cancel />}
              onClick={handleCheckOut}
              disabled={!hasCheckedIn || hasCheckedOut || checkOutMutation.isLoading}
            >
              {hasCheckedOut ? 'Checked Out' : 'Check Out'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Summary Cards (for employees) */}
      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Present Days
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {summary.breakdown?.present?.count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Absent Days
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  {summary.breakdown?.absent?.count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Hours
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {summary.totalHours ? parseFloat(summary.totalHours).toFixed(1) : '0.0'}h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Leave Days
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                  {summary.breakdown?.leave?.count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Month/Year Filter */}
      <Box display="flex" gap={2} mb={3}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            label="Month"
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {[...Array(12)].map((_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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

      {/* Attendance Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.attendance?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No attendance records found for this period
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data?.attendance?.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{record.full_name}</TableCell>
                  <TableCell>
                    {record.check_in_time
                      ? format(new Date(record.check_in_time), 'HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {record.check_out_time
                      ? format(new Date(record.check_out_time), 'HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {record.work_hours ? parseFloat(record.work_hours).toFixed(1) : '0.0'}h
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.status}
                      color={getStatusColor(record.status)}
                      size="small"
                      icon={getStatusIcon(record.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={record.source} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Attendance;

