import express from 'express';
import Joi from 'joi';
import { query } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Validation schema
const leaveSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  leaveType: Joi.string().valid('sick', 'vacation', 'personal', 'maternity', 'paternity', 'unpaid', 'other').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  reason: Joi.string().required(),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').optional(),
  approvedBy: Joi.number().integer().optional(),
  approvalNotes: Joi.string().optional(),
});

// GET /api/leave - Get leave requests
router.get('/', requireAuth, async (req, res) => {
  try {
    const { employeeId, status, year, page = 1, limit = 50 } = req.query;
    
    let queryStr = `
      SELECT l.*, 
             e.full_name as employee_name, e.employee_code,
             d.name as department_name,
             a.full_name as approver_name
      FROM leave_requests l
      JOIN employees e ON e.id = l.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employees a ON a.id = l.approved_by
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    // Role-based filtering
    if (req.user.role === 'employee') {
      // Employees can only see their own leave requests
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }
      queryStr += ` AND l.employee_id = $${paramIndex++}`;
      params.push(empResult.rows[0].id);
    } else if (req.user.role === 'manager') {
      // Managers can see their team's leave requests
      queryStr += ` AND e.manager_id IN (SELECT id FROM employees WHERE user_id = $${paramIndex++})`;
      params.push(req.user.id);
    }
    // Admin and HR can see all
    
    if (employeeId) {
      queryStr += ` AND l.employee_id = $${paramIndex++}`;
      params.push(employeeId);
    }
    
    if (status) {
      queryStr += ` AND l.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (year) {
      queryStr += ` AND EXTRACT(YEAR FROM l.start_date) = $${paramIndex++}`;
      params.push(year);
    }
    
    queryStr += ` ORDER BY l.created_at DESC`;
    queryStr += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await query(queryStr, params);
    
    // Get total count - rebuild the WHERE clause for count query
    let countQueryStr = `SELECT COUNT(*) FROM leave_requests l JOIN employees e ON e.id = l.employee_id WHERE 1=1`;
    let countParams = [];
    let countParamIndex = 1;
    
    if (employeeId) {
      countQueryStr += ` AND l.employee_id = $${countParamIndex++}`;
      countParams.push(employeeId);
    }
    
    if (status) {
      countQueryStr += ` AND l.status = $${countParamIndex++}`;
      countParams.push(status);
    }
    
    if (year) {
      countQueryStr += ` AND EXTRACT(YEAR FROM l.start_date) = $${countParamIndex++}`;
      countParams.push(year);
    }
    
    const countResult = await query(countQueryStr, countParams);
    
    res.json({
      leaveRequests: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// GET /api/leave/balance/:employeeId - Get leave balance
router.get('/balance/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    // Check access
    if (req.user.role === 'employee') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0 || empResult.rows[0].id != employeeId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // Calculate leave balance
    const result = await query(`
      SELECT 
        leave_type,
        COUNT(*) as total_requests,
        SUM((end_date - start_date) + 1) as total_days,
        SUM(CASE WHEN status = 'approved' THEN (end_date - start_date) + 1 ELSE 0 END) as approved_days
      FROM leave_requests
      WHERE employee_id = $1
        AND EXTRACT(YEAR FROM start_date) = $2
      GROUP BY leave_type
    `, [employeeId, parseInt(year)]);
    
    // Standard leave allowances (can be made configurable)
    const allowances = {
      sick: 10,
      vacation: 15,
      personal: 5,
      maternity: 90,
      paternity: 15,
      unpaid: 999, // Unlimited
      other: 5
    };
    
    const balance = {
      employeeId: parseInt(employeeId),
      year: parseInt(year),
      breakdown: {}
    };
    
    // Initialize all leave types
    Object.keys(allowances).forEach(type => {
      const used = result.rows.find(r => r.leave_type === type);
      balance.breakdown[type] = {
        allowed: allowances[type],
        used: parseInt(used?.approved_days || 0),
        pending: parseInt(used?.total_days || 0) - parseInt(used?.approved_days || 0),
        remaining: allowances[type] - parseInt(used?.approved_days || 0)
      };
    });
    
    res.json({ balance });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
});

// GET /api/leave/:id - Get single leave request
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT l.*, 
             e.full_name as employee_name, e.employee_code, e.position,
             d.name as department_name,
             a.full_name as approver_name
      FROM leave_requests l
      JOIN employees e ON e.id = l.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employees a ON a.id = l.approved_by
      WHERE l.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    // Check access for employees
    if (req.user.role === 'employee') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0 || empResult.rows[0].id != result.rows[0].employee_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json({ leaveRequest: result.rows[0] });
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({ error: 'Failed to fetch leave request' });
  }
});

// POST /api/leave - Create leave request
router.post('/', requireAuth, async (req, res) => {
  try {
    let { employeeId, leaveType, startDate, endDate, reason } = req.body;
    
    // If employee is creating their own request
    if (req.user.role === 'employee') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }
      employeeId = empResult.rows[0].id;
    }
    
    const { error, value } = leaveSchema.validate({ 
      employeeId, leaveType, startDate, endDate, reason 
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Validate dates
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    
    // Check for overlapping leave requests
    const overlapResult = await query(`
      SELECT id FROM leave_requests
      WHERE employee_id = $1
        AND status NOT IN ('rejected', 'cancelled')
        AND (
          (start_date <= $2 AND end_date >= $2)
          OR (start_date <= $3 AND end_date >= $3)
          OR (start_date >= $2 AND end_date <= $3)
        )
    `, [employeeId, startDate, endDate]);
    
    if (overlapResult.rows.length > 0) {
      return res.status(400).json({ error: 'Leave request overlaps with existing request' });
    }
    
    const result = await query(`
      INSERT INTO leave_requests (
        employee_id, leave_type, start_date, end_date, reason, status
      )
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [employeeId, leaveType, startDate, endDate, reason]);
    
    await logAudit(req.user.id, 'CREATE', 'leave_request', result.rows[0].id, 
      `Created leave request for employee ${employeeId}`);
    
    res.status(201).json({
      message: 'Leave request created successfully',
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// PUT /api/leave/:id/approve - Approve/Reject leave request
router.put('/:id/approve', requireAuth, requireRole(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvalNotes } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }
    
    // Get approver employee ID
    const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Approver profile not found' });
    }
    
    const result = await query(`
      UPDATE leave_requests
      SET status = $1, approved_by = $2, approval_notes = $3, 
          approval_date = now(), updated_at = now()
      WHERE id = $4
      RETURNING *
    `, [status, empResult.rows[0].id, approvalNotes, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    await logAudit(req.user.id, 'UPDATE', 'leave_request', id, 
      `${status} leave request ${id}`);
    
    res.json({
      message: `Leave request ${status} successfully`,
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
});

// PUT /api/leave/:id/cancel - Cancel leave request
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get employee ID
    const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    const result = await query(`
      UPDATE leave_requests
      SET status = 'cancelled', updated_at = now()
      WHERE id = $1 AND employee_id = $2 AND status = 'pending'
      RETURNING *
    `, [id, empResult.rows[0].id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found or cannot be cancelled' });
    }
    
    await logAudit(req.user.id, 'UPDATE', 'leave_request', id, 
      `Cancelled leave request ${id}`);
    
    res.json({
      message: 'Leave request cancelled successfully',
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
});

// DELETE /api/leave/:id - Delete leave request
router.delete('/:id', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM leave_requests WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    await logAudit(req.user.id, 'DELETE', 'leave_request', id, 
      `Deleted leave request ${id}`);
    
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({ error: 'Failed to delete leave request' });
  }
});

export default router;

