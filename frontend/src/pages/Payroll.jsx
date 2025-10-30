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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Receipt,
  Visibility,
  PlayArrow,
} from '@mui/icons-material';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Payroll = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProcessDialog, setOpenProcessDialog] = useState(false);
  const [processMonth, setProcessMonth] = useState(new Date().getMonth() + 1);
  const [processYear, setProcessYear] = useState(new Date().getFullYear());

  // Fetch payroll records
  const { data, isLoading } = useQuery({
    queryKey: ['payroll', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await apiClient.get('/payroll', {
        params: { month: selectedMonth, year: selectedYear }
      });
      return response.data;
    },
    enabled: ['admin', 'hr'].includes(user?.role),
  });

  // Fetch employee's own payroll history
  const { data: employeePayroll, isLoading: employeePayrollLoading } = useQuery({
    queryKey: ['employeePayroll'],
    queryFn: async () => {
      // Get current employee ID
      const empResponse = await apiClient.get('/employees');
      if (empResponse.data.employees && empResponse.data.employees.length > 0) {
        const employeeId = empResponse.data.employees[0].id;
        const response = await apiClient.get(`/payroll/employee/${employeeId}`);
        return response.data;
      }
      return null;
    },
    enabled: user?.role === 'employee',
  });

  const handleViewDetails = (payroll) => {
    setSelectedPayroll(payroll);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPayroll(null);
  };

  // Process payroll mutation
  const processPayrollMutation = useMutation({
    mutationFn: async ({ month, year }) => {
      const response = await apiClient.post('/payroll/process', { month, year });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payroll processed successfully!');
      setOpenProcessDialog(false);
      queryClient.invalidateQueries(['payroll']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process payroll');
    },
  });

  const handleProcessPayroll = () => {
    processPayrollMutation.mutate({ month: processMonth, year: processYear });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const calculateTotalPayroll = (payrolls) => {
    return payrolls?.reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0) || 0;
  };

  if (isLoading || employeePayrollLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // For employees, show their payroll history
  if (user?.role === 'employee') {
    const latestPayroll = employeePayroll?.payrolls?.[0];

    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          My Payroll
        </Typography>

        {/* Latest Payroll Summary */}
        {latestPayroll && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Latest Salary
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(latestPayroll.net_salary)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(latestPayroll.year, latestPayroll.month - 1), 'MMMM yyyy')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Gross Salary
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(latestPayroll.gross_salary)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Deductions
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {formatCurrency(latestPayroll.gross_salary - latestPayroll.net_salary)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Payroll History */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Payroll History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Base Salary</TableCell>
                  <TableCell>Gross Salary</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeePayroll?.payrolls?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No payroll records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  employeePayroll?.payrolls?.map((payroll) => (
                    <TableRow key={payroll.id} hover>
                      <TableCell>
                        {format(new Date(payroll.year, payroll.month - 1), 'MMMM yyyy')}
                      </TableCell>
                      <TableCell>{formatCurrency(payroll.base_salary)}</TableCell>
                      <TableCell>{formatCurrency(payroll.gross_salary)}</TableCell>
                      <TableCell sx={{ color: 'error.main' }}>
                        {formatCurrency(payroll.gross_salary - payroll.net_salary)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(payroll.net_salary)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewDetails(payroll)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  }

  // For admin/HR, show all payroll records
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Payroll Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={() => setOpenProcessDialog(true)}
        >
          Process Payroll
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Payroll ({new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'short' })})
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {formatCurrency(calculateTotalPayroll(data?.payrolls))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Employees Paid
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {data?.payrolls?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Salary
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(
                  data?.payrolls?.length > 0
                    ? calculateTotalPayroll(data.payrolls) / data.payrolls.length
                    : 0
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      {/* Payroll Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Base Salary</TableCell>
              <TableCell>Gross Salary</TableCell>
              <TableCell>Tax</TableCell>
              <TableCell>Net Salary</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.payrolls?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No payroll records found for this period
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data?.payrolls?.map((payroll) => (
                <TableRow key={payroll.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {payroll.full_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {payroll.employee_code}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{payroll.department_name || '-'}</TableCell>
                  <TableCell>{formatCurrency(payroll.base_salary)}</TableCell>
                  <TableCell>{formatCurrency(payroll.gross_salary)}</TableCell>
                  <TableCell sx={{ color: 'error.main' }}>
                    {formatCurrency(payroll.tax_amount)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(payroll.net_salary)}
                  </TableCell>
                  <TableCell>
                    <Chip label={payroll.payment_method?.replace('_', ' ')} size="small" />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(payroll)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payroll Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Payroll Details - {selectedPayroll?.full_name}
        </DialogTitle>
        <DialogContent>
          {selectedPayroll && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {format(new Date(selectedPayroll.year, selectedPayroll.month - 1), 'MMMM yyyy')}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Base Salary
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(selectedPayroll.base_salary)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Gross Salary
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(selectedPayroll.gross_salary)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Allowances
              </Typography>
              <List dense>
                {Object.entries(selectedPayroll.allowances || {}).length === 0 ? (
                  <ListItem>
                    <ListItemText secondary="No allowances" />
                  </ListItem>
                ) : (
                  Object.entries(selectedPayroll.allowances).map(([key, value]) => (
                    <ListItem key={key}>
                      <ListItemText
                        primary={key.replace(/_/g, ' ').toUpperCase()}
                        secondary={formatCurrency(value)}
                      />
                    </ListItem>
                  ))
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Deductions
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Tax" secondary={formatCurrency(selectedPayroll.tax_amount)} />
                </ListItem>
                {Object.entries(selectedPayroll.deductions || {}).map(([key, value]) => (
                  <ListItem key={key}>
                    <ListItemText
                      primary={key.replace(/_/g, ' ').toUpperCase()}
                      secondary={formatCurrency(value)}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} bgcolor="primary.light" borderRadius={1}>
                <Typography variant="h6">Net Salary</Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(selectedPayroll.net_salary)}
                </Typography>
              </Box>

              {selectedPayroll.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    Notes: {selectedPayroll.notes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Process Payroll Dialog */}
      <Dialog open={openProcessDialog} onClose={() => setOpenProcessDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payroll</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Generate payroll for all active employees for the selected month and year.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={processMonth}
                    label="Month"
                    onChange={(e) => setProcessMonth(e.target.value)}
                  >
                    {[...Array(12)].map((_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={processYear}
                    label="Year"
                    onChange={(e) => setProcessYear(e.target.value)}
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProcessDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleProcessPayroll}
            disabled={processPayrollMutation.isLoading}
            startIcon={processPayrollMutation.isLoading ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {processPayrollMutation.isLoading ? 'Processing...' : 'Process'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;

