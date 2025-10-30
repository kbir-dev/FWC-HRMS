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
  Chip,
  CircularProgress,
  Avatar,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  InputAdornment,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Close as CloseIcon 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const Employees = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newRole, setNewRole] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await apiClient.get('/employees');
      return response.data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ employeeId, role }) => {
      // This would update the user role via backend
      // For now, we'll assume there's an endpoint to update user roles
      const response = await apiClient.put(`/employees/${employeeId}`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      toast.success('Employee role updated successfully');
      setRoleDialogOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update role');
    },
  });

  const handleOpenRoleDialog = (employee) => {
    setSelectedEmployee(employee);
    setNewRole(employee.role || 'employee');
    setRoleDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (selectedEmployee) {
      updateRoleMutation.mutate({
        employeeId: selectedEmployee.id,
        role: newRole,
      });
    }
  };

  const filteredEmployees = data?.employees?.filter((emp) => {
    const matchesSearch = 
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      hr: 'primary',
      recruiter: 'secondary',
      manager: 'warning',
      employee: 'default',
    };
    return colors[role] || 'default';
  };

  if (isLoading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Employees
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage employee information and roles
          </Typography>
        </Box>
        <Chip
          label={`${filteredEmployees.length} of ${data?.employees?.length || 0} employees`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Name, code, email, position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {employee.full_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {employee.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employee.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{employee.employee_code}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{employee.position || 'N/A'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{employee.department_name || 'N/A'}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={(employee.role || 'employee').toUpperCase()}
                    size="small"
                    color={getRoleColor(employee.role)}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={employee.employment_type || 'N/A'} 
                    size="small" 
                    variant="outlined" 
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={employee.status || 'active'}
                    size="small"
                    color={employee.status === 'active' ? 'success' : 'default'}
                  />
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Tooltip title="Change Role">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenRoleDialog(employee)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredEmployees.length === 0 && (
        <Typography variant="body1" color="text.secondary" textAlign="center" mt={4}>
          {searchTerm || statusFilter !== 'all' 
            ? 'No employees match your filters' 
            : 'No employees found'}
        </Typography>
      )}

      {/* Role Update Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Change Employee Role
          <IconButton
            aria-label="close"
            onClick={() => setRoleDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Employee
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {selectedEmployee?.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedEmployee?.email}
            </Typography>
          </Box>
          <TextField
            fullWidth
            select
            label="System Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            helperText="Assign role for system access permissions"
          >
            <MenuItem value="employee">Employee</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="recruiter">Recruiter</MenuItem>
            <MenuItem value="hr">HR Manager</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Role Permissions:</strong>
              <br />
              • <strong>Admin:</strong> Full system access
              <br />
              • <strong>HR Manager:</strong> Employee, payroll, leave management
              <br />
              • <strong>Recruiter:</strong> Jobs and applications
              <br />
              • <strong>Manager:</strong> Team management
              <br />
              • <strong>Employee:</strong> Basic access
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={updateRoleMutation.isLoading}
          >
            {updateRoleMutation.isLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;

