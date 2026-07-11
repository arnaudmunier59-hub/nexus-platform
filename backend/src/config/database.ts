import { Pool, PoolClient } from 'pg'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

let pool: Pool | null = null

/**
 * Initialize PostgreSQL connection pool
 */
export async function initializeDatabase(): Promise<void> {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20, // Max connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      statement_timeout: 30000,
    })

    // Test connection
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()

    logger.info('✅ PostgreSQL pool initialized successfully')
  } catch (error) {
    logger.error('❌ Failed to initialize database pool:', error)
    throw error
  }
}

/**
 * Get database pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.')
  }
  return pool
}

/**
 * Get a single client from the pool
 */
export async function getClient(): Promise<PoolClient> {
  const p = getPool()
  return p.connect()
}

/**
 * Execute a query
 */
export async function query<T = any>(
  text: string,
  values?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const p = getPool()
  
  try {
    const result = await p.query(text, values)
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0,
    }
  } catch (error) {
    logger.error('Database query error:', { text, values, error })
    throw error
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('Transaction error:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close database pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    logger.info('✅ Database pool closed')
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  responseTime: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const client = await getClient()
    await client.query('SELECT 1')
    client.release()

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
 * Get pool statistics
 */
export function getPoolStats(): {
  totalConnections: number
  idleConnections: number
  waitingRequests: number
} {
  const p = getPool()
  return {
    totalConnections: p.totalCount,
    idleConnections: p.idleCount,
    waitingRequests: p.waitingCount,
  }
}
