import { FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '../utils/logger.js'
import { AppError, ValidationError } from '../types/index.js'

/**
 * Global error handler middleware
 */
export async function errorHandler(
  error: any,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.id || 'unknown'

  // Log the error
  logger.error('Error occurred', {
    requestId,
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    path: request.url,
    method: request.method,
  })

  // Handle known app errors
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    })
  }

  // Handle validation errors
  if (error instanceof ValidationError) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    })
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation,
      },
      timestamp: new Date().toISOString(),
      requestId,
    })
  }

  // Default error response
  const statusCode = error.statusCode || 500
  const isDevelopment = process.env.NODE_ENV === 'development'

  return reply.code(statusCode).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: isDevelopment ? error.message : 'An error occurred',
      ...(isDevelopment && { details: error.stack }),
    },
    timestamp: new Date().toISOString(),
    requestId,
  })
}
