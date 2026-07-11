import pino from 'pino'
import { env } from '../config/env.js'

const logLevel = env.LOG_LEVEL || 'info'

const pinoLogger = pino({
  level: logLevel,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
})

/**
 * Logger instance with structured logging
 */
export const logger = {
  trace: (message: string, data?: any) => pinoLogger.trace(data || {}, message),
  debug: (message: string, data?: any) => pinoLogger.debug(data || {}, message),
  info: (message: string, data?: any) => pinoLogger.info(data || {}, message),
  warn: (message: string, data?: any) => pinoLogger.warn(data || {}, message),
  error: (message: string, data?: any) => pinoLogger.error(data || {}, message),
  fatal: (message: string, data?: any) => pinoLogger.fatal(data || {}, message),
  child: (bindings: Record<string, any>) => pinoLogger.child(bindings),
}

export default pinoLogger
