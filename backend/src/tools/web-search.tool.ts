import axios from 'axios'
import { logger } from '../utils/logger.js'

/**
 * Web search tool - integrates with search APIs
 */

interface SearchResult {
  title: string
  url: string
  description: string
  snippet: string
}

export async function webSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
  try {
    const apiKey = process.env.SEARCH_API_KEY
    if (!apiKey) {
      throw new Error('SEARCH_API_KEY not configured')
    }

    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count: limit,
      },
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
    })

    return response.data.web.map((result: any) => ({
      title: result.title,
      url: result.url,
      description: result.description,
      snippet: result.snippet || '',
    }))
  } catch (error) {
    logger.error('Web search error:', error)
    throw new Error(`Web search failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function getWebPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NexusBot/1.0)',
      },
    })

    // Extract text content (simplified)
    return response.data.substring(0, 5000)
  } catch (error) {
    logger.error('Failed to fetch web page:', error)
    throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : String(error)}`)
  }
}
