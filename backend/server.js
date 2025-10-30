import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import 'express-async-errors';
import { config } from './config/index.js';
import pool from './db/connection.js';
import redisClient from './utils/redis.js';
import socketService from './services/websocket/socketService.js';

// Import routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import interviewRoutes from './routes/interviews.js';
import chatRoutes from './routes/chat.js';
import attendanceRoutes from './routes/attendance.js';
import payrollRoutes from './routes/payroll.js';
import performanceRoutes from './routes/performance.js';
import leaveRoutes from './routes/leave.js';
import dashboardRoutes from './routes/dashboard.js';

// Import worker (to start it)
import './workers/screeningWorker.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database
    await pool.query('SELECT 1');
    const dbStatus = 'healthy';
    
    // Check Redis
    await redisClient.ping();
    const redisStatus = 'healthy';
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        api: 'healthy'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Powered HRMS API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      employees: '/api/employees',
      jobs: '/api/jobs',
      applications: '/api/applications',
      interviews: '/api/interviews',
      chat: '/api/chat',
      dashboard: '/api/dashboard',
      attendance: '/api/attendance',
      payroll: '/api/payroll',
      performance: '/api/performance',
      leave: '/api/leave'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  // Database errors
  if (err.code === '23505') {
    return res.status(400).json({ error: 'Duplicate entry' });
  }
  
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: config.env === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server with WebSocket support
const PORT = config.port;
const server = http.createServer(app);

// Initialize WebSocket
socketService.initialize(server);

server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 AI-Powered HRMS Backend Server');
  console.log('========================================');
  console.log(`Environment: ${config.env}`);
  console.log(`Server running on port: ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
  console.log(`WebSocket: Enabled`);
  console.log('========================================\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close database connection
  await pool.end();
  
  // Close Redis connection
  await redisClient.quit();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  
  // Close database connection
  await pool.end();
  
  // Close Redis connection
  await redisClient.quit();
  
  process.exit(0);
});

// Export app and socketService for use in other modules
export { app, socketService };
export default app;

