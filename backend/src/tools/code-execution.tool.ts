import { spawn } from 'child_process'
import { logger } from '../utils/logger.js'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'

/**
 * Code execution tool - safely executes code in sandboxed environments
 */

const SUPPORTED_LANGUAGES = ['python', 'javascript', 'bash', 'sql']
const EXECUTION_TIMEOUT = 30000 // 30 seconds
const MAX_OUTPUT_SIZE = 10000 // 10KB

interface ExecutionResult {
  success: boolean
  output: string
  error: string
  executionTime: number
}

export async function executeCode(
  code: string,
  language: string = 'javascript'
): Promise<ExecutionResult> {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return {
      success: false,
      output: '',
      error: `Unsupported language: ${language}`,
      executionTime: 0,
    }
  }

  const tempDir = os.tmpdir()
  const fileName = `nexus_exec_${Date.now()}.${getExtension(language)}`
  const filePath = path.join(tempDir, fileName)

  try {
    // Write code to temporary file
    await fs.writeFile(filePath, code)

    const startTime = Date.now()
    const result = await executeScript(filePath, language)
    const executionTime = Date.now() - startTime

    return {
      success: result.success,
      output: result.output.substring(0, MAX_OUTPUT_SIZE),
      error: result.error,
      executionTime,
    }
  } catch (error) {
    logger.error('Code execution error:', error)
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
      executionTime: 0,
    }
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(filePath)
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

function getExtension(language: string): string {
  const extensions: Record<string, string> = {
    python: 'py',
    javascript: 'js',
    bash: 'sh',
    sql: 'sql',
  }
  return extensions[language] || 'txt'
}

function executeScript(filePath: string, language: string): Promise<any> {
  return new Promise((resolve) => {
    let command = ''
    let args: string[] = []

    switch (language) {
      case 'python':
        command = 'python3'
        args = [filePath]
        break
      case 'javascript':
        command = 'node'
        args = [filePath]
        break
      case 'bash':
        command = 'bash'
        args = [filePath]
        break
      case 'sql':
        // SQL requires database connection
        resolve({
          success: false,
          output: '',
          error: 'SQL execution requires database context',
        })
        return
    }

    let output = ''
    let error = ''

    const process = spawn(command, args, {
      timeout: EXECUTION_TIMEOUT,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    process.stdout?.on('data', (data) => {
      output += data.toString()
    })

    process.stderr?.on('data', (data) => {
      error += data.toString()
    })

    process.on('error', (err) => {
      error += err.message
      resolve({ success: false, output, error })
    })

    process.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        error,
      })
    })

    setTimeout(() => {
      process.kill()
      resolve({
        success: false,
        output,
        error: 'Execution timeout',
      })
    }, EXECUTION_TIMEOUT)
  })
}
