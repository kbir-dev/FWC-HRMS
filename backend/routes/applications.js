import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Joi from 'joi';
import { Queue } from 'bullmq';
import { query } from '../db/connection.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Create BullMQ queue for screening jobs
const redisUrl = new URL(config.redis.url);
const screeningQueue = new Queue('resume-screening', {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379
  }
});

// Validation schema
const applySchema = Joi.object({
  candidateName: Joi.string().required(),
  candidateEmail: Joi.string().email().required(),
  candidatePhone: Joi.string(),
  coverLetter: Joi.string(),
  linkedinUrl: Joi.string().uri(),
  portfolioUrl: Joi.string().uri(),
  yearsOfExperience: Joi.number().min(0),
  currentCompany: Joi.string(),
  currentPosition: Joi.string(),
  expectedSalary: Joi.number(),
  noticePeriod: Joi.number().integer()
});

// POST /api/jobs/:jobId/apply - Apply for a job
router.post('/:jobId/apply', upload.single('resume'), async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Validate job exists and is published
    const jobResult = await query(
      'SELECT id, title, status FROM job_postings WHERE id = $1',
      [jobId]
    );
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = jobResult.rows[0];
    
    if (job.status !== 'published') {
      return res.status(400).json({ error: 'This job is not accepting applications' });
    }
    
    // Validate request body
    const { error, value } = applySchema.validate(req.body);
    if (error) {
      // Clean up uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }
    
    // Check for duplicate application
    const existingApp = await query(
      'SELECT id FROM applications WHERE job_id = $1 AND candidate_email = $2',
      [jobId, value.candidateEmail]
    );
    
    if (existingApp.rows.length > 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'You have already applied for this job' });
    }
    
    // Create application
    const result = await query(
      `INSERT INTO applications (
        job_id, candidate_name, candidate_email, candidate_phone,
        resume_file_path, cover_letter, linkedin_url, portfolio_url,
        years_of_experience, current_company, current_position,
        expected_salary, notice_period, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'received')
      RETURNING *`,
      [
        jobId,
        value.candidateName,
        value.candidateEmail,
        value.candidatePhone,
        req.file.path,
        value.coverLetter,
        value.linkedinUrl,
        value.portfolioUrl,
        value.yearsOfExperience,
        value.currentCompany,
        value.currentPosition,
        value.expectedSalary,
        value.noticePeriod
      ]
    );
    
    const application = result.rows[0];
    
    // Enqueue screening job
    await screeningQueue.add('screen-resume', {
      applicationId: application.id
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
    
    console.log(`✓ Application ${application.id} created, screening job queued`);
    
    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: application.id,
      status: 'Your application is being processed. You will receive an update via email.'
    });
  } catch (error) {
    console.error('Apply error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// GET /api/applications/my-applications - Get applications for current user (employee)
router.get('/my-applications', authenticate, async (req, res) => {
  try {
    const candidateEmail = req.user.email;
    
    const result = await query(
      `SELECT 
        a.*,
        jp.title as job_title,
        jp.department_id,
        jp.employment_type,
        jp.location
      FROM applications a
      JOIN job_postings jp ON a.job_posting_id = jp.id
      WHERE a.candidate_email = $1
      ORDER BY a.created_at DESC`,
      [candidateEmail]
    );
    
    res.json({
      applications: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('My applications error:', error);
    res.status(500).json({ error: 'Failed to fetch your applications' });
  }
});

// GET /api/applications - List applications (admin/hr/recruiter)
router.get('/', authenticate, authorize('admin', 'hr', 'recruiter', 'manager'), async (req, res) => {
  try {
    const { 
      jobId, 
      status, 
      minScore,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (jobId) {
      whereConditions.push(`a.job_id = $${paramIndex++}`);
      params.push(jobId);
    }
    
    if (status) {
      whereConditions.push(`a.status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (minScore) {
      whereConditions.push(`a.screening_score >= $${paramIndex++}`);
      params.push(minScore);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    params.push(limit, offset);
    
    const result = await query(
      `SELECT 
         a.*,
         j.title as job_title,
         j.department_id
       FROM applications a
       JOIN job_postings j ON j.id = a.job_id
       ${whereClause}
       ORDER BY a.screening_score DESC NULLS LAST, a.applied_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM applications a ${whereClause}`,
      params.slice(0, -2)
    );
    
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      applications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/:id - Get single application
router.get('/:id', authenticate, authorize('admin', 'hr', 'recruiter', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT 
         a.*,
         j.title as job_title,
         j.description as job_description,
         j.required_skills,
         j.department_id,
         d.name as department_name
       FROM applications a
       JOIN job_postings j ON j.id = a.job_id
       LEFT JOIN departments d ON d.id = j.department_id
       WHERE a.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ application: result.rows[0] });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// GET /api/screening/:applicationId/report - Get screening report
router.get('/screening/:applicationId/report', authenticate, authorize('admin', 'hr', 'recruiter', 'manager'), async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const result = await query(
      `SELECT 
         a.id,
         a.candidate_name,
         a.candidate_email,
         a.screening_score,
         a.screening_details,
         a.status,
         a.screened_at,
         a.years_of_experience,
         j.title as job_title,
         j.required_skills
       FROM applications a
       JOIN job_postings j ON j.id = a.job_id
       WHERE a.id = $1`,
      [applicationId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const application = result.rows[0];
    
    if (!application.screening_score) {
      return res.status(400).json({ error: 'Application has not been screened yet' });
    }
    
    res.json({
      report: {
        applicationId: application.id,
        candidate: {
          name: application.candidate_name,
          email: application.candidate_email,
          yearsOfExperience: application.years_of_experience
        },
        job: {
          title: application.job_title,
          requiredSkills: application.required_skills
        },
        screening: {
          score: application.screening_score,
          status: application.status,
          screenedAt: application.screened_at,
          details: application.screening_details
        }
      }
    });
  } catch (error) {
    console.error('Get screening report error:', error);
    res.status(500).json({ error: 'Failed to fetch screening report' });
  }
});

// PUT /api/applications/:id/status - Update application status
router.put('/:id/status', authenticate, authorize('admin', 'hr', 'recruiter'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    const validStatuses = ['received', 'screening', 'screened', 'shortlisted', 'interview', 'rejected', 'offer', 'hired'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await query(
      `UPDATE applications 
       SET status = $1, rejection_reason = $2
       WHERE id = $3
       RETURNING *`,
      [status, rejectionReason, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({
      message: 'Application status updated',
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

export default router;

