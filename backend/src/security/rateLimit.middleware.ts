import { FastifyRequest, FastifyReply } from 'fastify'
import { getRedis } from '../config/redis.js'
import { logger } from '../utils/logger.js'

/**
 * Rate limiting middleware
 */
export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const redis = getRedis()
  const identifier = request.user?.id || request.ip
  const key = `ratelimit:${identifier}`
  const limit = 1000 // requests
  const window = 900 // seconds (15 minutes)

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, window)
    }

    reply.header('x-ratelimit-limit', limit.toString())
    reply.header('x-ratelimit-remaining', Math.max(0, limit - current).toString())
    reply.header('x-ratelimit-reset', Math.floor(Date.now() / 1000 + window).toString())

    if (current > limit) {
      logger.warn(`Rate limit exceeded for ${identifier}`, { current, limit })
      return reply.code(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          retryAfter: window,
        },
      })
    }
  } catch (error) {
    logger.error('Rate limit middleware error:', error)
    // Don't block on redis errors
  }
}

/**
 * Strict rate limiting for sensitive endpoints
 */
export async function strictRateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const redis = getRedis()
  const identifier = request.user?.id || request.ip
  const key = `ratelimit:strict:${identifier}`
  const limit = 10 // requests
  const window = 60 // seconds

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, window)
    }

    if (current > limit) {
      logger.warn(`Strict rate limit exceeded for ${identifier}`, { current, limit })
      return reply.code(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests on this endpoint',
          retryAfter: window,
        },
      })
    }
  } catch (error) {
    logger.error('Strict rate limit middleware error:', error)
  }
}
