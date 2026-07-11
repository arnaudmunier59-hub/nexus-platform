import Groq from 'groq-sdk'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

let groqClient: Groq | null = null

/**
 * Initialize Groq API client
 */
export function initializeGroq(): void {
  try {
    groqClient = new Groq({
      apiKey: env.GROQ_API_KEY,
    })

    logger.info('✅ Groq API client initialized')
  } catch (error) {
    logger.error('❌ Failed to initialize Groq API:', error)
    throw error
  }
}

/**
 * Get Groq client instance
 */
export function getGroq(): Groq {
  if (!groqClient) {
    throw new Error('Groq client not initialized. Call initializeGroq() first.')
  }
  return groqClient
}

/**
 * Available Groq models
 */
export const GROQ_MODELS = {
  LLAMA_3_1_70B: 'llama-3.1-70b-versatile',
  LLAMA_3_1_8B: 'llama-3.1-8b-instant',
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',
  GEMMA_7B: 'gemma-7b-it',
} as const

export type GroqModel = (typeof GROQ_MODELS)[keyof typeof GROQ_MODELS]

/**
 * Configuration for API calls
 */
export interface GroqCallConfig {
  model?: GroqModel
  temperature?: number
  maxTokens?: number
  topP?: number
  stopSequences?: string[]
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: GroqCallConfig = {
  model: GROQ_MODELS.LLAMA_3_1_70B,
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1,
}

/**
 * Make a chat completion request to Groq
 */
export async function groqChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  config?: GroqCallConfig
): Promise<{
  content: string
  model: string
  tokens: {
    input: number
    output: number
    total: number
  }
}> {
  const client = getGroq()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  try {
    const response = await client.chat.completions.create({
      model: finalConfig.model!,
      messages,
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.maxTokens,
      top_p: finalConfig.topP,
      stop: finalConfig.stopSequences,
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      content,
      model: response.model,
      tokens: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    }
  } catch (error) {
    logger.error('Groq API error:', error)
    throw error
  }
}

/**
 * Stream a chat completion request to Groq
 */
export async function groqChatCompletionStream(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  onChunk: (chunk: string) => void,
  config?: GroqCallConfig
): Promise<{
  model: string
  totalTokens: number
}> {
  const client = getGroq()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  try {
    const stream = await client.chat.completions.create({
      model: finalConfig.model!,
      messages,
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.maxTokens,
      top_p: finalConfig.topP,
      stop: finalConfig.stopSequences,
      stream: true,
    })

    let totalTokens = 0
    let model = finalConfig.model!

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        onChunk(content)
      }

      if (chunk.model) {
        model = chunk.model
      }

      // Track tokens if available
      if (chunk.usage) {
        totalTokens = chunk.usage.total_tokens || 0
      }
    }

    return {
      model,
      totalTokens,
    }
  } catch (error) {
    logger.error('Groq streaming API error:', error)
    throw error
  }
}

/**
 * Get available models from Groq
 */
export async function getAvailableModels(): Promise<string[]> {
  const client = getGroq()

  try {
    // Note: Groq SDK might not expose models endpoint directly
    // Returning known models for now
    return Object.values(GROQ_MODELS)
  } catch (error) {
    logger.error('Failed to get Groq models:', error)
    return Object.values(GROQ_MODELS)
  }
}

/**
 * Estimate tokens for a message
 * Rough estimation: ~4 characters = 1 token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Check Groq API health
 */
export async function checkGroqHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  responseTime: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const client = getGroq()

    // Make a simple test call
    await client.chat.completions.create({
      model: GROQ_MODELS.LLAMA_3_1_8B,
      messages: [
        {
          role: 'user',
          content: 'ping',
        },
      ],
      max_tokens: 10,
    })

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
 * Get model info
 */
export function getModelInfo(model: GroqModel): {
  name: string
  description: string
  contextWindow: number
  costPer1kTokens: { input: number; output: number }
} {
  const modelInfo: Record<
    GroqModel,
    {
      name: string
      description: string
      contextWindow: number
      costPer1kTokens: { input: number; output: number }
    }
  > = {
    [GROQ_MODELS.LLAMA_3_1_70B]: {
      name: 'Llama 3.1 70B',
      description: 'Powerful 70B parameter model, best for complex tasks',
      contextWindow: 131072,
      costPer1kTokens: { input: 0.59, output: 0.79 },
    },
    [GROQ_MODELS.LLAMA_3_1_8B]: {
      name: 'Llama 3.1 8B',
      description: 'Fast 8B parameter model, good for simple tasks',
      contextWindow: 131072,
      costPer1kTokens: { input: 0.05, output: 0.1 },
    },
    [GROQ_MODELS.MIXTRAL_8X7B]: {
      name: 'Mixtral 8x7B',
      description: 'Mixture of experts model, balanced performance',
      contextWindow: 32768,
      costPer1kTokens: { input: 0.27, output: 0.81 },
    },
    [GROQ_MODELS.GEMMA_7B]: {
      name: 'Gemma 7B',
      description: 'Lightweight model, good for constrained environments',
      contextWindow: 8192,
      costPer1kTokens: { input: 0.07, output: 0.14 },
    },
  }

  return modelInfo[model] || modelInfo[GROQ_MODELS.LLAMA_3_1_70B]
}
