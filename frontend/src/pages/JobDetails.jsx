import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { jobsAPI } from '../api/jobs';

const JobDetails = () => {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsAPI.getJob(id),
  });

  if (isLoading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const job = data?.job;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        component={Link}
        to="/jobs"
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
      >
        Back to Jobs
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
          {job?.title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {job?.department_name && (
            <Chip label={job.department_name} color="primary" />
          )}
          {job?.employment_type && <Chip label={job.employment_type} />}
          {job?.experience_level && (
            <Chip label={job.experience_level} color="secondary" />
          )}
          {job?.remote_allowed && <Chip label="Remote OK" color="success" />}
        </Box>

        <Typography variant="h6" gutterBottom>
          Description
        </Typography>
        <Typography variant="body1" paragraph>
          {job?.description}
        </Typography>

        {job?.requirements && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <Typography variant="body1" paragraph style={{ whiteSpace: 'pre-line' }}>
              {job.requirements}
            </Typography>
          </>
        )}

        {job?.responsibilities && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Responsibilities
            </Typography>
            <Typography variant="body1" paragraph style={{ whiteSpace: 'pre-line' }}>
              {job.responsibilities}
            </Typography>
          </>
        )}

        {job?.required_skills && job.required_skills.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Required Skills
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {job.required_skills.map((skill, index) => (
                <Chip key={index} label={skill} variant="outlined" />
              ))}
            </Box>
          </>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            component={Link}
            to={`/jobs/${id}/apply`}
            variant="contained"
            size="large"
          >
            Apply for this Position
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default JobDetails;

