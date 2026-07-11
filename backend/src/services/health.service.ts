import { getRedis } from '../config/redis.js'
import { getPool, checkDatabaseHealth } from '../config/database.js'
import { checkGroqHealth } from '../config/groq.js'
import { checkRedisHealth } from '../config/redis.js'
import { HealthCheck, SystemMetrics } from '../types/index.js'
import { logger } from '../utils/logger.js'
import os from 'os'

/**
 * Health check service
 */

export async function getHealthCheck(): Promise<HealthCheck> {
  const dbHealth = await checkDatabaseHealth()
  const redisHealth = await checkRedisHealth()
  const groqHealth = await checkGroqHealth()

  const isHealthy =
    dbHealth.status === 'healthy' &&
    redisHealth.status === 'healthy' &&
    groqHealth.status === 'healthy'

  const status = isHealthy ? 'healthy' : 'degraded'

  const metrics = getSystemMetrics()

  return {
    status,
    timestamp: new Date(),
    services: {
      database: {
        status: dbHealth.status,
        responseTime: dbHealth.responseTime,
      },
      redis: {
        status: redisHealth.status,
        responseTime: redisHealth.responseTime,
      },
      groq: {
        status: groqHealth.status,
        responseTime: groqHealth.responseTime,
      },
    },
    metrics,
  }
}

function getSystemMetrics(): SystemMetrics {
  const cpus = os.cpus()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory

  return {
    timestamp: new Date(),
    cpu: {
      usage: process.cpuUsage().user / 1000000, // Convert to seconds
      speed: cpus[0]?.speed || 0,
    },
    memory: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      percent: (usedMemory / totalMemory) * 100,
    },
    disk: {
      total: 0,
      used: 0,
      free: 0,
      percent: 0,
    },
  }
}
