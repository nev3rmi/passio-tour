import { Router, Request, Response } from 'express'
import AuthService from '@/services/AuthService'
import { asyncHandler, validateRequired, validateTypes } from '@/middleware/errorHandler'
import { authorize, requireOwnership } from '@/middleware/auth'

const router = Router()
const authService = AuthService.getInstance()

/**
 * @route   GET /users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  
  const result = await authService.getUserProfile(user.userId)

  const statusCode = result.success ? 200 : 404
  res.status(statusCode).json(result)
}))

/**
 * @route   PUT /users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { fullName, firstName, lastName, phone, avatar, dateOfBirth, gender, language, timezone } = req.body

  // Build update object with only provided fields
  const updates: any = {}
  if (fullName !== undefined) updates.fullName = fullName
  if (firstName !== undefined) updates.firstName = firstName
  if (lastName !== undefined) updates.lastName = lastName
  if (phone !== undefined) updates.phone = phone
  if (avatar !== undefined) updates.avatar = avatar
  if (dateOfBirth !== undefined) updates.date_of_birth = dateOfBirth
  if (gender !== undefined) updates.gender = gender
  if (language !== undefined) updates.language = language
  if (timezone !== undefined) updates.timezone = timezone

  const result = await authService.updateUserProfile(user.userId, updates)

  const statusCode = result.success ? 200 : 400
  res.status(statusCode).json(result)
}))

/**
 * @route   POST /users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user
  const { currentPassword, newPassword } = req.body

  // Validate required fields
  const requiredError = validateRequired(req.body, ['currentPassword', 'newPassword'])
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
    currentPassword: 'string',
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

  const result = await authService.changePassword(user.userId, {
    currentPassword,
    newPassword
  })

  const statusCode = result.success ? 200 : 400
  res.status(statusCode).json(result)
}))

/**
 * @route   GET /users/:userId
 * @desc    Get user by ID (admin only)
 * @access  Private (Admin)
 */
router.get('/:userId', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params

  const result = await authService.getUserProfile(userId)

  const statusCode = result.success ? 200 : 404
  res.status(statusCode).json(result)
}))

/**
 * @route   PUT /users/:userId/status
 * @desc    Update user status (admin only)
 * @access  Private (Admin)
 */
router.put('/:userId/status', authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params
  const { status } = req.body

  // TODO: Implement user status update
  res.status(501).json({
    success: false,
    message: 'User status update not yet implemented',
    code: 'NOT_IMPLEMENTED'
  })
}))

export default router