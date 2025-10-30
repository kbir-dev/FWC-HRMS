import nodemailer from 'nodemailer';
import { config } from '../../config/index.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure email transporter
    // For development, use Ethereal (fake SMTP service)
    // For production, use real SMTP service (Gmail, SendGrid, AWS SES, etc.)
    
    if (config.env === 'production') {
      // Production: Use real SMTP
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Development: Create test account automatically
      nodemailer.createTestAccount((err, account) => {
        if (err) {
          console.error('Failed to create test email account:', err);
          return;
        }

        this.transporter = nodemailer.createTransporter({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });

        console.log('✓ Email service initialized (Ethereal Test Account)');
        console.log('  Preview emails at: https://ethereal.email');
      });
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      console.warn('Email transporter not initialized');
      return { error: 'Email service not available' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"HRMS Platform" <noreply@hrms.com>',
        to,
        subject,
        text,
        html,
      });

      // For development, log preview URL
      if (config.env !== 'production') {
        console.log('📧 Email sent! Preview: %s', nodemailer.getTestMessageUrl(info));
      }

      return { messageId: info.messageId, success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { error: error.message, success: false };
    }
  }

  // Application status notification
  async sendApplicationStatusEmail(application, status) {
    const statusMessages = {
      screened: {
        subject: 'Application Update - Screening Complete',
        message: 'Your application has been screened and is under review.',
      },
      shortlisted: {
        subject: 'Great News! You\'ve Been Shortlisted',
        message: 'Congratulations! You\'ve been shortlisted for the next round.',
      },
      rejected: {
        subject: 'Application Update',
        message: 'Thank you for your interest. Unfortunately, we won\'t be moving forward with your application at this time.',
      },
      interview: {
        subject: 'Interview Invitation',
        message: 'You\'ve been invited for an interview! We\'ll contact you soon with details.',
      },
    };

    const statusInfo = statusMessages[status] || statusMessages.screened;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HRMS Platform</h1>
          </div>
          <div class="content">
            <h2>Dear ${application.candidate_name},</h2>
            <p>${statusInfo.message}</p>
            <p><strong>Position:</strong> ${application.job_title}</p>
            <p><strong>Status:</strong> ${status.toUpperCase()}</p>
            ${application.screening_score ? `<p><strong>Screening Score:</strong> ${application.screening_score}/100</p>` : ''}
            <p>Thank you for your patience throughout this process.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from HRMS Platform.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: application.candidate_email,
      subject: statusInfo.subject,
      html,
      text: statusInfo.message,
    });
  }

  // Interview invitation email
  async sendInterviewInvitationEmail(interview) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0ea5e9; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Interview Invitation</h1>
          </div>
          <div class="content">
            <h2>Dear ${interview.candidate_name},</h2>
            <p>We are pleased to invite you for an interview for the position of <strong>${interview.job_title}</strong>.</p>
            <div class="details">
              <p><strong>Interview Type:</strong> ${interview.interview_type}</p>
              ${interview.scheduled_date ? `<p><strong>Date & Time:</strong> ${new Date(interview.scheduled_date).toLocaleString()}</p>` : ''}
              ${interview.location ? `<p><strong>Location:</strong> ${interview.location}</p>` : ''}
              ${interview.notes ? `<p><strong>Additional Information:</strong> ${interview.notes}</p>` : ''}
            </div>
            <p>Please confirm your attendance by replying to this email.</p>
            <p>We look forward to meeting you!</p>
          </div>
          <div class="footer">
            <p>HRMS Platform - Talent Acquisition Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: interview.candidate_email,
      subject: `Interview Invitation - ${interview.job_title}`,
      html,
      text: `You've been invited for an interview for ${interview.job_title}`,
    });
  }

  // Welcome email for new employees
  async sendWelcomeEmail(employee) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .button { display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Team!</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${employee.full_name}!</h2>
            <p>We're thrilled to have you join our team as a <strong>${employee.position}</strong>.</p>
            <p><strong>Employee Code:</strong> ${employee.employee_code}</p>
            <p><strong>Start Date:</strong> ${new Date(employee.hire_date).toLocaleDateString()}</p>
            ${employee.department_name ? `<p><strong>Department:</strong> ${employee.department_name}</p>` : ''}
            <p>Your account has been created. You can now access the HRMS platform using your email address.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login to HRMS</a>
            <p>If you have any questions, please don't hesitate to reach out to HR.</p>
          </div>
          <div class="footer">
            <p>HRMS Platform - Human Resources</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: employee.email,
      subject: 'Welcome to the Team!',
      html,
      text: `Welcome ${employee.full_name}! Your employee code is ${employee.employee_code}`,
    });
  }

  // Payroll notification
  async sendPayrollNotificationEmail(payroll) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .amount { font-size: 32px; font-weight: bold; color: #0ea5e9; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payroll Processed</h1>
          </div>
          <div class="content">
            <h2>Dear ${payroll.full_name},</h2>
            <p>Your salary for ${new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} has been processed.</p>
            <div class="amount">
              $${payroll.net_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p>Payment will be credited to your account via ${payroll.payment_method.replace('_', ' ')}.</p>
            <p>You can view detailed payslip in the HRMS portal.</p>
          </div>
          <div class="footer">
            <p>HRMS Platform - Payroll Department</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: payroll.email,
      subject: `Payroll Processed - ${new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long' })}`,
      html,
      text: `Your salary for ${new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long' })} has been processed: $${payroll.net_salary}`,
    });
  }

  // Performance review notification
  async sendPerformanceReviewEmail(review) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .score { font-size: 48px; font-weight: bold; color: #0ea5e9; text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Performance Review</h1>
          </div>
          <div class="content">
            <h2>Dear ${review.employee_name},</h2>
            <p>Your performance review for the period ${new Date(review.review_period_start).toLocaleDateString()} to ${new Date(review.review_period_end).toLocaleDateString()} has been completed.</p>
            <div class="score">
              ${review.overall_score.toFixed(1)}/10
            </div>
            <p>Reviewer: ${review.reviewer_name}</p>
            <p>You can view the detailed review and feedback in the HRMS portal.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/performance" class="button">View Full Review</a>
          </div>
          <div class="footer">
            <p>HRMS Platform - Performance Management</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: review.employee_email,
      subject: 'Performance Review Completed',
      html,
      text: `Your performance review has been completed. Overall score: ${review.overall_score}/10`,
    });
  }
}

// Export singleton instance
export default new EmailService();

