import { z } from 'zod'

/**
 * Environment variables validation schema
 * Ensures all required env vars are present and valid
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().min(1000).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().url().optional(),

  // Redis
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().default(6379),
  REDIS_PASSWORD: z.string().min(1),
  REDIS_URL: z.string().optional(),

  // JWT & Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),

  // AI Providers
  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().default('llama-3.1-70b-versatile'),

  // File Storage
  STORAGE_PATH: z.string().default('/data/uploads'),
  MAX_FILE_SIZE: z.coerce.number().int().default(104857600), // 100MB

  // CORS & Security
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),

  // Monitoring
  ENABLE_MONITORING: z.enum(['true', 'false']).transform(v => v === 'true').default(false),
  MONITORING_PORT: z.coerce.number().int().default(9090),

  // Grafana
  GRAFANA_PASSWORD: z.string().default('admin'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().default(1000),

  // Queue
  QUEUE_CONCURRENCY: z.coerce.number().int().default(10),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().int().default(3),
  QUEUE_BACKOFF_DELAY: z.coerce.number().int().default(2000),
})

export type Environment = z.infer<typeof envSchema>

/**
 * Validate and load environment variables
 */
function loadEnv(): Environment {
  try {
    const env = envSchema.parse(process.env)
    
    // Construct DATABASE_URL if not provided
    if (!env.DATABASE_URL) {
      env.DATABASE_URL = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`
    }

    // Construct REDIS_URL if not provided
    if (!env.REDIS_URL) {
      env.REDIS_URL = `redis://:${env.REDIS_PASSWORD}@${env.REDIS_HOST}:${env.REDIS_PORT}`
    }

    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      process.exit(1)
    }
    throw error
  }
}

export const env = loadEnv()

/**
 * Validate a single environment variable
 */
export function validateEnvVar(key: keyof Environment, value: any): any {
  const schema = envSchema.pick({ [key]: true })
  const result = schema.safeParse({ [key]: value })
  
  if (!result.success) {
    throw new Error(`Invalid value for ${key}: ${result.error.errors[0].message}`)
  }
  
  return result.data[key]
}

/**
 * Get all environment variables (for debugging)
 */
export function getEnvSummary(): Partial<Environment> {
  return {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    LOG_LEVEL: env.LOG_LEVEL,
    DB_HOST: env.DB_HOST,
    DB_NAME: env.DB_NAME,
    REDIS_HOST: env.REDIS_HOST,
    GROQ_MODEL: env.GROQ_MODEL,
    ENABLE_MONITORING: env.ENABLE_MONITORING,
  }
}
