import { logger } from '../utils/logger.js'
import * as webSearchTool from './web-search.tool.js'
import * as codeExecutionTool from './code-execution.tool.js'
import * as dataFetchTool from './data-fetch.tool.js'
import * as fileManagerTool from './file-manager.tool.js'
import * as emailTool from './email.tool.js'

/**
 * Tool registry - centralized management of all available tools
 */

export interface ToolDefinition {
  name: string
  description: string
  execute: (params: any) => Promise<any>
  parameters: {
    [key: string]: {
      type: string
      description: string
      required?: boolean
    }
  }
}

const toolRegistry: Map<string, ToolDefinition> = new Map()

// Register tools
function registerTools() {
  // Web Search
  toolRegistry.set('web_search', {
    name: 'web_search',
    description: 'Search the web for information',
    execute: async (params) => webSearchTool.webSearch(params.query, params.limit),
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      limit: { type: 'number', description: 'Number of results', required: false },
    },
  })

  // Code Execution
  toolRegistry.set('execute_code', {
    name: 'execute_code',
    description: 'Execute code safely',
    execute: async (params) => codeExecutionTool.executeCode(params.code, params.language),
    parameters: {
      code: { type: 'string', description: 'Code to execute', required: true },
      language: { type: 'string', description: 'Programming language', required: true },
    },
  })

  // Data Fetch
  toolRegistry.set('fetch_data', {
    name: 'fetch_data',
    description: 'Fetch data from URLs',
    execute: async (params) => dataFetchTool.fetchData(params.url, params.options),
    parameters: {
      url: { type: 'string', description: 'URL to fetch', required: true },
      options: { type: 'object', description: 'Fetch options', required: false },
    },
  })

  // File Manager
  toolRegistry.set('read_file', {
    name: 'read_file',
    description: 'Read file contents',
    execute: async (params) => fileManagerTool.readFile(params.path),
    parameters: {
      path: { type: 'string', description: 'File path', required: true },
    },
  })

  toolRegistry.set('write_file', {
    name: 'write_file',
    description: 'Write contents to file',
    execute: async (params) => fileManagerTool.writeFile(params.path, params.content),
    parameters: {
      path: { type: 'string', description: 'File path', required: true },
      content: { type: 'string', description: 'File content', required: true },
    },
  })

  toolRegistry.set('list_files', {
    name: 'list_files',
    description: 'List files in directory',
    execute: async (params) => fileManagerTool.listFiles(params.path),
    parameters: {
      path: { type: 'string', description: 'Directory path', required: true },
    },
  })

  // Email
  toolRegistry.set('send_email', {
    name: 'send_email',
    description: 'Send an email',
    execute: async (params) => emailTool.sendEmail(params),
    parameters: {
      to: { type: 'string', description: 'Recipient email(s)', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
    },
  })
}

// Initialize on load
registerTools()

export function getTool(name: string): ToolDefinition | undefined {
  return toolRegistry.get(name)
}

export function getTools(): ToolDefinition[] {
  return Array.from(toolRegistry.values())
}

export function getToolNames(): string[] {
  return Array.from(toolRegistry.keys())
}

export async function executeTool(name: string, params: any): Promise<any> {
  const tool = getTool(name)

  if (!tool) {
    throw new Error(`Tool not found: ${name}`)
  }

  logger.info(`Executing tool: ${name}`, { params })

  try {
    const result = await tool.execute(params)
    logger.info(`Tool execution succeeded: ${name}`)
    return result
  } catch (error) {
    logger.error(`Tool execution failed: ${name}`, error)
    throw error
  }
}
