import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import pool from '../db/connection.js';

const router = express.Router();

// Admin Dashboard Stats (with and without /stats for compatibility)
router.get('/admin', authenticate, authorize('admin'), async (req, res) => {
  try {
    const stats = {};

    // Total users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    stats.totalUsers = parseInt(usersResult.rows[0].count);

    // Total employees
    const employeesResult = await pool.query('SELECT COUNT(*) as count FROM employees WHERE status = $1', ['active']);
    stats.totalEmployees = parseInt(employeesResult.rows[0].count);

    // Total departments
    const departmentsResult = await pool.query('SELECT COUNT(DISTINCT department) as count FROM employees');
    stats.totalDepartments = parseInt(departmentsResult.rows[0].count);

    // Active jobs
    const jobsResult = await pool.query('SELECT COUNT(*) as count FROM job_postings WHERE status = $1', ['open']);
    stats.activeJobs = parseInt(jobsResult.rows[0].count);

    // Pending applications
    const applicationsResult = await pool.query(
      'SELECT COUNT(*) as count FROM applications WHERE status = $1',
      ['pending']
    );
    stats.pendingApplications = parseInt(applicationsResult.rows[0].count);

    // Department distribution
    const deptDistribution = await pool.query(
      'SELECT department as name, COUNT(*) as value FROM employees WHERE department IS NOT NULL GROUP BY department LIMIT 10'
    );
    stats.departmentDistribution = deptDistribution.rows.map(row => ({
      name: row.name,
      value: parseInt(row.value),
    }));

    // Recruitment funnel
    const funnelResult = await pool.query(`
      SELECT 
        status as name,
        COUNT(*) as count
      FROM applications
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'pending' THEN 1
          WHEN 'screened' THEN 2
          WHEN 'interview' THEN 3
          WHEN 'shortlisted' THEN 4
          WHEN 'hired' THEN 5
          ELSE 6
        END
    `);
    stats.recruitmentFunnel = funnelResult.rows.map(row => ({
      name: row.name.charAt(0).toUpperCase() + row.name.slice(1),
      count: parseInt(row.count),
    }));

    // User activity (last 7 days) - using created_at as proxy for activity
    const activityResult = await pool.query(`
      SELECT 
        TO_CHAR(day_series.day, 'Dy') as name,
        COUNT(DISTINCT u.id) as logins,
        COUNT(DISTINCT u.id) as active
      FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        '1 day'::interval
      ) AS day_series(day)
      LEFT JOIN users u ON DATE(u.last_login) = day_series.day::date
      GROUP BY day_series.day
      ORDER BY day_series.day
    `);
    stats.userActivity = activityResult.rows.map(row => ({
      name: row.name,
      logins: parseInt(row.logins || 0),
      active: parseInt(row.active || 0)
    }));

    // Recent activities (system-wide)
    const recentActivitiesResult = await pool.query(`
      (SELECT 
        'user' as type,
        'New User Registered' as title,
        u.email || ' joined the system' as description,
        u.created_at as activity_time
      FROM users u
      WHERE u.created_at > NOW() - INTERVAL '7 days'
      ORDER BY u.created_at DESC
      LIMIT 2)
      
      UNION ALL
      
      (SELECT 
        'job' as type,
        'Job Posted' as title,
        j.title || ' position opened' as description,
        j.created_at as activity_time
      FROM job_postings j
      WHERE j.created_at > NOW() - INTERVAL '7 days'
      ORDER BY j.created_at DESC
      LIMIT 2)
      
      UNION ALL
      
      (SELECT 
        'application' as type,
        'Application Received' as title,
        a.candidate_name || ' applied for a position' as description,
        a.created_at as activity_time
      FROM applications a
      WHERE a.created_at > NOW() - INTERVAL '7 days'
      ORDER BY a.created_at DESC
      LIMIT 2)
      
      ORDER BY activity_time DESC
      LIMIT 5
    `);
    stats.recentActivities = recentActivitiesResult.rows.map(row => ({
      type: row.type,
      title: row.title,
      description: row.description,
      time: (() => {
        const diff = Date.now() - new Date(row.activity_time).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return 'Just now';
      })(),
      badge: row.type === 'user' ? 'New' : null
    }));

    res.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// HR Manager Dashboard Stats (with and without /stats for compatibility)
router.get('/hr', authenticate, authorize('hr', 'admin'), async (req, res) => {
  try {
    const stats = {};

    // Total employees
    const employeesResult = await pool.query('SELECT COUNT(*) as count FROM employees WHERE status = $1', ['active']);
    stats.totalEmployees = parseInt(employeesResult.rows[0].count);

    // New hires (last 90 days)
    const newHiresResult = await pool.query(
      'SELECT COUNT(*) as count FROM employees WHERE created_at > NOW() - INTERVAL \'90 days\''
    );
    stats.newHires = parseInt(newHiresResult.rows[0].count);

    // Pending leave requests
    const leaveResult = await pool.query(
      'SELECT COUNT(*) as count FROM leave_requests WHERE status = $1',
      ['pending']
    );
    stats.pendingLeave = parseInt(leaveResult.rows[0].count || 0);

    // Total applications
    const applicationsResult = await pool.query('SELECT COUNT(*) as count FROM applications');
    stats.totalApplications = parseInt(applicationsResult.rows[0].count);

    // Applications by status
    const appsByStatus = await pool.query(`
      SELECT status as name, COUNT(*) as count
      FROM applications
      WHERE status IN ('pending', 'screened', 'interview', 'shortlisted')
      GROUP BY status
    `);
    stats.applicationsByStatus = appsByStatus.rows.map(row => ({
      name: row.name.charAt(0).toUpperCase() + row.name.slice(1),
      count: parseInt(row.count),
    }));

    // Headcount trend (last 6 months)
    const headcountResult = await pool.query(`
      SELECT 
        TO_CHAR(month_series.month, 'Mon') as name,
        COUNT(e.id) as count
      FROM generate_series(
        date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
        date_trunc('month', CURRENT_DATE),
        '1 month'::interval
      ) AS month_series(month)
      LEFT JOIN employees e ON date_trunc('month', e.created_at) <= month_series.month
        AND (e.termination_date IS NULL OR date_trunc('month', e.termination_date) > month_series.month)
      GROUP BY month_series.month
      ORDER BY month_series.month
    `);
    stats.headcountTrend = headcountResult.rows.map(row => ({
      name: row.name,
      count: parseInt(row.count || 0)
    }));

    // Upcoming interviews (next 7 days)
    const interviewsResult = await pool.query(`
      SELECT 
        a.candidate_name as candidate,
        j.title as position,
        TO_CHAR(i.scheduled_at, 'YYYY-MM-DD') as date,
        TO_CHAR(i.scheduled_at, 'HH:MI AM') as time,
        i.status
      FROM interviews i
      JOIN applications a ON a.id = i.application_id
      JOIN job_postings j ON j.id = a.job_id
      WHERE i.status = 'scheduled'
        AND i.scheduled_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY i.scheduled_at
      LIMIT 10
    `);
    stats.upcomingInterviews = interviewsResult.rows.map(row => ({
      candidate: row.candidate,
      position: row.position,
      date: row.date,
      time: row.time,
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1)
    }));

    // Pending leave requests
    const pendingLeaveResult = await pool.query(`
      SELECT 
        e.full_name as employee,
        l.leave_type as type,
        TO_CHAR(l.start_date, 'Mon DD') || '-' || TO_CHAR(l.end_date, 'DD') as dates,
        (l.end_date - l.start_date + 1) as days,
        l.status
      FROM leave_requests l
      JOIN employees e ON e.id = l.employee_id
      WHERE l.status = 'pending'
      ORDER BY l.created_at ASC
      LIMIT 10
    `);
    stats.pendingLeaveRequests = pendingLeaveResult.rows.map(row => ({
      employee: row.employee,
      type: row.type.charAt(0).toUpperCase() + row.type.slice(1) + ' Leave',
      dates: row.dates,
      days: parseInt(row.days),
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1)
    }));

    res.json(stats);
  } catch (error) {
    console.error('HR stats error:', error);
    res.status(500).json({ error: 'Failed to fetch HR statistics' });
  }
});

// Recruiter Dashboard Stats (with and without /stats for compatibility)
router.get('/recruiter', authenticate, authorize('recruiter', 'hr', 'admin'), async (req, res) => {
  try {
    const stats = {};

    // Active jobs
    const jobsResult = await pool.query('SELECT COUNT(*) as count FROM job_postings WHERE status = $1', ['open']);
    stats.activeJobs = parseInt(jobsResult.rows[0].count);

    // Total applications
    const applicationsResult = await pool.query('SELECT COUNT(*) as count FROM applications');
    stats.totalApplications = parseInt(applicationsResult.rows[0].count);

    // Shortlisted candidates
    const shortlistedResult = await pool.query(
      'SELECT COUNT(*) as count FROM applications WHERE status = $1',
      ['shortlisted']
    );
    stats.shortlisted = parseInt(shortlistedResult.rows[0].count);

    // Scheduled interviews
    const interviewResult = await pool.query(
      'SELECT COUNT(*) as count FROM applications WHERE status = $1',
      ['interview']
    );
    stats.scheduled = parseInt(interviewResult.rows[0].count);

    // AI score distribution
    const scoreDistribution = await pool.query(`
      SELECT 
        CASE 
          WHEN ai_score >= 90 THEN '90-100'
          WHEN ai_score >= 80 THEN '80-89'
          WHEN ai_score >= 70 THEN '70-79'
          WHEN ai_score >= 60 THEN '60-69'
          ELSE '<60'
        END as name,
        COUNT(*) as count
      FROM applications
      WHERE ai_score IS NOT NULL
      GROUP BY name
      ORDER BY name DESC
    `);
    stats.aiScoreDistribution = scoreDistribution.rows.map(row => ({
      name: row.name,
      count: parseInt(row.count),
    }));

    // Application pipeline
    const pipelineResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM applications
      WHERE status IN ('pending', 'screened', 'interview', 'shortlisted')
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'pending' THEN 1
          WHEN 'screened' THEN 2
          WHEN 'interview' THEN 3
          WHEN 'shortlisted' THEN 4
        END
    `);
    stats.applicationPipeline = pipelineResult.rows.map(row => ({
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      count: parseInt(row.count),
    }));

    // Top candidates by AI score
    const topCandidatesResult = await pool.query(`
      SELECT 
        a.candidate_name as name,
        j.title as position,
        COALESCE(a.ai_score, 0) as score,
        a.status,
        TO_CHAR(NOW() - a.created_at, 'DD" days ago"') as applied
      FROM applications a
      JOIN job_postings j ON j.id = a.job_id
      WHERE a.ai_score IS NOT NULL
      ORDER BY a.ai_score DESC
      LIMIT 10
    `);
    stats.topCandidates = topCandidatesResult.rows.map(row => ({
      name: row.name,
      position: row.position,
      score: parseInt(row.score),
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      applied: row.applied
    }));

    // Active jobs list with application counts
    const activeJobsResult = await pool.query(`
      SELECT 
        j.title,
        COUNT(a.id) as applications,
        COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) as shortlisted,
        j.status
      FROM job_postings j
      LEFT JOIN applications a ON a.job_id = j.id
      WHERE j.status = 'open'
      GROUP BY j.id, j.title, j.status
      ORDER BY applications DESC
      LIMIT 10
    `);
    stats.activeJobsList = activeJobsResult.rows.map(row => ({
      title: row.title,
      applications: parseInt(row.applications || 0),
      shortlisted: parseInt(row.shortlisted || 0),
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1)
    }));

    res.json(stats);
  } catch (error) {
    console.error('Recruiter stats error:', error);
    res.status(500).json({ error: 'Failed to fetch recruiter statistics' });
  }
});

// Manager Dashboard Stats (with and without /stats for compatibility)
router.get('/manager', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const stats = {};
    const userId = req.user.id;

    // Get manager's employee record
    const managerResult = await pool.query(
      'SELECT id FROM employees WHERE user_id = $1',
      [userId]
    );

    if (managerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Manager profile not found' });
    }

    const managerId = managerResult.rows[0].id;

    // Team size - employees reporting to this manager
    const teamSizeResult = await pool.query(
      'SELECT COUNT(*) as count FROM employees WHERE manager_id = $1 AND status = $2',
      [managerId, 'active']
    );
    stats.teamSize = parseInt(teamSizeResult.rows[0].count || 0);

    // Present today
    const today = new Date().toISOString().split('T')[0];
    const presentResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE e.manager_id = $1 
         AND a.date = $2 
         AND a.status = 'present'`,
      [managerId, today]
    );
    stats.presentToday = parseInt(presentResult.rows[0].count || 0);

    // On leave today
    const onLeaveResult = await pool.query(
      `SELECT COUNT(DISTINCT e.id) as count
       FROM employees e
       JOIN leave_requests l ON l.employee_id = e.id
       WHERE e.manager_id = $1
         AND l.status = 'approved'
         AND $2 BETWEEN l.start_date AND l.end_date`,
      [managerId, today]
    );
    stats.onLeave = parseInt(onLeaveResult.rows[0].count || 0);

    // Pending leave requests
    const pendingLeaveResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM leave_requests l
       JOIN employees e ON e.id = l.employee_id
       WHERE e.manager_id = $1 AND l.status = 'pending'`,
      [managerId]
    );
    stats.pendingLeaveRequests = parseInt(pendingLeaveResult.rows[0].count || 0);

    // Team attendance for last 7 days
    const attendanceResult = await pool.query(
      `SELECT 
         TO_CHAR(a.date, 'Dy') as name,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
       FROM generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         '1 day'::interval
       ) AS date_series(date)
       LEFT JOIN attendance a ON a.date = date_series.date::date
       LEFT JOIN employees e ON e.id = a.employee_id AND e.manager_id = $1
       GROUP BY date_series.date
       ORDER BY date_series.date`,
      [managerId]
    );
    stats.teamAttendance = attendanceResult.rows;

    // Team performance (aggregate scores)
    const performanceResult = await pool.query(
      `SELECT 
         'Quality' as subject, 
         AVG(overall_score) as "teamAvg", 
         90 as target
       FROM performance_reviews pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE e.manager_id = $1
       UNION ALL
       SELECT 'Productivity', AVG(overall_score), 85
       FROM performance_reviews pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE e.manager_id = $1
       UNION ALL
       SELECT 'Communication', AVG(overall_score), 85
       FROM performance_reviews pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE e.manager_id = $1
       UNION ALL
       SELECT 'Teamwork', AVG(overall_score), 90
       FROM performance_reviews pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE e.manager_id = $1
       UNION ALL
       SELECT 'Goals', AVG(overall_score), 85
       FROM performance_reviews pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE e.manager_id = $1`,
      [managerId]
    );
    stats.teamPerformance = performanceResult.rows.map(row => ({
      subject: row.subject,
      teamAvg: parseFloat(row.teamAvg || 0),
      target: parseInt(row.target)
    }));

    // Pending leave list
    const pendingLeaveListResult = await pool.query(
      `SELECT 
         e.full_name as employee,
         l.leave_type as type,
         TO_CHAR(l.start_date, 'Mon DD') || '-' || TO_CHAR(l.end_date, 'DD') as dates,
         (l.end_date - l.start_date + 1) as days,
         l.status
       FROM leave_requests l
       JOIN employees e ON e.id = l.employee_id
       WHERE e.manager_id = $1 AND l.status = 'pending'
       ORDER BY l.created_at DESC
       LIMIT 10`,
      [managerId]
    );
    stats.pendingLeaveList = pendingLeaveListResult.rows;

    // Direct reports with stats
    const directReportsResult = await pool.query(
      `SELECT 
         e.full_name as name,
         e.position,
         COALESCE(
           ROUND(
             (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
              NULLIF(COUNT(a.id), 0) * 100), 0
           ), 0
         )::text || '%' as attendance,
         COALESCE(ROUND(AVG(pr.overall_score)), 0) as performance,
         e.status
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id 
         AND a.date >= CURRENT_DATE - INTERVAL '30 days'
       LEFT JOIN performance_reviews pr ON pr.employee_id = e.id
       WHERE e.manager_id = $1 AND e.status = 'active'
       GROUP BY e.id, e.full_name, e.position, e.status
       ORDER BY e.full_name
       LIMIT 10`,
      [managerId]
    );
    stats.directReports = directReportsResult.rows.map(row => ({
      name: row.name,
      position: row.position,
      attendance: row.attendance,
      performance: parseInt(row.performance),
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1)
    }));

    res.json(stats);
  } catch (error) {
    console.error('Manager stats error:', error);
    res.status(500).json({ error: 'Failed to fetch manager statistics' });
  }
});

// Employee Dashboard Stats (with and without /stats for compatibility)
router.get('/employee', authenticate, async (req, res) => {
  try {
    const stats = {};
    const userId = req.user.id;

    // Get employee record
    const employeeResult = await pool.query(
      `SELECT e.*, m.full_name as manager_name
       FROM employees e
       LEFT JOIN employees m ON m.id = e.manager_id
       WHERE e.user_id = $1`,
      [userId]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

      const employee = employeeResult.rows[0];
    const employeeId = employee.id;

    // Personal info with manager and join date
      stats.personalInfo = {
      name: employee.full_name,
        position: employee.position,
        department: employee.department,
      manager: employee.manager_name || 'N/A',
      joinDate: new Date(employee.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    };

    // Attendance stats (current month)
    const attendanceResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present_days,
        COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE status = 'late') as late_days,
        COUNT(*) as total_days
      FROM attendance 
      WHERE employee_id = $1
      AND date >= date_trunc('month', CURRENT_DATE)`,
      [employeeId]
    );

      stats.attendanceStats = {
      presentDays: parseInt(attendanceResult.rows[0]?.present_days || 0),
      absentDays: parseInt(attendanceResult.rows[0]?.absent_days || 0),
      lateDays: parseInt(attendanceResult.rows[0]?.late_days || 0),
      totalDays: parseInt(attendanceResult.rows[0]?.total_days || 0),
    };

    // Leave balance by type
    const currentYear = new Date().getFullYear();
    const leaveBalanceResult = await pool.query(
      `SELECT 
        leave_type as type,
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'approved' THEN (end_date - start_date + 1) ELSE 0 END) as used
      FROM leave_requests
      WHERE employee_id = $1
        AND EXTRACT(YEAR FROM start_date) = $2
      GROUP BY leave_type`,
      [employeeId, currentYear]
    );

    const leaveTypes = {
      'sick': { type: 'Sick Leave', total: 10 },
      'vacation': { type: 'Annual Leave', total: 20 },
      'personal': { type: 'Casual Leave', total: 6 }
    };

    stats.leaveBalance = Object.entries(leaveTypes).map(([key, config]) => {
      const record = leaveBalanceResult.rows.find(r => r.type === key);
      const used = parseInt(record?.used || 0);
      return {
        type: config.type,
        available: config.total - used,
        used: used,
        total: config.total
      };
    });

    // Attendance trend (last 4 weeks)
    const attendanceTrendResult = await pool.query(
      `SELECT 
         'Week ' || CEIL(EXTRACT(DAY FROM date_series.date - CURRENT_DATE + 29) / 7.0)::text as name,
         COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
         COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent
       FROM generate_series(
         CURRENT_DATE - INTERVAL '27 days',
         CURRENT_DATE,
         '1 day'::interval
       ) AS date_series(date)
       LEFT JOIN attendance a ON a.date = date_series.date::date AND a.employee_id = $1
       GROUP BY CEIL(EXTRACT(DAY FROM date_series.date - CURRENT_DATE + 29) / 7.0)
       ORDER BY CEIL(EXTRACT(DAY FROM date_series.date - CURRENT_DATE + 29) / 7.0)`,
      [employeeId]
    );
    stats.attendanceTrend = attendanceTrendResult.rows;

    // Recent payslips (mock for now - implement when payroll table exists)
    stats.recentPayslips = [
      {
        month: new Date(Date.now() - 30*24*60*60*1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        gross: '$' + (employee.salary || 5000).toLocaleString(),
        deductions: '$' + Math.round((employee.salary || 5000) * 0.2).toLocaleString(),
        net: '$' + Math.round((employee.salary || 5000) * 0.8).toLocaleString(),
        date: new Date(Date.now() - 30*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      },
      {
        month: new Date(Date.now() - 60*24*60*60*1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        gross: '$' + (employee.salary || 5000).toLocaleString(),
        deductions: '$' + Math.round((employee.salary || 5000) * 0.2).toLocaleString(),
        net: '$' + Math.round((employee.salary || 5000) * 0.8).toLocaleString(),
        date: new Date(Date.now() - 60*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
    ];

    // Performance score
    const performanceResult = await pool.query(
      `SELECT 
         AVG(overall_score) as overall,
         AVG(overall_score) as quality,
         AVG(overall_score) as productivity,
         AVG(overall_score) as communication
       FROM performance_reviews
       WHERE employee_id = $1`,
      [employeeId]
    );

    stats.performanceScore = {
      overall: Math.round(parseFloat(performanceResult.rows[0]?.overall || 0)),
      quality: Math.round(parseFloat(performanceResult.rows[0]?.quality || 0)),
      productivity: Math.round(parseFloat(performanceResult.rows[0]?.productivity || 0)),
      communication: Math.round(parseFloat(performanceResult.rows[0]?.communication || 0))
    };

    // Internal job opportunities
    const internalJobsResult = await pool.query(
      `SELECT 
         title,
         department,
         employment_type as type,
         TO_CHAR(created_at, 'DD Mon YYYY') as posted
       FROM job_postings
       WHERE status = 'open'
       ORDER BY created_at DESC
       LIMIT 5`
    );

    stats.internalJobs = internalJobsResult.rows.map(job => ({
      title: job.title,
      department: job.department || 'Various',
      type: job.type || 'Full-time',
      posted: job.posted
    }));

    // Upcoming events (mock for now - implement when events table exists)
    stats.upcomingEvents = [
      { 
        event: 'Team Meeting', 
        date: new Date(Date.now() + 1*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 
        type: 'Meeting' 
      },
      { 
        event: 'Public Holiday', 
        date: new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 
        type: 'Holiday' 
      },
      { 
        event: 'Performance Review', 
        date: new Date(Date.now() + 17*24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 
        type: 'Review' 
      }
    ];

    res.json(stats);
  } catch (error) {
    console.error('Employee stats error:', error);
    res.status(500).json({ error: 'Failed to fetch employee statistics' });
  }
});

export default router;

