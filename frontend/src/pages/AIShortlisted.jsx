import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  TextField,
  Grid,
  InputAdornment,
  TableSortLabel,
  Card,
  CardContent,
  LinearProgress,
  Alert,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  AutoAwesome as AIIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { applicationsAPI } from '../api/jobs';
import { format } from 'date-fns';

const AIShortlisted = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('70');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['shortlisted-applications'],
    queryFn: () => applicationsAPI.getApplications({ status: 'shortlisted' }),
  });

  // Filter shortlisted applications (score >= 70)
  const shortlistedApplications = useMemo(() => {
    if (!data?.applications) return [];

    let filtered = data.applications.filter(
      (app) => app.screening_score && app.screening_score >= 70
    );

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.candidate_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Min score filter
    if (minScoreFilter) {
      filtered = filtered.filter(
        (app) => app.screening_score >= parseInt(minScoreFilter)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.candidate_name || '').localeCompare(b.candidate_name || '');
          break;
        case 'score':
          comparison = (a.screening_score || 0) - (b.screening_score || 0);
          break;
        case 'date':
          comparison = new Date(a.applied_at) - new Date(b.applied_at);
          break;
        case 'job':
          comparison = (a.job_title || '').localeCompare(b.job_title || '');
          break;
        default:
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [data?.applications, searchTerm, minScoreFilter, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const apps = shortlistedApplications;
    if (apps.length === 0) return { avgScore: 0, topScore: 0, total: 0, excellent: 0 };
    
    const avgScore = apps.reduce((sum, app) => sum + (app.screening_score || 0), 0) / apps.length;
    const topScore = Math.max(...apps.map(app => app.screening_score || 0));
    const excellent = apps.filter(app => app.screening_score >= 90).length;
    
    return {
      avgScore: avgScore.toFixed(1),
      topScore: topScore.toFixed(1),
      total: apps.length,
      excellent,
    };
  }, [shortlistedApplications]);

  if (isLoading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={4}>
        <Alert severity="error">Failed to load shortlisted candidates. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AIIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              AI Shortlisted Candidates
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Top candidates automatically screened and shortlisted by AI (Score ≥ 70%)
          </Typography>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Shortlisted
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {statistics.total}
                  </Typography>
                </Box>
                <AIIcon color="primary" sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Average Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, color: 'success.main' }}>
                    {statistics.avgScore}%
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Top Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, color: 'warning.main' }}>
                    {statistics.topScore}%
                  </Typography>
                </Box>
                <TrophyIcon color="warning" sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Excellent (≥90%)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, color: 'error.main' }}>
                    {statistics.excellent}
                  </Typography>
                </Box>
                <TrophyIcon color="error" sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Name, email, job..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Minimum AI Score"
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(e.target.value)}
              SelectProps={{
                native: true,
              }}
            >
              <option value="70">70% and above (All Shortlisted)</option>
              <option value="75">75% and above</option>
              <option value="80">80% and above</option>
              <option value="85">85% and above</option>
              <option value="90">90% and above (Excellent)</option>
              <option value="95">95% and above (Outstanding)</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setMinScoreFilter('70');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {shortlistedApplications.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Candidate
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'job'}
                    direction={sortBy === 'job' ? sortOrder : 'asc'}
                    onClick={() => handleSort('job')}
                  >
                    Job Title
                  </TableSortLabel>
                </TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'score'}
                    direction={sortBy === 'score' ? sortOrder : 'asc'}
                    onClick={() => handleSort('score')}
                  >
                    AI Score
                  </TableSortLabel>
                </TableCell>
                <TableCell>Match Quality</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'date'}
                    direction={sortBy === 'date' ? sortOrder : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Applied Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shortlistedApplications.map((app) => {
                const score = app.screening_score || 0;
                const scoreColor = 
                  score >= 90 ? 'error' : 
                  score >= 80 ? 'warning' : 
                  score >= 70 ? 'success' : 'primary';
                
                const matchLabel = 
                  score >= 90 ? 'Excellent Match' : 
                  score >= 80 ? 'Great Match' : 
                  'Good Match';

                return (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {app.candidate_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.candidate_email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{app.job_title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {app.years_of_experience ? `${app.years_of_experience} yrs` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip
                          label={`${score}%`}
                          color={scoreColor}
                          size="small"
                          icon={<AIIcon />}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={score}
                          color={scoreColor}
                          sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={matchLabel}
                        color={scoreColor}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(app.applied_at), 'MMM dd, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/applications/${app.id}`}
                        size="small"
                        variant="contained"
                        color={scoreColor}
                      >
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AIIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Shortlisted Candidates Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || minScoreFilter !== '70'
              ? 'Try adjusting your filters to see more results'
              : 'AI will automatically shortlist candidates with scores ≥ 70%'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AIShortlisted;

