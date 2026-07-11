import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger.js'
import * as analysisService from '../services/analysis.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validation.js'

const router = Router()

// Apply auth middleware to all analysis routes
router.use(authMiddleware)

/**
 * POST /api/analysis/analyze
 * Analyze data with AI
 */
router.post('/analyze', validateRequest('analysis.analyze'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { projectId, data, analysisType } = req.body

    const result = await analysisService.analyzeData(
      userId,
      projectId,
      data,
      analysisType
    )

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Analysis error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
    })
  }
})

/**
 * GET /api/analysis/history/:projectId
 * Get analysis history
 */
router.get('/history/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const userId = (req as any).user?.id
    const { page = 1, limit = 10 } = req.query

    const result = await analysisService.getAnalysisHistory(
      userId,
      projectId,
      parseInt(page as string),
      parseInt(limit as string)
    )

    res.status(200).json({
      success: true,
      data: result.analyses,
      pagination: result.pagination,
    })
  } catch (error) {
    logger.error('Get analysis history error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analysis history',
    })
  }
})

/**
 * GET /api/analysis/:analysisId
 * Get analysis details
 */
router.get('/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params
    const userId = (req as any).user?.id

    const analysis = await analysisService.getAnalysis(analysisId, userId)

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found',
      })
    }

    res.status(200).json({
      success: true,
      data: analysis,
    })
  } catch (error) {
    logger.error('Get analysis error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analysis',
    })
  }
})

export default router
