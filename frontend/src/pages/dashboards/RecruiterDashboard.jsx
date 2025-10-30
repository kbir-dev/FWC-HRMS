import { Grid, Box, Typography, Paper, Chip } from '@mui/material';
import {
  Work as WorkIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  PostAdd as PostAddIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import StatCard from '../../components/dashboard/StatCard';
import KPICard from '../../components/dashboard/KPICard';
import QuickActions from '../../components/dashboard/QuickActions';
import DataTable from '../../components/dashboard/DataTable';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';

const RecruiterDashboard = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['recruiterStats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/dashboard/recruiter');
        return response.data;
      } catch (error) {
        return {
          activeJobs: 8,
          totalApplications: 145,
          shortlisted: 23,
          scheduled: 12,
          aiScoreDistribution: [
            { name: '90-100', count: 12 },
            { name: '80-89', count: 18 },
            { name: '70-79', count: 25 },
            { name: '60-69', count: 32 },
            { name: '<60', count: 58 },
          ],
          applicationPipeline: [
            { status: 'Applied', count: 145, color: '#1976d2' },
            { status: 'Screened', count: 89, color: '#00897b' },
            { status: 'Interview', count: 34, color: '#fb8c00' },
            { status: 'Offer', count: 12, color: '#43a047' },
          ],
          topCandidates: [
            {
              name: 'Alice Johnson',
              position: 'Senior Developer',
              score: 95,
              status: 'Interview',
              applied: '2 days ago',
            },
            {
              name: 'Bob Martinez',
              position: 'Product Manager',
              score: 92,
              status: 'Screened',
              applied: '3 days ago',
            },
            {
              name: 'Carol Williams',
              position: 'UX Designer',
              score: 88,
              status: 'Shortlisted',
              applied: '1 week ago',
            },
          ],
          activeJobsList: [
            {
              title: 'Senior Frontend Developer',
              applications: 45,
              shortlisted: 8,
              status: 'Open',
            },
            {
              title: 'Data Scientist',
              applications: 32,
              shortlisted: 6,
              status: 'Open',
            },
            {
              title: 'DevOps Engineer',
              applications: 28,
              shortlisted: 5,
              status: 'Open',
            },
          ],
        };
      }
    },
  });

  const quickActions = [
    {
      title: 'Post New Job',
      description: 'Create job opening',
      icon: <PostAddIcon />,
      color: 'primary',
      path: '/jobs',
    },
    {
      title: 'Review Applications',
      description: 'Screen candidates',
      icon: <RateReviewIcon />,
      color: 'success',
      path: '/applications',
    },
    {
      title: 'Schedule Interview',
      description: 'Set up interviews',
      icon: <ScheduleIcon />,
      color: 'warning',
      path: '/applications',
    },
  ];

  const candidateColumns = [
    { id: 'name', label: 'Candidate', minWidth: 120 },
    { id: 'position', label: 'Position', minWidth: 140 },
    {
      id: 'score',
      label: 'AI Score',
      minWidth: 80,
      render: (value) => (
        <Chip
          label={value}
          color={value >= 90 ? 'success' : value >= 70 ? 'primary' : 'warning'}
          size="small"
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      type: 'chip',
      getColor: (value) =>
        value === 'Interview'
          ? 'success'
          : value === 'Screened'
          ? 'primary'
          : 'warning',
    },
    { id: 'applied', label: 'Applied', minWidth: 100 },
  ];

  const jobColumns = [
    { id: 'title', label: 'Job Title', minWidth: 200 },
    { id: 'applications', label: 'Applications', minWidth: 100 },
    { id: 'shortlisted', label: 'Shortlisted', minWidth: 100 },
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
        Recruiter Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Jobs"
            value={stats?.activeJobs || 0}
            icon={<WorkIcon />}
            color="primary"
            trend="up"
            trendValue="+2"
            subtitle="this week"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Applications"
            value={stats?.totalApplications || 0}
            icon={<DescriptionIcon />}
            color="success"
            trend="up"
            trendValue="+24"
            subtitle="this week"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Shortlisted"
            value={stats?.shortlisted || 0}
            icon={<PeopleIcon />}
            color="warning"
            subtitle="candidates"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Interviews Scheduled"
            value={stats?.scheduled || 0}
            icon={<ScheduleIcon />}
            color="info"
            subtitle="this week"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Application Pipeline */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <KPICard title="Application Pipeline">
            <Grid container spacing={2}>
              {stats?.applicationPipeline?.map((stage, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderLeft: `4px solid ${stage.color}`,
                      bgcolor: 'background.default',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {stage.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stage.status}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </KPICard>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <KPICard title="AI Screening Score Distribution">
            <BarChart
              data={stats?.aiScoreDistribution || []}
              dataKeys={['count']}
              xAxisKey="name"
              height={250}
              showLegend={false}
            />
          </KPICard>
        </Grid>
        <Grid item xs={12} md={6}>
          <KPICard title="Top Candidates (AI Ranked)">
            <DataTable
              columns={candidateColumns}
              data={stats?.topCandidates || []}
              showPagination={false}
              onRowClick={(row) => navigate('/applications')}
            />
          </KPICard>
        </Grid>
      </Grid>

      {/* Active Jobs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <KPICard title="Active Job Postings">
            <DataTable
              columns={jobColumns}
              data={stats?.activeJobsList || []}
              showPagination={false}
              onRowClick={(row) => navigate('/jobs')}
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

export default RecruiterDashboard;

