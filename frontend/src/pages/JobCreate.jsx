import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, Add as AddIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { jobsAPI } from '../api/jobs';

const JobCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    departmentId: '',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    salaryRangeMin: '',
    salaryRangeMax: '',
    location: '',
    remoteAllowed: false,
    requiredSkills: [],
    preferredSkills: [],
    openings: 1,
  });

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
  };

  const handleAddSkill = (type) => {
    if (skillInput.trim()) {
      setFormData({
        ...formData,
        [type]: [...formData[type], skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (type, index) => {
    setFormData({
      ...formData,
      [type]: formData[type].filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data for submission
      const jobData = {
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        salaryRangeMin: formData.salaryRangeMin ? parseFloat(formData.salaryRangeMin) : null,
        salaryRangeMax: formData.salaryRangeMax ? parseFloat(formData.salaryRangeMax) : null,
        openings: parseInt(formData.openings) || 1,
      };

      await jobsAPI.createJob(jobData);
      toast.success('Job created successfully!');
      navigate('/jobs');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create job';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        component={Link}
        to="/jobs"
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
      >
        Back to Jobs
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Create New Job Posting
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Fill in the details to post a new job opening
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Job Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer"
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Job Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of the role..."
              />
            </Grid>

            {/* Requirements */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List the qualifications and requirements..."
              />
            </Grid>

            {/* Responsibilities */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Responsibilities"
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                placeholder="List the key responsibilities..."
              />
            </Grid>

            {/* Employment Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Employment Type"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
              >
                <MenuItem value="full-time">Full-time</MenuItem>
                <MenuItem value="part-time">Part-time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="intern">Intern</MenuItem>
              </TextField>
            </Grid>

            {/* Experience Level */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Experience Level"
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
              >
                <MenuItem value="entry">Entry Level</MenuItem>
                <MenuItem value="mid">Mid Level</MenuItem>
                <MenuItem value="senior">Senior Level</MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
              </TextField>
            </Grid>

            {/* Location */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., New York, NY"
              />
            </Grid>

            {/* Number of Openings */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Openings"
                name="openings"
                value={formData.openings}
                onChange={handleChange}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Salary Range */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Salary Range Min"
                name="salaryRangeMin"
                value={formData.salaryRangeMin}
                onChange={handleChange}
                placeholder="e.g., 50000"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Salary Range Max"
                name="salaryRangeMax"
                value={formData.salaryRangeMax}
                onChange={handleChange}
                placeholder="e.g., 80000"
              />
            </Grid>

            {/* Remote Allowed */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.remoteAllowed}
                    onChange={handleChange}
                    name="remoteAllowed"
                  />
                }
                label="Remote Work Allowed"
              />
            </Grid>

            {/* Required Skills */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Required Skills
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill('requiredSkills');
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => handleAddSkill('requiredSkills')}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formData.requiredSkills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => handleRemoveSkill('requiredSkills', index)}
                    color="primary"
                  />
                ))}
              </Box>
            </Grid>

            {/* Preferred Skills */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Preferred Skills (Optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill('preferredSkills');
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => handleAddSkill('preferredSkills')}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formData.preferredSkills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => handleRemoveSkill('preferredSkills', index)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  component={Link}
                  to="/jobs"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Job'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default JobCreate;

