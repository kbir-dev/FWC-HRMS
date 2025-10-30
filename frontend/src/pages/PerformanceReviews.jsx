import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Rating,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import {
  Star,
  TrendingUp,
  Assessment,
  Visibility,
  ArrowUpward,
  ArrowDownward,
  Add,
} from '@mui/icons-material';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const PerformanceReviews = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    employee_id: '',
    review_period_start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    review_period_end: new Date().toISOString().split('T')[0],
    overall_score: 7,
    strengths: '',
    areas_for_improvement: '',
    goals: '',
    comments: ''
  });

  // Fetch performance reviews
  const { data, isLoading } = useQuery({
    queryKey: ['performanceReviews'],
    queryFn: async () => {
      const response = await apiClient.get('/performance');
      return response.data;
    },
  });

  // Fetch performance summary for employee
  const { data: summary } = useQuery({
    queryKey: ['performanceSummary'],
    queryFn: async () => {
      // Get current employee ID
      const empResponse = await apiClient.get('/employees');
      if (empResponse.data.employees && empResponse.data.employees.length > 0) {
        const employeeId = empResponse.data.employees[0].id;
        const response = await apiClient.get(`/performance/employee/${employeeId}/summary`);
        return response.data.summary;
      }
      return null;
    },
    enabled: user?.role === 'employee',
  });

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReview(null);
  };

  // Fetch employees for create form
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await apiClient.get('/employees');
      return response.data;
    },
    enabled: ['admin', 'hr', 'manager'].includes(user?.role) && openCreateDialog,
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/performance', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Performance review created successfully!');
      setOpenCreateDialog(false);
      setCreateForm({
        employee_id: '',
        review_period_start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        review_period_end: new Date().toISOString().split('T')[0],
        overall_score: 7,
        strengths: '',
        areas_for_improvement: '',
        goals: '',
        comments: ''
      });
      queryClient.invalidateQueries(['performanceReviews']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create review');
    },
  });

  const handleCreateReview = () => {
    createReviewMutation.mutate(createForm);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'success.main';
    if (score >= 6) return 'warning.main';
    return 'error.main';
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Very Good';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Satisfactory';
    if (score >= 5) return 'Needs Improvement';
    return 'Poor';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Radar chart data for latest review
  const getRadarData = (review) => [
    { subject: 'Quality', score: review.quality_score, fullMark: 10 },
    { subject: 'Productivity', score: review.productivity_score, fullMark: 10 },
    { subject: 'Communication', score: review.communication_score, fullMark: 10 },
    { subject: 'Teamwork', score: review.teamwork_score, fullMark: 10 },
    { subject: 'Goals', score: review.goals_score, fullMark: 10 },
  ];

  // For employees, show their own reviews with analytics
  if (user?.role === 'employee' && summary) {
    const latestReview = summary.recentReviews?.[0];

    // Prepare trend data for line chart
    const trendData = summary.scoreTrend?.map(item => ({
      month: `${item.month}/${item.year}`,
      score: parseFloat(item.avg_score),
    })) || [];

    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          My Performance Reviews
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overall Score
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: getScoreColor(summary.averageScores.overall) }}>
                  {summary.averageScores.overall}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {getScoreLabel(summary.averageScores.overall)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Reviews
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {summary.totalReviews}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Quality
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {summary.averageScores.quality}
                  </Typography>
                  <Rating value={parseFloat(summary.averageScores.quality) / 2} precision={0.1} readOnly size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Productivity
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {summary.averageScores.productivity}
                  </Typography>
                  <Rating value={parseFloat(summary.averageScores.productivity) / 2} precision={0.1} readOnly size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Charts */}
        <Grid container spacing={3} mb={3}>
          {/* Trend Chart */}
          {trendData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" name="Overall Score" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {/* Radar Chart for Latest Review */}
          {latestReview && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Latest Review Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={getRadarData(latestReview)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} />
                    <Radar name="Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Score Breakdown */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Average Scores by Category
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Quality', score: summary.averageScores.quality },
              { label: 'Productivity', score: summary.averageScores.productivity },
              { label: 'Communication', score: summary.averageScores.communication },
              { label: 'Teamwork', score: summary.averageScores.teamwork },
              { label: 'Goals', score: summary.averageScores.goals },
            ].map((item) => (
              <Grid item xs={12} key={item.label}>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">{item.label}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {item.score}/10
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(item.score) * 10}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getScoreColor(parseFloat(item.score)),
                      },
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Recent Reviews */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Review History
          </Typography>
          <List>
            {summary.recentReviews?.map((review) => (
              <ListItem
                key={review.id}
                secondaryAction={
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetails(review)}
                  >
                    View Details
                  </Button>
                }
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="body1" fontWeight="medium">
                        {format(new Date(review.review_period_start), 'MMM dd, yyyy')} -{' '}
                        {format(new Date(review.review_period_end), 'MMM dd, yyyy')}
                      </Typography>
                      <Chip
                        label={`${review.overall_score.toFixed(1)}/10`}
                        color={review.overall_score >= 8 ? 'success' : review.overall_score >= 6 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={`Reviewer: ${review.reviewer_name}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  }

  // For admin/HR/manager, show all reviews
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Performance Reviews
        </Typography>
        {['admin', 'hr', 'manager'].includes(user?.role) && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Create Review
          </Button>
        )}
      </Box>

      {/* Reviews List */}
      <Grid container spacing={3}>
        {data?.reviews?.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No performance reviews found
              </Typography>
            </Paper>
          </Grid>
        ) : (
          data?.reviews?.map((review) => (
            <Grid item xs={12} md={6} key={review.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {review.employee_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {review.employee_code} • {review.department_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Reviewed by: {review.reviewer_name}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${review.overall_score.toFixed(1)}/10`}
                      color={review.overall_score >= 8 ? 'success' : review.overall_score >= 6 ? 'warning' : 'error'}
                      icon={<Star />}
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" mb={1}>
                    Period: {format(new Date(review.review_period_start), 'MMM dd')} -{' '}
                    {format(new Date(review.review_period_end), 'MMM dd, yyyy')}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={1}>
                    {[
                      { label: 'Quality', score: review.quality_score },
                      { label: 'Productivity', score: review.productivity_score },
                      { label: 'Communication', score: review.communication_score },
                      { label: 'Teamwork', score: review.teamwork_score },
                      { label: 'Goals', score: review.goals_score },
                    ].map((item) => (
                      <Grid item xs={12} key={item.label}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption">{item.label}</Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="caption" fontWeight="bold">
                              {item.score}/10
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={item.score * 10}
                              sx={{ width: 50, height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <Box mt={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(review)}
                    >
                      View Full Review
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Review Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Performance Review Details
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box>
              <Box mb={2}>
                <Typography variant="h6">{selectedReview.employee_name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedReview.position} • {selectedReview.department_name}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="textSecondary" gutterBottom>
                Review Period: {format(new Date(selectedReview.review_period_start), 'MMM dd, yyyy')} -{' '}
                {format(new Date(selectedReview.review_period_end), 'MMM dd, yyyy')}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Reviewer: {selectedReview.reviewer_name}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="center" alignItems="center" p={2} bgcolor="primary.light" borderRadius={1} mb={2}>
                <Typography variant="h4" fontWeight="bold">
                  Overall Score: {selectedReview.overall_score.toFixed(1)}/10
                </Typography>
              </Box>

              <Grid container spacing={2} mb={3}>
                {[
                  { label: 'Quality', score: selectedReview.quality_score },
                  { label: 'Productivity', score: selectedReview.productivity_score },
                  { label: 'Communication', score: selectedReview.communication_score },
                  { label: 'Teamwork', score: selectedReview.teamwork_score },
                  { label: 'Goals Achievement', score: selectedReview.goals_score },
                ].map((item) => (
                  <Grid item xs={12} sm={6} key={item.label}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        {item.label}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {item.score}/10
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={item.score * 10}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {selectedReview.strengths && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Strengths
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="body2">{selectedReview.strengths}</Typography>
                  </Paper>
                </Box>
              )}

              {selectedReview.areas_for_improvement && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Areas for Improvement
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                    <Typography variant="body2">{selectedReview.areas_for_improvement}</Typography>
                  </Paper>
                </Box>
              )}

              {selectedReview.goals && (
                <Box mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Goals for Next Period
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="body2">{selectedReview.goals}</Typography>
                  </Paper>
                </Box>
              )}

              {selectedReview.comments && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Additional Comments
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Typography variant="body2">{selectedReview.comments}</Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Review Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Performance Review</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={createForm.employee_id}
                    label="Employee"
                    onChange={(e) => setCreateForm({ ...createForm, employee_id: e.target.value })}
                  >
                    {employeesData?.employees?.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.full_name} - {emp.employee_code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Review Period Start"
                  type="date"
                  value={createForm.review_period_start}
                  onChange={(e) => setCreateForm({ ...createForm, review_period_start: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Review Period End"
                  type="date"
                  value={createForm.review_period_end}
                  onChange={(e) => setCreateForm({ ...createForm, review_period_end: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Overall Score: {createForm.overall_score}/10</Typography>
                <Slider
                  value={createForm.overall_score}
                  onChange={(e, val) => setCreateForm({ ...createForm, overall_score: val })}
                  min={1}
                  max={10}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Strengths"
                  value={createForm.strengths}
                  onChange={(e) => setCreateForm({ ...createForm, strengths: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Areas for Improvement"
                  value={createForm.areas_for_improvement}
                  onChange={(e) => setCreateForm({ ...createForm, areas_for_improvement: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Goals for Next Period"
                  value={createForm.goals}
                  onChange={(e) => setCreateForm({ ...createForm, goals: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Comments"
                  value={createForm.comments}
                  onChange={(e) => setCreateForm({ ...createForm, comments: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateReview}
            disabled={createReviewMutation.isLoading || !createForm.employee_id}
            startIcon={createReviewMutation.isLoading ? <CircularProgress size={20} /> : <Add />}
          >
            {createReviewMutation.isLoading ? 'Creating...' : 'Create Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceReviews;

