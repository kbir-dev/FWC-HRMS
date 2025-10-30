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
        return {
          teamSize: 12,
          presentToday: 10,
          onLeave: 2,
          pendingLeaveRequests: 3,
          teamAttendance: [
            { name: 'Mon', present: 11, absent: 1 },
            { name: 'Tue', present: 12, absent: 0 },
            { name: 'Wed', present: 10, absent: 2 },
            { name: 'Thu', present: 11, absent: 1 },
            { name: 'Fri', present: 10, absent: 2 },
            { name: 'Sat', present: 0, absent: 12 },
            { name: 'Sun', present: 0, absent: 12 },
          ],
          teamPerformance: [
            { subject: 'Quality', teamAvg: 85, target: 90 },
            { subject: 'Productivity', teamAvg: 78, target: 85 },
            { subject: 'Communication', teamAvg: 88, target: 85 },
            { subject: 'Teamwork', teamAvg: 92, target: 90 },
            { subject: 'Goals', teamAvg: 80, target: 85 },
          ],
          pendingLeaveList: [
            {
              employee: 'John Doe',
              type: 'Annual Leave',
              dates: 'Nov 1-3',
              days: 3,
              status: 'Pending',
            },
            {
              employee: 'Jane Smith',
              type: 'Sick Leave',
              dates: 'Oct 31',
              days: 1,
              status: 'Pending',
            },
            {
              employee: 'Mike Johnson',
              type: 'Personal',
              dates: 'Nov 5-6',
              days: 2,
              status: 'Pending',
            },
          ],
          directReports: [
            {
              name: 'John Doe',
              position: 'Senior Developer',
              attendance: '95%',
              performance: 88,
              status: 'Active',
            },
            {
              name: 'Jane Smith',
              position: 'Developer',
              attendance: '92%',
              performance: 85,
              status: 'Active',
            },
            {
              name: 'Mike Johnson',
              position: 'Junior Developer',
              attendance: '98%',
              performance: 82,
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

