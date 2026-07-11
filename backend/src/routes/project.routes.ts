import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger.js'
import * as projectService from '../services/project.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validation.js'

const router = Router()

// Apply auth middleware to all project routes
router.use(authMiddleware)

/**
 * GET /api/projects
 * List all projects for current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { page = 1, limit = 10 } = req.query

    const result = await projectService.getUserProjects(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    )

    res.status(200).json({
      success: true,
      data: result.projects,
      pagination: result.pagination,
    })
  } catch (error) {
    logger.error('List projects error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    })
  }
})

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', validateRequest('project.create'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { name, description, type } = req.body

    const project = await projectService.createProject(
      userId,
      { name, description, type }
    )

    res.status(201).json({
      success: true,
      data: project,
    })
  } catch (error) {
    logger.error('Create project error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    })
  }
})

/**
 * GET /api/projects/:projectId
 * Get project details
 */
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const userId = (req as any).user?.id

    const project = await projectService.getProject(projectId, userId)

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      })
    }

    res.status(200).json({
      success: true,
      data: project,
    })
  } catch (error) {
    logger.error('Get project error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project',
    })
  }
})

/**
 * PUT /api/projects/:projectId
 * Update project
 */
router.put('/:projectId', validateRequest('project.update'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const userId = (req as any).user?.id
    const { name, description, status } = req.body

    const updated = await projectService.updateProject(
      projectId,
      userId,
      { name, description, status }
    )

    res.status(200).json({
      success: true,
      data: updated,
    })
  } catch (error) {
    logger.error('Update project error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    })
  }
})

/**
 * DELETE /api/projects/:projectId
 * Delete project
 */
router.delete('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const userId = (req as any).user?.id

    await projectService.deleteProject(projectId, userId)

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    logger.error('Delete project error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    })
  }
})

export default router
