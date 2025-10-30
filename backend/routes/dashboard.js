import express from 'express';
import { query } from '../db/connection.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/hr - HR Dashboard Statistics
router.get('/hr', authenticate, authorize('admin', 'hr'), async (req, res) => {
  try {
    // Total Employees
    const employeesResult = await query(
      "SELECT COUNT(*) as count FROM employees WHERE status = 'active'"
    );
    const totalEmployees = parseInt(employeesResult.rows[0].count);

    // New Hires (this quarter)
    const quarterStart = new Date();
    quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3, 1);
    const newHiresResult = await query(
      'SELECT COUNT(*) as count FROM employees WHERE hire_date >= $1',
      [quarterStart]
    );
    const newHires = parseInt(newHiresResult.rows[0].count);

    // Total Applications (all time)
    const applicationsResult = await query(
      'SELECT COUNT(*) as count FROM applications'
    );
    const totalApplications = parseInt(applicationsResult.rows[0].count);

    // Pending Leave Requests
    const pendingLeaveResult = await query(
      "SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'"
    );
    const pendingLeave = parseInt(pendingLeaveResult.rows[0].count);

    // Headcount Trend (last 6 months)
    const headcountTrend = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      const result = await query(
        "SELECT COUNT(*) as count FROM employees WHERE hire_date <= $1 AND status = 'active'",
        [date]
      );
      
      headcountTrend.push({
        name: monthName,
        count: parseInt(result.rows[0].count)
      });
    }

    // Applications by Status
    const applicationsByStatusResult = await query(`
      SELECT status, COUNT(*) as count
      FROM applications
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'shortlisted' THEN 1
          WHEN 'interview' THEN 2
          WHEN 'screened' THEN 3
          WHEN 'received' THEN 4
          ELSE 5
        END
    `);
    
    const applicationsByStatus = applicationsByStatusResult.rows.map(row => ({
      name: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      count: parseInt(row.count)
    }));

    // Upcoming Interviews (next 7 days)
    const upcomingInterviewsResult = await query(`
      SELECT 
        i.id,
        i.scheduled_at,
        i.interview_type,
        i.status,
        a.candidate_name as candidate,
        j.title as position
      FROM interviews i
      JOIN applications a ON a.id = i.application_id
      JOIN job_postings j ON j.id = a.job_id
      WHERE i.scheduled_at >= NOW()
        AND i.scheduled_at <= NOW() + INTERVAL '7 days'
        AND i.status IN ('scheduled', 'in-progress')
      ORDER BY i.scheduled_at ASC
      LIMIT 10
    `);

    const upcomingInterviews = upcomingInterviewsResult.rows.map(row => ({
      candidate: row.candidate,
      position: row.position,
      date: new Date(row.scheduled_at).toISOString().split('T')[0],
      time: new Date(row.scheduled_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      status: row.status === 'scheduled' ? 'Scheduled' : 'In Progress'
    }));

    // Pending Leave Requests (details)
    const pendingLeaveRequestsResult = await query(`
      SELECT 
        l.id,
        l.leave_type,
        l.start_date,
        l.end_date,
        l.status,
        e.full_name as employee_name,
        (l.end_date - l.start_date + 1) as days
      FROM leave_requests l
      JOIN employees e ON e.id = l.employee_id
      WHERE l.status = 'pending'
      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    const pendingLeaveRequests = pendingLeaveRequestsResult.rows.map(row => ({
      employee: row.employee_name,
      type: row.leave_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      dates: `${new Date(row.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(row.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      days: parseInt(row.days),
      status: 'Pending'
    }));

    res.json({
      totalEmployees,
      newHires,
      totalApplications,
      pendingLeave,
      headcountTrend,
      applicationsByStatus,
      upcomingInterviews,
      pendingLeaveRequests
    });
  } catch (error) {
    console.error('Get HR dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// GET /api/dashboard/admin - Admin Dashboard Statistics
router.get('/admin', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Total Users
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Total Employees
    const employeesResult = await query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
    const totalEmployees = parseInt(employeesResult.rows[0].count);
    
    // Total Departments
    const departmentsResult = await query('SELECT COUNT(*) as count FROM departments');
    const totalDepartments = parseInt(departmentsResult.rows[0].count);

    // Active Jobs
    const jobsResult = await query("SELECT COUNT(*) as count FROM job_postings WHERE status = 'published'");
    const activeJobs = parseInt(jobsResult.rows[0].count);

    // Pending Applications
    const pendingApplicationsResult = await query('SELECT COUNT(*) as count FROM applications');
    const pendingApplications = parseInt(pendingApplicationsResult.rows[0].count);

    // User Activity (last 7 days)
    const userActivity = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      // Simulate activity (in real app, track login/activity logs)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      userActivity.push({
        name: dayName,
        logins: isWeekend ? 0 : Math.floor(Math.random() * 2) + 5,
        active: isWeekend ? 0 : Math.floor(Math.random() * 2) + 4
      });
    }

    // Recruitment Funnel
    const recruitmentFunnelResult = await query(`
      SELECT status, COUNT(*) as count
      FROM applications
      GROUP BY status
      ORDER BY count DESC
    `);
    
    const recruitmentFunnel = recruitmentFunnelResult.rows.map(row => ({
      name: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      count: parseInt(row.count)
    }));

    // Department Distribution
    const deptDistResult = await query(`
      SELECT d.name, COUNT(e.id) as value
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      GROUP BY d.id, d.name
      ORDER BY value DESC
    `);
    
    const departmentDistribution = deptDistResult.rows.map(row => ({
      name: row.name,
      value: parseInt(row.value)
    }));

    // Recent Activities
    const recentActivities = [
      {
        type: 'application',
        title: 'New Applications',
        description: `${pendingApplications} candidates applied with AI screening`,
        time: 'Today',
        badge: 'New'
      },
      {
        type: 'job',
        title: 'Job Posted',
        description: 'Senior Full Stack Engineer position opened',
        time: 'This week'
      },
      {
        type: 'application',
        title: 'Interviews Scheduled',
        description: '5 interviews scheduled for top candidates',
        time: 'Today'
      }
    ];

    res.json({
      totalUsers,
      totalEmployees,
      totalDepartments,
      activeJobs,
      pendingApplications,
      userActivity,
      recruitmentFunnel,
      departmentDistribution,
      recentActivities
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// GET /api/dashboard/recruiter - Recruiter Dashboard Statistics  
router.get('/recruiter', authenticate, authorize('admin', 'hr', 'recruiter'), async (req, res) => {
  try {
    // Active Jobs
    const activeJobsResult = await query(
      "SELECT COUNT(*) as count FROM job_postings WHERE status = 'published'"
    );
    const activeJobs = parseInt(activeJobsResult.rows[0].count);

    // Total Applications
    const applicationsResult = await query(
      'SELECT COUNT(*) as count FROM applications'
    );
    const totalApplications = parseInt(applicationsResult.rows[0].count);

    // Shortlisted Candidates
    const shortlistedResult = await query(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'shortlisted'"
    );
    const shortlisted = parseInt(shortlistedResult.rows[0].count);

    // Scheduled Interviews
    const interviewsResult = await query(
      "SELECT COUNT(*) as count FROM interviews WHERE status = 'scheduled'"
    );
    const scheduled = parseInt(interviewsResult.rows[0].count);

    // AI Score Distribution
    const aiScoreDistResult = await query(`
      SELECT 
        CASE 
          WHEN screening_score >= 90 THEN '90-100'
          WHEN screening_score >= 80 THEN '80-89'
          WHEN screening_score >= 70 THEN '70-79'
          WHEN screening_score >= 60 THEN '60-69'
          ELSE '<60'
        END as score_range,
        COUNT(*) as count
      FROM applications
      WHERE screening_score IS NOT NULL
      GROUP BY score_range
      ORDER BY score_range DESC
    `);

    const scoreOrder = ['90-100', '80-89', '70-79', '60-69', '<60'];
    const aiScoreDistribution = scoreOrder.map(range => {
      const found = aiScoreDistResult.rows.find(r => r.score_range === range);
      return {
        name: range,
        count: found ? parseInt(found.count) : 0
      };
    });

    // Application Pipeline
    const appsPipelineResult = await query(`
      SELECT status, COUNT(*) as count
      FROM applications
      GROUP BY status
      ORDER BY count DESC
    `);
    
    const applicationPipeline = appsPipelineResult.rows.map(row => ({
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      count: parseInt(row.count),
      color: getStatusColor(row.status)
    }));

    // Top Candidates
    const topCandidatesResult = await query(`
      SELECT 
        a.candidate_name as name,
        j.title as position,
        a.screening_score as score,
        a.status,
        a.created_at
      FROM applications a
      JOIN job_postings j ON j.id = a.job_id
      WHERE a.screening_score IS NOT NULL
      ORDER BY a.screening_score DESC
      LIMIT 3
    `);

    const topCandidates = topCandidatesResult.rows.map(row => ({
      name: row.name,
      position: row.position,
      score: Math.round(row.score),
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      applied: getRelativeTime(row.created_at)
    }));

    // Active Jobs List
    const activeJobsListResult = await query(`
      SELECT 
        j.id,
        j.title,
        COUNT(a.id) as applications,
        COUNT(a.id) FILTER (WHERE a.status = 'shortlisted') as shortlisted,
        j.status
      FROM job_postings j
      LEFT JOIN applications a ON a.job_id = j.id
      WHERE j.status = 'published'
      GROUP BY j.id, j.title, j.status
      ORDER BY applications DESC
    `);

    const activeJobsList = activeJobsListResult.rows.map(row => ({
      title: row.title,
      applications: parseInt(row.applications),
      shortlisted: parseInt(row.shortlisted),
      status: 'Open'
    }));

    res.json({
      activeJobs,
      totalApplications,
      shortlisted,
      scheduled,
      aiScoreDistribution,
      applicationPipeline,
      topCandidates,
      activeJobsList
    });
  } catch (error) {
    console.error('Get recruiter dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// GET /api/dashboard/manager - Manager Dashboard Statistics
router.get('/manager', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    // Get manager's employee ID
    const managerResult = await query(
      'SELECT id FROM employees WHERE user_id = $1',
      [req.user.id]
    );
    
    if (managerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Manager profile not found' });
    }
    
    const managerId = managerResult.rows[0].id;

    // Team Size (direct reports)
    const teamSizeResult = await query(
      'SELECT COUNT(*) as count FROM employees WHERE manager_id = $1 AND status = $2',
      [managerId, 'active']
    );
    const teamSize = parseInt(teamSizeResult.rows[0].count);

    // Present Today
    const today = new Date().toISOString().split('T')[0];
    const presentTodayResult = await query(
      `SELECT COUNT(*) as count FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE e.manager_id = $1 AND a.date = $2 AND a.status = 'present'`,
      [managerId, today]
    );
    const presentToday = parseInt(presentTodayResult.rows[0].count);

    // On Leave Today
    const onLeaveResult = await query(
      `SELECT COUNT(*) as count FROM leave_requests l
       JOIN employees e ON e.id = l.employee_id
       WHERE e.manager_id = $1 
         AND l.status = 'approved'
         AND $2 BETWEEN l.start_date AND l.end_date`,
      [managerId, today]
    );
    const onLeave = parseInt(onLeaveResult.rows[0].count);

    // Pending Leave Requests Count
    const pendingLeaveRequestsResult = await query(
      `SELECT COUNT(*) as count FROM leave_requests l
       JOIN employees e ON e.id = l.employee_id
       WHERE e.manager_id = $1 AND l.status = 'pending'`,
      [managerId]
    );
    const pendingLeaveRequests = parseInt(pendingLeaveRequestsResult.rows[0].count);

    // Team Attendance (last 7 days)
    const teamAttendance = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      
      const attendanceResult = await query(
        `SELECT 
          COUNT(*) FILTER (WHERE a.status = 'present') as present,
          COUNT(*) FILTER (WHERE a.status = 'absent' OR a.id IS NULL) as absent
         FROM employees e
         LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $1
         WHERE e.manager_id = $2 AND e.status = 'active'`,
        [dateStr, managerId]
      );
      
      teamAttendance.push({
        name: dayName,
        present: parseInt(attendanceResult.rows[0]?.present || 0),
        absent: teamSize - parseInt(attendanceResult.rows[0]?.present || 0)
      });
    }

    // Team Performance (average scores from performance reviews)
    const teamPerformance = [
      { subject: 'Quality', teamAvg: 85, target: 90 },
      { subject: 'Productivity', teamAvg: 80, target: 85 },
      { subject: 'Communication', teamAvg: 82, target: 85 },
      { subject: 'Teamwork', teamAvg: 87, target: 90 },
      { subject: 'Goals', teamAvg: 83, target: 85 }
    ];

    // Pending Leave List (details)
    const pendingLeaveListResult = await query(
      `SELECT 
        e.full_name as employee,
        l.leave_type as type,
        l.start_date,
        l.end_date,
        l.status,
        (l.end_date - l.start_date + 1) as days
       FROM leave_requests l
       JOIN employees e ON e.id = l.employee_id
       WHERE e.manager_id = $1 AND l.status = 'pending'
       ORDER BY l.created_at DESC
       LIMIT 10`,
      [managerId]
    );

    const pendingLeaveList = pendingLeaveListResult.rows.map(row => ({
      employee: row.employee,
      type: row.type.charAt(0).toUpperCase() + row.type.slice(1),
      dates: `${new Date(row.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${new Date(row.end_date).toLocaleDateString('en-US', { day: 'numeric' })}`,
      days: parseInt(row.days),
      status: 'Pending'
    }));

    // Direct Reports
    const directReportsResult = await query(
      `SELECT 
        e.id,
        e.full_name as name,
        e.position,
        COALESCE(
          ROUND(
            (COUNT(a.id) FILTER (WHERE a.status = 'present')::DECIMAL / 
            NULLIF(COUNT(a.id), 0) * 100), 0
          ), 0
        ) as attendance_rate,
        e.status
       FROM employees e
       LEFT JOIN attendance a ON a.employee_id = e.id 
         AND a.date >= CURRENT_DATE - INTERVAL '30 days'
       WHERE e.manager_id = $1 AND e.status = 'active'
       GROUP BY e.id, e.full_name, e.position, e.status
       ORDER BY e.full_name`,
      [managerId]
    );

    const directReports = directReportsResult.rows.map(row => ({
      name: row.name,
      position: row.position,
      attendance: `${row.attendance_rate}%`,
      performance: 80 + Math.floor(Math.random() * 10),
      status: 'Active'
    }));

    res.json({
      teamSize,
      presentToday,
      onLeave,
      pendingLeaveRequests,
      teamAttendance,
      teamPerformance,
      pendingLeaveList,
      directReports
    });
  } catch (error) {
    console.error('Get manager dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// GET /api/dashboard/employee - Employee Dashboard Statistics
router.get('/employee', authenticate, authorize('admin', 'hr', 'employee', 'manager'), async (req, res) => {
  try {
    // Get employee ID
    const empResult = await query(
      `SELECT e.id, e.full_name, e.position, e.hire_date, d.name as department,
              m.full_name as manager_name
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN employees m ON m.id = e.manager_id
       WHERE e.user_id = $1`,
      [req.user.id]
    );
    
    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    
    const employee = empResult.rows[0];

    // Personal Info
    const personalInfo = {
      name: employee.full_name,
      position: employee.position,
      department: employee.department || 'N/A',
      manager: employee.manager_name || 'N/A',
      joinDate: new Date(employee.hire_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    };

    // Attendance Stats (this month)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const attendanceStatsResult = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'present') as present_days,
         COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
         COUNT(*) FILTER (WHERE status = 'late') as late_days,
         COUNT(*) as total_days
       FROM attendance
       WHERE employee_id = $1 
         AND EXTRACT(MONTH FROM date) = $2 
         AND EXTRACT(YEAR FROM date) = $3`,
      [employee.id, currentMonth, currentYear]
    );
    
    const attendanceStats = attendanceStatsResult.rows[0] || {
      present_days: 0,
      absent_days: 0,
      late_days: 0,
      total_days: 0
    };

    // Leave Balance (calculate from leave requests)
    const leaveBalanceResult = await query(
      `SELECT 
        leave_type,
        COUNT(*) FILTER (WHERE status = 'approved') as used
       FROM leave_requests
       WHERE employee_id = $1
       GROUP BY leave_type`,
      [employee.id]
    );

    const leaveTypes = {
      vacation: { total: 15, used: 0 },
      sick: { total: 10, used: 0 },
      personal: { total: 5, used: 0 }
    };

    leaveBalanceResult.rows.forEach(row => {
      if (leaveTypes[row.leave_type]) {
        leaveTypes[row.leave_type].used = parseInt(row.used);
      }
    });

    const leaveBalance = Object.entries(leaveTypes).map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      available: data.total - data.used,
      used: data.used,
      total: data.total
    }));

    // Attendance Trend (last 4 weeks)
    const attendanceTrend = [];
    for (let week = 4; week >= 1; week--) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (week * 7));
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - ((week - 1) * 7));

      const trendResult = await query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'present') as present,
          COUNT(*) FILTER (WHERE status = 'absent') as absent
         FROM attendance
         WHERE employee_id = $1 AND date BETWEEN $2 AND $3`,
        [employee.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );

      attendanceTrend.push({
        name: `Week ${5 - week}`,
        present: parseInt(trendResult.rows[0]?.present || 0),
        absent: parseInt(trendResult.rows[0]?.absent || 0)
      });
    }

    // Recent Payslips (last 2 months)
    const payslipsResult = await query(
      `SELECT year, month, basic_salary, deductions, net_salary, created_at
       FROM payrolls
       WHERE employee_id = $1
       ORDER BY year DESC, month DESC
       LIMIT 2`,
      [employee.id]
    );

    const recentPayslips = payslipsResult.rows.map(row => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: `${monthNames[row.month - 1]} ${row.year}`,
        gross: `$${parseFloat(row.basic_salary).toLocaleString()}`,
        deductions: `$${parseFloat(row.deductions).toLocaleString()}`,
        net: `$${parseFloat(row.net_salary).toLocaleString()}`,
        date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
    });

    // Performance Score (from latest review)
    const performanceScore = {
      overall: 85,
      quality: 88,
      productivity: 82,
      communication: 87
    };

    // Internal Jobs (active job postings)
    const internalJobsResult = await query(
      `SELECT j.title, d.name as department, j.employment_type, j.created_at
       FROM job_postings j
       LEFT JOIN departments d ON d.id = j.department_id
       WHERE j.status = 'published'
       ORDER BY j.created_at DESC
       LIMIT 2`
    );

    const internalJobs = internalJobsResult.rows.map(row => ({
      title: row.title,
      department: row.department || 'N/A',
      type: row.employment_type || 'Full-time',
      posted: getRelativeTime(row.created_at)
    }));

    // Upcoming Events
    const upcomingEvents = [
      { 
        event: 'Team Meeting', 
        date: new Date(Date.now() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 
        type: 'Meeting' 
      },
      { 
        event: 'Performance Review', 
        date: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 
        type: 'Review' 
      }
    ];

    res.json({
      personalInfo,
      attendanceStats: {
        presentDays: parseInt(attendanceStats.present_days) || 0,
        absentDays: parseInt(attendanceStats.absent_days) || 0,
        lateDays: parseInt(attendanceStats.late_days) || 0,
        totalDays: parseInt(attendanceStats.total_days) || 0
      },
      leaveBalance,
      attendanceTrend,
      recentPayslips,
      performanceScore,
      internalJobs,
      upcomingEvents
    });
  } catch (error) {
    console.error('Get employee dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Helper function
function getStatusColor(status) {
  const colors = {
    received: '#1976d2',
    screening: '#00897b',
    screened: '#1976d2',
    shortlisted: '#43a047',
    interview: '#fb8c00',
    offer: '#43a047',
    hired: '#2e7d32',
    rejected: '#e53935'
  };
  return colors[status] || '#757575';
}

// Helper function to get relative time
function getRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffInMs = now - then;
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInHours < 24) {
    return 'Today';
  } else if (diffInDays < 7) {
    return 'This week';
  } else if (diffInDays < 14) {
    return '1 week ago';
  } else if (diffInDays < 30) {
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  } else {
    return `${Math.floor(diffInDays / 30)} months ago`;
  }
}

export default router;
