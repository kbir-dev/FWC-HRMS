# Complete Backend Requirements - All Dashboard Functionality

## Current Status: INCOMPLETE ❌
**Most dashboards are returning mock data from frontend when backend fails!**

---

## 1. ADMIN DASHBOARD (`/api/dashboard/admin`)

### Current Backend (Partial) ✅
```javascript
{
  totalUsers: number,
  totalEmployees: number,
  totalDepartments: number,
  activeJobs: number,
  pendingApplications: number,
  departmentDistribution: [{name, value}],
  recruitmentFunnel: [{name, count}]
}
```

### MISSING FROM BACKEND ❌
```javascript
{
  userActivity: [
    { name: 'Mon', logins: 42, active: 38 },
    // For last 7 days - need to track user logins!
  ],
  recentActivities: [
    {
      type: 'user'|'job'|'application',
      title: string,
      description: string,
      time: string,
      badge?: string
    }
  ]
}
```

**Required New Tables/Features:**
- User login tracking table
- Activity log table for system events
- Real-time activity feed

---

## 2. HR DASHBOARD (`/api/dashboard/hr`)

### Current Backend (Partial) ✅
```javascript
{
  totalEmployees: number,
  newHires: number,
  pendingLeave: number,
  totalApplications: number,
  applicationsByStatus: [{name, count}]
}
```

### MISSING FROM BACKEND ❌
```javascript
{
  headcountTrend: [
    { name: 'Jan', count: 128 },
    // Monthly employee count trend
  ],
  upcomingInterviews: [
    {
      candidate: string,
      position: string,
      date: date,
      time: string,
      status: string
    }
  ],
  pendingLeaveRequests: [
    {
      employee: string,
      type: string,
      dates: string,
      days: number,
      status: string
    }
  ]
}
```

**Required Endpoints:**
- `GET /api/dashboard/hr/headcount-trend` - Monthly employee growth
- `GET /api/dashboard/hr/upcoming-interviews` - Next 7 days interviews
- `GET /api/dashboard/hr/pending-leave` - Leave requests awaiting approval

---

## 3. RECRUITER DASHBOARD (`/api/dashboard/recruiter`)

### Current Backend (Partial) ✅
```javascript
{
  activeJobs: number,
  totalApplications: number,
  shortlisted: number,
  scheduled: number,
  aiScoreDistribution: [{name, count}],
  applicationPipeline: [{status, count}]
}
```

### MISSING FROM BACKEND ❌
```javascript
{
  topCandidates: [
    {
      name: string,
      position: string,
      score: number,
      status: string,
      applied: string
    }
  ],
  activeJobsList: [
    {
      title: string,
      applications: number,
      shortlisted: number,
      status: string
    }
  ]
}
```

**Required Endpoints:**
- `GET /api/dashboard/recruiter/top-candidates` - Top 10 by AI score
- `GET /api/dashboard/recruiter/active-jobs` - Jobs with application stats

---

## 4. MANAGER DASHBOARD (`/api/dashboard/manager`)

### Current Backend (Mock Data Only) ❌
```javascript
{
  teamSize: 0,
  presentToday: 0,
  onLeave: 0,
  pendingLeaveRequests: 0
}
```

### COMPLETELY MISSING ❌
```javascript
{
  teamSize: number,
  presentToday: number,
  onLeave: number,
  pendingLeaveRequests: number,
  teamAttendance: [
    { name: 'Mon', present: number, absent: number }
    // Last 7 days
  ],
  teamPerformance: [
    { subject: string, teamAvg: number, target: number }
  ],
  pendingLeaveList: [
    {
      employee: string,
      type: string,
      dates: string,
      days: number,
      status: string
    }
  ],
  directReports: [
    {
      name: string,
      position: string,
      attendance: string,
      performance: number,
      status: string
    }
  ]
}
```

**Required Database Changes:**
- Add `manager_id` to `employees` table
- Track manager-employee relationships

**Required Endpoints:**
- `GET /api/dashboard/manager/team-stats`
- `GET /api/dashboard/manager/team-attendance`
- `GET /api/dashboard/manager/team-performance`
- `GET /api/dashboard/manager/pending-leave`
- `GET /api/dashboard/manager/direct-reports`

---

## 5. EMPLOYEE DASHBOARD (`/api/dashboard/employee`)

### Current Backend (Very Partial) ❌
```javascript
{
  personalInfo: {
    name: string,
    position: string,
    department: string
  },
  attendanceStats: {
    presentDays: number,
    absentDays: number,
    lateDays: number,
    totalDays: number
  }
}
```

### MISSING FROM BACKEND ❌
```javascript
{
  personalInfo: {
    name, position, department,
    manager: string,      // ❌ Missing
    joinDate: string      // ❌ Missing
  },
  leaveBalance: [
    {
      type: string,
      available: number,
      used: number,
      total: number
    }
  ],
  attendanceTrend: [
    { name: 'Week 1', present: number, absent: number }
    // Last 4 weeks
  ],
  recentPayslips: [
    {
      month: string,
      gross: string,
      deductions: string,
      net: string,
      date: string
    }
  ],
  performanceScore: {
    overall: number,
    quality: number,
    productivity: number,
    communication: number
  },
  internalJobs: [
    {
      title: string,
      department: string,
      type: string,
      posted: string
    }
  ],
  upcomingEvents: [
    {
      event: string,
      date: string,
      type: 'Meeting'|'Holiday'|'Review'
    }
  ]
}
```

**Required Endpoints:**
- `GET /api/dashboard/employee/leave-balance`
- `GET /api/dashboard/employee/attendance-trend`
- `GET /api/dashboard/employee/payslips`
- `GET /api/dashboard/employee/performance`
- `GET /api/dashboard/employee/internal-jobs`
- `GET /api/dashboard/employee/upcoming-events`

---

## SUMMARY OF MISSING BACKEND WORK

### New Tables Needed:
1. **user_login_logs** - Track user logins for activity charts
2. **system_activity_log** - Log all important system events
3. **company_events** - Holidays, meetings, events
4. Manager-employee relationship (add `manager_id` to employees)

### Missing API Endpoints (Count: 15+):
1. ✅ `/api/dashboard/admin` - Partially done
2. ❌ `/api/dashboard/admin/user-activity` - NEW
3. ❌ `/api/dashboard/admin/recent-activities` - NEW
4. ✅ `/api/dashboard/hr` - Partially done
5. ❌ `/api/dashboard/hr/headcount-trend` - NEW
6. ❌ `/api/dashboard/hr/upcoming-interviews` - NEW
7. ❌ `/api/dashboard/hr/pending-leave` - NEW
8. ✅ `/api/dashboard/recruiter` - Partially done
9. ❌ `/api/dashboard/recruiter/top-candidates` - NEW
10. ❌ `/api/dashboard/recruiter/active-jobs` - NEW
11. ❌ `/api/dashboard/manager` - COMPLETELY NEW
12. ❌ `/api/dashboard/manager/team-stats` - NEW
13. ❌ `/api/dashboard/manager/team-attendance` - NEW
14. ❌ `/api/dashboard/manager/team-performance` - NEW
15. ❌ `/api/dashboard/manager/direct-reports` - NEW
16. ✅ `/api/dashboard/employee` - Partially done
17. ❌ `/api/dashboard/employee/leave-balance` - NEW
18. ❌ `/api/dashboard/employee/attendance-trend` - NEW
19. ❌ `/api/dashboard/employee/payslips` - NEW
20. ❌ `/api/dashboard/employee/performance` - NEW
21. ❌ `/api/dashboard/employee/internal-jobs` - NEW
22. ❌ `/api/dashboard/employee/upcoming-events` - NEW

### Additional Missing Features:
- User login tracking
- Activity feed system
- Manager hierarchy
- Internal job posting visibility
- Company events calendar
- Weekly/monthly trend calculations
- Performance scoring system
- Payslip generation

---

## PRIORITY ORDER

### HIGH PRIORITY (Core functionality):
1. Manager Dashboard - COMPLETELY implement
2. Employee Dashboard - Complete missing parts
3. HR Dashboard - Add interview and leave tables
4. Recruiter Dashboard - Add candidate and job lists

### MEDIUM PRIORITY (Enhanced analytics):
5. Admin Dashboard - User activity tracking
6. All trend/chart data endpoints

### LOW PRIORITY (Nice to have):
7. Activity feed system
8. Events calendar

---

## ESTIMATED WORK

**Total Missing Endpoints:** ~20  
**New Database Tables:** 3-4  
**Database Migrations:** 2-3  
**Estimated Time:** 4-6 hours of focused work

**Current Completion:** ~30%  
**Target:** 100%

---

## NEXT STEPS

1. ✅ Create comprehensive requirements document (THIS FILE)
2. ⏳ Implement Manager Dashboard backend (HIGHEST PRIORITY)
3. ⏳ Complete Employee Dashboard backend
4. ⏳ Add missing HR Dashboard features
5. ⏳ Add missing Recruiter Dashboard features
6. ⏳ Enhance Admin Dashboard
7. ⏳ Test all endpoints thoroughly


