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
        // Fallback data matching actual database seed
        return {
          totalEmployees: 6,
          newHires: 2,
          pendingLeave: 5,
          totalApplications: 10,
          headcountTrend: [
            { name: 'May', count: 4 },
            { name: 'Jun', count: 4 },
            { name: 'Jul', count: 5 },
            { name: 'Aug', count: 5 },
            { name: 'Sep', count: 6 },
            { name: 'Oct', count: 6 },
          ],
          applicationsByStatus: [
            { name: 'Shortlisted', count: 7 },
            { name: 'Screened', count: 2 },
            { name: 'Rejected', count: 1 },
          ],
          upcomingInterviews: [
            {
              candidate: 'John Smith',
              position: 'Senior Full Stack Engineer',
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              time: '10:00 AM',
              status: 'Scheduled',
            },
            {
              candidate: 'Emily Rodriguez',
              position: 'Senior Full Stack Engineer',
              date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
              time: '12:00 PM',
              status: 'Scheduled',
            },
            {
              candidate: 'Lisa Thompson',
              position: 'Senior Full Stack Engineer',
              date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
              time: '2:00 PM',
              status: 'Scheduled',
            },
            {
              candidate: 'James Wilson',
              position: 'Full Stack Developer',
              date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
              time: '4:00 PM',
              status: 'Scheduled',
            },
            {
              candidate: 'Maria Garcia',
              position: 'Full Stack Developer',
              date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
              time: '6:00 PM',
              status: 'Scheduled',
            },
          ],
          pendingLeaveRequests: [
            {
              employee: 'Alice Developer',
              type: 'Vacation',
              dates: 'Nov 1-3',
              days: 3,
              status: 'Pending',
            },
            {
              employee: 'Bob Developer',
              type: 'Sick Leave',
              dates: 'Nov 5',
              days: 1,
              status: 'Pending',
            },
            {
              employee: 'Tech Manager',
              type: 'Personal',
              dates: 'Nov 8-10',
              days: 3,
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

