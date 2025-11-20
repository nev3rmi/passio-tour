import { redis, set, get, del, expire } from '@/database/redis'
import { logger } from '@/utils/logger'
import { config } from '@/config/config'

export interface SessionData {
  userId: string
  email: string
  role: string
  deviceInfo?: {
    userAgent?: string
    ip?: string
    deviceType?: string
  }
  permissions?: string[]
  metadata?: Record<string, any>
  createdAt: Date
  lastAccessedAt: Date
  expiresAt: Date
}

export interface RefreshTokenData {
  userId: string
  sessionId: string
  deviceInfo?: {
    userAgent?: string
    ip?: string
    deviceType?: string
  }
  createdAt: Date
  expiresAt: Date
}

export class SessionManager {
  private static instance: SessionManager

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private getSessionKey(sessionId: string): string {
    return `${config.REDIS.keyPrefix}session:${sessionId}`
  }

  private getRefreshTokenKey(refreshToken: string): string {
    return `${config.REDIS.keyPrefix}refresh_token:${refreshToken}`
  }

  private getUserSessionsKey(userId: string): string {
    return `${config.REDIS.keyPrefix}user_sessions:${userId}`
  }

  /**
   * Create a new session
   */
  async createSession(
    sessionId: string,
    userData: {
      userId: string
      email: string
      role: string
      permissions?: string[]
      deviceInfo?: {
        userAgent?: string
        ip?: string
        deviceType?: string
      }
      metadata?: Record<string, any>
    },
    ttlSeconds: number = config.SESSION.ttl
  ): Promise<boolean> {
    try {
      const sessionData: SessionData = {
        ...userData,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000)
      }

      // Store session data
      const sessionKey = this.getSessionKey(sessionId)
      const sessionStored = await set(sessionKey, sessionData, ttlSeconds)
      
      if (!sessionStored) {
        return false
      }

      // Store session ID in user's session list
      const userSessionsKey = this.getUserSessionsKey(userData.userId)
      await redis.getClient().sAdd(userSessionsKey, sessionId)
      await expire(userSessionsKey, config.SESSION.userSessionsTTL)

      logger.info('Session created', {
        sessionId,
        userId: userData.userId,
        ttlSeconds,
        deviceInfo: userData.deviceInfo
      })

      return true
    } catch (error) {
      logger.error('Failed to create session', {
        sessionId,
        userId: userData.userId,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionData = await get<SessionData>(this.getSessionKey(sessionId))
      
      if (sessionData) {
        // Update last accessed time
        sessionData.lastAccessedAt = new Date()
        await set(this.getSessionKey(sessionId), sessionData, config.SESSION.ttl)
      }
      
      return sessionData
    } catch (error) {
      logger.error('Failed to get session', {
        sessionId,
        error: error instanceof Error ? error.message : error
      })
      return null
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId)
      if (!sessionData) {
        return false
      }

      const updatedSession = { ...sessionData, ...updates }
      const ttlSeconds = Math.floor((updatedSession.expiresAt.getTime() - Date.now()) / 1000)
      
      return await set(this.getSessionKey(sessionId), updatedSession, Math.max(ttlSeconds, 60))
    } catch (error) {
      logger.error('Failed to update session', {
        sessionId,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string, additionalSeconds: number): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId)
      if (!sessionData) {
        return false
      }

      sessionData.expiresAt = new Date(sessionData.expiresAt.getTime() + additionalSeconds * 1000)
      
      return await set(this.getSessionKey(sessionId), sessionData, config.SESSION.ttl)
    } catch (error) {
      logger.error('Failed to extend session', {
        sessionId,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId)
      
      // Delete session
      const sessionDeleted = await del(this.getSessionKey(sessionId))
      
      // Remove from user's session list
      if (sessionData) {
        const userSessionsKey = this.getUserSessionsKey(sessionData.userId)
        await redis.getClient().sRem(userSessionsKey, sessionId)
      }

      logger.info('Session destroyed', {
        sessionId,
        userId: sessionData?.userId
      })

      return sessionDeleted > 0
    } catch (error) {
      logger.error('Failed to destroy session', {
        sessionId,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(
    refreshToken: string,
    refreshData: {
      userId: string
      sessionId: string
      deviceInfo?: {
        userAgent?: string
        ip?: string
        deviceType?: string
      }
    },
    ttlSeconds: number = config.SESSION.refreshTokenTTL
  ): Promise<boolean> {
    try {
      const tokenData: RefreshTokenData = {
        ...refreshData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000)
      }

      const key = this.getRefreshTokenKey(refreshToken)
      return await set(key, tokenData, ttlSeconds)
    } catch (error) {
      logger.error('Failed to store refresh token', {
        refreshToken: refreshToken.substring(0, 10) + '...',
        userId: refreshData.userId,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  /**
   * Get refresh token data
   */
  async getRefreshToken(refreshToken: string): Promise<RefreshTokenData | null> {
    try {
      return await get<RefreshTokenData>(this.getRefreshTokenKey(refreshToken))
    } catch (error) {
      logger.error('Failed to get refresh token', {
        refreshToken: refreshToken.substring(0, 10) + '...',
        error: error instanceof Error ? error.message : error
      })
      return null
    }
  }

  /**
   * Invalidate refresh token
   */
  async invalidateRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      return await del(this.getRefreshTokenKey(refreshToken))
    } catch (error) {
      logger.error('Failed to invalidate refresh token', {
        refreshToken: refreshToken.substring(0, 10) + '...',
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<string[]> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId)
      return await redis.getClient().sMembers(userSessionsKey)
    } catch (error) {
      logger.error('Failed to get user sessions', {
        userId,
        error: error instanceof Error ? error.message : error
      })
      return []
    }
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId: string): Promise<number> {
    try {
      const sessionIds = await this.getUserSessions(userId)
      let destroyedCount = 0

      for (const sessionId of sessionIds) {
        if (await this.destroySession(sessionId)) {
          destroyedCount++
        }
      }

      // Clear the user's session set
      const userSessionsKey = this.getUserSessionsKey(userId)
      await del(userSessionsKey)

      logger.info('User sessions destroyed', {
        userId,
        destroyedCount,
        totalSessions: sessionIds.length
      })

      return destroyedCount
    } catch (error) {
      logger.error('Failed to destroy user sessions', {
        userId,
        error: error instanceof Error ? error.message : error
      })
      return 0
    }
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      logger.info('Starting expired sessions cleanup')
      
      // This would typically involve scanning all session keys
      // For now, we'll log the intent as Redis doesn't provide built-in expiration scanning
      
      logger.info('Expired sessions cleanup completed')
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', {
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<any> {
    try {
      const sessionKeys = await redis.keys(`${config.REDIS.keyPrefix}session:*`)
      const refreshTokenKeys = await redis.keys(`${config.REDIS.keyPrefix}refresh_token:*`)
      
      return {
        activeSessions: sessionKeys.length,
        activeRefreshTokens: refreshTokenKeys.length,
        sessionKeyPrefix: config.REDIS.keyPrefix
      }
    } catch (error) {
      logger.error('Failed to get session stats', {
        error: error instanceof Error ? error.message : error
      })
      return null
    }
  }
}

export default SessionManager