import express from 'express';
import Joi from 'joi';
import { query } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Validation schema
const performanceSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  reviewerId: Joi.number().integer().required(),
  reviewPeriodStart: Joi.date().required(),
  reviewPeriodEnd: Joi.date().required(),
  qualityScore: Joi.number().min(0).max(10).required(),
  productivityScore: Joi.number().min(0).max(10).required(),
  communicationScore: Joi.number().min(0).max(10).required(),
  teamworkScore: Joi.number().min(0).max(10).required(),
  goalsScore: Joi.number().min(0).max(10).required(),
  strengths: Joi.string().optional(),
  areasForImprovement: Joi.string().optional(),
  goals: Joi.string().optional(),
  comments: Joi.string().optional()
});

// GET /api/performance - Get performance reviews
router.get('/', requireAuth, async (req, res) => {
  try {
    const { employeeId, reviewerId, year, page = 1, limit = 50 } = req.query;
    
    let queryStr = `
      SELECT pr.*, 
             e.full_name as employee_name, e.employee_code,
             r.full_name as reviewer_name,
             d.name as department_name
      FROM performance_reviews pr
      JOIN employees e ON e.id = pr.employee_id
      JOIN employees r ON r.id = pr.reviewer_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    // Role-based filtering
    if (req.user.role === 'employee') {
      // Employees can see their own reviews
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }
      queryStr += ` AND pr.employee_id = $${paramIndex++}`;
      params.push(empResult.rows[0].id);
    } else if (req.user.role === 'manager') {
      // Managers can see reviews they conducted or for their team
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length > 0) {
        queryStr += ` AND (pr.reviewer_id = $${paramIndex} OR e.manager_id = $${paramIndex})`;
        params.push(empResult.rows[0].id);
        paramIndex++;
      }
    }
    // Admin and HR can see all
    
    if (employeeId) {
      queryStr += ` AND pr.employee_id = $${paramIndex++}`;
      params.push(employeeId);
    }
    
    if (reviewerId) {
      queryStr += ` AND pr.reviewer_id = $${paramIndex++}`;
      params.push(reviewerId);
    }
    
    if (year) {
      queryStr += ` AND EXTRACT(YEAR FROM pr.review_period_start) = $${paramIndex++}`;
      params.push(year);
    }
    
    queryStr += ` ORDER BY pr.review_period_end DESC`;
    queryStr += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await query(queryStr, params);
    
    // Get total count - rebuild the WHERE clause for count query
    let countQueryStr = `SELECT COUNT(*) FROM performance_reviews pr WHERE 1=1`;
    let countParams = [];
    let countParamIndex = 1;
    
    if (employeeId) {
      countQueryStr += ` AND pr.employee_id = $${countParamIndex++}`;
      countParams.push(employeeId);
    }
    
    if (year) {
      countQueryStr += ` AND EXTRACT(YEAR FROM pr.review_period_start) = $${countParamIndex++}`;
      countParams.push(year);
    }
    
    const countResult = await query(countQueryStr, countParams);
    
    res.json({
      reviews: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get performance reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch performance reviews' });
  }
});

// GET /api/performance/:id - Get single performance review
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT pr.*, 
             e.full_name as employee_name, e.employee_code, e.position,
             r.full_name as reviewer_name,
             d.name as department_name
      FROM performance_reviews pr
      JOIN employees e ON e.id = pr.employee_id
      JOIN employees r ON r.id = pr.reviewer_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE pr.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Performance review not found' });
    }
    
    // Check access for employees
    if (req.user.role === 'employee') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0 || empResult.rows[0].id != result.rows[0].employee_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json({ review: result.rows[0] });
  } catch (error) {
    console.error('Get performance review error:', error);
    res.status(500).json({ error: 'Failed to fetch performance review' });
  }
});

// GET /api/performance/employee/:employeeId/summary - Get performance summary
router.get('/employee/:employeeId/summary', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Check access
    if (req.user.role === 'employee') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0 || empResult.rows[0].id != employeeId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // Get average scores
    const avgResult = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_score) as avg_overall_score,
        AVG(overall_score) as avg_quality_score,
        AVG(overall_score) as avg_productivity_score,
        AVG(overall_score) as avg_communication_score,
        AVG(overall_score) as avg_teamwork_score,
        AVG(overall_score) as avg_goals_score
      FROM performance_reviews
      WHERE employee_id = $1
    `, [employeeId]);
    
    // Get recent reviews
    const recentResult = await query(`
      SELECT pr.*, r.full_name as reviewer_name
      FROM performance_reviews pr
      JOIN employees r ON r.id = pr.reviewer_id
      WHERE pr.employee_id = $1
      ORDER BY pr.review_period_end DESC
      LIMIT 5
    `, [employeeId]);
    
    // Get score trend (last 12 months)
    const trendResult = await query(`
      SELECT 
        EXTRACT(YEAR FROM review_period_end) as year,
        EXTRACT(MONTH FROM review_period_end) as month,
        AVG(overall_score) as avg_score
      FROM performance_reviews
      WHERE employee_id = $1
        AND review_period_end >= NOW() - INTERVAL '12 months'
      GROUP BY EXTRACT(YEAR FROM review_period_end), EXTRACT(MONTH FROM review_period_end)
      ORDER BY year, month
    `, [employeeId]);
    
    res.json({
      summary: {
        employeeId: parseInt(employeeId),
        totalReviews: parseInt(avgResult.rows[0].total_reviews),
        averageScores: {
          overall: parseFloat(avgResult.rows[0].avg_overall_score || 0).toFixed(2),
          quality: parseFloat(avgResult.rows[0].avg_quality_score || 0).toFixed(2),
          productivity: parseFloat(avgResult.rows[0].avg_productivity_score || 0).toFixed(2),
          communication: parseFloat(avgResult.rows[0].avg_communication_score || 0).toFixed(2),
          teamwork: parseFloat(avgResult.rows[0].avg_teamwork_score || 0).toFixed(2),
          goals: parseFloat(avgResult.rows[0].avg_goals_score || 0).toFixed(2)
        },
        recentReviews: recentResult.rows,
        scoreTrend: trendResult.rows
      }
    });
  } catch (error) {
    console.error('Get performance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch performance summary' });
  }
});

// POST /api/performance - Create performance review (simplified)
router.post('/', requireAuth, requireRole(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const {
      employee_id, review_period_start, review_period_end,
      overall_score, strengths, areas_for_improvement, goals, comments
    } = req.body;
    
    if (!employee_id || !review_period_start || !review_period_end || !overall_score) {
      return res.status(400).json({ error: 'Employee ID, review period, and overall score are required' });
    }

    // Get reviewer ID from authenticated user
    const reviewerResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (reviewerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reviewer profile not found' });
    }
    const reviewerId = reviewerResult.rows[0].id;

    // Use overall score for all individual scores if not provided
    const score = parseFloat(overall_score);
    
    const result = await query(`
      INSERT INTO performance_reviews (
        employee_id, reviewer_id, review_period_start, review_period_end,
        quality_score, productivity_score, communication_score, teamwork_score, goals_score,
        overall_score, strengths, areas_for_improvement, goals, comments
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      employee_id, reviewerId, review_period_start, review_period_end,
      score, score, score, score, score,
      score, strengths, areas_for_improvement, goals, comments
    ]);
    
    await logAudit(req.user.id, 'CREATE', 'performance_review', result.rows[0].id, 
      `Created performance review for employee ${employee_id}`);
    
    res.status(201).json({
      message: 'Performance review created successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Create performance review error:', error);
    res.status(500).json({ error: 'Failed to create performance review' });
  }
});

// PUT /api/performance/:id - Update performance review
router.put('/:id', requireAuth, requireRole(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = performanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const {
      qualityScore, productivityScore, communicationScore, teamworkScore, goalsScore,
      strengths, areasForImprovement, goals, comments
    } = value;
    
    // Recalculate overall score
    const overallScore = (
      parseFloat(qualityScore) + 
      parseFloat(productivityScore) + 
      parseFloat(communicationScore) + 
      parseFloat(teamworkScore) + 
      parseFloat(goalsScore)
    ) / 5;
    
    const result = await query(`
      UPDATE performance_reviews
      SET quality_score = $1, productivity_score = $2, communication_score = $3,
          teamwork_score = $4, goals_score = $5, overall_score = $6,
          strengths = $7, areas_for_improvement = $8, goals = $9, comments = $10,
          updated_at = now()
      WHERE id = $11
      RETURNING *
    `, [
      qualityScore, productivityScore, communicationScore, teamworkScore, goalsScore,
      overallScore, strengths, areasForImprovement, goals, comments, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Performance review not found' });
    }
    
    await logAudit(req.user.id, 'UPDATE', 'performance_review', id, 
      `Updated performance review ${id}`);
    
    res.json({
      message: 'Performance review updated successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Update performance review error:', error);
    res.status(500).json({ error: 'Failed to update performance review' });
  }
});

// DELETE /api/performance/:id - Delete performance review
router.delete('/:id', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM performance_reviews WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Performance review not found' });
    }
    
    await logAudit(req.user.id, 'DELETE', 'performance_review', id, 
      `Deleted performance review ${id}`);
    
    res.json({ message: 'Performance review deleted successfully' });
  } catch (error) {
    console.error('Delete performance review error:', error);
    res.status(500).json({ error: 'Failed to delete performance review' });
  }
});

export default router;

