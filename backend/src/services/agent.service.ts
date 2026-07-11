import { query } from '../config/database.js'
import { logger } from '../utils/logger.js'
import { Agent, AgentExecution } from '../types/index.js'

/**
 * Agent service - handles agent operations
 */

export async function createAgent(
  name: string,
  description: string,
  systemPrompt: string,
  model: string,
  tools: string[] = []
): Promise<Agent> {
  const result = await query(
    `INSERT INTO agents (name, description, system_prompt, model, tools, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING *`,
    [name, description, systemPrompt, model, tools]
  )

  return result.rows[0]
}

export async function getAgent(id: string): Promise<Agent | null> {
  const result = await query('SELECT * FROM agents WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function getActiveAgents(): Promise<Agent[]> {
  const result = await query('SELECT * FROM agents WHERE is_active = true ORDER BY name ASC')
  return result.rows
}

export async function updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
  const fields = Object.keys(updates)
    .map((key, i) => `${key} = $${i + 2}`)
    .join(', ')

  const values = [id, ...Object.values(updates)]

  const result = await query(
    `UPDATE agents SET ${fields}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 RETURNING *`,
    values
  )

  return result.rows[0]
}

export async function createAgentExecution(
  agentId: string,
  conversationId: string,
  input: string
): Promise<AgentExecution> {
  const result = await query(
    `INSERT INTO agent_executions (agent_id, conversation_id, status, input)
     VALUES ($1, $2, 'pending', $3)
     RETURNING *`,
    [agentId, conversationId, input]
  )

  return result.rows[0]
}

export async function updateAgentExecution(
  id: string,
  updates: Partial<AgentExecution>
): Promise<AgentExecution> {
  const fields = Object.keys(updates)
    .map((key, i) => `${key} = $${i + 2}`)
    .join(', ')

  const values = [id, ...Object.values(updates)]

  const result = await query(
    `UPDATE agent_executions SET ${fields} WHERE id = $1 RETURNING *`,
    values
  )

  return result.rows[0]
}

export async function getAgentExecutions(agentId: string, limit: number = 20): Promise<AgentExecution[]> {
  const result = await query(
    `SELECT * FROM agent_executions WHERE agent_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [agentId, limit]
  )

  return result.rows
}
