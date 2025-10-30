# AI-Powered HRMS - Product Requirements Document

## Project Overview
An enterprise-grade Human Resource Management System with AI-powered features for recruitment, employee management, and workforce analytics.

## User Roles
1. **Admin** - Full system access and management
2. **HR Manager** - Employee lifecycle and recruitment management
3. **Recruiter** - Job postings and candidate screening
4. **Manager** - Team management and approvals
5. **Employee** - Self-service portal

## Core Features

### 1. Authentication & Authorization
- User login with email/password
- JWT-based session management
- Role-based access control (RBAC)
- Multi-role support (5 roles)
- Protected routes and API endpoints

### 2. Role-Specific Dashboards
#### Admin Dashboard
- System-wide KPIs (users, employees, departments, jobs)
- User activity trends (7-day chart)
- Recruitment funnel visualization
- Department distribution
- System activity feed

#### HR Manager Dashboard
- Employee metrics and new hires tracking
- Recruitment pipeline
- Upcoming interviews
- Pending leave requests
- Payroll summary

#### Recruiter Dashboard  
- Active jobs and applications metrics
- Application pipeline (4 stages)
- AI screening score distribution
- Top candidates ranking
- Interview scheduling

#### Manager Dashboard
- Team metrics (size, attendance, leave)
- Team attendance trends
- Team performance radar chart
- Leave approval workflow
- Direct reports management

#### Employee Dashboard
- Personal profile and information
- Attendance tracking
- Leave balance (3 types)
- Payslip access
- Performance scores
- Internal job board
- Event calendar

### 3. AI-Powered Recruitment
- Automated resume parsing (PDF, DOCX, TXT)
- Vector embeddings for semantic matching
- Multi-factor AI scoring (60% AI + 40% rules)
- Automatic candidate classification
- Background job processing
- AI chat for screening
- Voice interaction support

### 4. Employee Management
- Employee CRUD operations
- Organizational hierarchy
- Department management
- Role assignment
- Profile management

### 5. Job Postings
- Create and publish jobs
- Internal job board for employees
- Job application submission
- Application tracking
- AI-powered candidate ranking

### 6. Attendance Management
- Check-in/check-out
- Attendance tracking (present, absent, late)
- Monthly/weekly summaries
- Attendance trends

### 7. Payroll Management
- Automated payroll calculation
- Payslip generation
- Allowances and deductions
- Tax computation
- Payroll history

### 8. Performance Management
- Multi-factor reviews
- Performance scoring
- Trend analysis
- Manager reviews
- Performance visualization

### 9. Leave Management
- Leave request submission
- Approval workflow
- Leave balance tracking (annual, sick, casual)
- Leave calendar
- Manager approvals

### 10. Communication
- Email notifications
- Real-time notifications (WebSocket)
- AI chat interface
- Voice interaction

## Technical Requirements

### Frontend
- **Framework**: React 18 with Vite
- **UI Library**: Material-UI 5
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Routing**: React Router DOM
- **State**: React Query, Context API
- **Port**: 5173

### Backend
- **Framework**: Express.js
- **Runtime**: Node.js v20+
- **Database**: PostgreSQL 14+ with pgvector
- **Cache**: Redis 7+
- **Queue**: BullMQ
- **Auth**: JWT
- **Port**: 3001

### AI Integration
- Google Gemini API (primary)
- HuggingFace Inference API (fallback)
- Vector similarity search
- Natural language processing

## User Flows

### Flow 1: Employee Login and Dashboard Access
1. Navigate to login page
2. Enter credentials
3. Submit login form
4. Redirect to role-specific dashboard
5. View personalized metrics and charts

### Flow 2: Job Application (Employee)
1. Login as employee
2. Navigate to Internal Jobs
3. Browse open positions
4. Click on a job
5. Fill application form
6. Upload resume
7. Submit application
8. AI screening begins automatically

### Flow 3: Candidate Review (Recruiter)
1. Login as recruiter
2. View Recruiter Dashboard
3. See AI-scored applications
4. Click on application
5. Review AI analysis
6. Update application status
7. Schedule interview

### Flow 4: Leave Request (Employee)
1. Login as employee
2. Navigate to My Leave
3. View leave balance
4. Submit leave request
5. Wait for approval

### Flow 5: Leave Approval (Manager)
1. Login as manager
2. View Manager Dashboard
3. See pending leave requests
4. Review request details
5. Approve or reject

## Success Criteria
- All 5 dashboards render correctly for each role
- Navigation shows only role-appropriate items
- Charts and visualizations display data
- Authentication works for all roles
- AI scoring system processes applications
- Real-time notifications function
- Theme switching (light/dark) works
- Mobile responsive design
- API endpoints respond correctly
- Database queries optimize performance

## Non-Functional Requirements
- Page load time < 2 seconds
- API response time < 500ms
- Support 5000+ concurrent users
- 99.9% uptime
- WCAG AA accessibility
- Mobile-first responsive design
- Browser support: Chrome, Firefox, Safari, Edge


