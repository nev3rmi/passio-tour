import { Router, Request, Response } from 'express'
import AuthService from '@/services/AuthService'
import { validateRequired, validateTypes, asyncHandler, createValidationError } from '@/middleware/errorHandler'
import { authRateLimit } from '@/middleware/auth'
import { validateEmail, validatePassword } from '@/utils/validation'

const router = Router()
const authService = AuthService.getInstance()

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authRateLimit(5, 15 * 60 * 1000), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, firstName, lastName, phone } = req.body

  // Validate required fields
  const requiredError = validateRequired(req.body, ['email', 'password', 'fullName'])
  if (requiredError) {
    return res.status(400).json({
      success: false,
      message: requiredError.message,
      code: requiredError.code,
      details: requiredError.details
    })
  }

  // Validate field types
  const typeError = validateTypes(req.body, {
    email: 'string',
    password: 'string',
    fullName: 'string',
    firstName: 'string',
    lastName: 'string',
    phone: 'string'
  })
  if (typeError) {
    return res.status(400).json({
      success: false,
      message: typeError.message,
      code: typeError.code,
      details: typeError.details
    })
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
      code: 'INVALID_EMAIL'
    })
  }

  // Validate password strength
  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      code: 'WEAK_PASSWORD'
    })
  }

  const deviceInfo = {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    deviceType: req.get('User-Agent')?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop'
  }

  const result = await authService.register({
    email,
    password,
    fullName,
    firstName,
    lastName,
    phone
  }, req.ip, deviceInfo)

  const statusCode = result.success ? 201 : 400
  res.status(statusCode).json(result)
}))

/**
 * @route   POST /auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', authRateLimit(10, 15 * 60 * 1000), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  // Validate required fields
  const requiredError = validateRequired(req.body, ['email', 'password'])
  if (requiredError) {
    return res.status(400).json({
      success: false,
      message: requiredError.message,
      code: requiredError.code,
      details: requiredError.details
    })
  }

  // Validate field types
  const typeError = validateTypes(req.body, {
    email: 'string',
    password: 'string'
  })
  if (typeError) {
    return res.status(400).json({
      success: false,
      message: typeError.message,
      code: typeError.code,
      details: typeError.details
    })
  }

  const deviceInfo = {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    deviceType: req.get('User-Agent')?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop'
  }

  const result = await authService.login({
    email,
    password,
    deviceInfo
  })

  const statusCode = result.success ? 200 : 401
  res.status(statusCode).json(result)
}))

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authRateLimit(20, 15 * 60 * 1000), asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  // Validate required fields
  const requiredError = validateRequired(req.body, ['refreshToken'])
  if (requiredError) {
    return res.status(400).json({
      success: false,
      message: requiredError.message,
      code: requiredError.code,
      details: requiredError.details
    })
  }

  // Validate field types
  const typeError = validateTypes(req.body, {
    refreshToken: 'string'
  })
  if (typeError) {
    return res.status(400).json({
      success: false,
      message: typeError.message,
      code: typeError.code,
      details: typeError.details
    })
  }

  const result = await authService.refreshToken(refreshToken)

  const statusCode = result.success ? 200 : 401
  res.status(statusCode).json(result)
}))

/**
 * @route   POST /auth/logout
 * @desc    User logout
 * @access  Public
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const { refreshToken } = req.body

  let accessToken = null
  
  // Extract access token from header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.substring(7)
  }

  const result = await authService.logout(accessToken, refreshToken)

  res.status(result.success ? 200 : 400).json({
    success: result.success,
    message: result.message
  })
}))

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', authRateLimit(3, 60 * 60 * 1000), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body

  // Validate required fields
  const requiredError = validateRequired(req.body, ['email'])
  if (requiredError) {
    return res.status(400).json({
      success: false,
      message: requiredError.message,
      code: requiredError.code,
      details: requiredError.details
    })
  }

  // Validate field types
  const typeError = validateTypes(req.body, {
    email: 'string'
  })
  if (typeError) {
    return res.status(400).json({
      success: false,
      message: typeError.message,
      code: typeError.code,
      details: typeError.details
    })
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
      code: 'INVALID_EMAIL'
    })
  }

  const result = await authService.requestPasswordReset({ email })

  // Always return success to prevent email enumeration
  res.status(200).json({
    success: true,
    message: result.message
  })
}))

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authRateLimit(5, 60 * 60 * 1000), asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body

  // Validate required fields
  const requiredError = validateRequired(req.body, ['token', 'newPassword'])
  if (requiredError) {
    return res.status(400).json({
      success: false,
      message: requiredError.message,
      code: requiredError.code,
      details: requiredError.details
    })
  }

  // Validate field types
  const typeError = validateTypes(req.body, {
    token: 'string',
    newPassword: 'string'
  })
  if (typeError) {
    return res.status(400).json({
      success: false,
      message: typeError.message,
      code: typeError.code,
      details: typeError.details
    })
  }

  // Validate password strength
  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      code: 'WEAK_PASSWORD'
    })
  }

  const result = await authService.confirmPasswordReset({
    token,
    newPassword
  })

  const statusCode = result.success ? 200 : 400
  res.status(statusCode).json(result)
}))

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    })
  }

  const result = await authService.getUserProfile(user.userId)

  const statusCode = result.success ? 200 : 404
  res.status(statusCode).json(result)
}))

export default router