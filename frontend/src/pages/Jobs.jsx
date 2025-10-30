import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import { LocationOn, Work, CalendarToday, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { jobsAPI } from '../api/jobs';
import { format } from 'date-fns';

const Jobs = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const canManageJobs = ['admin', 'hr', 'recruiter'].includes(user?.role);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { status: isEmployee ? 'open' : 'published' }],
    queryFn: () => jobsAPI.getJobs({ status: isEmployee ? 'open' : 'published' }),
  });

  if (isLoading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            {isEmployee ? 'Internal Job Board' : 'Job Postings'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isEmployee
              ? 'Explore internal career opportunities and apply for positions'
              : 'Manage job postings and view applications'}
          </Typography>
        </Box>
        {canManageJobs && (
          <Button
            component={Link}
            to="/jobs/create"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ minWidth: 150 }}
          >
            Post New Job
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {data?.jobs?.map((job) => (
          <Grid item xs={12} md={6} key={job.id}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {job.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {job.department_name && (
                    <Chip label={job.department_name} size="small" color="primary" variant="outlined" />
                  )}
                  {job.employment_type && (
                    <Chip label={job.employment_type} size="small" />
                  )}
                  {job.experience_level && (
                    <Chip label={job.experience_level} size="small" color="secondary" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {job.description?.substring(0, 150)}...
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {job.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {job.location}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Posted {format(new Date(job.published_at), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <Button component={Link} to={`/jobs/${job.id}`} size="small">
                  View Details
                </Button>
                <Button
                  component={Link}
                  to={`/jobs/${job.id}/apply`}
                  size="small"
                  variant="contained"
                >
                  Apply Now
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {data?.jobs?.length === 0 && (
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mt: 4 }}>
          No open positions at the moment. Check back soon!
        </Typography>
      )}
    </Container>
  );
};

export default Jobs;

