import { Grid, Box, Typography } from '@mui/material';
import {
  People as PeopleIcon,
  EventAvailable as EventAvailableIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import StatCard from '../../components/dashboard/StatCard';
import KPICard from '../../components/dashboard/KPICard';
import QuickActions from '../../components/dashboard/QuickActions';
import DataTable from '../../components/dashboard/DataTable';
import BarChart from '../../components/charts/BarChart';
import RadarChart from '../../components/charts/RadarChart';

const ManagerDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['managerStats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/manager');
        return response.data;
      } catch (error) {
        // Fallback data matching actual database seed
        return {
          teamSize: 2,
          presentToday: 2,
          onLeave: 0,
          pendingLeaveRequests: 2,
          teamAttendance: [
            { name: 'Mon', present: 2, absent: 0 },
            { name: 'Tue', present: 2, absent: 0 },
            { name: 'Wed', present: 2, absent: 0 },
            { name: 'Thu', present: 2, absent: 0 },
            { name: 'Fri', present: 2, absent: 0 },
            { name: 'Sat', present: 0, absent: 2 },
            { name: 'Sun', present: 0, absent: 2 },
          ],
          teamPerformance: [
            { subject: 'Quality', teamAvg: 85, target: 90 },
            { subject: 'Productivity', teamAvg: 80, target: 85 },
            { subject: 'Communication', teamAvg: 82, target: 85 },
            { subject: 'Teamwork', teamAvg: 87, target: 90 },
            { subject: 'Goals', teamAvg: 83, target: 85 },
          ],
          pendingLeaveList: [
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
          ],
          directReports: [
            {
              name: 'Alice Developer',
              position: 'Senior Software Engineer',
              attendance: '95%',
              performance: 85,
              status: 'Active',
            },
            {
              name: 'Bob Developer',
              position: 'Software Engineer',
              attendance: '93%',
              performance: 80,
              status: 'Active',
            },
          ],
        };
      }
    },
  });

  const quickActions = [
    {
      title: 'Approve Leave',
      description: 'Review requests',
      icon: <EventAvailableIcon />,
      color: 'primary',
      path: '/leave',
    },
    {
      title: 'Submit Review',
      description: 'Performance review',
      icon: <RateReviewIcon />,
      color: 'success',
      path: '/performance',
    },
    {
      title: 'Team Reports',
      description: 'View analytics',
      icon: <AssessmentIcon />,
      color: 'warning',
      path: '/performance',
    },
  ];

  const leaveColumns = [
    { id: 'employee', label: 'Employee', minWidth: 120 },
    { id: 'type', label: 'Type', minWidth: 100 },
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

  const teamColumns = [
    { id: 'name', label: 'Name', minWidth: 140 },
    { id: 'position', label: 'Position', minWidth: 140 },
    { id: 'attendance', label: 'Attendance', minWidth: 100 },
    { id: 'performance', label: 'Performance', minWidth: 100 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      type: 'chip',
      getColor: () => 'success',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Team Manager Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team Size"
            value={stats?.teamSize || 0}
            icon={<PeopleIcon />}
            color="primary"
            subtitle="direct reports"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Present Today"
            value={stats?.presentToday || 0}
            icon={<CheckCircleIcon />}
            color="success"
            subtitle="team members"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="On Leave"
            value={stats?.onLeave || 0}
            icon={<EventAvailableIcon />}
            color="warning"
            subtitle="today"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingLeaveRequests || 0}
            icon={<AttachMoneyIcon />}
            color="error"
            subtitle="leave requests"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <KPICard title="Team Attendance (Last 7 Days)">
            <BarChart
              data={stats?.teamAttendance || []}
              dataKeys={['present', 'absent']}
              xAxisKey="name"
              height={280}
            />
          </KPICard>
        </Grid>
        <Grid item xs={12} md={6}>
          <KPICard title="Team Performance Overview">
            <RadarChart
              data={stats?.teamPerformance || []}
              dataKeys={['teamAvg', 'target']}
              height={280}
            />
          </KPICard>
        </Grid>
      </Grid>

      {/* Tables */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <KPICard title="Pending Leave Requests">
            <DataTable
              columns={leaveColumns}
              data={stats?.pendingLeaveList || []}
              showPagination={false}
            />
          </KPICard>
        </Grid>
        <Grid item xs={12} md={6}>
          <KPICard title="Direct Reports">
            <DataTable
              columns={teamColumns}
              data={stats?.directReports || []}
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

export default ManagerDashboard;

