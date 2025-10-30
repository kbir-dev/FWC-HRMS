import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import JobCreate from './pages/JobCreate';
import JobApplication from './pages/JobApplication';
import Applications from './pages/Applications';
import ApplicationDetails from './pages/ApplicationDetails';
import AIShortlisted from './pages/AIShortlisted';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import PerformanceReviews from './pages/PerformanceReviews';
import LeaveManagement from './pages/LeaveManagement';
import Profile from './pages/Profile';
import ChatScreen from './pages/ChatScreen';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="performance" element={<PerformanceReviews />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:id" element={<ApplicationDetails />} />
            <Route path="shortlisted" element={<AIShortlisted />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/create" element={<JobCreate />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="jobs/:id/apply" element={<JobApplication />} />
            <Route path="chat" element={<ChatScreen />} />
          </Route>

          {/* Catch all - redirect to dashboard or login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

