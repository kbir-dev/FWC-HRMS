import express from 'express';
import Joi from 'joi';
import { query } from '../db/connection.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createInterviewSchema = Joi.object({
  applicationId: Joi.number().integer().required(),
  round: Joi.number().integer().min(1).default(1),
  interviewType: Joi.string().valid('phone-screen', 'technical', 'behavioral', 'hr', 'final').required(),
  scheduledAt: Joi.date().iso().required(),
  durationMinutes: Joi.number().integer().min(15).max(480).default(60),
  interviewers: Joi.array().items(Joi.number().integer()).default([]),
  location: Joi.string().allow('', null),
  meetingLink: Joi.string().uri().allow('', null),
  notes: Joi.string().allow('', null)
});

const updateInterviewSchema = Joi.object({
  scheduledAt: Joi.date().iso(),
  durationMinutes: Joi.number().integer().min(15).max(480),
  interviewers: Joi.array().items(Joi.number().integer()),
  location: Joi.string().allow('', null),
  meetingLink: Joi.string().uri().allow('', null),
  status: Joi.string().valid('scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'),
  notes: Joi.string().allow('', null)
});

const feedbackSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comments: Joi.string().required(),
  recommendation: Joi.string().valid('strong-hire', 'hire', 'neutral', 'no-hire', 'strong-no-hire').required()
});

// POST /api/interviews - Schedule a new interview
router.post('/', authenticate, authorize('admin', 'hr', 'recruiter', 'manager'), async (req, res) => {
  try {
    const { error, value } = createInterviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      applicationId,
      round,
      interviewType,
      scheduledAt,
      durationMinutes,
      interviewers,
      location,
      meetingLink,
      notes
    } = value;

    // Verify application exists and is in appropriate status
    const appCheck = await query(
      'SELECT id, status, candidate_email, candidate_name FROM applications WHERE id = $1',
      [applicationId]
    );

    if (appCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = appCheck.rows[0];
    
    if (!['shortlisted', 'interview'].includes(application.status)) {
      return res.status(400).json({ 
        error: 'Application must be shortlisted before scheduling interview' 
      });
    }

    // Create interview
    const result = await query(
      `INSERT INTO interviews (
        application_id, round, interview_type, scheduled_at, duration_minutes,
        interviewers, location, meeting_link, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
      RETURNING *`,
      [
        applicationId,
        round,
        interviewType,
        scheduledAt,
        durationMinutes,
        JSON.stringify(interviewers),
        location,
        meetingLink,
        notes
      ]
    );

    const interview = result.rows[0];

    // Update application status to 'interview' if not already
    if (application.status !== 'interview') {
      await query(
        'UPDATE applications SET status = $1 WHERE id = $2',
        ['interview', applicationId]
      );
    }

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview: {
        ...interview,
        interviewers: JSON.parse(interview.interviewers || '[]')
      }
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// GET /api/interviews - List all interviews
router.get('/', authenticate, authorize('admin', 'hr', 'recruiter', 'manager'), async (req, res) => {
  try {
    const { applicationId, status, from, to, page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (applicationId) {
      whereConditions.push(`i.application_id = $${paramIndex++}`);
      params.push(applicationId);
    }
    
    if (status) {
      whereConditions.push(`i.status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (from) {
      whereConditions.push(`i.scheduled_at >= $${paramIndex++}`);
      params.push(from);
    }
    
    if (to) {
      whereConditions.push(`i.scheduled_at <= $${paramIndex++}`);
      params.push(to);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    params.push(limit, offset);
    
    const result = await query(
      `SELECT 
         i.*,
         a.candidate_name,
         a.candidate_email,
         a.candidate_phone,
         j.title as job_title,
         j.department_id
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       JOIN job_postings j ON j.id = a.job_id
       ${whereClause}
       ORDER BY i.scheduled_at ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );
    
    // Parse JSON fields
    const interviews = result.rows.map(row => ({
      ...row,
      interviewers: JSON.parse(row.interviewers || '[]'),
      feedback: JSON.parse(row.feedback || '[]')
    }));
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM interviews i ${whereClause}`,
      params.slice(0, -2)
    );
    
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      interviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// GET /api/interviews/:id - Get single interview
router.get('/:id', authenticate, authorize('admin', 'hr', 'recruiter', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT 
         i.*,
         a.candidate_name,
         a.candidate_email,
         a.candidate_phone,
         a.resume_file_path,
         j.title as job_title,
         j.description as job_description,
         j.department_id
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       JOIN job_postings j ON j.id = a.job_id
       WHERE i.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    const interview = {
      ...result.rows[0],
      interviewers: JSON.parse(result.rows[0].interviewers || '[]'),
      feedback: JSON.parse(result.rows[0].feedback || '[]')
    };
    
    res.json({ interview });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// PUT /api/interviews/:id - Update interview
router.put('/:id', authenticate, authorize('admin', 'hr', 'recruiter', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateInterviewSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (value.scheduledAt !== undefined) {
      updates.push(`scheduled_at = $${paramIndex++}`);
      params.push(value.scheduledAt);
    }
    
    if (value.durationMinutes !== undefined) {
      updates.push(`duration_minutes = $${paramIndex++}`);
      params.push(value.durationMinutes);
    }
    
    if (value.interviewers !== undefined) {
      updates.push(`interviewers = $${paramIndex++}`);
      params.push(JSON.stringify(value.interviewers));
    }
    
    if (value.location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      params.push(value.location);
    }
    
    if (value.meetingLink !== undefined) {
      updates.push(`meeting_link = $${paramIndex++}`);
      params.push(value.meetingLink);
    }
    
    if (value.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(value.status);
    }
    
    if (value.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(value.notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    const result = await query(
      `UPDATE interviews 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    const interview = {
      ...result.rows[0],
      interviewers: JSON.parse(result.rows[0].interviewers || '[]'),
      feedback: JSON.parse(result.rows[0].feedback || '[]')
    };
    
    res.json({
      message: 'Interview updated successfully',
      interview
    });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// DELETE /api/interviews/:id - Cancel interview
router.delete('/:id', authenticate, authorize('admin', 'hr', 'recruiter'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE interviews 
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    res.json({ message: 'Interview cancelled successfully' });
  } catch (error) {
    console.error('Cancel interview error:', error);
    res.status(500).json({ error: 'Failed to cancel interview' });
  }
});

// POST /api/interviews/:id/feedback - Add feedback for interview
router.post('/:id/feedback', authenticate, authorize('admin', 'hr', 'recruiter', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = feedbackSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { rating, comments, recommendation } = value;
    
    // Get current interview
    const interviewResult = await query(
      'SELECT * FROM interviews WHERE id = $1',
      [id]
    );
    
    if (interviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    const interview = interviewResult.rows[0];
    const currentFeedback = JSON.parse(interview.feedback || '[]');
    
    // Add new feedback
    const newFeedback = {
      reviewerId: req.user.id,
      reviewerName: req.user.email,
      rating,
      comments,
      recommendation,
      createdAt: new Date().toISOString()
    };
    
    currentFeedback.push(newFeedback);
    
    // Calculate average rating
    const avgRating = currentFeedback.reduce((sum, f) => sum + f.rating, 0) / currentFeedback.length;
    
    // Update interview
    await query(
      `UPDATE interviews 
       SET feedback = $1, overall_rating = $2, recommendation = $3
       WHERE id = $4`,
      [JSON.stringify(currentFeedback), avgRating, recommendation, id]
    );
    
    res.json({
      message: 'Feedback submitted successfully',
      feedback: newFeedback
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// GET /api/interviews/upcoming - Get upcoming interviews (for dashboard)
router.get('/dashboard/upcoming', authenticate, authorize('admin', 'hr', 'recruiter', 'manager'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await query(
      `SELECT 
         i.*,
         a.candidate_name,
         a.candidate_email,
         j.title as job_title
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       JOIN job_postings j ON j.id = a.job_id
       WHERE i.status = 'scheduled' 
         AND i.scheduled_at >= NOW()
       ORDER BY i.scheduled_at ASC
       LIMIT $1`,
      [limit]
    );
    
    const interviews = result.rows.map(row => ({
      ...row,
      interviewers: JSON.parse(row.interviewers || '[]')
    }));
    
    res.json({ interviews });
  } catch (error) {
    console.error('Get upcoming interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming interviews' });
  }
});

export default router;

