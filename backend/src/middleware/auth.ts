import { Request, Response, NextFunction } from 'express'
import JWTManager from '@/services/JWTManager'
import { logger } from '@/utils/logger'

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
    sessionId: string
  }
}

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
  sessionId: string
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const jwtManager = JWTManager.getInstance()
    
    // Extract token from header
    const token = jwtManager.extractTokenFromHeader(authHeader)
    
    if (!token) {
      logger.warn('No authorization token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })
      
      res.status(401).json({
        success: false,
        message: 'Authorization token required',
        code: 'MISSING_TOKEN'
      })
      return
    }

    // Verify token
    const decoded = jwtManager.verifyAccessToken(token)
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId
    }

    logger.debug('User authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      sessionId: decoded.sessionId,
      ip: req.ip
    })

    next()
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : error,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })

    if (error instanceof Error && error.message === 'Token expired') {
      res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      })
      return
    }

    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    })
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const jwtManager = JWTManager.getInstance()
    
    const token = jwtManager.extractTokenFromHeader(authHeader)
    
    if (!token) {
      // No token provided, continue without authentication
      return next()
    }

    // Verify token if provided
    const decoded = jwtManager.verifyAccessToken(token)
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId
    }

    logger.debug('User optionally authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      sessionId: decoded.sessionId
    })

    next()
  } catch (error) {
    // Token verification failed, but continue without authentication
    logger.debug('Optional authentication failed, continuing without user', {
      error: error instanceof Error ? error.message : error
    })
    
    next()
  }
}

/**
 * Authorization middleware - checks user roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      })
      return
    }

    const userRole = req.user.role
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Authorization failed', {
        userId: req.user.userId,
        userRole,
        requiredRoles: allowedRoles,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip
      })

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      })
      return
    }

    logger.debug('Authorization successful', {
      userId: req.user.userId,
      userRole,
      requiredRoles: allowedRoles,
      endpoint: `${req.method} ${req.path}`
    })

    next()
  }
}

/**
 * Role-based authorization helper
 */
export const hasRole = (userRole: string, allowedRoles: string[]): boolean => {
  return allowedRoles.includes(userRole)
}

/**
 * Permission-based authorization helpers
 */
export const isAdmin = (userRole: string): boolean => {
  return userRole === 'admin'
}

export const isTourOperator = (userRole: string): boolean => {
  return userRole === 'tour_operator'
}

export const isPartner = (userRole: string): boolean => {
  return userRole === 'partner'
}

export const isCustomer = (userRole: string): boolean => {
  return userRole === 'customer'
}

export const isStaff = (userRole: string): boolean => {
  return ['admin', 'tour_operator', 'partner'].includes(userRole)
}

/**
 * Check if user owns resource or is staff
 */
export const isOwnerOrStaff = (userId: string, resourceUserId: string, userRole: string): boolean => {
  return userId === resourceUserId || isStaff(userRole)
}

/**
 * Resource ownership middleware - checks if user owns the resource
 */
export const requireOwnership = (userIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      })
      return
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField]
    
    if (!resourceUserId) {
      res.status(400).json({
        success: false,
        message: 'Resource user ID required',
        code: 'MISSING_RESOURCE_USER_ID'
      })
      return
    }

    if (!isOwnerOrStaff(req.user.userId, resourceUserId, req.user.role)) {
      logger.warn('Resource ownership check failed', {
        userId: req.user.userId,
        resourceUserId,
        userRole: req.user.role,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip
      })

      res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
      return
    }

    logger.debug('Resource ownership check passed', {
      userId: req.user.userId,
      resourceUserId,
      userRole: req.user.role,
      endpoint: `${req.method} ${req.path}`
    })

    next()
  }
}

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>()
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}:${req.path}`
    const now = Date.now()
    
    const userAttempts = attempts.get(key)
    
    if (!userAttempts || now > userAttempts.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs })
      return next()
    }
    
    if (userAttempts.count >= maxAttempts) {
      logger.warn('Auth rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        attempts: userAttempts.count,
        resetTime: new Date(userAttempts.resetTime)
      })
      
      res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
      })
      return
    }
    
    userAttempts.count++
    next()
  }
}

export default {
  authenticate,
  optionalAuth,
  authorize,
  requireOwnership,
  hasRole,
  isAdmin,
  isTourOperator,
  isPartner,
  isCustomer,
  isStaff,
  isOwnerOrStaff,
  authRateLimit
}