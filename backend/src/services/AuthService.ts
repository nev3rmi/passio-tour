import { query, transaction } from '@/database/connection'
import JWTManager from '@/services/JWTManager'
import CacheManager from '@/services/CacheManager'
import { logger } from '@/utils/logger'
import { validateEmail, validatePassword } from '@/utils/validation'
import { User, UserPreferences } from '@/types/user'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export interface LoginRequest {
  email: string
  password: string
  deviceInfo?: {
    userAgent?: string
    ip?: string
    deviceType?: string
  }
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  firstName?: string
  lastName?: string
  phone?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ResetPasswordRequest {
  email: string
}

export interface ConfirmResetPasswordRequest {
  token: string
  newPassword: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: Omit<User, 'passwordHash'>
    tokens: {
      accessToken: string
      refreshToken: string
      expiresIn: number
    }
  }
  error?: string
  code?: string
}

export class AuthService {
  private static instance: AuthService
  private jwtManager: JWTManager
  private cacheManager: CacheManager

  private constructor() {
    this.jwtManager = JWTManager.getInstance()
    this.cacheManager = CacheManager.getInstance()
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * User registration
   */
  async register(data: RegisterRequest, ip?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      // Validate input
      if (!validateEmail(data.email)) {
        return {
          success: false,
          message: 'Invalid email format',
          code: 'INVALID_EMAIL'
        }
      }

      if (!validatePassword(data.password)) {
        return {
          success: false,
          message: 'Password does not meet requirements',
          code: 'INVALID_PASSWORD'
        }
      }

      const passwordHash = await this.jwtManager.hashPassword(data.password)

      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [data.email.toLowerCase()]
      )

      if (existingUser.rows.length > 0) {
        logger.warn('Registration attempt with existing email', {
          email: data.email,
          ip
        })

        return {
          success: false,
          message: 'User with this email already exists',
          code: 'EMAIL_EXISTS'
        }
      }

      // Create user in transaction
      const result = await transaction(async (client) => {
        // Insert user
        const userResult = await client.query(
          `INSERT INTO users (
            email, password_hash, full_name, first_name, last_name, phone, role
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING 
            id, email, full_name, first_name, last_name, phone, role, status, 
            email_verified, created_at, updated_at`,
          [
            data.email.toLowerCase(),
            passwordHash,
            data.fullName,
            data.firstName || null,
            data.lastName || null,
            data.phone || null,
            'customer'
          ]
        )

        const user = userResult.rows[0]

        // Create default user preferences
        await client.query(
          `INSERT INTO user_preferences (user_id) VALUES ($1)`,
          [user.id]
        )

        return user
      })

      logger.info('User registered successfully', {
        userId: result.id,
        email: result.email,
        ip
      })

      // Generate tokens
      const tokens = await this.jwtManager.generateTokens({
        userId: result.id,
        email: result.email,
        role: result.role,
        deviceInfo: {
          userAgent,
          ip,
          deviceType: this.detectDeviceType(userAgent)
        }
      })

      // Cache user data
      await this.cacheManager.cacheUser(result.id, result)

      // Remove sensitive data
      const { passwordHash: _, ...safeUser } = result

      return {
        success: true,
        message: 'Registration successful',
        data: {
          user: safeUser,
          tokens
        }
      }

    } catch (error) {
      logger.error('Registration failed', {
        email: data.email,
        error: error instanceof Error ? error.message : error,
        ip
      })

      return {
        success: false,
        message: 'Registration failed',
        error: 'Internal server error'
      }
    }
  }

  /**
   * User login
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = data

      // Validate input
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        }
      }

      // Get user
      const userResult = await query(
        `SELECT id, email, password_hash, full_name, first_name, last_name, 
                phone, role, status, email_verified, locked_until, login_attempts
         FROM users 
         WHERE email = $1 AND status != 'archived'`,
        [email.toLowerCase()]
      )

      if (userResult.rows.length === 0) {
        logger.warn('Login attempt with non-existent email', {
          email,
          ip: data.deviceInfo?.ip
        })

        return {
          success: false,
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }
      }

      const user = userResult.rows[0]

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        logger.warn('Login attempt on locked account', {
          userId: user.id,
          email: user.email,
          lockedUntil: user.locked_until,
          ip: data.deviceInfo?.ip
        })

        return {
          success: false,
          message: 'Account is temporarily locked due to too many failed attempts',
          code: 'ACCOUNT_LOCKED'
        }
      }

      // Verify password
      const isPasswordValid = await this.jwtManager.verifyPassword(password, user.password_hash)

      if (!isPasswordValid) {
        // Increment login attempts
        const newAttempts = (user.login_attempts || 0) + 1
        const shouldLock = newAttempts >= 5

        await query(
          `UPDATE users 
           SET login_attempts = $1, 
               locked_until = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [
            newAttempts,
            shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null, // Lock for 30 minutes
            user.id
          ]
        )

        logger.warn('Failed login attempt', {
          userId: user.id,
          email: user.email,
          attempts: newAttempts,
          ip: data.deviceInfo?.ip
        })

        return {
          success: false,
          message: shouldLock 
            ? 'Account temporarily locked due to too many failed attempts'
            : 'Invalid email or password',
          code: shouldLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS'
        }
      }

      // Reset login attempts on successful login
      await query(
        `UPDATE users 
         SET login_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [user.id]
      )

      // Generate tokens
      const tokens = await this.jwtManager.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceInfo: data.deviceInfo
      })

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: data.deviceInfo?.ip
      })

      // Cache user data
      await this.cacheManager.cacheUser(user.id, user)

      // Remove sensitive data
      const { password_hash: _, ...safeUser } = user

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: safeUser,
          tokens
        }
      }

    } catch (error) {
      logger.error('Login failed', {
        email: data.email,
        error: error instanceof Error ? error.message : error,
        ip: data.deviceInfo?.ip
      })

      return {
        success: false,
        message: 'Login failed',
        error: 'Internal server error'
      }
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ success: boolean; data?: any; message?: string; error?: string; code?: string }> {
    try {
      const tokens = await this.jwtManager.refreshAccessToken(refreshToken)

      return {
        success: true,
        data: tokens
      }

    } catch (error) {
      logger.warn('Token refresh failed', {
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        message: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      }
    }
  }

  /**
   * Logout
   */
  async logout(accessToken: string, refreshToken?: string): Promise<{ success: boolean; message?: string }> {
    try {
      await this.jwtManager.invalidateTokens(accessToken, refreshToken)

      return {
        success: true,
        message: 'Logged out successfully'
      }

    } catch (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        message: 'Logout failed'
      }
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
    try {
      // Get user
      const userResult = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      )

      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      }

      const user = userResult.rows[0]

      // Verify current password
      const isCurrentPasswordValid = await this.jwtManager.verifyPassword(data.currentPassword, user.password_hash)

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        }
      }

      // Validate new password
      if (!validatePassword(data.newPassword)) {
        return {
          success: false,
          message: 'New password does not meet requirements',
          code: 'INVALID_NEW_PASSWORD'
        }
      }

      // Hash new password
      const newPasswordHash = await this.jwtManager.hashPassword(data.newPassword)

      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      )

      logger.info('Password changed successfully', {
        userId,
        timestamp: new Date()
      })

      return {
        success: true,
        message: 'Password changed successfully'
      }

    } catch (error) {
      logger.error('Password change failed', {
        userId,
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        message: 'Password change failed',
        error: 'Internal server error'
      }
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: ResetPasswordRequest): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
    try {
      // Check if user exists
      const userResult = await query(
        'SELECT id, email, status FROM users WHERE email = $1',
        [data.email.toLowerCase()]
      )

      // Always return success to prevent email enumeration
      const genericMessage = 'If an account with that email exists, a password reset link has been sent.'

      if (userResult.rows.length === 0) {
        logger.warn('Password reset requested for non-existent email', {
          email: data.email
        })

        return {
          success: true,
          message: genericMessage
        }
      }

      const user = userResult.rows[0]

      // Check if account is active
      if (user.status !== 'active') {
        return {
          success: true,
          message: genericMessage
        }
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Store reset token (you might want to create a separate table for this)
      await query(
        `INSERT INTO user_sessions (user_id, token, expires_at) 
         VALUES ($1, $2, $3)`,
        [user.id, hashedToken, expiresAt]
      )

      // TODO: Send email with reset link
      // await sendPasswordResetEmail(user.email, resetToken)

      logger.info('Password reset requested', {
        userId: user.id,
        email: user.email
      })

      return {
        success: true,
        message: genericMessage
      }

    } catch (error) {
      logger.error('Password reset request failed', {
        email: data.email,
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        message: 'Password reset request failed',
        error: 'Internal server error'
      }
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: ConfirmResetPasswordRequest): Promise<{ success: boolean; message?: string; error?: string; code?: string }> {
    try {
      const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex')

      // Find valid reset token
      const tokenResult = await query(
        `SELECT us.user_id 
         FROM user_sessions us
         WHERE us.token = $1 AND us.expires_at > NOW()`,
        [hashedToken]
      )

      if (tokenResult.rows.length === 0) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        }
      }

      const userId = tokenResult.rows[0].user_id

      // Validate new password
      if (!validatePassword(data.newPassword)) {
        return {
          success: false,
          message: 'New password does not meet requirements',
          code: 'INVALID_NEW_PASSWORD'
        }
      }

      // Hash new password
      const newPasswordHash = await this.jwtManager.hashPassword(data.newPassword)

      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      )

      // Invalidate all sessions (force re-login)
      // This would require implementing session invalidation for all user sessions

      // Clean up reset token
      await query(
        'DELETE FROM user_sessions WHERE token = $1',
        [hashedToken]
      )

      logger.info('Password reset completed', {
        userId,
        timestamp: new Date()
      })

      return {
        success: true,
        message: 'Password reset successful'
      }

    } catch (error) {
      logger.error('Password reset confirmation failed', {
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        message: 'Password reset failed',
        error: 'Internal server error'
      }
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
    try {
      // Try cache first
      let user = await this.cacheManager.getUser(userId)

      if (!user) {
        // Get from database
        const userResult = await query(
          `SELECT id, email, full_name, first_name, last_name, phone, role, status,
                  avatar, date_of_birth, gender, language, timezone, email_verified,
                  phone_verified, last_login_at, created_at, updated_at
           FROM users 
           WHERE id = $1 AND status != 'archived'`,
          [userId]
        )

        if (userResult.rows.length === 0) {
          return {
            success: false,
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        }

        user = userResult.rows[0]

        // Cache user data
        await this.cacheManager.cacheUser(userId, user)
      }

      return {
        success: true,
        data: user
      }

    } catch (error) {
      logger.error('Failed to get user profile', {
        userId,
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        message: 'Failed to get user profile',
        error: 'Internal server error'
      }
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
    try {
      // Build update query dynamically
      const allowedFields = [
        'full_name', 'first_name', 'last_name', 'phone', 'avatar',
        'date_of_birth', 'gender', 'language', 'timezone'
      ]

      const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key))
      
      if (updateFields.length === 0) {
        return {
          success: false,
          message: 'No valid fields to update',
          code: 'NO_VALID_FIELDS'
        }
      }

      const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ')
      const values = updateFields.map(field => (updates as any)[field])

      const result = await query(
        `UPDATE users 
         SET ${setClause}, updated_at = NOW()
         WHERE id = $1 AND status != 'archived'
         RETURNING id, email, full_name, first_name, last_name, phone, role, status,
                   avatar, date_of_birth, gender, language, timezone, email_verified,
                   phone_verified, last_login_at, created_at, updated_at`,
        [userId, ...values]
      )

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      }

      const updatedUser = result.rows[0]

      // Update cache
      await this.cacheManager.cacheUser(userId, updatedUser)

      logger.info('User profile updated', {
        userId,
        updatedFields: updateFields
      })

      return {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      }

    } catch (error) {
      logger.error('Failed to update user profile', {
        userId,
        error: error instanceof Error ? error.message : error
      })

      return {
        success: false,
        message: 'Failed to update profile',
        error: 'Internal server error'
      }
    }
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown'
    
    const ua = userAgent.toLowerCase()
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }
}

export default AuthService