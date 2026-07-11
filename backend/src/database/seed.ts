import { query } from '../config/database.js'
import { hashPassword } from '../utils/crypto.js'
import { logger } from '../utils/logger.js'

/**
 * Seed database with initial data
 */
export async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...')

    // Check if already seeded
    const result = await query('SELECT COUNT(*) as count FROM users')
    if (result.rows[0].count > 0) {
      logger.info('✅ Database already seeded')
      return
    }

    // Seed admin user
    const adminPasswordHash = await hashPassword('admin123456')
    await query(
      `INSERT INTO users (email, username, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)`,
      ['admin@nexus.local', 'admin', adminPasswordHash, 'admin', true]
    )
    logger.info('✅ Admin user created')

    // Seed demo user
    const userPasswordHash = await hashPassword('user123456')
    await query(
      `INSERT INTO users (email, username, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)`,
      ['user@nexus.local', 'demo_user', userPasswordHash, 'user', true]
    )
    logger.info('✅ Demo user created')

    // Seed built-in tools
    const tools = [
      {
        name: 'web_search',
        description: 'Search the web for information',
        category: 'search',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'Search query' },
        ],
      },
      {
        name: 'code_execution',
        description: 'Execute code safely in sandbox',
        category: 'code',
        parameters: [
          { name: 'code', type: 'string', required: true, description: 'Code to execute' },
          { name: 'language', type: 'string', required: true, description: 'Programming language' },
        ],
      },
      {
        name: 'file_reader',
        description: 'Read files from storage',
        category: 'file',
        parameters: [
          { name: 'path', type: 'string', required: true, description: 'File path' },
        ],
      },
    ]

    for (const tool of tools) {
      await query(
        `INSERT INTO tools (name, description, category, parameters, is_active) VALUES ($1, $2, $3, $4, $5)`,
        [tool.name, tool.description, tool.category, JSON.stringify(tool.parameters), true]
      )
    }
    logger.info(`✅ ${tools.length} tools created`)

    // Seed demo agent
    await query(
      `INSERT INTO agents (name, description, system_prompt, model, is_active) VALUES ($1, $2, $3, $4, $5)`,
      [
        'Default Assistant',
        'A helpful AI assistant',
        'You are a helpful, harmless, and honest AI assistant.',
        'llama-3.1-70b-versatile',
        true,
      ]
    )
    logger.info('✅ Default agent created')

    logger.info('✅ Database seeding completed')
  } catch (error) {
    logger.error('❌ Database seeding failed:', error)
    throw error
  }
}
