import apiClient from './client';

export const jobsAPI = {
  // Get all jobs
  getJobs: async (params = {}) => {
    const response = await apiClient.get('/jobs', { params });
    return response.data;
  },

  // Get single job
  getJob: async (id) => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data;
  },

  // Create job
  createJob: async (data) => {
    const response = await apiClient.post('/jobs', data);
    return response.data;
  },

  // Update job
  updateJob: async (id, data) => {
    const response = await apiClient.put(`/jobs/${id}`, data);
    return response.data;
  },

  // Delete job
  deleteJob: async (id) => {
    const response = await apiClient.delete(`/jobs/${id}`);
    return response.data;
  },

  // Apply to job
  applyToJob: async (jobId, formData) => {
    const response = await apiClient.post(`/jobs/${jobId}/apply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const applicationsAPI = {
  // Get all applications
  getApplications: async (params = {}) => {
    const response = await apiClient.get('/applications', { params });
    return response.data;
  },

  // Get single application
  getApplication: async (id) => {
    const response = await apiClient.get(`/applications/${id}`);
    return response.data;
  },

  // Get screening report
  getScreeningReport: async (applicationId) => {
    const response = await apiClient.get(`/applications/screening/${applicationId}/report`);
    return response.data;
  },

  // Update application status
  updateApplicationStatus: async (id, data) => {
    const response = await apiClient.put(`/applications/${id}/status`, data);
    return response.data;
  },
};

export const interviewsAPI = {
  // Get all interviews
  getInterviews: async (params = {}) => {
    const response = await apiClient.get('/interviews', { params });
    return response.data;
  },

  // Get single interview
  getInterview: async (id) => {
    const response = await apiClient.get(`/interviews/${id}`);
    return response.data;
  },

  // Schedule new interview
  scheduleInterview: async (data) => {
    const response = await apiClient.post('/interviews', data);
    return response.data;
  },

  // Update interview
  updateInterview: async (id, data) => {
    const response = await apiClient.put(`/interviews/${id}`, data);
    return response.data;
  },

  // Cancel interview
  cancelInterview: async (id) => {
    const response = await apiClient.delete(`/interviews/${id}`);
    return response.data;
  },

  // Add feedback
  addFeedback: async (id, feedback) => {
    const response = await apiClient.post(`/interviews/${id}/feedback`, feedback);
    return response.data;
  },

  // Get upcoming interviews
  getUpcomingInterviews: async (limit = 10) => {
    const response = await apiClient.get('/interviews/dashboard/upcoming', { params: { limit } });
    return response.data;
  },
};

