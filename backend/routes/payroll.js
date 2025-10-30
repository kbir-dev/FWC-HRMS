import express from 'express';
import Joi from 'joi';
import { query } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

// Validation schema
const payrollSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).max(2100).required(),
  baseSalary: Joi.number().min(0).required(),
  allowances: Joi.object().default({}),
  deductions: Joi.object().default({}),
  taxAmount: Joi.number().min(0).default(0),
  paymentDate: Joi.date().optional(),
  paymentMethod: Joi.string().valid('bank_transfer', 'check', 'cash', 'direct_deposit').default('bank_transfer'),
  notes: Joi.string().optional()
});

// GET /api/payroll - Get payroll records
router.get('/', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { employeeId, month, year, page = 1, limit = 50 } = req.query;
    
    let queryStr = `
      SELECT p.*, e.full_name, e.employee_code, d.name as department_name
      FROM payrolls p
      JOIN employees e ON e.id = p.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (employeeId) {
      queryStr += ` AND p.employee_id = $${paramIndex++}`;
      params.push(employeeId);
    }
    
    if (month) {
      queryStr += ` AND p.month = $${paramIndex++}`;
      params.push(month);
    }
    
    if (year) {
      queryStr += ` AND p.year = $${paramIndex++}`;
      params.push(year);
    }
    
    queryStr += ` ORDER BY p.year DESC, p.month DESC`;
    queryStr += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await query(queryStr, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM payrolls p WHERE 1=1`;
    const countParams = params.slice(0, -2);
    const countResult = await query(countQuery, countParams);
    
    res.json({
      payrolls: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
});

// GET /api/payroll/employee/:employeeId - Get payroll history for employee
router.get('/employee/:employeeId', requireAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 12 } = req.query;
    
    // Check access
    if (req.user.role === 'employee') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0 || empResult.rows[0].id != employeeId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await query(`
      SELECT p.*, e.full_name, e.employee_code
      FROM payrolls p
      JOIN employees e ON e.id = p.employee_id
      WHERE p.employee_id = $1
      ORDER BY p.year DESC, p.month DESC
      LIMIT $2
    `, [employeeId, parseInt(limit)]);
    
    res.json({ payrolls: result.rows });
  } catch (error) {
    console.error('Get employee payroll error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll history' });
  }
});

// POST /api/payroll/process - Process payroll for all employees
router.post('/process', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Check if payroll already processed for this period
    const existing = await query(
      'SELECT COUNT(*) as count FROM payrolls WHERE month = $1 AND year = $2',
      [month, year]
    );

    if (parseInt(existing.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Payroll already processed for this period',
        message: `Found ${existing.rows[0].count} existing payroll records for ${month}/${year}`
      });
    }

    // Get all active employees
    const employees = await query(
      'SELECT id, salary FROM employees WHERE status = $1',
      ['active']
    );

    if (employees.rows.length === 0) {
      return res.status(400).json({ error: 'No active employees found' });
    }

    // Process payroll for each employee
    const processed = [];
    for (const emp of employees.rows) {
      const baseSalary = parseFloat(emp.salary || 0);
      const taxAmount = baseSalary * 0.2; // 20% tax
      const grossSalary = baseSalary;
      const netSalary = grossSalary - taxAmount;

      const result = await query(
        `INSERT INTO payrolls (
          employee_id, month, year, base_salary, gross_salary, 
          tax_amount, net_salary, payment_method, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          emp.id, month, year, baseSalary, grossSalary,
          taxAmount, netSalary, 'bank_transfer', 'pending'
        ]
      );

      processed.push(result.rows[0]);
    }

    await logAudit(req.user.id, 'process_payroll', 'payrolls', null, {
      month,
      year,
      count: processed.length
    });

    res.json({
      message: `Payroll processed successfully for ${processed.length} employees`,
      count: processed.length,
      month,
      year
    });
  } catch (error) {
    console.error('Process payroll error:', error);
    res.status(500).json({ error: 'Failed to process payroll' });
  }
});

// GET /api/payroll/:id - Get single payroll record
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT p.*, e.full_name, e.employee_code, d.name as department_name
      FROM payrolls p
      JOIN employees e ON e.id = p.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    // Check access for employees
    if (req.user.role === 'employee') {
      const empResult = await query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
      if (empResult.rows.length === 0 || empResult.rows[0].id != result.rows[0].employee_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json({ payroll: result.rows[0] });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ error: 'Failed to fetch payroll record' });
  }
});

// POST /api/payroll - Create payroll record
router.post('/', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { error, value } = payrollSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { 
      employeeId, month, year, baseSalary, allowances, deductions, 
      taxAmount, paymentDate, paymentMethod, notes 
    } = value;
    
    // Check for duplicate
    const existing = await query(
      'SELECT id FROM payrolls WHERE employee_id = $1 AND month = $2 AND year = $3',
      [employeeId, month, year]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Payroll record already exists for this period' });
    }
    
    // Calculate totals
    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + parseFloat(val), 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + parseFloat(val), 0);
    const grossSalary = parseFloat(baseSalary) + totalAllowances;
    const netSalary = grossSalary - totalDeductions - parseFloat(taxAmount);
    
    const result = await query(`
      INSERT INTO payrolls (
        employee_id, month, year, base_salary, allowances, deductions,
        gross_salary, tax_amount, net_salary, payment_date, payment_method, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      employeeId, month, year, baseSalary, JSON.stringify(allowances), JSON.stringify(deductions),
      grossSalary, taxAmount, netSalary, paymentDate, paymentMethod, notes
    ]);
    
    await logAudit(req.user.id, 'CREATE', 'payroll', result.rows[0].id, 
      `Created payroll for employee ${employeeId} for ${month}/${year}`);
    
    res.status(201).json({
      message: 'Payroll record created successfully',
      payroll: result.rows[0]
    });
  } catch (error) {
    console.error('Create payroll error:', error);
    res.status(500).json({ error: 'Failed to create payroll record' });
  }
});

// POST /api/payroll/generate - Generate payroll for multiple employees
router.post('/generate', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { month, year, employeeIds } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
    
    // Get employees with their salary information
    let employeeQuery = `
      SELECT id, full_name, employee_code, salary
      FROM employees
      WHERE status = 'active'
    `;
    const params = [];
    
    if (employeeIds && employeeIds.length > 0) {
      employeeQuery += ` AND id = ANY($1)`;
      params.push(employeeIds);
    }
    
    const employees = await query(employeeQuery, params);
    
    const created = [];
    const skipped = [];
    
    for (const employee of employees.rows) {
      // Check if payroll already exists
      const existing = await query(
        'SELECT id FROM payrolls WHERE employee_id = $1 AND month = $2 AND year = $3',
        [employee.id, month, year]
      );
      
      if (existing.rows.length > 0) {
        skipped.push({ employeeId: employee.id, reason: 'Already exists' });
        continue;
      }
      
      // Basic payroll calculation (can be enhanced with actual allowances/deductions logic)
      const baseSalary = employee.salary || 0;
      const taxAmount = baseSalary * 0.1; // 10% tax (simplified)
      const grossSalary = baseSalary;
      const netSalary = grossSalary - taxAmount;
      
      const result = await query(`
        INSERT INTO payrolls (
          employee_id, month, year, base_salary, allowances, deductions,
          gross_salary, tax_amount, net_salary, payment_method
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        employee.id, month, year, baseSalary, '{}', '{}',
        grossSalary, taxAmount, netSalary, 'bank_transfer'
      ]);
      
      created.push(result.rows[0]);
    }
    
    await logAudit(req.user.id, 'CREATE', 'payroll', null, 
      `Generated ${created.length} payroll records for ${month}/${year}`);
    
    res.status(201).json({
      message: `Generated ${created.length} payroll records`,
      created: created.length,
      skipped: skipped.length,
      payrolls: created,
      skippedRecords: skipped
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    res.status(500).json({ error: 'Failed to generate payroll records' });
  }
});

// PUT /api/payroll/:id - Update payroll record
router.put('/:id', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = payrollSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    const { 
      baseSalary, allowances, deductions, taxAmount, 
      paymentDate, paymentMethod, notes 
    } = value;
    
    // Recalculate totals
    const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + parseFloat(val), 0);
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + parseFloat(val), 0);
    const grossSalary = parseFloat(baseSalary) + totalAllowances;
    const netSalary = grossSalary - totalDeductions - parseFloat(taxAmount);
    
    const result = await query(`
      UPDATE payrolls
      SET base_salary = $1, allowances = $2, deductions = $3,
          gross_salary = $4, tax_amount = $5, net_salary = $6,
          payment_date = $7, payment_method = $8, notes = $9,
          updated_at = now()
      WHERE id = $10
      RETURNING *
    `, [
      baseSalary, JSON.stringify(allowances), JSON.stringify(deductions),
      grossSalary, taxAmount, netSalary, paymentDate, paymentMethod, notes, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    await logAudit(req.user.id, 'UPDATE', 'payroll', id, 
      `Updated payroll record ${id}`);
    
    res.json({
      message: 'Payroll record updated successfully',
      payroll: result.rows[0]
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({ error: 'Failed to update payroll record' });
  }
});

// DELETE /api/payroll/:id - Delete payroll record
router.delete('/:id', requireAuth, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM payrolls WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    await logAudit(req.user.id, 'DELETE', 'payroll', id, 
      `Deleted payroll record ${id}`);
    
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({ error: 'Failed to delete payroll record' });
  }
});

export default router;

