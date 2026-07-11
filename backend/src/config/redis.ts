import Redis, { RedisOptions } from 'ioredis'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

let redis: Redis | null = null
let redisSubscriber: Redis | null = null

/**
 * Initialize Redis client
 */
export async function initializeRedis(): Promise<void> {
  try {
    const options: RedisOptions = {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: true,
    }

    redis = new Redis(options)

    // Connection event handlers
    redis.on('connect', () => {
      logger.info('✅ Redis connected')
    })

    redis.on('error', (error) => {
      logger.error('❌ Redis error:', error)
    })

    redis.on('reconnecting', () => {
      logger.warn('⚠️ Redis reconnecting...')
    })

    // Test connection
    await redis.ping()
    logger.info('✅ Redis ping successful')

    // Initialize subscriber for pub/sub
    redisSubscriber = new Redis(options)

    redisSubscriber.on('error', (error) => {
      logger.error('❌ Redis subscriber error:', error)
    })

    logger.info('✅ Redis subscriber initialized')
  } catch (error) {
    logger.error('❌ Failed to initialize Redis:', error)
    throw error
  }
}

/**
 * Get Redis client
 */
export function getRedis(): Redis {
  if (!redis) {
    throw new Error('Redis not initialized. Call initializeRedis() first.')
  }
  return redis
}

/**
 * Get Redis subscriber
 */
export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    throw new Error('Redis subscriber not initialized. Call initializeRedis() first.')
  }
  return redisSubscriber
}

/**
 * Set a value in Redis with optional TTL
 */
export async function redisSet(
  key: string,
  value: any,
  ttl?: number
): Promise<void> {
  const r = getRedis()

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)

    if (ttl) {
      await r.setex(key, ttl, serialized)
    } else {
      await r.set(key, serialized)
    }
  } catch (error) {
    logger.error('Redis SET error:', { key, error })
    throw error
  }
}

/**
 * Get a value from Redis
 */
export async function redisGet<T = any>(key: string): Promise<T | null> {
  const r = getRedis()

  try {
    const value = await r.get(key)

    if (!value) return null

    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  } catch (error) {
    logger.error('Redis GET error:', { key, error })
    throw error
  }
}

/**
 * Delete a key from Redis
 */
export async function redisDel(key: string | string[]): Promise<number> {
  const r = getRedis()

  try {
    const keys = Array.isArray(key) ? key : [key]
    return await r.del(...keys)
  } catch (error) {
    logger.error('Redis DEL error:', { key, error })
    throw error
  }
}

/**
 * Check if key exists
 */
export async function redisExists(key: string): Promise<boolean> {
  const r = getRedis()

  try {
    const exists = await r.exists(key)
    return exists === 1
  } catch (error) {
    logger.error('Redis EXISTS error:', { key, error })
    throw error
  }
}

/**
 * Get TTL for a key
 */
export async function redisTTL(key: string): Promise<number> {
  const r = getRedis()

  try {
    return await r.ttl(key)
  } catch (error) {
    logger.error('Redis TTL error:', { key, error })
    throw error
  }
}

/**
 * Increment a counter
 */
export async function redisIncr(key: string): Promise<number> {
  const r = getRedis()

  try {
    return await r.incr(key)
  } catch (error) {
    logger.error('Redis INCR error:', { key, error })
    throw error
  }
}

/**
 * Decrement a counter
 */
export async function redisDecr(key: string): Promise<number> {
  const r = getRedis()

  try {
    return await r.decr(key)
  } catch (error) {
    logger.error('Redis DECR error:', { key, error })
    throw error
  }
}

/**
 * Push to a list
 */
export async function redisPush(key: string, ...values: any[]): Promise<number> {
  const r = getRedis()

  try {
    const serialized = values.map(v => 
      typeof v === 'string' ? v : JSON.stringify(v)
    )
    return await r.rpush(key, ...serialized)
  } catch (error) {
    logger.error('Redis PUSH error:', { key, error })
    throw error
  }
}

/**
 * Pop from a list
 */
export async function redisPop<T = any>(key: string): Promise<T | null> {
  const r = getRedis()

  try {
    const value = await r.lpop(key)
    if (!value) return null

    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  } catch (error) {
    logger.error('Redis POP error:', { key, error })
    throw error
  }
}

/**
 * Get all keys matching pattern
 */
export async function redisKeys(pattern: string): Promise<string[]> {
  const r = getRedis()

  try {
    return await r.keys(pattern)
  } catch (error) {
    logger.error('Redis KEYS error:', { pattern, error })
    throw error
  }
}

/**
 * Flush all data (use with caution!)
 */
export async function redisFlush(): Promise<void> {
  const r = getRedis()

  try {
    await r.flushdb()
    logger.warn('⚠️ Redis database flushed')
  } catch (error) {
    logger.error('Redis FLUSH error:', error)
    throw error
  }
}

/**
 * Check Redis health
 */
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  responseTime: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const r = getRedis()
    await r.ping()

    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
    logger.info('✅ Redis connection closed')
  }

  if (redisSubscriber) {
    await redisSubscriber.quit()
    redisSubscriber = null
    logger.info('✅ Redis subscriber closed')
  }
}
