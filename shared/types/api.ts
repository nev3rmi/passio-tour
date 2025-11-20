import { ApiResponse as BaseApiResponse, ErrorResponse, SuccessResponse, PaginatedResponse } from './index'

// Common API request/response interfaces
export interface ApiRequest<T = any> {
  data?: T
  params?: Record<string, string | number>
  query?: Record<string, string | number>
  headers?: Record<string, string>
}

export interface ApiResponse<T = any> extends BaseApiResponse<T> {
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasNext?: boolean
    hasPrev?: boolean
  }
}

// HTTP Status codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

// API Error codes
export enum ApiErrorCode {
  // General errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  
  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_ALREADY_VERIFIED = 'EMAIL_ALREADY_VERIFIED',
  INVALID_VERIFICATION_TOKEN = 'INVALID_VERIFICATION_TOKEN',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  
  // Tour errors
  TOUR_NOT_FOUND = 'TOUR_NOT_FOUND',
  TOUR_UNAVAILABLE = 'TOUR_UNAVAILABLE',
  TOUR_CAPACITY_EXCEEDED = 'TOUR_CAPACITY_EXCEEDED',
  INVALID_TOUR_DATE = 'INVALID_TOUR_DATE',
  
  // Booking errors
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  BOOKING_ALREADY_CONFIRMED = 'BOOKING_ALREADY_CONFIRMED',
  BOOKING_ALREADY_CANCELLED = 'BOOKING_ALREADY_CANCELLED',
  BOOKING_DATE_PASSED = 'BOOKING_DATE_PASSED',
  CANNOT_CANCEL_BOOKING = 'CANNOT_CANCEL_BOOKING',
  
  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  REFUND_FAILED = 'REFUND_FAILED',
  
  // Database errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR = 'SMS_SERVICE_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
}

// API Response builders
export const createSuccessResponse = <T>(data?: T, message?: string, meta?: any): SuccessResponse<T> => ({
  success: true,
  data,
  message,
  meta,
  timestamp: new Date().toISOString(),
})

export const createErrorResponse = (
  error: string, 
  code?: ApiErrorCode, 
  details?: any
): ErrorResponse => ({
  success: false,
  error,
  code,
  details,
  timestamp: new Date().toISOString(),
})

// Pagination helpers
export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  },
})

// HTTP Method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'

// API endpoint definition
export interface ApiEndpoint {
  path: string
  method: HttpMethod
  description: string
  requiresAuth?: boolean
  requiresRole?: string[]
  rateLimited?: boolean
  rateLimitPerMinute?: number
}

// Validation rule interface
export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'uuid' | 'enum' | 'array' | 'object'
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  enum?: any[]
  items?: ValidationRule
  properties?: Record<string, ValidationRule>
  custom?: (value: any) => boolean | string
}

// Schema definition for request/response validation
export interface ApiSchema {
  body?: Record<string, ValidationRule>
  query?: Record<string, ValidationRule>
  params?: Record<string, ValidationRule>
  response?: {
    [statusCode: number]: Record<string, ValidationRule>
  }
}

// WebSocket message types
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: string
  userId?: string
  sessionId?: string
}

export enum WebSocketMessageType {
  CONNECTION_ESTABLISHED = 'connection_established',
  CONNECTION_CLOSED = 'connection_closed',
  AUTHENTICATION_REQUIRED = 'authentication_required',
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_FAILED = 'authentication_failed',
  
  // Booking events
  BOOKING_CREATED = 'booking_created',
  BOOKING_UPDATED = 'booking_updated',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_CONFIRMED = 'booking_confirmed',
  
  // Payment events
  PAYMENT_PROCESSED = 'payment_processed',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_PROCESSED = 'refund_processed',
  
  // Tour events
  TOUR_UPDATED = 'tour_updated',
  TOUR_CAPACITY_CHANGED = 'tour_capacity_changed',
  TOUR_DATE_BLOCKED = 'tour_date_blocked',
  
  // Notification events
  NOTIFICATION_SENT = 'notification_sent',
  SYSTEM_NOTIFICATION = 'system_notification',
  
  // Error events
  ERROR_OCCURRED = 'error_occurred',
  WEBSOCKET_ERROR = 'websocket_error',
}

// API Documentation types
export interface ApiDocumentation {
  title: string
  version: string
  description?: string
  servers: ApiServer[]
  endpoints: Record<string, ApiEndpoint>
  schemas: Record<string, ApiSchema>
  security: ApiSecurity[]
}

export interface ApiServer {
  url: string
  description: string
  variables?: Record<string, { default: string; description: string }>
}

export interface ApiSecurity {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: 'bearer' | 'basic' | 'digest'
  bearerFormat?: string
  name?: string
  in?: 'header' | 'query' | 'cookie'
  description?: string
}

// Health check types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    externalApis?: ServiceHealth
    email?: ServiceHealth
  }
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  lastChecked: string
  message?: string
}

// File upload types
export interface FileUploadRequest {
  file: File
  bucket?: string
  folder?: string
  allowedTypes?: string[]
  maxSize?: number
  metadata?: Record<string, string>
}

export interface FileUploadResponse {
  url: string
  key: string
  bucket: string
  size: number
  contentType: string
  etag?: string
  metadata?: Record<string, string>
}

// API Rate limiting
export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Search and filtering
export interface SearchFilters {
  query?: string
  filters?: Record<string, any>
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
  pagination?: {
    page: number
    limit: number
  }
}

export interface SearchResponse<T> {
  results: T[]
  total: number
  facets?: Record<string, Array<{ value: string; count: number }>>
  suggestions?: string[]
}