import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { config } from '@/config/config'
import { logger } from '@/utils/logger'
import SessionManager from '@/services/SessionManager'

export interface TokenPayload {
  userId: string
  email: string
  role: string
  sessionId: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  sessionId: string
  iat?: number
  exp?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export class JWTManager {
  private static instance: JWTManager

  public static getInstance(): JWTManager {
    if (!JWTManager.instance) {
      JWTManager.instance = new JWTManager()
    }
    return JWTManager.instance
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(
        payload,
        config.AUTH.jwtSecret,
        {
          expiresIn: config.AUTH.jwtExpiresIn,
          issuer: 'passio-tour-api',
          audience: 'passio-tour-client'
        }
      )

      logger.debug('Access token generated', {
        userId: payload.userId,
        sessionId: payload.sessionId,
        expiresIn: config.AUTH.jwtExpiresIn
      })

      return token
    } catch (error) {
      logger.error('Failed to generate access token', {
        userId: payload.userId,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(
        payload,
        config.AUTH.jwtSecret,
        {
          expiresIn: config.AUTH.refreshTokenExpiresIn,
          issuer: 'passio-tour-api',
          audience: 'passio-tour-client'
        }
      )

      logger.debug('Refresh token generated', {
        userId: payload.userId,
        sessionId: payload.sessionId,
        expiresIn: config.AUTH.refreshTokenExpiresIn
      })

      return token
    } catch (error) {
      logger.error('Failed to generate refresh token', {
        userId: payload.userId,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokens(userData: {
    userId: string
    email: string
    role: string
    deviceInfo?: {
      userAgent?: string
      ip?: string
      deviceType?: string
    }
  }): Promise<AuthTokens> {
    try {
      // Generate unique session ID
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

      // Create session in Redis
      const sessionCreated = await SessionManager.getInstance().createSession(sessionId, {
        userId: userData.userId,
        email: userData.email,
        role: userData.role,
        deviceInfo: userData.deviceInfo
      })

      if (!sessionCreated) {
        throw new Error('Failed to create session')
      }

      // Generate tokens
      const accessToken = this.generateAccessToken({
        userId: userData.userId,
        email: userData.email,
        role: userData.role,
        sessionId
      })

      const refreshToken = this.generateRefreshToken({
        userId: userData.userId,
        sessionId
      })

      // Store refresh token in Redis
      await SessionManager.getInstance().storeRefreshToken(refreshToken, {
        userId: userData.userId,
        sessionId,
        deviceInfo: userData.deviceInfo
      })

      // Calculate expiration time in seconds
      const expiresIn = this.parseExpirationTime(config.AUTH.jwtExpiresIn)

      logger.info('Auth tokens generated successfully', {
        userId: userData.userId,
        sessionId,
        expiresIn
      })

      return {
        accessToken,
        refreshToken,
        expiresIn
      }
    } catch (error) {
      logger.error('Failed to generate auth tokens', {
        userId: userData.userId,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.AUTH.jwtSecret, {
        issuer: 'passio-tour-api',
        audience: 'passio-tour-client'
      }) as TokenPayload

      logger.debug('Access token verified', {
        userId: decoded.userId,
        sessionId: decoded.sessionId
      })

      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Access token expired', {
          error: error.message
        })
        throw new Error('Token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid access token', {
          error: error.message
        })
        throw new Error('Invalid token')
      } else {
        logger.error('Access token verification failed', {
          error: error instanceof Error ? error.message : error
        })
        throw error
      }
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, config.AUTH.jwtSecret, {
        issuer: 'passio-tour-api',
        audience: 'passio-tour-client'
      }) as RefreshTokenPayload

      // Check if refresh token exists in Redis
      const sessionManager = SessionManager.getInstance()
      const tokenData = await sessionManager.getRefreshToken(token)
      
      if (!tokenData) {
        logger.warn('Refresh token not found in storage', {
          userId: decoded.userId,
          sessionId: decoded.sessionId
        })
        throw new Error('Invalid refresh token')
      }

      logger.debug('Refresh token verified', {
        userId: decoded.userId,
        sessionId: decoded.sessionId
      })

      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Refresh token expired', {
          error: error.message
        })
        throw new Error('Refresh token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid refresh token', {
          error: error.message
        })
        throw new Error('Invalid refresh token')
      } else {
        logger.error('Refresh token verification failed', {
          error: error instanceof Error ? error.message : error
        })
        throw error
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = await this.verifyRefreshToken(refreshToken)
      
      const sessionManager = SessionManager.getInstance()
      
      // Get session data
      const sessionData = await sessionManager.getSession(decoded.sessionId)
      if (!sessionData) {
        throw new Error('Session not found')
      }

      // Check if session belongs to the user
      if (sessionData.userId !== decoded.userId) {
        throw new Error('Session user mismatch')
      }

      // Generate new tokens
      const newTokens = await this.generateTokens({
        userId: sessionData.userId,
        email: sessionData.email,
        role: sessionData.role,
        deviceInfo: sessionData.deviceInfo
      })

      // Invalidate old refresh token
      await sessionManager.invalidateRefreshToken(refreshToken)

      logger.info('Access token refreshed successfully', {
        userId: sessionData.userId,
        sessionId: sessionData.sessionId
      })

      return newTokens
    } catch (error) {
      logger.error('Failed to refresh access token', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Invalidate tokens (logout)
   */
  async invalidateTokens(accessToken: string, refreshToken?: string): Promise<boolean> {
    try {
      let sessionId: string | null = null
      
      // Try to extract session ID from access token
      try {
        const decoded = this.verifyAccessToken(accessToken)
        sessionId = decoded.sessionId
      } catch {
        // Token might be expired, try to decode without verification
        const decoded = jwt.decode(accessToken) as TokenPayload
        sessionId = decoded?.sessionId || null
      }

      if (sessionId) {
        const sessionManager = SessionManager.getInstance()
        
        // Destroy session
        await sessionManager.destroySession(sessionId)
        
        // Invalidate refresh token if provided
        if (refreshToken) {
          await sessionManager.invalidateRefreshToken(refreshToken)
        }
      }

      logger.info('Tokens invalidated', { sessionId })
      return true
    } catch (error) {
      logger.error('Failed to invalidate tokens', {
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = config.AUTH.bcryptRounds
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      
      logger.debug('Password hashed', {
        saltRounds
      })
      
      return hashedPassword
    } catch (error) {
      logger.error('Failed to hash password', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword)
      
      logger.debug('Password verification', {
        isValid
      })
      
      return isValid
    } catch (error) {
      logger.error('Failed to verify password', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) {
      return 3600 // Default 1 hour
    }

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 3600
      case 'd': return value * 86400
      default: return 3600
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    return authHeader.substring(7)
  }
}

export default JWTManager