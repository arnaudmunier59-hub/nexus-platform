import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger.js'
import * as toolService from '../services/tool.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validation.js'

const router = Router()

// Apply auth middleware to all tool routes
router.use(authMiddleware)

/**
 * GET /api/tools
 * List all available tools
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tools = await toolService.getAllTools()

    res.status(200).json({
      success: true,
      data: tools,
    })
  } catch (error) {
    logger.error('List tools error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tools',
    })
  }
})

/**
 * POST /api/tools/execute
 * Execute a tool
 */
router.post('/execute', validateRequest('tool.execute'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { toolName, params } = req.body

    const result = await toolService.executeTool(userId, toolName, params)

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Tool execution error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tool execution failed',
    })
  }
})

/**
 * GET /api/tools/:toolId
 * Get tool details
 */
router.get('/:toolId', async (req: Request, res: Response) => {
  try {
    const { toolId } = req.params

    const tool = await toolService.getTool(toolId)

    if (!tool) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found',
      })
    }

    res.status(200).json({
      success: true,
      data: tool,
    })
  } catch (error) {
    logger.error('Get tool error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tool',
    })
  }
})

export default router
