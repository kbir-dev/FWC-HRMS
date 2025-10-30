import { Grid, Box, Typography } from '@mui/material';
import {
  People as PeopleIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  EventAvailable as EventAvailableIcon,
  PersonAdd as PersonAddIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  PostAdd as PostAddIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import StatCard from '../../components/dashboard/StatCard';
import KPICard from '../../components/dashboard/KPICard';
import QuickActions from '../../components/dashboard/QuickActions';
import DataTable from '../../components/dashboard/DataTable';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';

const HRDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['hrStats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/hr');
        return response.data;
      } catch (error) {
        return {
          totalEmployees: 145,
          newHires: 12,
          pendingLeave: 8,
          totalApplications: 89,
          headcountTrend: [
            { name: 'Jan', count: 128 },
            { name: 'Feb', count: 132 },
            { name: 'Mar', count: 135 },
            { name: 'Apr', count: 139 },
            { name: 'May', count: 142 },
            { name: 'Jun', count: 145 },
          ],
          applicationsByStatus: [
            { name: 'Applied', count: 45 },
            { name: 'Screened', count: 28 },
            { name: 'Interview', count: 12 },
            { name: 'Shortlisted', count: 4 },
          ],
          upcomingInterviews: [
            {
              candidate: 'Alice Johnson',
              position: 'Senior Developer',
              date: '2025-10-29',
              time: '10:00 AM',
              status: 'Scheduled',
            },
            {
              candidate: 'Bob Smith',
              position: 'Product Manager',
              date: '2025-10-29',
              time: '2:00 PM',
              status: 'Scheduled',
            },
            {
              candidate: 'Carol Davis',
              position: 'UX Designer',
              date: '2025-10-30',
              time: '11:00 AM',
              status: 'Pending',
            },
          ],
          pendingLeaveRequests: [
            {
              employee: 'John Doe',
              type: 'Annual Leave',
              dates: 'Nov 1-5',
              days: 5,
              status: 'Pending',
            },
            {
              employee: 'Jane Smith',
              type: 'Sick Leave',
              dates: 'Oct 30-31',
              days: 2,
              status: 'Pending',
            },
          ],
        };
      }
    },
  });

  const quickActions = [
    {
      title: 'Post Job',
      description: 'Create new job opening',
      icon: <PostAddIcon />,
      color: 'primary',
      path: '/jobs',
    },
    {
      title: 'Add Employee',
      description: 'Onboard new employee',
      icon: <PersonAddIcon />,
      color: 'success',
      path: '/employees',
    },
    {
      title: 'Review Applications',
      description: 'Screen candidates',
      icon: <DescriptionIcon />,
      color: 'warning',
      path: '/applications',
    },
    {
      title: 'Process Payroll',
      description: 'Manage payroll',
      icon: <AccountBalanceIcon />,
      color: 'info',
      path: '/payroll',
    },
    {
      title: 'Approve Leave',
      description: 'Review leave requests',
      icon: <EventAvailableIcon />,
      color: 'secondary',
      path: '/leave',
    },
    {
      title: 'View Reports',
      description: 'HR analytics',
      icon: <AssessmentIcon />,
      color: 'error',
      path: '/performance',
    },
  ];

  const interviewColumns = [
    { id: 'candidate', label: 'Candidate', minWidth: 120 },
    { id: 'position', label: 'Position', minWidth: 120 },
    { id: 'date', label: 'Date', minWidth: 80 },
    { id: 'time', label: 'Time', minWidth: 80 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      type: 'chip',
      getColor: (value) => (value === 'Scheduled' ? 'success' : 'warning'),
    },
  ];

  const leaveColumns = [
    { id: 'employee', label: 'Employee', minWidth: 120 },
    { id: 'type', label: 'Leave Type', minWidth: 120 },
    { id: 'dates', label: 'Dates', minWidth: 100 },
    { id: 'days', label: 'Days', minWidth: 60 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      type: 'chip',
      getColor: () => 'warning',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        HR Manager Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            icon={<PeopleIcon />}
            color="primary"
            trend="up"
            trendValue="+5%"
            subtitle="vs last month"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Hires"
            value={stats?.newHires || 0}
            icon={<PersonAddIcon />}
            color="success"
            subtitle="this quarter"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Applications"
            value={stats?.totalApplications || 0}
            icon={<DescriptionIcon />}
            color="warning"
            trend="up"
            trendValue="+18"
            subtitle="this week"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Leave"
            value={stats?.pendingLeave || 0}
            icon={<EventAvailableIcon />}
            color="error"
            subtitle="awaiting approval"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <KPICard title="Employee Headcount Trend">
            <LineChart
              data={stats?.headcountTrend || []}
              dataKeys={['count']}
              xAxisKey="name"
              height={250}
              showLegend={false}
            />
          </KPICard>
        </Grid>
        <Grid item xs={12} md={6}>
          <KPICard title="Recruitment Pipeline">
            <BarChart
              data={stats?.applicationsByStatus || []}
              dataKeys={['count']}
              xAxisKey="name"
              height={250}
              showLegend={false}
            />
          </KPICard>
        </Grid>
      </Grid>

      {/* Tables */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <KPICard title="Upcoming Interviews">
            <DataTable
              columns={interviewColumns}
              data={stats?.upcomingInterviews || []}
              showPagination={false}
            />
          </KPICard>
        </Grid>
        <Grid item xs={12} md={6}>
          <KPICard title="Pending Leave Requests">
            <DataTable
              columns={leaveColumns}
              data={stats?.pendingLeaveRequests || []}
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

export default HRDashboard;

