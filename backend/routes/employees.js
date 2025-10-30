import express from 'express';
import Joi from 'joi';
import { query } from '../db/connection.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';

const router = express.Router();

// Validation schemas
const createEmployeeSchema = Joi.object({
  userId: Joi.number().integer(),
  employeeCode: Joi.string().required(),
  fullName: Joi.string().required(),
  dateOfBirth: Joi.date(),
  hireDate: Joi.date().required(),
  departmentId: Joi.number().integer(),
  managerId: Joi.number().integer(),
  position: Joi.string(),
  employmentType: Joi.string().valid('full-time', 'part-time', 'contract', 'intern'),
  salary: Joi.number(),
  contact: Joi.object(),
  emergencyContact: Joi.object(),
  address: Joi.object()
});

// GET /api/employees - List employees
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      departmentId,
      status = 'active',
      search,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    // Role-based filtering
    if (req.user.role === 'manager') {
      // Managers can only see their team
      const empResult = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      
      if (empResult.rows.length > 0) {
        whereConditions.push(`(e.manager_id = $${paramIndex++} OR e.id = $${paramIndex++})`);
        params.push(empResult.rows[0].id, empResult.rows[0].id);
      }
    } else if (req.user.role === 'employee') {
      // Employees can only see themselves
      whereConditions.push(`e.user_id = $${paramIndex++}`);
      params.push(req.user.id);
    }
    
    if (status) {
      whereConditions.push(`e.status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (departmentId) {
      whereConditions.push(`e.department_id = $${paramIndex++}`);
      params.push(departmentId);
    }
    
    if (search) {
      whereConditions.push(`(e.full_name ILIKE $${paramIndex++} OR e.employee_code ILIKE $${paramIndex++})`);
      params.push(`%${search}%`, `%${search}%`);
      paramIndex--; // Reuse same param twice
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    params.push(limit, offset);
    
    const result = await query(
      `SELECT 
         e.id, e.employee_code, e.full_name, e.position, e.employment_type,
         e.hire_date, e.status, e.department_id,
         d.name as department_name,
         m.full_name as manager_name,
         u.email, u.role
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN employees m ON m.id = e.manager_id
       LEFT JOIN users u ON u.id = e.user_id
       ${whereClause}
       ORDER BY e.full_name
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM employees e ${whereClause}`,
      params.slice(0, -2)
    );
    
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      employees: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/employees/:id - Get single employee
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT 
         e.*,
         d.name as department_name,
         m.full_name as manager_name,
         m.employee_code as manager_code,
         u.email, u.role, u.last_login
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN employees m ON m.id = e.manager_id
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const employee = result.rows[0];
    
    // Check permissions
    if (req.user.role === 'employee' && employee.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    if (req.user.role === 'manager') {
      // Check if this employee reports to the manager
      const managerEmpResult = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      
      if (managerEmpResult.rows.length > 0) {
        const managerId = managerEmpResult.rows[0].id;
        if (employee.manager_id !== managerId && employee.id !== managerId) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }
    }
    
    // Don't expose salary to non-admin/hr users
    if (!['admin', 'hr'].includes(req.user.role) && employee.user_id !== req.user.id) {
      delete employee.salary;
    }
    
    res.json({ employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST /api/employees - Create employee
router.post('/', authenticate, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { error, value } = createEmployeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    // Check if employee code already exists
    const existing = await query(
      'SELECT id FROM employees WHERE employee_code = $1',
      [value.employeeCode]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Employee code already exists' });
    }
    
    const result = await query(
      `INSERT INTO employees (
        user_id, employee_code, full_name, date_of_birth, hire_date,
        department_id, manager_id, position, employment_type, salary,
        contact, emergency_contact, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        value.userId,
        value.employeeCode,
        value.fullName,
        value.dateOfBirth,
        value.hireDate,
        value.departmentId,
        value.managerId,
        value.position,
        value.employmentType,
        value.salary,
        JSON.stringify(value.contact || {}),
        JSON.stringify(value.emergencyContact || {}),
        JSON.stringify(value.address || {})
      ]
    );
    
    const employee = result.rows[0];
    
    await createAuditLog(
      req.user.id, 
      'create', 
      'employees', 
      employee.id, 
      { name: employee.full_name, code: employee.employee_code }
    );
    
    res.status(201).json({
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', authenticate, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const existing = await query('SELECT * FROM employees WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Managers can only update their direct reports
    if (req.user.role === 'manager') {
      const managerEmpResult = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      
      if (managerEmpResult.rows.length > 0) {
        const managerId = managerEmpResult.rows[0].id;
        if (existing.rows[0].manager_id !== managerId) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }
    }
    
    // Build update query dynamically
    const allowedFields = [
      'full_name', 'date_of_birth', 'department_id', 'manager_id',
      'position', 'employment_type', 'salary', 'contact',
      'emergency_contact', 'address', 'status'
    ];
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Managers cannot update salary
        if (field === 'salary' && req.user.role === 'manager') {
          continue;
        }
        
        if (['contact', 'emergency_contact', 'address'].includes(field)) {
          updates.push(`${field} = $${paramIndex++}`);
          params.push(JSON.stringify(req.body[field]));
        } else {
          updates.push(`${field} = $${paramIndex++}`);
          params.push(req.body[field]);
        }
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    params.push(id);
    
    const result = await query(
      `UPDATE employees 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );
    
    const employee = result.rows[0];
    
    await createAuditLog(req.user.id, 'update', 'employees', employee.id, req.body);
    
    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /api/employees/:id - Soft delete employee
router.delete('/:id', authenticate, authorize('admin', 'hr'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE employees 
       SET status = 'terminated'
       WHERE id = $1
       RETURNING id, full_name, employee_code`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    await createAuditLog(
      req.user.id, 
      'delete', 
      'employees', 
      id, 
      { name: result.rows[0].full_name }
    );
    
    res.json({ message: 'Employee terminated successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to terminate employee' });
  }
});

export default router;

