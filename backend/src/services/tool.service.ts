import { query } from '../config/database.js'
import { logger } from '../utils/logger.js'
import { Tool, ToolExecution } from '../types/index.js'

/**
 * Tool service - manages tools and their executions
 */

export async function getTool(id: string): Promise<Tool | null> {
  const result = await query('SELECT * FROM tools WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function getToolByName(name: string): Promise<Tool | null> {
  const result = await query('SELECT * FROM tools WHERE name = $1', [name])
  return result.rows[0] || null
}

export async function getActiveTools(): Promise<Tool[]> {
  const result = await query('SELECT * FROM tools WHERE is_active = true ORDER BY name ASC')
  return result.rows
}

export async function getToolsByCategory(category: string): Promise<Tool[]> {
  const result = await query(
    'SELECT * FROM tools WHERE category = $1 AND is_active = true ORDER BY name ASC',
    [category]
  )
  return result.rows
}

export async function createToolExecution(
  toolId: string,
  agentId: string,
  input: any
): Promise<ToolExecution> {
  const result = await query(
    `INSERT INTO tool_executions (tool_id, agent_id, input, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [toolId, agentId, JSON.stringify(input)]
  )

  return result.rows[0]
}

export async function updateToolExecution(
  id: string,
  output: any,
  status: 'success' | 'error',
  error?: string
): Promise<ToolExecution> {
  const executionTime = Date.now()

  const result = await query(
    `UPDATE tool_executions SET output = $1, status = $2, error = $3 WHERE id = $4 RETURNING *`,
    [JSON.stringify(output), status, error, id]
  )

  return result.rows[0]
}

export async function getToolExecutions(toolId: string, limit: number = 20): Promise<ToolExecution[]> {
  const result = await query(
    `SELECT * FROM tool_executions WHERE tool_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [toolId, limit]
  )

  return result.rows
}
