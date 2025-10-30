import express from 'express';
import Joi from 'joi';
import { query } from '../db/connection.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = express.Router();

// Validation schemas
const createJobSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  requirements: Joi.string(),
  responsibilities: Joi.string(),
  departmentId: Joi.number().integer(),
  employmentType: Joi.string().valid('full-time', 'part-time', 'contract', 'intern'),
  experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead'),
  salaryRangeMin: Joi.number(),
  salaryRangeMax: Joi.number(),
  location: Joi.string(),
  remoteAllowed: Joi.boolean(),
  requiredSkills: Joi.array().items(Joi.string()),
  preferredSkills: Joi.array().items(Joi.string()),
  openings: Joi.number().integer().min(1).default(1)
});

const updateJobSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  requirements: Joi.string(),
  responsibilities: Joi.string(),
  departmentId: Joi.number().integer(),
  employmentType: Joi.string().valid('full-time', 'part-time', 'contract', 'intern'),
  experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'lead'),
  salaryRangeMin: Joi.number(),
  salaryRangeMax: Joi.number(),
  location: Joi.string(),
  remoteAllowed: Joi.boolean(),
  requiredSkills: Joi.array().items(Joi.string()),
  preferredSkills: Joi.array().items(Joi.string()),
  status: Joi.string().valid('draft', 'published', 'closed', 'on-hold'),
  openings: Joi.number().integer().min(0)
});

// GET /api/jobs - List all job postings
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      status = 'published', 
      departmentId,
      experienceLevel,
      employmentType,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    // Public users can only see published jobs
    if (!req.user || !['admin', 'hr', 'recruiter'].includes(req.user.role)) {
      whereConditions.push(`j.status = 'published'`);
    } else if (status) {
      whereConditions.push(`j.status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (departmentId) {
      whereConditions.push(`j.department_id = $${paramIndex++}`);
      params.push(departmentId);
    }
    
    if (experienceLevel) {
      whereConditions.push(`j.experience_level = $${paramIndex++}`);
      params.push(experienceLevel);
    }
    
    if (employmentType) {
      whereConditions.push(`j.employment_type = $${paramIndex++}`);
      params.push(employmentType);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    params.push(limit, offset);
    
    const result = await query(
      `SELECT 
         j.*,
         d.name as department_name,
         e.full_name as hiring_manager_name,
         (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
       FROM job_postings j
       LEFT JOIN departments d ON d.id = j.department_id
       LEFT JOIN employees e ON e.id = j.hiring_manager_id
       ${whereClause}
       ORDER BY j.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM job_postings j ${whereClause}`,
      params.slice(0, -2)
    );
    
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      jobs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - Get single job posting
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT 
         j.*,
         d.name as department_name,
         e.full_name as hiring_manager_name,
         e.employee_code as hiring_manager_code,
         (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count,
         (SELECT COUNT(*) FROM applications WHERE job_id = j.id AND status = 'shortlisted') as shortlisted_count
       FROM job_postings j
       LEFT JOIN departments d ON d.id = j.department_id
       LEFT JOIN employees e ON e.id = j.hiring_manager_id
       WHERE j.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = result.rows[0];
    
    // Non-authenticated users can only view published jobs
    if (!req.user && job.status !== 'published') {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs - Create new job posting
router.post('/', authenticate, authorize('admin', 'hr', 'recruiter'), async (req, res) => {
  try {
    const { error, value } = createJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Get hiring manager (current user's employee record)
    const empResult = await query(
      'SELECT id FROM employees WHERE user_id = $1',
      [req.user.id]
    );
    
    const hiringManagerId = empResult.rows[0]?.id || null;
    
    const result = await query(
      `INSERT INTO job_postings (
        title, description, requirements, responsibilities,
        department_id, hiring_manager_id, employment_type, experience_level,
        salary_range_min, salary_range_max, location, remote_allowed,
        required_skills, preferred_skills, openings, status, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'draft', NULL)
      RETURNING *`,
      [
        value.title,
        value.description,
        value.requirements,
        value.responsibilities,
        value.departmentId,
        hiringManagerId,
        value.employmentType,
        value.experienceLevel,
        value.salaryRangeMin,
        value.salaryRangeMax,
        value.location,
        value.remoteAllowed,
        JSON.stringify(value.requiredSkills || []),
        JSON.stringify(value.preferredSkills || []),
        value.openings
      ]
    );
    
    const job = result.rows[0];
    
    await createAuditLog(req.user.id, 'create', 'job_postings', job.id, { title: job.title });
    
    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// PUT /api/jobs/:id - Update job posting
router.put('/:id', authenticate, authorize('admin', 'hr', 'recruiter'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateJobSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (key === 'requiredSkills' || key === 'preferredSkills') {
          updates.push(`${dbKey} = $${paramIndex++}`);
          params.push(JSON.stringify(val));
        } else {
          updates.push(`${dbKey} = $${paramIndex++}`);
          params.push(val);
        }
      }
    }
    
    // If status is being changed to published, set published_at
    if (value.status === 'published') {
      updates.push(`published_at = COALESCE(published_at, NOW())`);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    params.push(id);
    
    const result = await query(
      `UPDATE job_postings 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = result.rows[0];
    
    await createAuditLog(req.user.id, 'update', 'job_postings', job.id, value);
    
    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// DELETE /api/jobs/:id - Delete job posting
router.delete('/:id', authenticate, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM job_postings WHERE id = $1 RETURNING id, title',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    await createAuditLog(req.user.id, 'delete', 'job_postings', id, { title: result.rows[0].title });
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;

