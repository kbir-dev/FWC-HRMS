import express from 'express';
import Joi from 'joi';
import { query } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Validation schemas
const attendanceSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  date: Joi.date().required(),
  checkInTime: Joi.date().iso().optional(),
  checkOutTime: Joi.date().iso().optional(),
  status: Joi.string().valid('present', 'absent', 'late', 'half-day', 'leave', 'holiday').required(),
  source: Joi.string().valid('manual', 'biometric', 'app', 'system').default('manual'),
  notes: Joi.string().optional(),
  location: Joi.object().optional()
});

// GET /api/attendance - Get attendance records
router.get('/', requireAuth, async (req, res) => {
  try {
    const { employeeId, startDate, endDate, status, page = 1, limit = 50 } = req.query;
    
    // Build WHERE clause once to reuse
    let whereClause = ' WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    // Role-based filtering
    if (req.user.role === 'employee') {
      // Employees can only see their own attendance
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0) {
        return res.status(404).json({ error: 'Employee profile not found' });
      }
      whereClause += ` AND a.employee_id = $${paramIndex++}`;
      params.push(empResult.rows[0].id);
    } else if (req.user.role === 'manager') {
      // Managers can see their team's attendance
      whereClause += ` AND e.manager_id IN (SELECT id FROM employees WHERE user_id = $${paramIndex++})`;
      params.push(req.user.id);
    }
    // Admin and HR can see all
    
    if (employeeId) {
      whereClause += ` AND a.employee_id = $${paramIndex++}`;
      params.push(employeeId);
    }
    
    if (startDate) {
      whereClause += ` AND a.date >= $${paramIndex++}`;
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ` AND a.date <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    if (status) {
      whereClause += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }
    
    // Build main query
    const queryStr = `
      SELECT a.*, e.full_name, e.employee_code, d.name as department_name
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      ${whereClause}
      ORDER BY a.date DESC, a.check_in_time DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await query(queryStr, params);
    
    // Get total count with same WHERE clause
    const countQuery = `
      SELECT COUNT(*) 
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      ${whereClause}
    `;
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await query(countQuery, countParams);
    
    res.json({
      attendance: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// GET /api/attendance/summary/:employeeId - Get attendance summary for an employee
router.get('/summary/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    
    // Check access
    if (req.user.role === 'employee') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0 || empResult.rows[0].id != employeeId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    
    const result = await query(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(work_hours), 0) as total_hours
      FROM attendance
      WHERE employee_id = $1
        AND EXTRACT(MONTH FROM date) = $2
        AND EXTRACT(YEAR FROM date) = $3
      GROUP BY status
    `, [employeeId, currentMonth, currentYear]);
    
    // Calculate total working days
    const totalResult = await query(`
      SELECT COUNT(*) as total_days,
             COALESCE(SUM(work_hours), 0) as total_hours
      FROM attendance
      WHERE employee_id = $1
        AND EXTRACT(MONTH FROM date) = $2
        AND EXTRACT(YEAR FROM date) = $3
    `, [employeeId, currentMonth, currentYear]);
    
    const summary = {
      employeeId: parseInt(employeeId),
      month: parseInt(currentMonth),
      year: parseInt(currentYear),
      totalDays: parseInt(totalResult.rows[0].total_days),
      totalHours: parseFloat(totalResult.rows[0].total_hours),
      breakdown: result.rows.reduce((acc, row) => {
        acc[row.status] = {
          count: parseInt(row.count),
          hours: parseFloat(row.total_hours)
        };
        return acc;
      }, {})
    };
    
    res.json({ summary });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

// POST /api/attendance - Create attendance record
router.post('/', requireAuth, requireRole(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const { error, value } = attendanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { employeeId, date, checkInTime, checkOutTime, status, source, notes, location } = value;
    
    // Calculate work hours if both times are provided
    let workHours = null;
    if (checkInTime && checkOutTime) {
      const start = new Date(checkInTime);
      const end = new Date(checkOutTime);
      workHours = (end - start) / (1000 * 60 * 60); // Hours
    }
    
    // Check for duplicate
    const existing = await query(
      'SELECT id FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, date]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Attendance record already exists for this date' });
    }
    
    const result = await query(`
      INSERT INTO attendance (
        employee_id, date, check_in_time, check_out_time, 
        work_hours, status, source, notes, location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [employeeId, date, checkInTime, checkOutTime, workHours, status, source, notes, JSON.stringify(location)]);
    
    await logAudit(req.user.id, 'CREATE', 'attendance', result.rows[0].id, 
      `Created attendance record for employee ${employeeId}`);
    
    res.status(201).json({
      message: 'Attendance record created successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ error: 'Failed to create attendance record' });
  }
});

// PUT /api/attendance/:id - Update attendance record
router.put('/:id', requireAuth, requireRole(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = attendanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { checkInTime, checkOutTime, status, notes, location } = value;
    
    // Calculate work hours
    let workHours = null;
    if (checkInTime && checkOutTime) {
      const start = new Date(checkInTime);
      const end = new Date(checkOutTime);
      workHours = (end - start) / (1000 * 60 * 60);
    }
    
    const result = await query(`
      UPDATE attendance
      SET check_in_time = $1, check_out_time = $2, work_hours = $3,
          status = $4, notes = $5, location = $6, updated_at = now()
      WHERE id = $7
      RETURNING *
    `, [checkInTime, checkOutTime, workHours, status, notes, JSON.stringify(location), id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    await logAudit(req.user.id, 'UPDATE', 'attendance', id, 
      `Updated attendance record ${id}`);
    
    res.json({
      message: 'Attendance record updated successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance record' });
  }
});

// POST /api/attendance/check-in - Check in (for employees)
router.post('/check-in', requireAuth, async (req, res) => {
  try {
    // Get employee ID from user
    const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    const employeeId = empResult.rows[0].id;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const existing = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already checked in today' });
    }
    
    const { location } = req.body;
    const checkInTime = new Date();
    
    const result = await query(`
      INSERT INTO attendance (
        employee_id, date, check_in_time, status, source, location
      )
      VALUES ($1, $2, $3, 'present', 'app', $4)
      RETURNING *
    `, [employeeId, today, checkInTime, JSON.stringify(location)]);
    
    res.status(201).json({
      message: 'Checked in successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// POST /api/attendance/check-out - Check out (for employees)
router.post('/check-out', requireAuth, async (req, res) => {
  try {
    const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    const employeeId = empResult.rows[0].id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's attendance record
    const existing = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (existing.rows.length === 0) {
      return res.status(400).json({ error: 'No check-in record found for today' });
    }
    
    if (existing.rows[0].check_out_time) {
      return res.status(400).json({ error: 'Already checked out today' });
    }
    
    const checkOutTime = new Date();
    const checkInTime = new Date(existing.rows[0].check_in_time);
    const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    
    const result = await query(`
      UPDATE attendance
      SET check_out_time = $1, work_hours = $2, updated_at = now()
      WHERE id = $3
      RETURNING *
    `, [checkOutTime, workHours, existing.rows[0].id]);
    
    res.json({
      message: 'Checked out successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Failed to check out' });
  }
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM attendance WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    await logAudit(req.user.id, 'DELETE', 'attendance', id, 
      `Deleted attendance record ${id}`);
    
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

export default router;

