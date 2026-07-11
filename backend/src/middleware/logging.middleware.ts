import { FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '../utils/logger.js'

/**
 * Middleware to log incoming requests and responses
 */
export async function loggingMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const startTime = Date.now()

  // Log incoming request
  logger.debug(`→ ${request.method} ${request.url}`, {
    requestId: request.id,
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  })

  // Log response when sent
  reply.addHook('onResponse', (reply: FastifyReply, done) => {
    const duration = Date.now() - startTime
    const statusCode = reply.statusCode

    const logLevel =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    logger[logLevel as 'info' | 'warn' | 'error'](
      `← ${request.method} ${request.url} ${statusCode} ${duration}ms`,
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode,
        duration,
        ip: request.ip,
      }
    )

    done()
  })
}
