import { query } from '../config/database.js'
import { logger } from '../utils/logger.js'
import { schema, createSchema } from './schema.js'

/**
 * Migration system for database schema
 */

interface Migration {
  version: number
  name: string
  up: () => Promise<void>
  down: () => Promise<void>
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_initial_schema',
    up: async () => {
      await createSchema((sql: string) => query(sql))
      logger.info('✅ Migration 1 UP: Initial schema created')
    },
    down: async () => {
      const tables = [
        'audit_logs',
        'traces',
        'tool_executions',
        'tools',
        'agent_executions',
        'agents',
        'messages',
        'conversations',
        'sessions',
        'users',
      ]

      for (const table of tables) {
        await query(`DROP TABLE IF EXISTS ${table} CASCADE`)
      }
      logger.info('✅ Migration 1 DOWN: Schema dropped')
    },
  },
  {
    version: 2,
    name: 'add_indexes',
    up: async () => {
      await query(`CREATE INDEX IF NOT EXISTS idx_conversations_user_created ON conversations(user_id, created_at DESC)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at ASC)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_status ON agent_executions(agent_id, status)`)
      logger.info('✅ Migration 2 UP: Indexes added')
    },
    down: async () => {
      await query(`DROP INDEX IF EXISTS idx_conversations_user_created`)
      await query(`DROP INDEX IF EXISTS idx_messages_conversation_created`)
      await query(`DROP INDEX IF EXISTS idx_agent_executions_agent_status`)
      logger.info('✅ Migration 2 DOWN: Indexes dropped')
    },
  },
]

/**
 * Get migration table
 */
async function getMigrationTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (error) {
    logger.error('Failed to create migrations table:', error)
    throw error
  }
}

/**
 * Run pending migrations
 */
export async function runMigrations() {
  try {
    await getMigrationTable()

    const result = await query(`SELECT version FROM migrations ORDER BY version DESC LIMIT 1`)
    const lastMigration = result.rows[0]?.version || 0

    const pendingMigrations = migrations.filter((m) => m.version > lastMigration)

    if (pendingMigrations.length === 0) {
      logger.info('✅ All migrations are up to date')
      return
    }

    for (const migration of pendingMigrations) {
      try {
        await migration.up()
        await query(`INSERT INTO migrations (version, name) VALUES ($1, $2)`, [
          migration.version,
          migration.name,
        ])
        logger.info(`✅ Migration ${migration.version} executed: ${migration.name}`)
      } catch (error) {
        logger.error(`❌ Migration ${migration.version} failed:`, error)
        throw error
      }
    }

    logger.info(`✅ All ${pendingMigrations.length} migrations completed`)
  } catch (error) {
    logger.error('❌ Migration process failed:', error)
    throw error
  }
}

/**
 * Rollback last migration
 */
export async function rollbackMigration() {
  try {
    const result = await query(`SELECT version FROM migrations ORDER BY version DESC LIMIT 1`)
    const lastMigration = result.rows[0]?.version

    if (!lastMigration) {
      logger.warn('No migrations to rollback')
      return
    }

    const migration = migrations.find((m) => m.version === lastMigration)

    if (!migration) {
      throw new Error(`Migration ${lastMigration} not found`)
    }

    await migration.down()
    await query(`DELETE FROM migrations WHERE version = $1`, [lastMigration])
    logger.info(`✅ Migration ${lastMigration} rolled back`)
  } catch (error) {
    logger.error('Rollback failed:', error)
    throw error
  }
}
