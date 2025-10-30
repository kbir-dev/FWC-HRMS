import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ArrowBack, Edit, CalendarToday } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { applicationsAPI, interviewsAPI } from '../api/jobs';
import { format } from 'date-fns';

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interviewType: 'technical',
    scheduledAt: '',
    durationMinutes: 60,
    meetingLink: '',
    location: '',
    notes: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsAPI.getApplication(id),
  });

  const { data: reportData } = useQuery({
    queryKey: ['screeningReport', id],
    queryFn: () => applicationsAPI.getScreeningReport(id),
    enabled: !!data?.application?.screening_score,
  });

  const { data: interviewsData } = useQuery({
    queryKey: ['interviews', id],
    queryFn: () => interviewsAPI.getInterviews({ applicationId: id }),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, rejectionReason }) => 
      applicationsAPI.updateApplicationStatus(id, { status, rejectionReason }),
    onSuccess: () => {
      toast.success('Application status updated successfully');
      queryClient.invalidateQueries(['application', id]);
      queryClient.invalidateQueries(['applications']);
      setStatusDialogOpen(false);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: (data) => interviewsAPI.scheduleInterview(data),
    onSuccess: () => {
      toast.success('Interview scheduled successfully!');
      queryClient.invalidateQueries(['interviews', id]);
      queryClient.invalidateQueries(['application', id]);
      setInterviewDialogOpen(false);
      setInterviewForm({
        interviewType: 'technical',
        scheduledAt: '',
        durationMinutes: 60,
        meetingLink: '',
        location: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to schedule interview');
    },
  });

  const handleOpenStatusDialog = () => {
    setSelectedStatus(data?.application?.status || '');
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    if (selectedStatus === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    updateStatusMutation.mutate({
      status: selectedStatus,
      rejectionReason: selectedStatus === 'rejected' ? rejectionReason : null,
    });
  };

  const handleScheduleInterview = () => {
    if (!interviewForm.scheduledAt) {
      toast.error('Please select interview date and time');
      return;
    }

    if (!interviewForm.interviewType) {
      toast.error('Please select interview type');
      return;
    }

    scheduleInterviewMutation.mutate({
      applicationId: parseInt(id),
      ...interviewForm,
      durationMinutes: parseInt(interviewForm.durationMinutes),
    });
  };

  const getInterviewTypeLabel = (type) => {
    const labels = {
      'phone-screen': 'Phone Screen',
      'technical': 'Technical',
      'behavioral': 'Behavioral',
      'hr': 'HR Round',
      'final': 'Final Round'
    };
    return labels[type] || type;
  };

  const getInterviewStatusColor = (status) => {
    const colors = {
      'scheduled': 'primary',
      'in-progress': 'warning',
      'completed': 'success',
      'cancelled': 'error',
      'no-show': 'default'
    };
    return colors[status] || 'default';
  };

  if (isLoading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const app = data?.application;
  const report = reportData?.report;

  return (
    <Box>
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/applications')}
        sx={{ mb: 2 }}
      >
        Back to Applications
      </Button>

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Application Details
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Candidate Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" gutterBottom>
                {app?.candidate_name}
              </Typography>

              <Typography variant="body2" color="text.secondary" mt={2}>
                Email
              </Typography>
              <Typography variant="body1" gutterBottom>
                {app?.candidate_email}
              </Typography>

              {app?.candidate_phone && (
                <>
                  <Typography variant="body2" color="text.secondary" mt={2}>
                    Phone
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {app.candidate_phone}
                  </Typography>
                </>
              )}

              {app?.years_of_experience && (
                <>
                  <Typography variant="body2" color="text.secondary" mt={2}>
                    Experience
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {app.years_of_experience} years
                  </Typography>
                </>
              )}
            </Box>
          </Paper>

          {report && report.screening && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                AI Screening Report
              </Typography>
              <Box sx={{ mt: 2 }}>
                {report.screening.details && Object.entries(report.screening.details).map(([key, value]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                      {key}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={value.score * 100}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                      <Typography variant="body2">
                        {Math.round(value.score * 100)}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {value.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Scheduled Interviews */}
          {interviewsData?.interviews && interviewsData.interviews.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Scheduled Interviews
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {interviewsData.interviews.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell>
                          <Chip 
                            label={getInterviewTypeLabel(interview.interview_type)} 
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(interview.scheduled_at), 'MMM dd, yyyy hh:mm a')}
                        </TableCell>
                        <TableCell>{interview.duration_minutes} min</TableCell>
                        <TableCell>
                          <Chip 
                            label={interview.status} 
                            size="small"
                            color={getInterviewStatusColor(interview.status)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {interviewsData.interviews.some(i => i.meeting_link) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Meeting Links:
                  </Typography>
                  {interviewsData.interviews.filter(i => i.meeting_link).map((interview) => (
                    <Typography key={interview.id} variant="body2" sx={{ mt: 1 }}>
                      {getInterviewTypeLabel(interview.interview_type)}:{' '}
                      <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                        {interview.meeting_link}
                      </a>
                    </Typography>
                  ))}
                </Box>
              )}
              
              {/* AI Screening Chat Link */}
              {interviewsData.interviews.some(i => i.status === 'scheduled') && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    🤖 AI Screening Chat Access
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Candidates can access the AI screening chat during their scheduled interview time using this link:
                  </Typography>
                  <Box sx={{ 
                    p: 1, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1, 
                    border: 1, 
                    borderColor: 'divider',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    wordBreak: 'break-all'
                  }}>
                    {`${window.location.origin}/chat?applicationId=${id}`}
                  </Box>
                  <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 1 }}>
                    ⏰ Note: Access is only available during scheduled interview times (±2 hours window)
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Job Details
            </Typography>
            <Typography variant="body1" gutterBottom>
              {app?.job_title}
            </Typography>
            {app?.department_name && (
              <Chip label={app.department_name} size="small" />
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Application Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {(app?.status === 'shortlisted' || app?.status === 'interview') && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CalendarToday />}
                    onClick={() => setInterviewDialogOpen(true)}
                    color="success"
                  >
                    Schedule Interview
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit />}
                  onClick={handleOpenStatusDialog}
                >
                  Update Status
                </Button>
              </Box>
            </Box>
            <Chip label={app?.status} color="primary" sx={{ mt: 1 }} />
            {app?.rejection_reason && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Rejection Reason
                </Typography>
                <Typography variant="body2" color="error.main">
                  {app.rejection_reason}
                </Typography>
              </Box>
            )}
            {app?.screening_score && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  AI Screening Score
                </Typography>
                <Typography variant="h4" color={app.screening_score >= 70 ? 'success.main' : 'warning.main'}>
                  {app.screening_score}%
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Application Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="screening">Screening</MenuItem>
              <MenuItem value="screened">Screened</MenuItem>
              <MenuItem value="shortlisted">Shortlisted</MenuItem>
              <MenuItem value="interview">Interview</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="offer">Offer</MenuItem>
              <MenuItem value="hired">Hired</MenuItem>
            </Select>
          </FormControl>

          {selectedStatus === 'rejected' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Please provide a reason for rejection"
              required
            />
          )}

          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current Status: <strong>{app?.status}</strong>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={interviewDialogOpen} onClose={() => setInterviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Schedule Interview</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Interview Type</InputLabel>
                  <Select
                    value={interviewForm.interviewType}
                    label="Interview Type"
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewType: e.target.value })}
                  >
                    <MenuItem value="phone-screen">Phone Screen</MenuItem>
                    <MenuItem value="technical">Technical Interview</MenuItem>
                    <MenuItem value="behavioral">Behavioral Interview</MenuItem>
                    <MenuItem value="hr">HR Round</MenuItem>
                    <MenuItem value="final">Final Round</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (minutes)"
                  value={interviewForm.durationMinutes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, durationMinutes: e.target.value })}
                  inputProps={{ min: 15, max: 480, step: 15 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Scheduled Date & Time"
                  value={interviewForm.scheduledAt}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: new Date().toISOString().slice(0, 16)
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Meeting Link (e.g., Zoom, Google Meet)"
                  value={interviewForm.meetingLink}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location (if in-person)"
                  value={interviewForm.location}
                  onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                  placeholder="Office address or room number"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  placeholder="Any additional notes or instructions for the interview..."
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Candidate:</strong> {app?.candidate_name} ({app?.candidate_email})
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleScheduleInterview} 
            variant="contained"
            disabled={scheduleInterviewMutation.isPending}
            color="success"
          >
            {scheduleInterviewMutation.isPending ? <CircularProgress size={24} /> : 'Schedule Interview'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationDetails;

