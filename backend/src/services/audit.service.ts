import { query } from '../config/database.js'
import { logger } from '../utils/logger.js'

/**
 * Audit service - logs all user actions for compliance
 */

export async function logAuditEntry(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId?: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(changes || {}),
        ipAddress,
        userAgent,
      ]
    )
  } catch (error) {
    logger.error('Failed to log audit entry:', error)
  }
}

export async function getUserAuditLog(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  const result = await query(
    `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  )

  return result.rows
}

export async function getResourceAuditLog(
  resourceType: string,
  resourceId: string
): Promise<any[]> {
  const result = await query(
    `SELECT * FROM audit_logs WHERE resource_type = $1 AND resource_id = $2 ORDER BY created_at DESC`,
    [resourceType, resourceId]
  )

  return result.rows
}
