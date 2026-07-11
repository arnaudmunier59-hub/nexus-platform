/**
 * Core TypeScript Types & Interfaces
 */

// User Types
export interface User {
  id: string
  email: string
  username: string
  passwordHash: string
  avatar?: string
  role: 'user' | 'admin' | 'moderator'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserSession {
  id: string
  userId: string
  token: string
  refreshToken: string
  expiresAt: Date
  createdAt: Date
}

// Conversation Types
export interface Conversation {
  id: string
  userId: string
  title: string
  description?: string
  model: string
  isArchived: boolean
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  conversationId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  contentType: 'text' | 'code' | 'markdown' | 'mixed'
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Agent Types
export interface Agent {
  id: string
  name: string
  description: string
  systemPrompt: string
  model: string
  tools: string[]
  isActive: boolean
  version: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface AgentExecution {
  id: string
  agentId: string
  conversationId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: string
  output?: string
  error?: string
  executionTime: number
  tokensUsed: number
  createdAt: Date
}

// Tool Types
export interface Tool {
  id: string
  name: string
  description: string
  category: 'search' | 'code' | 'browser' | 'file' | 'image' | 'system'
  isActive: boolean
  parameters: ToolParameter[]
  rateLimit?: number
  createdAt: Date
}

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description?: string
  defaultValue?: any
}

export interface ToolExecution {
  id: string
  toolId: string
  agentId: string
  input: any
  output: any
  status: 'success' | 'error'
  error?: string
  executionTime: number
  createdAt: Date
}

// Trace Types
export interface Trace {
  id: string
  agentId: string
  conversationId: string
  step: number
  action: 'thought' | 'tool_use' | 'decision' | 'observation'
  content: string
  metadata?: Record<string, any>
  createdAt: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  requestId: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Auth Types
export interface AuthPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  conversationId?: string
  message: string
  agentId?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatResponse {
  conversationId: string
  messageId: string
  content: string
  tokens: {
    input: number
    output: number
    total: number
  }
  model: string
  executionTime: number
}

// Monitoring Types
export interface SystemMetrics {
  timestamp: Date
  cpu: {
    usage: number
    speed: number
  }
  memory: {
    total: number
    used: number
    free: number
    percent: number
  }
  disk: {
    total: number
    used: number
    free: number
    percent: number
  }
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  services: {
    database: { status: string; responseTime: number }
    redis: { status: string; responseTime: number }
    groq: { status: string; responseTime: number }
  }
  metrics?: SystemMetrics
}

// Error Types
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super('AUTH_ERROR', message, 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super('AUTHZ_ERROR', message, 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}
