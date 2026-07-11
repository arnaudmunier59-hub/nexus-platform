import { query, transaction } from '../config/database.js'
import { logger } from '../utils/logger.js'
import { Conversation, Message, PaginatedResponse } from '../types/index.js'

/**
 * Conversation service - handles conversation operations
 */

export async function createConversation(
  userId: string,
  title: string,
  description?: string,
  model: string = 'llama-3.1-70b-versatile'
): Promise<Conversation> {
  const result = await query(
    `INSERT INTO conversations (user_id, title, description, model)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, title, description, model]
  )

  return result.rows[0]
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const result = await query('SELECT * FROM conversations WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function getUserConversations(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<Conversation>> {
  const offset = (page - 1) * pageSize

  const countResult = await query(
    'SELECT COUNT(*) as total FROM conversations WHERE user_id = $1 AND is_archived = false',
    [userId]
  )

  const result = await query(
    `SELECT * FROM conversations WHERE user_id = $1 AND is_archived = false
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  )

  return {
    items: result.rows,
    total: countResult.rows[0].total,
    page,
    pageSize,
    hasMore: offset + pageSize < countResult.rows[0].total,
  }
}

export async function updateConversation(
  id: string,
  updates: Partial<Conversation>
): Promise<Conversation> {
  const fields = Object.keys(updates)
    .map((key, i) => `${key} = $${i + 2}`)
    .join(', ')

  const values = [id, ...Object.values(updates)]

  const result = await query(
    `UPDATE conversations SET ${fields}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 RETURNING *`,
    values
  )

  return result.rows[0]
}

export async function archiveConversation(id: string): Promise<void> {
  await query('UPDATE conversations SET is_archived = true WHERE id = $1', [id])
}

export async function deleteConversation(id: string): Promise<void> {
  await query('DELETE FROM conversations WHERE id = $1', [id])
}

export async function addMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  contentType: string = 'text'
): Promise<Message> {
  const result = await query(
    `INSERT INTO messages (conversation_id, user_id, role, content, content_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [conversationId, userId, role, content, contentType]
  )

  return result.rows[0]
}

export async function getConversationMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  const result = await query(
    `SELECT * FROM messages WHERE conversation_id = $1
     ORDER BY created_at ASC LIMIT $2`,
    [conversationId, limit]
  )

  return result.rows
}

export async function updateMessage(id: string, content: string): Promise<Message> {
  const result = await query(
    `UPDATE messages SET content = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 RETURNING *`,
    [content, id]
  )

  return result.rows[0]
}

export async function deleteMessage(id: string): Promise<void> {
  await query('DELETE FROM messages WHERE id = $1', [id])
}
