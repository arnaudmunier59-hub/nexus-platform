import { query } from '../config/database.js'
import { logger } from '../utils/logger.js'
import { User, UserSession } from '../types/index.js'
import { hashPassword, verifyPassword, generateToken } from '../utils/crypto.js'

/**
 * User service - handles user operations
 */

export async function createUser(
  email: string,
  username: string,
  password: string
): Promise<User> {
  const passwordHash = await hashPassword(password)

  const result = await query(
    `INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)
     RETURNING id, email, username, role, is_active, created_at, updated_at`,
    [email, username, passwordHash]
  )

  return result.rows[0]
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE email = $1', [email])
  return result.rows[0] || null
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function verifyUserPassword(user: User, password: string): Promise<boolean> {
  return verifyPassword(password, user.passwordHash)
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [userId])
}

export async function createSession(
  userId: string,
  token: string,
  refreshToken: string,
  expiresIn: number
): Promise<UserSession> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  const result = await query(
    `INSERT INTO sessions (user_id, token, refresh_token, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, token, refresh_token, expires_at, created_at`,
    [userId, token, refreshToken, expiresAt]
  )

  return result.rows[0]
}

export async function getSessionByToken(token: string): Promise<UserSession | null> {
  const result = await query(
    `SELECT * FROM sessions WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`,
    [token]
  )
  return result.rows[0] || null
}

export async function getSessionByRefreshToken(refreshToken: string): Promise<UserSession | null> {
  const result = await query(
    `SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP`,
    [refreshToken]
  )
  return result.rows[0] || null
}

export async function deleteSession(sessionId: string): Promise<void> {
  await query('DELETE FROM sessions WHERE id = $1', [sessionId])
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await query('DELETE FROM sessions WHERE user_id = $1', [userId])
}
