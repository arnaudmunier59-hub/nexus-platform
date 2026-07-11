/**
 * Database schema definitions using raw SQL
 */

export const schema = {
  // Users table
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar VARCHAR(500),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_username (username),
      INDEX idx_role (role)
    );
  `,

  // User sessions table
  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(500) UNIQUE NOT NULL,
      refresh_token VARCHAR(500) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_token (token),
      INDEX idx_expires_at (expires_at)
    );
  `,

  // Conversations table
  conversations: `
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      model VARCHAR(100) NOT NULL,
      is_archived BOOLEAN DEFAULT false,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at),
      INDEX idx_is_archived (is_archived)
    );
  `,

  // Messages table
  messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      content_type VARCHAR(50) NOT NULL DEFAULT 'text',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_conversation_id (conversation_id),
      INDEX idx_user_id (user_id),
      INDEX idx_role (role),
      INDEX idx_created_at (created_at)
    );
  `,

  // Agents table
  agents: `
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      system_prompt TEXT NOT NULL,
      model VARCHAR(100) NOT NULL,
      tools TEXT[] DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      version INTEGER DEFAULT 1,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_is_active (is_active),
      INDEX idx_created_at (created_at)
    );
  `,

  // Agent executions table
  agent_executions: `
    CREATE TABLE IF NOT EXISTS agent_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      error TEXT,
      execution_time INTEGER,
      tokens_used INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_agent_id (agent_id),
      INDEX idx_conversation_id (conversation_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    );
  `,

  // Tools table
  tools: `
    CREATE TABLE IF NOT EXISTS tools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      parameters JSONB DEFAULT '[]',
      rate_limit INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_category (category),
      INDEX idx_is_active (is_active)
    );
  `,

  // Tool executions table
  tool_executions: `
    CREATE TABLE IF NOT EXISTS tool_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
      agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      input JSONB NOT NULL,
      output JSONB,
      status VARCHAR(50) NOT NULL,
      error TEXT,
      execution_time INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tool_id (tool_id),
      INDEX idx_agent_id (agent_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    );
  `,

  // Traces table
  traces: `
    CREATE TABLE IF NOT EXISTS traces (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      step INTEGER NOT NULL,
      action VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_agent_id (agent_id),
      INDEX idx_conversation_id (conversation_id),
      INDEX idx_action (action),
      INDEX idx_created_at (created_at)
    );
  `,

  // Audit logs table
  audit_logs: `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(100) NOT NULL,
      resource_id VARCHAR(255),
      changes JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_action (action),
      INDEX idx_resource_type (resource_type),
      INDEX idx_created_at (created_at)
    );
  `,
}

export async function createSchema(query: (sql: string) => Promise<any>) {
  for (const [name, sql] of Object.entries(schema)) {
    try {
      await query(sql)
      console.log(`✅ Created table: ${name}`)
    } catch (error) {
      console.error(`❌ Error creating table ${name}:`, error)
    }
  }
}
