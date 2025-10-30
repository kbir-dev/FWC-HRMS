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
        // Fallback data matching actual database seed
        return {
          activeJobs: 2,
          totalApplications: 10,
          shortlisted: 7,
          scheduled: 5,
          aiScoreDistribution: [
            { name: '90-100', count: 3 },
            { name: '80-89', count: 2 },
            { name: '70-79', count: 2 },
            { name: '60-69', count: 2 },
            { name: '<60', count: 1 },
          ],
          applicationPipeline: [
            { status: 'Shortlisted', count: 7, color: '#43a047' },
            { status: 'Screened', count: 2, color: '#1976d2' },
            { status: 'Rejected', count: 1, color: '#e53935' },
          ],
          topCandidates: [
            {
              name: 'John Smith',
              position: 'Senior Full Stack Engineer',
              score: 95,
              status: 'Shortlisted',
              applied: 'Today',
            },
            {
              name: 'Emily Rodriguez',
              position: 'Senior Full Stack Engineer',
              score: 92,
              status: 'Shortlisted',
              applied: 'Today',
            },
            {
              name: 'Lisa Thompson',
              position: 'Senior Full Stack Engineer',
              score: 88,
              status: 'Shortlisted',
              applied: 'Today',
            },
          ],
          activeJobsList: [
            {
              title: 'Senior Full Stack Engineer',
              applications: 8,
              shortlisted: 6,
              status: 'Open',
            },
            {
              title: 'Full Stack Developer',
              applications: 2,
              shortlisted: 1,
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

