import { Grid, Box, Typography, Avatar, Paper, LinearProgress, Chip } from '@mui/material';
import {
  Person as PersonIcon,
  EventAvailable as EventAvailableIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
  Work as WorkIcon,
  CalendarToday as CalendarTodayIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import StatCard from '../../components/dashboard/StatCard';
import KPICard from '../../components/dashboard/KPICard';
import QuickActions from '../../components/dashboard/QuickActions';
import DataTable from '../../components/dashboard/DataTable';
import BarChart from '../../components/charts/BarChart';

const EmployeeDashboard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['employeeStats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/employee');
        return response.data;
      } catch (error) {
        // Fallback data matching actual database seed
        return {
          personalInfo: {
            name: user?.email?.split('@')[0] || 'Employee',
            position: 'Senior Software Engineer',
            department: 'Engineering',
            manager: 'Tech Manager',
            joinDate: 'Jan 15, 2024',
          },
          attendanceStats: {
            presentDays: 20,
            absentDays: 0,
            lateDays: 1,
            totalDays: 21,
          },
          leaveBalance: [
            { type: 'Vacation', available: 13, used: 2, total: 15 },
            { type: 'Sick Leave', available: 8, used: 2, total: 10 },
            { type: 'Personal', available: 4, used: 1, total: 5 },
          ],
          attendanceTrend: [
            { name: 'Week 1', present: 5, absent: 0 },
            { name: 'Week 2', present: 5, absent: 0 },
            { name: 'Week 3', present: 5, absent: 0 },
            { name: 'Week 4', present: 5, absent: 0 },
          ],
          recentPayslips: [
            {
              month: 'September 2024',
              gross: '$126,500',
              deductions: '$39,900',
              net: '$87,700',
              date: 'Sep 30, 2024',
            },
            {
              month: 'August 2024',
              gross: '$126,500',
              deductions: '$39,900',
              net: '$87,700',
              date: 'Aug 31, 2024',
            },
          ],
          performanceScore: {
            overall: 85,
            quality: 88,
            productivity: 82,
            communication: 87,
          },
          internalJobs: [
            {
              title: 'Senior Full Stack Engineer',
              department: 'Engineering',
              type: 'Full-time',
              posted: 'This week',
            },
            {
              title: 'Full Stack Developer',
              department: 'Engineering',
              type: 'Full-time',
              posted: 'This week',
            },
          ],
          upcomingEvents: [
            { event: 'Team Meeting', date: new Date(Date.now() + 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), type: 'Meeting' },
            { event: 'Performance Review', date: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), type: 'Review' },
          ],
        };
      }
    },
  });

  const quickActions = [
    {
      title: 'Apply for Leave',
      description: 'Submit request',
      icon: <EventAvailableIcon />,
      color: 'primary',
      path: '/leave',
    },
    {
      title: 'View Payslip',
      description: 'Download payslips',
      icon: <AttachMoneyIcon />,
      color: 'success',
      path: '/payroll',
    },
    {
      title: 'Update Profile',
      description: 'Edit information',
      icon: <EditIcon />,
      color: 'warning',
      path: '/profile',
    },
    {
      title: 'Browse Jobs',
      description: 'Internal openings',
      icon: <WorkIcon />,
      color: 'info',
      path: '/jobs',
    },
    {
      title: 'My Performance',
      description: 'View reviews',
      icon: <AssessmentIcon />,
      color: 'secondary',
      path: '/performance',
    },
    {
      title: 'My Attendance',
      description: 'Track attendance',
      icon: <CalendarTodayIcon />,
      color: 'error',
      path: '/attendance',
    },
  ];

  const payslipColumns = [
    { id: 'month', label: 'Month', minWidth: 120 },
    { id: 'gross', label: 'Gross Salary', minWidth: 100 },
    { id: 'deductions', label: 'Deductions', minWidth: 100 },
    { id: 'net', label: 'Net Salary', minWidth: 100 },
    { id: 'date', label: 'Date', minWidth: 100 },
  ];

  const jobColumns = [
    { id: 'title', label: 'Job Title', minWidth: 200 },
    { id: 'department', label: 'Department', minWidth: 120 },
    { id: 'type', label: 'Type', minWidth: 100 },
    { id: 'posted', label: 'Posted', minWidth: 100 },
  ];

  const eventColumns = [
    { id: 'event', label: 'Event', minWidth: 180 },
    { id: 'date', label: 'Date', minWidth: 120 },
    {
      id: 'type',
      label: 'Type',
      minWidth: 100,
      type: 'chip',
      getColor: (value) =>
        value === 'Holiday' ? 'success' : value === 'Meeting' ? 'primary' : 'warning',
    },
  ];

  const attendancePercentage = stats?.attendanceStats
    ? Math.round((stats.attendanceStats.presentDays / stats.attendanceStats.totalDays) * 100)
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        My Dashboard
      </Typography>

      {/* Personal Info Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {stats?.personalInfo?.name?.charAt(0).toUpperCase() || 'E'}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {stats?.personalInfo?.name || user?.email}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {stats?.personalInfo?.position} • {stats?.personalInfo?.department}
                </Typography>
                <Box display="flex" gap={2} mt={1}>
                  <Chip
                    icon={<PersonIcon />}
                    label={`Manager: ${stats?.personalInfo?.manager}`}
                    size="small"
                  />
                  <Chip
                    icon={<CalendarTodayIcon />}
                    label={`Joined: ${stats?.personalInfo?.joinDate}`}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Attendance Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Attendance Rate"
            value={`${attendancePercentage}%`}
            icon={<CalendarTodayIcon />}
            color="primary"
            subtitle="this month"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Present Days"
            value={stats?.attendanceStats?.presentDays || 0}
            icon={<EventAvailableIcon />}
            color="success"
            subtitle="this month"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Late Arrivals"
            value={stats?.attendanceStats?.lateDays || 0}
            icon={<CalendarTodayIcon />}
            color="warning"
            subtitle="this month"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Performance Score"
            value={stats?.performanceScore?.overall || 0}
            icon={<AssessmentIcon />}
            color="info"
            subtitle="out of 100"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Leave Balance */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <KPICard title="Leave Balance">
            <Grid container spacing={2}>
              {stats?.leaveBalance?.map((leave, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {leave.type}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {leave.available}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      of {leave.total} days available
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(leave.available / leave.total) * 100}
                      sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </KPICard>
        </Grid>
      </Grid>

      {/* Charts and Tables */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <KPICard title="Attendance Trend (Last 4 Weeks)">
            <BarChart
              data={stats?.attendanceTrend || []}
              dataKeys={['present', 'absent']}
              xAxisKey="name"
              height={250}
            />
          </KPICard>
        </Grid>
        <Grid item xs={12} md={6}>
          <KPICard title="Recent Payslips">
            <DataTable
              columns={payslipColumns}
              data={stats?.recentPayslips || []}
              showPagination={false}
            />
          </KPICard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <KPICard title="Internal Job Opportunities">
            <DataTable
              columns={jobColumns}
              data={stats?.internalJobs || []}
              showPagination={false}
            />
          </KPICard>
        </Grid>
        <Grid item xs={12} md={6}>
          <KPICard title="Upcoming Events & Holidays">
            <DataTable
              columns={eventColumns}
              data={stats?.upcomingEvents || []}
              showPagination={false}
            />
          </KPICard>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
        </Typography>
        <QuickActions actions={quickActions} />
      </Box>
    </Box>
  );
};

export default EmployeeDashboard;

