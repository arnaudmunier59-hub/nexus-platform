import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger.js'
import * as authService from '../services/auth.service.js'
import { validateRequest } from '../middleware/validation.js'

const router = Router()

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRequest('auth.register'), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    const result = await authService.register(email, password, name)

    res.status(201).json({
      success: true,
      data: {
        userId: result.user.id,
        email: result.user.email,
        token: result.token,
      },
    })
  } catch (error) {
    logger.error('Registration error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    })
  }
})

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validateRequest('auth.login'), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const result = await authService.login(email, password)

    res.status(200).json({
      success: true,
      data: {
        userId: result.user.id,
        email: result.user.email,
        token: result.token,
      },
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    })
  }
})

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
      })
    }

    const newToken = await authService.refreshToken(refreshToken)

    res.status(200).json({
      success: true,
      data: { token: newToken },
    })
  } catch (error) {
    logger.error('Token refresh error:', error)
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    })
  }
})

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (token) {
      await authService.logout(token)
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    })
  }
})

export default router
