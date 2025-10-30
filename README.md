# AI-Powered HR Management System (HRMS)

A comprehensive, modern HR Management System with AI-powered resume screening, real-time notifications, and role-based dashboards.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure JWT-based auth with role-based access control
- **Employee Management** - Complete employee lifecycle management with role assignment
- **Job Management** - Post, manage, and track job openings
- **AI Resume Screening** - Automated candidate evaluation using Gemini/HuggingFace AI
- **Application Tracking** - Advanced filtering, sorting, and candidate management
- **Attendance System** - Check-in/out with work hours calculation
- **Payroll Management** - Automated payroll generation with allowances and deductions
- **Leave Management** - Request, approve, and track employee leave
- **Performance Reviews** - Multi-factor performance tracking with trends
- **Real-time Notifications** - WebSocket-based instant updates
- **Conversational AI Chat** - AI-powered recruitment assistant
- **Dark/Light Theme** - Beautiful, responsive Material-UI interface

### User Roles
- **Admin** - Full system access and user role management
- **HR Manager** - Employee, payroll, and leave management
- **Recruiter** - Job postings and application management
- **Manager** - Team management and approvals
- **Employee** - Self-service portal for personal data

## 📋 Prerequisites

- **Node.js** v18+ 
- **Docker Desktop** (for PostgreSQL and Redis)
- **npm** or **yarn**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Hackathon
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 3. Start Docker Services
Make sure Docker Desktop is running, then:
```bash
docker-compose up -d postgres redis
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379

### 4. Set Up Environment Variables
Create a `.env` file in the `backend` directory (use `backend/env.example.txt` as template):
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://hrms_user:hrms_password@localhost:5432/hrms_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
CORS_ORIGIN=http://localhost:5173
```

### 5. Initialize the Database
```bash
cd backend
npm run migrate
npm run seed
cd ..
```

### 6. Start the Application

**Option A: Start Both Services Together**
```bash
npm run dev
```

**Option B: Start Services Separately**

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 👤 Default Login Credentials

After running the seed script:

**Admin Account:**
- Email: `admin@hrms.com`
- Password: `admin123`

**HR Manager:**
- Email: `hr@hrms.com`
- Password: `hr123`

**Recruiter:**
- Email: `recruiter@hrms.com`
- Password: `recruiter123`

## 🎯 Quick Start Guide

### For Admins
1. Log in with admin credentials
2. Go to **Employees** → Click on any employee → Click edit icon to assign roles (HR, Manager, etc.)
3. Manage all system features from the dashboard

### For Recruiters/HR
1. Go to **Jobs** → Click "Post New Job"
2. Fill in job details and click "Create Job"
3. Go to **Applications** to review candidates
4. Use filters to sort by AI score, date, or status
5. Click "View Details" to see full candidate profile and AI screening report

### For Employees
1. Log in with employee credentials
2. Check attendance, view payslips, request leave
3. Apply for internal job openings
4. Track performance reviews

## 🏗️ Project Structure

```
Hackathon/
├── backend/              # Node.js/Express API
│   ├── config/          # Configuration files
│   ├── db/              # Database migrations and seeds
│   ├── middleware/      # Auth and other middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (AI, email, WebSocket)
│   ├── utils/           # Utility functions
│   └── workers/         # Background job workers
├── frontend/            # React/Vite application
│   ├── src/
│   │   ├── api/        # API client functions
│   │   ├── components/ # Reusable React components
│   │   ├── context/    # React context providers
│   │   ├── pages/      # Page components
│   │   └── App.jsx     # Main app component
│   └── vite.config.js
├── docker-compose.yml   # Docker services configuration
└── package.json         # Root package file

```

## 🔧 Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API
- **PostgreSQL** - Primary database with pgvector
- **Redis** - Caching and session management
- **BullMQ** - Background job processing
- **JWT** - Authentication
- **Socket.io** - Real-time notifications
- **Gemini/HuggingFace AI** - Resume screening

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Material-UI (MUI)** - Component library
- **React Query** - Data fetching and caching
- **React Router** - Navigation
- **Socket.io Client** - Real-time updates

## 📝 API Documentation

API documentation is available via OpenAPI spec at `openapi.yaml`.

Key endpoints:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job (HR/Admin only)
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/applications` - List applications (HR/Admin)
- `GET /api/employees` - List employees
- `POST /api/attendance/check-in` - Employee check-in
- `GET /api/payroll/employee/:id` - Get payroll history

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- SQL injection prevention
- XSS protection with Helmet.js

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3001 (backend)
npx kill-port 3001

# Kill process on port 5173 (frontend)
npx kill-port 5173
```

**Docker containers not starting:**
```bash
# Start Docker Desktop first, then:
docker-compose down
docker-compose up -d postgres redis
```

**Database connection errors:**
- Ensure PostgreSQL container is running: `docker ps`
- Check DATABASE_URL in backend/.env

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Ensure all services are running

## 📄 License

MIT License

---

**Built with ❤️ using modern web technologies**
