import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthenticationError } from '../types/index.js'

/**
 * Auth middleware to verify JWT token
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verify JWT token
    await request.jwtVerify()
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token')
  }
}

/**
 * Optional auth middleware (doesn't fail if no token)
 */
export async function optionalAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    // Continue without auth
  }
}

/**
 * Admin only middleware
 */
export async function adminOnlyMiddleware(request: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(request, reply)

  const user = request.user as any
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
}
