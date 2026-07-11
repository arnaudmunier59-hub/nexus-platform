import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger.js'
import * as userService from '../services/user.service.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validation.js'

const router = Router()

// Apply auth middleware to all user routes
router.use(authMiddleware)

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const user = await userService.getUserById(userId)

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    logger.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    })
  }
})

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', validateRequest('user.update'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { name, bio, avatar } = req.body

    const updated = await userService.updateUser(userId, { name, bio, avatar })

    res.status(200).json({
      success: true,
      data: updated,
    })
  } catch (error) {
    logger.error('Update profile error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    })
  }
})

/**
 * POST /api/users/change-password
 * Change user password
 */
router.post('/change-password', validateRequest('user.changePassword'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const { currentPassword, newPassword } = req.body

    await userService.changePassword(userId, currentPassword, newPassword)

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    logger.error('Change password error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password',
    })
  }
})

/**
 * GET /api/users/:userId
 * Get user by ID (admin only)
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const user = await userService.getUserById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    logger.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    })
  }
})

export default router
