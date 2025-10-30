import { query } from '../db/connection.js';

/**
 * Middleware to check if a user has an active interview scheduled
 * Validates that:
 * 1. The user has a scheduled interview
 * 2. The interview is happening now (within the scheduled time window)
 * 3. The interview status is 'scheduled' (not cancelled or completed)
 */
export const validateInterviewAccess = async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    
    if (!applicationId) {
      return res.status(400).json({ 
        error: 'Application ID required for interview chat access' 
      });
    }

    // Get current time
    const now = new Date();
    
    // Check if there's an active interview for this application
    const result = await query(
      `SELECT i.*, a.candidate_name, a.candidate_email
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       WHERE i.application_id = $1
         AND i.status = 'scheduled'
         AND i.scheduled_at <= $2
         AND i.scheduled_at + INTERVAL '2 hours' >= $2
       ORDER BY i.scheduled_at DESC
       LIMIT 1`,
      [applicationId, now]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ 
        error: 'No active interview found',
        message: 'You can only access the AI screening chat during your scheduled interview time.'
      });
    }

    const interview = result.rows[0];
    
    // Attach interview info to request for use in the route
    req.interview = interview;
    req.candidateName = interview.candidate_name;
    
    next();
  } catch (error) {
    console.error('Interview access validation error:', error);
    res.status(500).json({ error: 'Failed to validate interview access' });
  }
};

/**
 * Middleware to check if user has permission to view interview chat history
 * Allows:
 * - The candidate themselves (via applicationId)
 * - HR and recruiter roles
 * - Admin role
 */
export const validateChatHistoryAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // If user is authenticated and has admin/hr/recruiter role, allow access
    if (user && ['admin', 'hr', 'recruiter'].includes(user.role)) {
      return next();
    }

    // For unauthenticated or other users, check if they have an active interview
    const { applicationId } = req.query;
    
    if (!applicationId) {
      return res.status(403).json({ 
        error: 'Unauthorized access to conversation history' 
      });
    }

    // Verify the conversation belongs to this application
    const result = await query(
      `SELECT c.*, i.scheduled_at, i.status
       FROM conversations c
       JOIN interviews i ON i.application_id = c.application_id
       WHERE c.id = $1 AND c.application_id = $2`,
      [id, applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Conversation not found or access denied' 
      });
    }

    next();
  } catch (error) {
    console.error('Chat history access validation error:', error);
    res.status(500).json({ error: 'Failed to validate access' });
  }
};

/**
 * Optional interview access - allows the chat to proceed even without active interview
 * But adds context about whether there's an active interview
 */
export const optionalInterviewAccess = async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    
    if (!applicationId) {
      req.hasActiveInterview = false;
      return next();
    }

    const now = new Date();
    
    const result = await query(
      `SELECT i.*, a.candidate_name
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       WHERE i.application_id = $1
         AND i.status = 'scheduled'
         AND i.scheduled_at <= $2
         AND i.scheduled_at + INTERVAL '2 hours' >= $2
       LIMIT 1`,
      [applicationId, now]
    );

    req.hasActiveInterview = result.rows.length > 0;
    if (req.hasActiveInterview) {
      req.interview = result.rows[0];
      req.candidateName = result.rows[0].candidate_name;
    }
    
    next();
  } catch (error) {
    console.error('Optional interview access check error:', error);
    req.hasActiveInterview = false;
    next();
  }
};


