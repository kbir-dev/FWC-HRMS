# Database Data Overview

## 📊 Complete Database Data after Seeding

### 👥 Users (6 Total)

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `admin@hrms.com` | `password123` | admin | Full system access |
| `hr.manager@hrms.com` | `password123` | hr | HR operations |
| `recruiter@hrms.com` | `password123` | recruiter | Recruitment only |
| `manager@hrms.com` | `password123` | manager | Team management |
| `employee1@hrms.com` | `password123` | employee | Regular employee |
| `employee2@hrms.com` | `password123` | employee | Regular employee |

---

### 👔 Employees (6 Total)

| Code | Name | Position | Department | Manager | Salary |
|------|------|----------|------------|---------|--------|
| EMP001 | Admin User | System Administrator | Human Resources | - | $120,000 |
| EMP002 | HR Manager | Human Resources Manager | Human Resources | - | $95,000 |
| EMP003 | Jane Recruiter | Senior Recruiter | Human Resources | - | $75,000 |
| EMP004 | Tech Manager | Engineering Manager | Engineering | - | $130,000 |
| EMP005 | Alice Developer | Senior Software Engineer | Engineering | Tech Manager | $110,000 |
| EMP006 | Bob Developer | Software Engineer | Engineering | Tech Manager | $90,000 |

**Team Hierarchy:**
- Tech Manager manages: Alice Developer, Bob Developer

---

### 🏢 Departments (6 Total)

1. Engineering - Software development and technical operations
2. Human Resources - Talent management and employee relations
3. Sales - Business development and customer acquisition
4. Marketing - Brand management and growth
5. Finance - Financial planning and accounting
6. Operations - Business operations and logistics

---

### 💼 Job Postings (2 Active)

#### 1. Senior Full Stack Engineer
- **Department:** Engineering
- **Hiring Manager:** Tech Manager
- **Experience Level:** Senior (5+ years)
- **Status:** Published
- **Required Skills:** React, Node.js, PostgreSQL, AWS, Docker, Kubernetes, TypeScript

#### 2. Full Stack Developer
- **Department:** Engineering
- **Hiring Manager:** Tech Manager
- **Experience Level:** Mid (3+ years)
- **Status:** Published
- **Required Skills:** React, Node.js, PostgreSQL, JavaScript, Git, REST APIs

---

### 📝 Applications (10 Total with AI Screening)

| Candidate | Experience | Email | AI Score | Status |
|-----------|------------|-------|----------|--------|
| John Smith | 7.5 years | john.smith@example.com | 85-95% | Shortlisted |
| Sarah Johnson | 5 years | sarah.johnson@example.com | 75-85% | Shortlisted |
| Michael Chen | 3 years | michael.chen@example.com | 65-75% | Screened |
| Emily Rodriguez | 8.5 years | emily.rodriguez@example.com | 90-98% | Shortlisted |
| David Park | 1.5 years | david.park@example.com | 45-55% | Rejected |
| Lisa Thompson | 10.5 years | lisa.thompson@example.com | 92-99% | Shortlisted |
| James Wilson | 4 years | james.wilson@example.com | 70-80% | Shortlisted |
| Maria Garcia | 6 years | maria.garcia@example.com | 78-88% | Shortlisted |
| Robert Anderson | 5 years | robert.anderson@example.com | 72-82% | Shortlisted |
| Amanda White | 4 years | amanda.white@example.com | 68-78% | Screened |

**AI Screening Details:**
- Automatically scored using resume embeddings
- Skills matched against job requirements
- Experience level evaluated
- Top candidates (70%+) auto-shortlisted

---

### 🎤 Scheduled Interviews (5 Total)

| Candidate | Position | Date | Time | Type | Location | Status |
|-----------|----------|------|------|------|----------|--------|
| John Smith | Senior Full Stack Engineer | Tomorrow | 10:00 AM | Technical | Conference Room A | Scheduled |
| Emily Rodriguez | Senior Full Stack Engineer | +2 days | 12:00 PM | HR | Online (Meet Link) | Scheduled |
| Lisa Thompson | Senior Full Stack Engineer | +3 days | 2:00 PM | Technical | Conference Room A | Scheduled |
| James Wilson | Full Stack Developer | +4 days | 4:00 PM | HR | Online (Meet Link) | Scheduled |
| Maria Garcia | Full Stack Developer | +5 days | 6:00 PM | Technical | Conference Room A | Scheduled |

**Interview Details:**
- Duration: 60 minutes each
- Interviewers: Tech Manager team
- Mix of Technical and HR rounds
- Online interviews have meeting links

---

### ⭐ Performance Reviews (3 Total)

#### Review 1: Alice Developer
- **Reviewer:** Tech Manager
- **Period:** Last 6 months
- **Overall Score:** 85-90/100
- **Scores:**
  - Technical: 88
  - Communication: 82
  - Teamwork: 87
  - Leadership: 80
- **Strengths:** Excellent technical skills and great team player
- **Areas for Improvement:** Time management and documentation
- **Goals:** Complete advanced certification, mentor junior developers
- **Status:** Reviewed

#### Review 2: Bob Developer
- **Reviewer:** Tech Manager
- **Period:** Last 6 months
- **Overall Score:** 75-85/100
- **Scores:**
  - Technical: 80
  - Communication: 75
  - Teamwork: 82
  - Leadership: 72
- **Status:** Reviewed

#### Review 3: Tech Manager (Self-Review)
- **Reviewer:** Tech Manager
- **Period:** Last 6 months
- **Overall Score:** 88-95/100
- **Status:** Reviewed

---

### 🏖️ Leave Requests (12-18 Total)

**Distribution:**
- **Pending:** 4-6 requests (awaiting manager approval)
- **Approved:** 4-6 requests (manager approved)
- **Rejected:** 4-6 requests (insufficient balance)

**Leave Types:**
- Sick Leave: "Feeling unwell"
- Vacation: "Family vacation"
- Personal: "Personal matters"

**Duration:** 1-5 days per request
**Date Range:** Past 30 days to Future 30 days

**Example Pending Requests:**
```
Employee: Alice Developer
Type: Vacation
Dates: Nov 1-5, 2024 (5 days)
Status: Pending
Reason: Family vacation
```

---

### 📅 Attendance Records (~120 Total)

**Coverage:**
- All 6 employees
- Last 30 working days (excluding weekends)
- ~20 records per employee

**Sample Record:**
```
Employee: Alice Developer
Date: Oct 30, 2024
Check In: 9:15 AM
Check Out: 6:30 PM
Work Hours: 9.25 hours
Status: Present
Source: Biometric
```

**Statistics:**
- Average Attendance: 95%+
- On-time arrivals: 90%+
- Full days worked: 18-20 per month

---

### 💰 Payroll Records (6 Total - Last Month)

| Employee | Base Salary | Allowances | Deductions | Tax (20%) | Net Salary |
|----------|-------------|------------|------------|-----------|------------|
| Admin User | $120,000 | $18,000 | $14,400 | $27,600 | $96,000 |
| HR Manager | $95,000 | $14,250 | $11,400 | $21,850 | $76,000 |
| Jane Recruiter | $75,000 | $11,250 | $9,000 | $17,250 | $60,000 |
| Tech Manager | $130,000 | $19,500 | $15,600 | $30,780 | $103,120 |
| Alice Developer | $110,000 | $16,500 | $13,200 | $25,300 | $87,700 |
| Bob Developer | $90,000 | $13,500 | $10,800 | $20,700 | $71,700 |

**Calculation Formula:**
- Allowances = Base Salary × 15%
- Deductions = Base Salary × 12%
- Gross Salary = Base Salary + Allowances
- Tax = Gross Salary × 20%
- Net Salary = Gross Salary - Tax - Deductions

**Allowances Breakdown:**
- HRA: 50%
- Transport: 30%
- Other: 20%

**Deductions Breakdown:**
- Provident Fund: 60%
- Insurance: 40%

---

### 📊 Roles & Permissions (5 Total)

1. **System Administrator**
   - Permissions: All access

2. **HR Manager**
   - Permissions: Employees (full), Payroll (full), Recruitment (full)

3. **Department Manager**
   - Permissions: Employees (view), Attendance (full), Performance (full)

4. **HR Recruiter**
   - Permissions: Recruitment (full), Applications (full)

5. **Employee**
   - Permissions: Self data (view)

---

## 📈 Data Statistics Summary

```
Total Records Created:

👥 Users & Access
- Users: 6
- Roles: 5
- Employees: 6
- Departments: 6

💼 Recruitment
- Job Postings: 2
- Applications: 10 (with AI-scored resumes)
- Interviews: 5 (scheduled)

📊 HR Management
- Performance Reviews: 3
- Leave Requests: 12-18
- Attendance Records: ~120

💰 Finance
- Payroll Records: 6

🔐 Security
- All passwords: password123 (demo only)
- JWT-based authentication
- Role-based access control
```

---

## 🎯 Data Relationships

```
Users (6)
  ↓
Employees (6)
  ↓
  ├─→ Attendance Records (~120)
  ├─→ Leave Requests (12-18)
  ├─→ Performance Reviews (3)
  ├─→ Payroll Records (6)
  └─→ Manager Relationships (Tech Manager → 2 reports)

Job Postings (2)
  ↓
Applications (10)
  ↓
Interviews (5)
```

---

## 🔄 Auto-Generated Data

**AI Screening:**
- Resume embeddings automatically generated
- Similarity scores calculated
- Skills matched
- Auto-status assignment (shortlisted/screened/rejected)

**Attendance:**
- Random but realistic check-in/out times
- Calculated work hours
- Weekends excluded
- 95%+ attendance rate

**Leave Requests:**
- Random distribution of types
- Mixed statuses (pending/approved/rejected)
- Realistic date ranges
- Proper approval workflow

---

## 📈 Dashboard Data by Role

Each role sees different data on their dashboard based on their permissions and responsibilities:

### 👨‍💼 Admin Dashboard
**Login:** `admin@hrms.com`

**Key Metrics:**
- **Total Users:** 6
- **Total Employees:** 6
- **Total Departments:** 6
- **Active Jobs:** 2
- **Pending Applications:** 10

**Charts & Visualizations:**
- **User Activity (Weekly):**
  - Mon-Fri: 5-6 active users daily
  - Weekends: No activity
  
- **Recruitment Funnel:**
  - Applied: 10 candidates
  - Screened: 9 candidates
  - Interview: 5 scheduled
  - Shortlisted: 7 candidates
  
- **Department Distribution:**
  - Engineering: 3 employees
  - Human Resources: 3 employees
  - Other departments: 0 employees (setup ready)

**Recent Activities:**
- 10 new applications with AI screening
- 2 active job postings
- 5 interviews scheduled

---

### 👥 HR Dashboard
**Login:** `hr.manager@hrms.com`

**Key Metrics:**
- **Total Employees:** 6
- **New Hires (This Month):** 2
- **Pending Leave Requests:** 5-8 (varies)
- **Total Applications:** 10

**Upcoming Interviews (Next 5):**
1. John Smith - Senior Full Stack Engineer - Tomorrow 10:00 AM
2. Emily Rodriguez - Senior Full Stack Engineer - Day after 12:00 PM
3. Lisa Thompson - Senior Full Stack Engineer - 3 days 2:00 PM
4. James Wilson - Full Stack Developer - 4 days 4:00 PM
5. Maria Garcia - Full Stack Developer - 5 days 6:00 PM

**Pending Leave Requests:**
- Alice Developer: Vacation (Nov 1-3, 3 days)
- Bob Developer: Sick Leave (Nov 5, 1 day)
- Tech Manager: Personal (Nov 8-10, 3 days)

**Charts:**
- **Headcount Trend:** Growing from 4 (May) to 6 (Oct)
- **Applications by Status:**
  - Shortlisted: 7
  - Screened: 2
  - Rejected: 1

---

### 🎯 Recruiter Dashboard
**Login:** `recruiter@hrms.com`

**Key Metrics:**
- **Active Jobs:** 2
- **Total Applications:** 10
- **Shortlisted Candidates:** 7
- **Scheduled Interviews:** 5

**AI Score Distribution:**
- 90-100: 3 candidates (Excellent)
- 80-89: 2 candidates (Very Good)
- 70-79: 2 candidates (Good)
- 60-69: 2 candidates (Fair)
- <60: 1 candidate (Needs Review)

**Application Pipeline:**
- Shortlisted: 7 candidates
- Screened: 2 candidates
- Rejected: 1 candidate

**Top Candidates (By AI Score):**
1. **John Smith** - Senior Full Stack Engineer (Score: 95)
2. **Emily Rodriguez** - Senior Full Stack Engineer (Score: 92)
3. **Lisa Thompson** - Senior Full Stack Engineer (Score: 88)

**Active Jobs:**
1. Senior Full Stack Engineer: 8 applications, 6 shortlisted
2. Full Stack Developer: 2 applications, 1 shortlisted

---

### 👔 Manager Dashboard
**Login:** `manager@hrms.com`

**Key Metrics:**
- **Team Size:** 2 direct reports
- **Present Today:** 2
- **On Leave Today:** 0
- **Pending Leave Requests:** 2

**Direct Reports:**
1. **Alice Developer**
   - Position: Senior Software Engineer
   - Attendance: 95%
   - Performance Score: 85
   - Status: Active
   
2. **Bob Developer**
   - Position: Software Engineer
   - Attendance: 93%
   - Performance Score: 80
   - Status: Active

**Team Attendance (Weekly):**
- Mon-Fri: 2 present, 0 absent
- Weekends: 0 present, 2 absent

**Team Performance Scores:**
- Quality: 85/90 target
- Productivity: 80/85 target
- Communication: 82/85 target
- Teamwork: 87/90 target
- Goals: 83/85 target

**Pending Leave Requests:**
- Alice Developer: Vacation (Nov 1-3, 3 days)
- Bob Developer: Sick Leave (Nov 5, 1 day)

---

### 💻 Employee Dashboard
**Login:** `employee1@hrms.com` or `employee2@hrms.com`

**Personal Information:**
- **Position:** Senior Software Engineer
- **Department:** Engineering
- **Manager:** Tech Manager
- **Join Date:** Jan 15, 2024

**Attendance Stats (Current Month):**
- Present Days: 20
- Absent Days: 0
- Late Days: 1
- Total Working Days: 21
- Attendance Rate: 95%+

**Leave Balance:**
- **Vacation:** 13 available / 15 total (2 used)
- **Sick Leave:** 8 available / 10 total (2 used)
- **Personal:** 4 available / 5 total (1 used)

**Recent Payslips:**
1. September 2024: $87,700 net (after $39,900 deductions)
2. August 2024: $87,700 net (after $39,900 deductions)

**Performance Score:**
- Overall: 85
- Quality: 88
- Productivity: 82
- Communication: 87

**Available Internal Jobs:**
- Senior Full Stack Engineer (Engineering) - This week
- Full Stack Developer (Engineering) - This week

**Upcoming Events:**
- Team Meeting - Tomorrow
- Performance Review - In 15 days

---

## ✅ What You Can Test

1. **Login as any user** (password: password123)
2. **HR Dashboard:** See 6 employees, 10 applications, 5 interviews
3. **Manager Dashboard:** See 2 team members, their attendance
4. **Employee Dashboard:** See personal attendance, leave balance
5. **Applications:** View AI-shortlisted candidates
6. **Interviews:** See scheduled interviews
7. **Leave Management:** Approve/reject pending requests
8. **Payroll:** Process/view salary records
9. **Performance:** View completed reviews

---

**All data is interconnected and realistic for a complete working demo!** 🚀

