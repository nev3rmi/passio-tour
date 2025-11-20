import { Request, Response, NextFunction } from 'express'
import { logger, EnhancedLogger } from '@/utils/enhancedLogger'
import { config } from '@/config/secureConfig'

/**
 * Comprehensive API Response and Error Handling Standards
 * 
 * Features:
 * 1. Standardized response formats
 * 2. Enhanced error types and taxonomy
 * 3. Response builder utilities
 * 4. Pagination standards
 * 5. Success response helpers
 * 6. Error code taxonomy
 * 7. Response metadata standards
 */

// ==============================================
// API RESPONSE INTERFACES
// ==============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: ApiError
  meta?: ResponseMetadata
  timestamp: string
  requestId: string
  correlationId?: string
  version?: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
  field?: string
  path?: string
  timestamp: string
}

export interface ResponseMetadata {
  pagination?: PaginationMetadata
  filtering?: FilterMetadata
  sorting?: SortMetadata
  version?: string
  processingTime?: number
  cache?: CacheMetadata
}

export interface PaginationMetadata {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  nextPage?: number
  prevPage?: number
}

export interface FilterMetadata {
  applied: Record<string, any>
  available: Record<string, any[]>
}

export interface SortMetadata {
  field: string
  order: 'asc' | 'desc'
  available: string[]
}

export interface CacheMetadata {
  hit: boolean
  ttl?: number
  key?: string
}

// ==============================================
// ENHANCED ERROR CLASSES
// ==============================================

export interface AppError extends Error {
  statusCode: number
  code: string
  isOperational: boolean
  details?: any
  field?: string
  path?: string
  timestamp: string
  correlationId?: string
}

/**
 * Base custom error class
 */
export class CustomError extends Error implements AppError {
  public statusCode: number
  public code: string
  public isOperational: boolean
  public details?: any
  public field?: string
  public path?: string
  public timestamp: string
  public correlationId?: string

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any,
    field?: string,
    path?: string
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.details = details
    this.field = field
    this.path = path
    this.timestamp = new Date().toISOString()

    Error.captureStackTrace(this, this.constructor)
  }
}

// ==============================================
// ERROR TAXONOMY
// ==============================================

// Client Errors (4xx)
export class ValidationError extends CustomError {
  constructor(message: string = 'Validation failed', details?: any, field?: string) {
    super(message, 400, 'VALIDATION_ERROR', true, details, field)
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, 'AUTHENTICATION_REQUIRED', true, details)
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS', true, details)
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found', resource?: string, details?: any) {
    super(message, 404, 'RESOURCE_NOT_FOUND', true, { resource, ...details })
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict', field?: string, details?: any) {
    super(message, 409, 'RESOURCE_CONFLICT', true, details, field)
  }
}

export class UnsupportedMediaTypeError extends CustomError {
  constructor(message: string = 'Unsupported media type', details?: any) {
    super(message, 415, 'UNSUPPORTED_MEDIA_TYPE', true, details)
  }
}

export class UnprocessableEntityError extends CustomError {
  constructor(message: string = 'Unprocessable entity', details?: any) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', true, details)
  }
}

export class TooManyRequestsError extends CustomError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, details)
  }
}

// Server Errors (5xx)
export class InternalServerError extends CustomError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', true, details)
  }
}

export class NotImplementedError extends CustomError {
  constructor(message: string = 'Not implemented', details?: any) {
    super(message, 501, 'NOT_IMPLEMENTED', true, details)
  }
}

export class BadGatewayError extends CustomError {
  constructor(message: string = 'Bad gateway', service?: string, details?: any) {
    super(message, 502, 'BAD_GATEWAY', true, { service, ...details })
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message: string = 'Service unavailable', service?: string, retryAfter?: number, details?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', true, { service, retryAfter, ...details })
  }
}

export class GatewayTimeoutError extends CustomError {
  constructor(message: string = 'Gateway timeout', service?: string, details?: any) {
    super(message, 504, 'GATEWAY_TIMEOUT', true, { service, ...details })
  }
}

// Domain-Specific Errors
export class UserError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'USER_ERROR', true, details)
  }
}

export class TourError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'TOUR_ERROR', true, details)
  }
}

export class BookingError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'BOOKING_ERROR', true, details)
  }
}

export class PaymentError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 402, 'PAYMENT_ERROR', true, details)
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', true, details)
  }
}

export class CacheError extends CustomError {
  constructor(message: string = 'Cache operation failed', details?: any) {
    super(message, 500, 'CACHE_ERROR', true, details)
  }
}

export class ExternalServiceError extends CustomError {
  constructor(service: string, message: string = 'External service error', details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, { service, ...details })
  }
}

export class JWTError extends CustomError {
  constructor(message: string = 'Token validation failed', details?: any) {
    super(message, 401, 'JWT_ERROR', true, details)
  }
}

// ==============================================
// API RESPONSE BUILDER
// ==============================================

export class ApiResponseBuilder {
  private static logger = new EnhancedLogger('api-response')

  /**
   * Create success response
   */
  static success<T>(
    data?: T,
    message?: string,
    metadata?: ResponseMetadata,
    req?: Request
  ): ApiResponse<T> {
    const responseId = this.generateRequestId()
    
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: responseId,
      version: process.env.npm_package_version || '1.0.0'
    }

    if (metadata) {
      response.meta = metadata
    }

    if (req?.correlationId) {
      response.correlationId = req.correlationId
    }

    // Log successful response
    this.logger.info('API Success Response', {
      statusCode: 200,
      requestId: responseId,
      correlationId: response.correlationId,
      method: req?.method,
      url: req?.url,
      dataSize: data ? JSON.stringify(data).length : 0
    })

    return response
  }

  /**
   * Create error response
   */
  static error(
    error: AppError | Error,
    req?: Request,
    includeDetails: boolean = false
  ): ApiResponse {
    const responseId = this.generateRequestId()
    const correlationId = req?.correlationId

    // Convert regular Error to CustomError if needed
    const appError = this.normalizeError(error)

    const response: ApiResponse = {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: includeDetails || config.NODE_ENV !== 'production' ? appError.details : undefined,
        field: appError.field,
        path: appError.path,
        timestamp: appError.timestamp
      },
      timestamp: new Date().toISOString(),
      requestId: responseId,
      version: process.env.npm_package_version || '1.0.0'
    }

    if (correlationId) {
      response.correlationId = correlationId
    }

    // Log error
    const logLevel = appError.statusCode >= 500 ? 'error' : 'warn'
    this.logger.log(logLevel, 'API Error Response', {
      statusCode: appError.statusCode,
      code: appError.code,
      message: appError.message,
      requestId: responseId,
      correlationId,
      method: req?.method,
      url: req?.url,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      stack: appError.stack,
      details: appError.details
    })

    return response
  }

  /**
   * Create paginated response
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number
      limit: number
      total: number
    },
    message?: string,
    metadata?: Omit<ResponseMetadata, 'pagination'>,
    req?: Request
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(pagination.total / pagination.limit)
    const hasNext = pagination.page < totalPages
    const hasPrev = pagination.page > 1

    const paginationMeta: PaginationMetadata = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? pagination.page + 1 : undefined,
      prevPage: hasPrev ? pagination.page - 1 : undefined
    }

    return this.success(
      data,
      message,
      {
        ...metadata,
        pagination: paginationMeta
      },
      req
    )
  }

  /**
   * Create created response (201)
   */
  static created<T>(
    data: T,
    message: string = 'Resource created successfully',
    location?: string,
    metadata?: ResponseMetadata,
    req?: Request
  ): ApiResponse<T> {
    const response = this.success(data, message, metadata, req)
    
    // Add Location header for created resources
    if (location && req?.res) {
      req.res.setHeader('Location', location)
    }

    return response
  }

  /**
   * Create accepted response (202)
   */
  static accepted<T>(
    data: T,
    message: string = 'Request accepted for processing',
    metadata?: ResponseMetadata,
    req?: Request
  ): ApiResponse<T> {
    return this.success(data, message, metadata, req)
  }

  /**
   * Create no content response (204)
   */
  static noContent(req?: Request): void {
    const responseId = this.generateRequestId()
    
    this.logger.info('API No Content Response', {
      statusCode: 204,
      requestId: responseId,
      method: req?.method,
      url: req?.url
    })

    if (req?.res) {
      req.res.status(204).send()
    }
  }

  /**
   * Create validation error response
   */
  static validationError(
    errors: Array<{ field: string; message: string; value?: any }>,
    message: string = 'Validation failed',
    req?: Request
  ): ApiResponse {
    const validationError = new ValidationError(message, { errors })
    return this.error(validationError, req)
  }

  /**
   * Create unauthorized response
   */
  static unauthorized(
    message: string = 'Authentication required',
    realm?: string,
    req?: Request
  ): ApiResponse {
    const authError = new AuthenticationError(message, { realm })
    
    // Add WWW-Authenticate header if realm is provided
    if (realm && req?.res) {
      req.res.setHeader('WWW-Authenticate', `Bearer realm="${realm}"`)
    }

    return this.error(authError, req)
  }

  /**
   * Create forbidden response
   */
  static forbidden(
    message: string = 'Insufficient permissions',
    req?: Request
  ): ApiResponse {
    const authzError = new AuthorizationError(message)
    return this.error(authzError, req)
  }

  /**
   * Create not found response
   */
  static notFound(
    message: string = 'Resource not found',
    resource?: string,
    req?: Request
  ): ApiResponse {
    const notFoundError = new NotFoundError(message, resource)
    return this.error(notFoundError, req)
  }

  /**
   * Create conflict response
   */
  static conflict(
    message: string = 'Resource conflict',
    field?: string,
    req?: Request
  ): ApiResponse {
    const conflictError = new ConflictError(message, field)
    return this.error(conflictError, req)
  }

  /**
   * Create rate limit response
   */
  static rateLimit(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    req?: Request
  ): ApiResponse {
    const rateLimitError = new TooManyRequestsError(message, { retryAfter })
    
    // Add Retry-After header
    if (retryAfter && req?.res) {
      req.res.setHeader('Retry-After', retryAfter.toString())
    }

    return this.error(rateLimitError, req)
  }

  /**
   * Create service unavailable response
   */
  static serviceUnavailable(
    message: string = 'Service temporarily unavailable',
    service?: string,
    retryAfter?: number,
    req?: Request
  ): ApiResponse {
    const serviceError = new ServiceUnavailableError(message, service, retryAfter)
    
    // Add Retry-After header
    if (retryAfter && req?.res) {
      req.res.setHeader('Retry-After', retryAfter.toString())
    }

    return this.error(serviceError, req)
  }

  private static normalizeError(error: Error | AppError): AppError {
    if (error instanceof CustomError) {
      return error
    }

    // Convert common error types
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, (error as any).details)
    }

    if (error.name === 'CastError') {
      return new ValidationError('Invalid resource ID', undefined, (error as any).path)
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      if ((error as any).code === 11000) {
        return new ConflictError('Resource already exists')
      }
      return new DatabaseError('Database operation failed')
    }

    if (error.name === 'JsonWebTokenError') {
      return new JWTError('Invalid token')
    }

    if (error.name === 'TokenExpiredError') {
      return new JWTError('Token expired')
    }

    if (error.name === 'SyntaxError' && (error as any).type === 'entity.parse.failed') {
      return new ValidationError('Invalid JSON in request body')
    }

    // Default to internal server error
    return new InternalServerError(error.message)
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ==============================================
// RESPONSE MIDDLEWARE
// ==============================================

/**
 * Response formatter middleware
 */
export const responseFormatter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Override res.json to always use API response format
  const originalJson = res.json.bind(res)
  
  res.json = (body: any): Response => {
    // If response is already in API format, send as is
    if (body && typeof body === 'object' && 'success' in body) {
      return originalJson(body)
    }
    
    // Wrap success responses in API format
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return originalJson(ApiResponseBuilder.success(body, undefined, undefined, req))
    }
    
    // For error responses, let error handler deal with it
    return originalJson(body)
  }
  
  next()
}

/**
 * Response timing middleware
 */
export const responseTimingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    
    // Add processing time to response headers
    res.setHeader('X-Response-Time', `${duration}ms`)
    
    // Log slow responses
    if (duration > 5000) {
      logger.warn('Slow API response detected', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        requestId: (req as any).requestId
      })
    }
  })
  
  next()
}

// ==============================================
// EXPORTS
// ==============================================

// Main exports
export {
  ApiResponseBuilder as Response,
  CustomError
}

// Convenience exports for error classes
export {
  ValidationError as ValidationErr,
  AuthenticationError as AuthError,
  AuthorizationError as AuthzError,
  NotFoundError as NotFoundErr,
  ConflictError as ConflictErr,
  InternalServerError as InternalErr,
  DatabaseError as DatabaseErr,
  ExternalServiceError as ExternalErr,
  JWTError as JWTErr
}

export default ApiResponseBuilder