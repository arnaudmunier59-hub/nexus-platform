import fs from 'fs/promises'
import path from 'path'
import { logger } from '../utils/logger.js'

/**
 * File management tool - read/write files safely
 */

const ALLOWED_DIRS = [process.cwd() + '/uploads', process.cwd() + '/data']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function validatePath(filePath: string): boolean {
  const resolved = path.resolve(filePath)
  return ALLOWED_DIRS.some((dir) => resolved.startsWith(path.resolve(dir)))
}

export async function readFile(filePath: string): Promise<string> {
  try {
    if (!validatePath(filePath)) {
      throw new Error('Access denied: path outside allowed directories')
    }

    const content = await fs.readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    logger.error('File read error:', error)
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    if (!validatePath(filePath)) {
      throw new Error('Access denied: path outside allowed directories')
    }

    if (content.length > MAX_FILE_SIZE) {
      throw new Error('File too large')
    }

    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
  } catch (error) {
    logger.error('File write error:', error)
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    if (!validatePath(dirPath)) {
      throw new Error('Access denied: path outside allowed directories')
    }

    const files = await fs.readdir(dirPath)
    return files
  } catch (error) {
    logger.error('Directory listing error:', error)
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    if (!validatePath(filePath)) {
      throw new Error('Access denied: path outside allowed directories')
    }

    await fs.unlink(filePath)
  } catch (error) {
    logger.error('File delete error:', error)
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    if (!validatePath(filePath)) {
      return false
    }

    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
