import { Grid, Box, Typography } from '@mui/material';
import {
  People as PeopleIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import StatCard from '../../components/dashboard/StatCard';
import KPICard from '../../components/dashboard/KPICard';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import QuickActions from '../../components/dashboard/QuickActions';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/admin');
        return response.data;
      } catch (error) {
        // Return mock data if endpoint doesn't exist yet
        return {
          totalUsers: 156,
          totalEmployees: 145,
          totalDepartments: 12,
          activeJobs: 8,
          pendingApplications: 45,
          userActivity: [
            { name: 'Mon', logins: 42, active: 38 },
            { name: 'Tue', logins: 48, active: 45 },
            { name: 'Wed', logins: 51, active: 48 },
            { name: 'Thu', logins: 45, active: 42 },
            { name: 'Fri', logins: 55, active: 52 },
            { name: 'Sat', logins: 12, active: 10 },
            { name: 'Sun', logins: 8, active: 6 },
          ],
          recruitmentFunnel: [
            { name: 'Applied', count: 145 },
            { name: 'Screened', count: 89 },
            { name: 'Interview', count: 34 },
            { name: 'Offer', count: 12 },
            { name: 'Hired', count: 8 },
          ],
          departmentDistribution: [
            { name: 'Engineering', value: 45 },
            { name: 'Sales', value: 28 },
            { name: 'Marketing', value: 22 },
            { name: 'HR', value: 15 },
            { name: 'Finance', value: 18 },
            { name: 'Operations', value: 17 },
          ],
          recentActivities: [
            {
              type: 'user',
              title: 'New User Registered',
              description: 'John Smith joined as Software Engineer',
              time: '2 hours ago',
              badge: 'New',
            },
            {
              type: 'job',
              title: 'Job Posted',
              description: 'Senior Frontend Developer position opened',
              time: '5 hours ago',
            },
            {
              type: 'application',
              title: 'Application Received',
              description: '15 new applications for Data Analyst role',
              time: '1 day ago',
            },
          ],
        };
      }
    },
  });

  const quickActions = [
    {
      title: 'Add User',
      description: 'Create new user account',
      icon: <PersonAddIcon />,
      color: 'primary',
      path: '/employees',
    },
    {
      title: 'View Reports',
      description: 'Analytics & insights',
      icon: <AssessmentIcon />,
      color: 'success',
      path: '/reports',
    },
    {
      title: 'System Settings',
      description: 'Configure system',
      icon: <SettingsIcon />,
      color: 'warning',
      path: '/settings',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Administrator Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<PeopleIcon />}
            color="primary"
            trend="up"
            trendValue="+12%"
            subtitle="vs last month"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Employees"
            value={stats?.totalEmployees || 0}
            icon={<PersonAddIcon />}
            color="success"
            trend="up"
            trendValue="+8%"
            subtitle="vs last month"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Departments"
            value={stats?.totalDepartments || 0}
            icon={<BusinessIcon />}
            color="info"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={stats?.activeJobs || 0}
            icon={<WorkIcon />}
            color="warning"
            trend="up"
            trendValue="+3"
            subtitle="this week"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <KPICard title="User Activity (Last 7 Days)">
            <LineChart
              data={stats?.userActivity || []}
              dataKeys={['logins', 'active']}
              xAxisKey="name"
              height={280}
            />
          </KPICard>
        </Grid>
        <Grid item xs={12} md={4}>
          <KPICard title="Department Distribution">
            <PieChart
              data={stats?.departmentDistribution || []}
              height={280}
              showLegend={false}
            />
          </KPICard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <KPICard title="Recruitment Funnel">
            <BarChart
              data={stats?.recruitmentFunnel || []}
              dataKeys={['count']}
              xAxisKey="name"
              height={250}
              showLegend={false}
            />
          </KPICard>
        </Grid>
        <Grid item xs={12} md={6}>
          <KPICard title="Recent System Activity">
            <ActivityFeed activities={stats?.recentActivities || []} />
          </KPICard>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
        </Typography>
        <QuickActions actions={quickActions} />
      </Box>
    </Box>
  );
};

export default AdminDashboard;

