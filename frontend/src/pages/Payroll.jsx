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
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Receipt,
  Visibility,
  PlayArrow,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Payroll = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(''); // Empty = View All
  const [selectedYear, setSelectedYear] = useState(''); // Empty = View All
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProcessDialog, setOpenProcessDialog] = useState(false);
  const [processMonth, setProcessMonth] = useState(new Date().getMonth() + 1);
  const [processYear, setProcessYear] = useState(new Date().getFullYear());
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingPayroll, setDeletingPayroll] = useState(null);
  
  // Payroll form state
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: '',
    hra: '',
    da: '',
    otherAllowances: '',
    pf: '',
    tax: '',
    otherDeductions: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
  });

  // Fetch payroll records
  const { data, isLoading } = useQuery({
    queryKey: ['payroll', selectedMonth, selectedYear],
    queryFn: async () => {
      const params = {};
      if (selectedMonth) params.month = selectedMonth;
      if (selectedYear) params.year = selectedYear;
      
      const response = await apiClient.get('/payroll', { params });
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

  // Fetch all employees for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await apiClient.get('/employees');
      return response.data;
    },
    enabled: ['admin', 'hr'].includes(user?.role),
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

  // Delete payroll mutation
  const deletePayrollMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/payroll/${id}`);
    },
    onSuccess: () => {
      toast.success('Payroll record deleted successfully!');
      setOpenDeleteDialog(false);
      setDeletingPayroll(null);
      queryClient.invalidateQueries(['payroll']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete payroll');
    },
  });

  // Create payroll mutation
  const createPayrollMutation = useMutation({
    mutationFn: async (payrollData) => {
      const response = await apiClient.post('/payroll', payrollData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payroll created successfully!');
      setOpenCreateDialog(false);
      resetForm();
      queryClient.invalidateQueries(['payroll']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create payroll');
    },
  });

  // Update payroll mutation
  const updatePayrollMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/payroll/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payroll updated successfully!');
      setOpenEditDialog(false);
      setEditingPayroll(null);
      resetForm();
      queryClient.invalidateQueries(['payroll']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update payroll');
    },
  });

  const handleDeletePayroll = () => {
    if (deletingPayroll) {
      deletePayrollMutation.mutate(deletingPayroll.id);
    }
  };

  const handleEditClick = (payroll) => {
    // Pre-fill form with existing payroll data
    setFormData({
      employeeId: payroll.employee_id,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basic_salary,
      hra: payroll.allowances?.hra || '',
      da: payroll.allowances?.da || '',
      otherAllowances: payroll.allowances?.other || '',
      pf: payroll.deductions?.pf || '',
      tax: payroll.tax || '',
      otherDeductions: payroll.deductions?.other || '',
      paymentDate: payroll.payment_date || new Date().toISOString().split('T')[0],
      paymentMethod: payroll.payment_method || 'bank_transfer',
      paymentStatus: payroll.payment_status || 'pending',
    });
    setEditingPayroll(payroll);
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (payroll) => {
    setDeletingPayroll(payroll);
    setOpenDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: '',
      hra: '',
      da: '',
      otherAllowances: '',
      pf: '',
      tax: '',
      otherDeductions: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      paymentStatus: 'pending',
    });
  };

  const handleCreateClick = () => {
    resetForm();
    setOpenCreateDialog(true);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateGrossAndNet = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const hra = parseFloat(formData.hra) || 0;
    const da = parseFloat(formData.da) || 0;
    const otherAllow = parseFloat(formData.otherAllowances) || 0;
    const pf = parseFloat(formData.pf) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const otherDed = parseFloat(formData.otherDeductions) || 0;

    const gross = basic + hra + da + otherAllow;
    const totalDeductions = pf + tax + otherDed;
    const net = gross - totalDeductions;

    return { gross, net, totalDeductions };
  };

  const handleSubmitPayroll = () => {
    // Validate required fields
    if (!formData.employeeId || !formData.basicSalary) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { gross, net } = calculateGrossAndNet();

    const payrollData = {
      employeeId: formData.employeeId,
      month: formData.month,
      year: formData.year,
      baseSalary: parseFloat(formData.basicSalary),
      allowances: {
        hra: parseFloat(formData.hra) || 0,
        da: parseFloat(formData.da) || 0,
        other: parseFloat(formData.otherAllowances) || 0,
      },
      deductions: {
        pf: parseFloat(formData.pf) || 0,
        other: parseFloat(formData.otherDeductions) || 0,
      },
      taxAmount: parseFloat(formData.tax) || 0,
      paymentDate: formData.paymentDate,
      paymentMethod: formData.paymentMethod,
    };

    if (editingPayroll) {
      updatePayrollMutation.mutate({ id: editingPayroll.id, data: payrollData });
    } else {
      createPayrollMutation.mutate(payrollData);
    }
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
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            Create Payroll
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => setOpenProcessDialog(true)}
          >
            Process Payroll
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Payroll {selectedMonth && selectedYear 
                  ? `(${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'short' })} ${selectedYear})`
                  : '(All Periods)'}
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
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth || ''}
            label="Month"
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <MenuItem value="">All Months</MenuItem>
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
            value={selectedYear || ''}
            label="Year"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <MenuItem value="">All Years</MenuItem>
            {[2023, 2024, 2025, 2026].map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={() => {
            setSelectedMonth('');
            setSelectedYear('');
          }}
        >
          View All
        </Button>
        <Typography variant="body2" color="text.secondary">
          Showing {data?.payrolls?.length || 0} of {data?.pagination?.total || 0} records
        </Typography>
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
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDetails(payroll)}
                      >
                        Details
                      </Button>
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditClick(payroll)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteClick(payroll)}
                      >
                        Delete
                      </Button>
                    </Box>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm">
        <DialogTitle>Delete Payroll Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the payroll record for{' '}
            <strong>{deletingPayroll?.full_name}</strong> for{' '}
            <strong>
              {deletingPayroll && format(new Date(deletingPayroll.year, deletingPayroll.month - 1), 'MMMM yyyy')}
            </strong>
            ?
          </Typography>
          <Typography color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeletePayroll}
            disabled={deletePayrollMutation.isLoading}
            startIcon={deletePayrollMutation.isLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deletePayrollMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Payroll Dialog */}
      <Dialog 
        open={openCreateDialog || openEditDialog} 
        onClose={() => {
          setOpenCreateDialog(false);
          setOpenEditDialog(false);
          setEditingPayroll(null);
          resetForm();
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>{editingPayroll ? 'Edit Payroll Record' : 'Create Payroll Record'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* Employee Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={formData.employeeId}
                    onChange={(e) => handleFormChange('employeeId', e.target.value)}
                    label="Employee"
                    disabled={editingPayroll}
                  >
                    {employeesData?.employees?.map(emp => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Month & Year */}
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={formData.month}
                    onChange={(e) => handleFormChange('month', e.target.value)}
                    label="Month"
                    disabled={editingPayroll}
                  >
                    {[...Array(12)].map((_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label="Year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                  disabled={editingPayroll}
                />
              </Grid>

              {/* Basic Salary */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Basic Salary"
                  type="number"
                  value={formData.basicSalary}
                  onChange={(e) => handleFormChange('basicSalary', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Allowances Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                  Allowances
                </Typography>
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="HRA"
                  type="number"
                  value={formData.hra}
                  onChange={(e) => handleFormChange('hra', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="DA"
                  type="number"
                  value={formData.da}
                  onChange={(e) => handleFormChange('da', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Other Allowances"
                  type="number"
                  value={formData.otherAllowances}
                  onChange={(e) => handleFormChange('otherAllowances', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Deductions Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
                  Deductions
                </Typography>
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="PF (Provident Fund)"
                  type="number"
                  value={formData.pf}
                  onChange={(e) => handleFormChange('pf', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Tax"
                  type="number"
                  value={formData.tax}
                  onChange={(e) => handleFormChange('tax', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Other Deductions"
                  type="number"
                  value={formData.otherDeductions}
                  onChange={(e) => handleFormChange('otherDeductions', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Calculated Summary */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Gross Salary</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(calculateGrossAndNet().gross)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Total Deductions</Typography>
                      <Typography variant="h6" color="error">
                        {formatCurrency(calculateGrossAndNet().totalDeductions)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Net Salary</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(calculateGrossAndNet().net)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Payment Details */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Payment Date"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleFormChange('paymentDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                    label="Payment Method"
                  >
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="direct_deposit">Direct Deposit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCreateDialog(false);
            setOpenEditDialog(false);
            setEditingPayroll(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitPayroll}
            disabled={createPayrollMutation.isLoading || updatePayrollMutation.isLoading}
            startIcon={(createPayrollMutation.isLoading || updatePayrollMutation.isLoading) ? <CircularProgress size={20} /> : null}
          >
            {editingPayroll ? 'Update' : 'Create'} Payroll
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;

