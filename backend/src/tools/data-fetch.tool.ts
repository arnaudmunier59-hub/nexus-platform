import { getRedis } from '../config/redis.js'
import { logger } from '../utils/logger.js'
import axios from 'axios'

/**
 * Data fetching tool - retrieves data from various sources
 */

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  useCache?: boolean
  cacheTTL?: number
}

const DEFAULT_TIMEOUT = 10000
const DEFAULT_CACHE_TTL = 3600 // 1 hour

export async function fetchData(
  url: string,
  options: FetchOptions = {}
): Promise<any> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = DEFAULT_TIMEOUT,
    useCache = true,
    cacheTTL = DEFAULT_CACHE_TTL,
  } = options

  const cacheKey = `fetch:${method}:${url}`
  const redis = getRedis()

  // Check cache
  if (useCache && method === 'GET' && redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        logger.debug('Cache hit for:', url)
        return JSON.parse(cached)
      }
    } catch (error) {
      logger.warn('Cache retrieval failed:', error)
    }
  }

  try {
    const response = await axios({
      url,
      method,
      headers: {
        'User-Agent': 'NexusBot/1.0',
        ...headers,
      },
      data: body,
      timeout,
    })

    const data = response.data

    // Cache successful GET requests
    if (useCache && method === 'GET' && redis) {
      try {
        await redis.setex(cacheKey, cacheTTL, JSON.stringify(data))
      } catch (error) {
        logger.warn('Failed to cache data:', error)
      }
    }

    return data
  } catch (error) {
    logger.error('Data fetch error:', error)
    throw new Error(`Failed to fetch data from ${url}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function fetchJSON(url: string, options?: FetchOptions): Promise<any> {
  return fetchData(url, { ...options, headers: { ...options?.headers, 'Accept': 'application/json' } })
}

export async function fetchCSV(url: string, options?: FetchOptions): Promise<string> {
  const data = await fetchData(url, { ...options, headers: { ...options?.headers, 'Accept': 'text/csv' } })
  return data
}
