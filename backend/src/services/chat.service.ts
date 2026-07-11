import { query } from '../config/database.js'
import { groqChatCompletion, groqChatCompletionStream, GroqModel } from '../config/groq.js'
import { logger } from '../utils/logger.js'
import { ChatMessage, ChatResponse } from '../types/index.js'

/**
 * Chat service - handles AI conversations
 */

export async function generateChatResponse(
  messages: ChatMessage[],
  model: GroqModel = 'llama-3.1-70b-versatile',
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<ChatResponse> {
  const startTime = Date.now()

  try {
    const response = await groqChatCompletion(messages as any, {
      model,
      temperature,
      maxTokens,
    })

    const executionTime = Date.now() - startTime

    return {
      conversationId: '',
      messageId: '',
      content: response.content,
      tokens: response.tokens,
      model: response.model,
      executionTime,
    }
  } catch (error) {
    logger.error('Chat generation error:', error)
    throw error
  }
}

export async function generateChatResponseStream(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  model: GroqModel = 'llama-3.1-70b-versatile',
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<{ model: string; totalTokens: number }> {
  try {
    return await groqChatCompletionStream(messages as any, onChunk, {
      model,
      temperature,
      maxTokens,
    })
  } catch (error) {
    logger.error('Chat streaming error:', error)
    throw error
  }
}

export async function saveTokenUsage(
  conversationId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const totalTokens = inputTokens + outputTokens

  try {
    // Could save to database for analytics
    logger.debug('Token usage recorded', {
      conversationId,
      inputTokens,
      outputTokens,
      totalTokens,
    })
  } catch (error) {
    logger.error('Failed to save token usage:', error)
  }
}
