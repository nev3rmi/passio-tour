import { Request, Response, NextFunction } from 'express'
import { logger } from '@/utils/logger'
import { config } from '@/config/config'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
  details?: any
}

/**
 * Custom error class for operational errors
 */
export class CustomError extends Error implements AppError {
  public statusCode: number
  public code: string
  public isOperational: boolean
  public details?: any

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error
 */
export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details)
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED', true)
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS', true)
  }
}

/**
 * Not found error
 */
export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND', true)
  }
}

/**
 * Conflict error
 */
export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'RESOURCE_CONFLICT', true)
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true)
  }
}

/**
 * Database error
 */
export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', true, details)
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends CustomError {
  constructor(service: string, message: string = 'External service error', details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, { service, ...details })
  }
}

/**
 * JWT error
 */
export class JWTError extends CustomError {
  constructor(message: string = 'Token validation failed') {
    super(message, 401, 'JWT_ERROR', true)
  }
}

/**
 * Send error response
 */
const sendErrorResponse = (
  res: Response,
  error: AppError,
  req: Request,
  includeStack: boolean = false
): void => {
  const statusCode = error.statusCode || 500
  const code = error.code || 'INTERNAL_ERROR'
  
  // Build error response
  const errorResponse: any = {
    success: false,
    message: error.message,
    code,
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId || 'unknown'
  }

  // Add details in development or for client errors
  if (error.details && (config.NODE_ENV === 'development' || statusCode < 500)) {
    errorResponse.details = error.details
  }

  // Add stack trace in development
  if (includeStack && error.stack) {
    errorResponse.stack = error.stack
  }

  // Add request info in development
  if (config.NODE_ENV === 'development') {
    errorResponse.request = {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  }

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn'
  logger[logLevel]('API Error', {
    statusCode,
    code,
    message: error.message,
    requestId: errorResponse.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: error.stack,
    details: error.details
  })

  // Send response
  res.status(statusCode).json(errorResponse)
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If response was already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(error)
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    const validationError = new ValidationError(error.message, error.details)
    return sendErrorResponse(res, validationError, req, true)
  }

  if (error.name === 'CastError') {
    return sendErrorResponse(
      res,
      new CustomError('Invalid resource ID', 400, 'INVALID_ID'),
      req
    )
  }

  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    if ((error as any).code === 11000) {
      return sendErrorResponse(
        res,
        new ConflictError('Resource already exists'),
        req
      )
    }
    return sendErrorResponse(
      res,
      new DatabaseError('Database operation failed'),
      req
    )
  }

  if (error.name === 'JsonWebTokenError') {
    return sendErrorResponse(
      res,
      new JWTError('Invalid token'),
      req
    )
  }

  if (error.name === 'TokenExpiredError') {
    return sendErrorResponse(
      res,
      new JWTError('Token expired'),
      req
    )
  }

  if (error.name === 'SyntaxError' && (error as any).type === 'entity.parse.failed') {
    return sendErrorResponse(
      res,
      new ValidationError('Invalid JSON in request body'),
      req
    )
  }

  if (error.name === 'MulterError') {
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      return sendErrorResponse(
        res,
        new ValidationError('File size too large'),
        req
      )
    }
    if ((error as any).code === 'LIMIT_FILE_COUNT') {
      return sendErrorResponse(
        res,
        new ValidationError('Too many files uploaded'),
        req
      )
    }
  }

  // Handle our custom errors
  if (error instanceof CustomError) {
    return sendErrorResponse(res, error, req, true)
  }

  // Handle unknown errors
  const unexpectedError = new CustomError(
    'An unexpected error occurred',
    500,
    'INTERNAL_ERROR',
    false
  )

  sendErrorResponse(res, unexpectedError, req, true)
}

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`)
  
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: (req as any).requestId
  })

  res.status(404).json({
    success: false,
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId || 'unknown',
    path: req.path,
    method: req.method
  })
}

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Create error response for development
 */
export const createErrorResponse = (
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): AppError => {
  return new CustomError(message, statusCode, code, true, details)
}

/**
 * Validation error helpers
 */
export const createValidationError = (message: string, details?: any): ValidationError => {
  return new ValidationError(message, details)
}

export const createAuthError = (message: string = 'Authentication required'): AuthenticationError => {
  return new AuthenticationError(message)
}

export const createAuthzError = (message: string = 'Insufficient permissions'): AuthorizationError => {
  return new AuthorizationError(message)
}

export const createNotFoundError = (message: string = 'Resource not found'): NotFoundError => {
  return new NotFoundError(message)
}

export const createConflictError = (message: string = 'Resource conflict'): ConflictError => {
  return new ConflictError(message)
}

export const createRateLimitError = (message: string = 'Rate limit exceeded'): RateLimitError => {
  return new RateLimitError(message)
}

/**
 * Validate required fields
 */
export const validateRequired = (
  data: Record<string, any>,
  requiredFields: string[]
): ValidationError | null => {
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field)
    }
  }
  
  if (missingFields.length > 0) {
    return new ValidationError('Missing required fields', {
      missingFields,
      providedFields: Object.keys(data)
    })
  }
  
  return null
}

/**
 * Validate field types
 */
export const validateTypes = (
  data: Record<string, any>,
  validations: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
): ValidationError | null => {
  const typeErrors: string[] = []
  
  for (const [field, expectedType] of Object.entries(validations)) {
    if (data[field] !== undefined) {
      const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field]
      
      if (actualType !== expectedType) {
        typeErrors.push(`${field}: expected ${expectedType}, got ${actualType}`)
      }
    }
  }
  
  if (typeErrors.length > 0) {
    return new ValidationError('Invalid field types', { typeErrors })
  }
  
  return null
}

/**
 * Check if error is operational (expected) vs programming error
 */
export const isOperationalError = (error: Error): boolean => {
  return error instanceof CustomError && error.isOperational === true
}