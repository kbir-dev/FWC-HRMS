# 🚀 AI-Powered HRMS (Human Resource Management System)

A comprehensive, modern HRMS with AI-powered resume screening, real-time dashboards, and complete HR workflow automation.

## ✨ Features

- 🤖 **AI Resume Screening** - Automatic candidate evaluation using embeddings
- 📊 **Role-Based Dashboards** - Custom views for Admin, HR, Manager, Recruiter, Employee
- 💼 **Complete HR Workflows** - Recruitment, Attendance, Payroll, Performance, Leave
- 🎨 **Modern UI** - Material-UI with dark mode support
- 🔐 **Secure Authentication** - JWT-based with role-based access control
- 📈 **Real-time Updates** - Live dashboard statistics
- 💬 **AI Chat** - Interview assistant and HR support

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API
- **PostgreSQL** + **pgvector** - Database with vector embeddings
- **Redis** - Caching and sessions
- **BullMQ** - Background job processing
- **Socket.io** - Real-time communication
- **JWT** - Authentication

### Frontend
- **React** + **Vite** - Modern UI framework
- **Material-UI (MUI)** - Component library
- **TanStack Query** - Data fetching
- **Recharts** - Data visualization
- **React Router** - Navigation

---

## 📋 Prerequisites

Install these before starting:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/

2. **PostgreSQL** (v14 or higher)
   - Download: https://www.postgresql.org/download/

3. **Redis** (v6 or higher)
   - Windows: https://github.com/microsoftarchive/redis/releases
   - Or use Docker: `docker run -d -p 6379:6379 redis`

4. **Git**
   - Download: https://git-scm.com/

---

## 🚀 Quick Start (Setup in 5 Minutes)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd Hackathon
```

### Step 2: Setup Environment Variables

#### Backend `.env` file:
Create `backend/.env` file:
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/hrms

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-this

# Server
PORT=5000
NODE_ENV=development

# AI (Optional - for resume screening)
GEMINI_API_KEY=your-gemini-api-key
OPENROUTER_API_KEY=your-openrouter-key

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### Frontend `.env` file:
Create `frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000
```

### Step 3: Install Dependencies

```bash
# Install root dependencies (if any)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Setup Database

```bash
# Go to backend folder
cd backend

# Create database (in PostgreSQL)
# Option 1: Using psql command line
psql -U postgres
CREATE DATABASE hrms;
\q

# Option 2: Use pgAdmin GUI to create database named 'hrms'

# Run migrations (creates tables)
npm run migrate

# Seed demo data (adds sample users, employees, etc.)
npm run seed
```

**You'll see:**
```
✓ Database seeded successfully!

Created:
- 6 users (admin, hr, recruiter, manager, 2 employees)
- 6 employees
- 2 job postings
- 10 applications with AI scores
- 5 scheduled interviews
- 3 performance reviews
- 12-18 leave requests
- ~120 attendance records
- 6 payroll records

Default password for all users: password123
```

### Step 5: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Screening Worker (Optional):**
```bash
cd backend
node workers/screeningWorker.js
```

### Step 6: Open in Browser

Navigate to: **http://localhost:5173**

---

## 👥 Demo Login Credentials

All users have password: **`password123`**

| Role | Email | Access |
|------|-------|--------|
| **Admin** | `admin@hrms.com` | Full system access |
| **HR Manager** | `hr.manager@hrms.com` | HR operations, recruitment |
| **Recruiter** | `recruiter@hrms.com` | Jobs and applications |
| **Manager** | `manager@hrms.com` | Team management |
| **Employee** | `employee1@hrms.com` | Personal dashboard |
| **Employee** | `employee2@hrms.com` | Personal dashboard |

---

## 📂 Project Structure

```
Hackathon/
├── backend/
│   ├── config/          # Configuration files
│   ├── db/              # Database migrations and seeds
│   ├── middleware/      # Auth, validation middleware
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic (AI, email, etc.)
│   ├── utils/           # Helpers (JWT, Redis, audit)
│   ├── workers/         # Background jobs
│   └── server.js        # Main server file
│
├── frontend/
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth, Theme)
│   │   └── App.jsx      # Main app component
│   └── index.html
│
└── README.md            # This file
```

---

## 🎯 Available Scripts

### Backend

```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run seed         # Seed demo data
```

### Frontend

```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 📊 Features Overview

### For HR/Admin
- ✅ Employee management
- ✅ AI-powered recruitment
- ✅ Attendance tracking
- ✅ Payroll processing
- ✅ Performance reviews
- ✅ Leave management
- ✅ Real-time dashboards

### For Managers
- ✅ Team overview
- ✅ Attendance monitoring
- ✅ Leave approvals
- ✅ Performance reviews

### For Employees
- ✅ Personal dashboard
- ✅ Attendance tracking
- ✅ Leave requests
- ✅ Payslip viewing
- ✅ Internal job applications

### For Recruiters
- ✅ Job posting management
- ✅ Application tracking
- ✅ AI candidate screening
- ✅ Interview scheduling

---

## 🤖 AI Features

### Resume Screening
- Automatic resume parsing
- Semantic similarity matching
- Skill extraction and matching
- Experience evaluation
- Auto-scoring (0-100%)
- Auto-shortlisting (score ≥ 70%)

### AI Chat
- Interview preparation assistance
- HR policy queries
- Real-time support

---

## 🗄️ Database Schema

See **DATABASE_DATA.md** for complete data overview.

**Main Tables:**
- `users` - Authentication
- `employees` - Employee records
- `departments` - Organization structure
- `job_postings` - Job openings
- `applications` - Candidate applications (with AI scores)
- `interviews` - Interview schedules
- `attendance` - Daily attendance
- `payrolls` - Salary records
- `performance_reviews` - Performance evaluations
- `leave_requests` - Leave applications

---

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
# Windows: Check Services or Task Manager

# Verify database exists
psql -U postgres -l

# Create if missing
psql -U postgres
CREATE DATABASE hrms;
```

### Redis Connection Error
```bash
# Check Redis is running
# Windows: Check Task Manager

# Or start with Docker
docker run -d -p 6379:6379 redis
```

### Port Already in Use
```bash
# Backend (5000)
# Kill process on port 5000 or change PORT in .env

# Frontend (5173)
# Vite will auto-assign next available port
```

### Module Not Found
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🔐 Security Notes

**⚠️ IMPORTANT for Production:**

1. **Change all default passwords**
2. **Update JWT secrets** in `.env`
3. **Configure proper CORS** in backend config
4. **Enable HTTPS**
5. **Set strong database password**
6. **Add rate limiting** (already configured)
7. **Enable audit logging** (already configured)

---

## 📝 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Main Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Dashboard
- `GET /api/dashboard/hr` - HR dashboard stats
- `GET /api/dashboard/admin` - Admin dashboard stats
- `GET /api/dashboard/manager` - Manager dashboard stats
- `GET /api/dashboard/employee` - Employee dashboard stats
- `GET /api/dashboard/recruiter` - Recruiter dashboard stats

#### Jobs & Applications
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `POST /api/jobs/:id/apply` - Apply to job
- `GET /api/applications` - List applications
- `GET /api/applications/:id` - Get application details

#### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee

#### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out

#### Payroll
- `GET /api/payroll` - List payroll
- `POST /api/payroll/process` - Process payroll

#### Leave
- `GET /api/leave` - List leave requests
- `POST /api/leave` - Create leave request
- `PUT /api/leave/:id/approve` - Approve/reject leave

---

## 🎨 Customization

### Change Theme Colors
Edit `frontend/src/context/ThemeContext.jsx`

### Add New Dashboard Widget
1. Create component in `frontend/src/components/dashboard/`
2. Add to respective dashboard in `frontend/src/pages/dashboards/`

### Add New API Endpoint
1. Create route file in `backend/routes/`
2. Register in `backend/server.js`

---

## 📄 License

MIT License - Feel free to use for personal or commercial projects

---

## 👨‍💻 Support

For issues or questions:
1. Check **DATABASE_DATA.md** for data overview
2. Review troubleshooting section above
3. Check console logs for errors

---

## 🎉 Quick Test Checklist

After setup, verify everything works:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can login with `hr.manager@hrms.com` / `password123`
- [ ] Dashboard shows 6 employees, 10 applications
- [ ] Can view AI-shortlisted candidates
- [ ] Can schedule interview
- [ ] Can approve/reject leave
- [ ] Dark mode toggle works
- [ ] All navigation links work

---

**🚀 Ready to use! Login and explore the full-featured HRMS system!**
