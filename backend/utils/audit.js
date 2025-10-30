import { query } from '../db/connection.js';

/**
 * Create an audit log entry
 * @param {number} actorId - User ID performing the action
 * @param {string} action - Action being performed (e.g., 'create', 'update', 'delete', 'login')
 * @param {string} entityType - Type of entity (e.g., 'users', 'employees', 'applications')
 * @param {number} entityId - ID of the entity
 * @param {object} changes - Changes made (can include before/after values)
 * @param {string} ipAddress - IP address of the request
 * @param {string} userAgent - User agent string
 */
export const createAuditLog = async (
  actorId,
  action,
  entityType,
  entityId,
  changes = {},
  ipAddress = null,
  userAgent = null
) => {
  try {
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [actorId, action, entityType, entityId, JSON.stringify(changes), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent audit logging from breaking main flow
  }
};

/**
 * Get audit logs with optional filters
 */
export const getAuditLogs = async (filters = {}, limit = 100, offset = 0) => {
  let whereConditions = [];
  let params = [];
  let paramIndex = 1;
  
  if (filters.actorId) {
    whereConditions.push(`actor_id = $${paramIndex++}`);
    params.push(filters.actorId);
  }
  
  if (filters.entityType) {
    whereConditions.push(`entity_type = $${paramIndex++}`);
    params.push(filters.entityType);
  }
  
  if (filters.entityId) {
    whereConditions.push(`entity_id = $${paramIndex++}`);
    params.push(filters.entityId);
  }
  
  if (filters.action) {
    whereConditions.push(`action = $${paramIndex++}`);
    params.push(filters.action);
  }
  
  if (filters.startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(filters.endDate);
  }
  
  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';
  
  params.push(limit, offset);
  
  const result = await query(
    `SELECT 
       al.*,
       u.email as actor_email,
       u.role as actor_role
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );
  
  return result.rows;
};

// Alias for backward compatibility
export const logAudit = createAuditLog;

