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
  MenuItem,
  Grid,
  InputAdornment,
  TableSortLabel,
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { applicationsAPI } from '../api/jobs';
import { format } from 'date-fns';

const Applications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minScoreFilter, setMinScoreFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsAPI.getApplications(),
  });

  const getStatusColor = (status) => {
    const colors = {
      received: 'default',
      screening: 'info',
      screened: 'primary',
      shortlisted: 'success',
      interview: 'warning',
      rejected: 'error',
      offer: 'success',
      hired: 'success',
    };
    return colors[status] || 'default';
  };

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    if (!data?.applications) return [];

    let filtered = [...data.applications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.candidate_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Min score filter
    if (minScoreFilter) {
      filtered = filtered.filter(
        (app) => app.screening_score && app.screening_score >= parseInt(minScoreFilter)
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
  }, [data?.applications, searchTerm, statusFilter, minScoreFilter, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and review all job applications
          </Typography>
        </Box>
        <Chip
          icon={<FilterListIcon />}
          label={`${filteredApplications.length} of ${data?.applications?.length || 0} applications`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="screening">Screening</MenuItem>
              <MenuItem value="screened">Screened</MenuItem>
              <MenuItem value="shortlisted">Shortlisted</MenuItem>
              <MenuItem value="interview">Interview</MenuItem>
              <MenuItem value="offer">Offer</MenuItem>
              <MenuItem value="hired">Hired</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              size="small"
              label="Min AI Score"
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(e.target.value)}
            >
              <MenuItem value="">All Scores</MenuItem>
              <MenuItem value="90">90% and above</MenuItem>
              <MenuItem value="80">80% and above</MenuItem>
              <MenuItem value="70">70% and above</MenuItem>
              <MenuItem value="60">60% and above</MenuItem>
              <MenuItem value="50">50% and above</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setMinScoreFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'date'}
                  direction={sortBy === 'date' ? sortOrder : 'asc'}
                  onClick={() => handleSort('date')}
                >
                  Applied Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'score'}
                  direction={sortBy === 'score' ? sortOrder : 'asc'}
                  onClick={() => handleSort('score')}
                >
                  AI Score
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredApplications.map((app) => (
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
                    {format(new Date(app.applied_at), 'MMM dd, yyyy')}
                  </Typography>
                </TableCell>
                <TableCell>
                  {app.screening_score ? (
                    <Chip
                      label={`${app.screening_score}%`}
                      color={
                        app.screening_score >= 70
                          ? 'success'
                          : app.screening_score >= 50
                          ? 'warning'
                          : 'error'
                      }
                      size="small"
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={app.status} color={getStatusColor(app.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Button component={Link} to={`/applications/${app.id}`} size="small" variant="outlined">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredApplications.length === 0 && (
        <Typography variant="body1" color="text.secondary" textAlign="center" mt={4}>
          {searchTerm || statusFilter !== 'all' || minScoreFilter
            ? 'No applications match your filters'
            : 'No applications found'}
        </Typography>
      )}
    </Box>
  );
};

export default Applications;

