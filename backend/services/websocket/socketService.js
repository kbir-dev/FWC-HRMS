import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`✓ User connected: ${socket.userId} (${socket.id})`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);

      // Join user-specific room
      socket.join(`user-${socket.userId}`);
      
      // Join role-specific room
      socket.join(`role-${socket.userRole}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`✗ User disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
      });

      // Handle custom events
      socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`User ${socket.userId} joined room: ${room}`);
      });

      socket.on('leave-room', (room) => {
        socket.leave(room);
        console.log(`User ${socket.userId} left room: ${room}`);
      });
    });

    console.log('✓ WebSocket service initialized');
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    if (!this.io) return;
    
    this.io.to(`user-${userId}`).emit(event, data);
  }

  // Send notification to all users with specific role
  sendToRole(role, event, data) {
    if (!this.io) return;
    
    this.io.to(`role-${role}`).emit(event, data);
  }

  // Send to specific room
  sendToRoom(room, event, data) {
    if (!this.io) return;
    
    this.io.to(room).emit(event, data);
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (!this.io) return;
    
    this.io.emit(event, data);
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Notification types
  notifyApplicationUpdate(userId, application) {
    this.sendToUser(userId, 'application:update', {
      type: 'application_update',
      message: `Application for ${application.job_title} has been updated`,
      data: application,
      timestamp: new Date(),
    });
  }

  notifyNewJobPosting(job) {
    this.broadcast('job:new', {
      type: 'new_job',
      message: `New job posting: ${job.title}`,
      data: job,
      timestamp: new Date(),
    });
  }

  notifyInterviewScheduled(userId, interview) {
    this.sendToUser(userId, 'interview:scheduled', {
      type: 'interview_scheduled',
      message: `Interview scheduled for ${interview.job_title}`,
      data: interview,
      timestamp: new Date(),
    });
  }

  notifyPayrollProcessed(userId, payroll) {
    this.sendToUser(userId, 'payroll:processed', {
      type: 'payroll_processed',
      message: 'Your payroll has been processed',
      data: payroll,
      timestamp: new Date(),
    });
  }

  notifyPerformanceReview(userId, review) {
    this.sendToUser(userId, 'performance:reviewed', {
      type: 'performance_review',
      message: 'Your performance review is ready',
      data: review,
      timestamp: new Date(),
    });
  }

  notifyAttendanceReminder(userId) {
    this.sendToUser(userId, 'attendance:reminder', {
      type: 'attendance_reminder',
      message: 'Don\'t forget to check in today!',
      timestamp: new Date(),
    });
  }

  // Admin/HR notifications
  notifyNewApplication(application) {
    this.sendToRole('admin', 'application:new', {
      type: 'new_application',
      message: `New application from ${application.candidate_name}`,
      data: application,
      timestamp: new Date(),
    });

    this.sendToRole('hr', 'application:new', {
      type: 'new_application',
      message: `New application from ${application.candidate_name}`,
      data: application,
      timestamp: new Date(),
    });

    this.sendToRole('recruiter', 'application:new', {
      type: 'new_application',
      message: `New application from ${application.candidate_name}`,
      data: application,
      timestamp: new Date(),
    });
  }
}

// Export singleton instance
export default new SocketService();

