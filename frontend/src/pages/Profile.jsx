import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Email,
  Phone,
  Work,
  CalendarToday,
  Business,
  Person,
  Badge,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { format } from 'date-fns';

const Profile = () => {
  const { user } = useAuth();

  // Fetch current user details
  const { data, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const userInfo = data?.user;
  const employee = userInfo?.employee;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem',
              }}
            >
              {employee?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              {employee?.name || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {userInfo?.email}
            </Typography>
            <Box mt={2} display="flex" justifyContent="center" gap={1}>
              <Chip
                label={userInfo?.role?.toUpperCase()}
                color="primary"
                size="small"
              />
              {userInfo?.isActive && (
                <Chip label="Active" color="success" size="small" />
              )}
            </Box>
          </Paper>

          {/* Account Information */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Member Since"
                  secondary={
                    userInfo?.createdAt
                      ? format(new Date(userInfo.createdAt), 'MMM dd, yyyy')
                      : 'N/A'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Last Login"
                  secondary={
                    userInfo?.lastLogin
                      ? format(new Date(userInfo.lastLogin), 'MMM dd, yyyy HH:mm')
                      : 'N/A'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Account Status"
                  secondary={userInfo?.isActive ? 'Active' : 'Inactive'}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Employee Details */}
        <Grid item xs={12} md={8}>
          {employee ? (
            <>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Employee Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Badge color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Employee Code
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {employee.code || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Work color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Position
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {employee.position || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Business color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {employee.departmentId
                            ? `Department ID: ${employee.departmentId}`
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Person color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Manager
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {employee.managerId
                            ? `Manager ID: ${employee.managerId}`
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={2}>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {userInfo?.role || 'Employee'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Role
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        Active
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center" p={2} bgcolor="info.light" borderRadius={2}>
                      <Typography variant="h4" fontWeight="bold" color="info.main">
                        {employee.code || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Employee ID
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No employee profile found. Please contact HR to set up your employee record.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;

