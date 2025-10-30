import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, CloudUpload } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { jobsAPI } from '../api/jobs';

const JobApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    coverLetter: '',
    yearsOfExperience: '',
    currentCompany: '',
    currentPosition: '',
  });
  const [resume, setResume] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!resume) {
      setError('Please upload your resume');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('resume', resume);
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });

      await jobsAPI.applyToJob(id, data);
      toast.success('Application submitted successfully! You will receive screening results via email.');
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button component={Link} to={`/jobs/${id}`} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to Job
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Apply for Position
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Fill in your details below. Our AI will screen your application automatically.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            label="Full Name"
            name="candidateName"
            value={formData.candidateName}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            required
            type="email"
            label="Email"
            name="candidateEmail"
            value={formData.candidateEmail}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Phone"
            name="candidatePhone"
            value={formData.candidatePhone}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            type="number"
            label="Years of Experience"
            name="yearsOfExperience"
            value={formData.yearsOfExperience}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Current Company"
            name="currentCompany"
            value={formData.currentCompany}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Current Position"
            name="currentPosition"
            value={formData.currentPosition}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Cover Letter"
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleChange}
            margin="normal"
            helperText="Optional: Tell us why you're interested"
          />

          <Box sx={{ mt: 3, mb: 2 }}>
            <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
              {resume ? resume.name : 'Upload Resume (PDF, DOC, DOCX)'}
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Maximum file size: 5MB
            </Typography>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Application'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default JobApplication;

