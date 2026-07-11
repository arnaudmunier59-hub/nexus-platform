import { query } from '../config/database.js'
import { logger } from '../utils/logger.js'
import { Trace } from '../types/index.js'

/**
 * Trace service - logs agent reasoning steps
 */

export async function createTrace(
  agentId: string,
  conversationId: string,
  step: number,
  action: 'thought' | 'tool_use' | 'decision' | 'observation',
  content: string,
  metadata?: any
): Promise<Trace> {
  const result = await query(
    `INSERT INTO traces (agent_id, conversation_id, step, action, content, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [agentId, conversationId, step, action, content, JSON.stringify(metadata || {})]
  )

  return result.rows[0]
}

export async function getConversationTraces(conversationId: string): Promise<Trace[]> {
  const result = await query(
    `SELECT * FROM traces WHERE conversation_id = $1 ORDER BY step ASC`,
    [conversationId]
  )

  return result.rows
}

export async function getAgentTraces(agentId: string, limit: number = 100): Promise<Trace[]> {
  const result = await query(
    `SELECT * FROM traces WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [agentId, limit]
  )

  return result.rows
}
