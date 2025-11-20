/**
 * Comprehensive tests for API Response and Error Handling Standards
 * 
 * Tests coverage:
 * 1. ApiResponseBuilder success responses
 * 2. ApiResponseBuilder error responses
 * 3. Paginated responses
 * 4. HTTP status code responses (201, 202, 204)
 * 5. Domain-specific error handling
 * 6. Error normalization
 * 7. Response middleware
 * 8. Logging integration
 */

import {
  ApiResponseBuilder,
  ApiResponse,
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
  UserError,
  TourError,
  BookingError,
  PaymentError,
  DatabaseError,
  CacheError,
  ExternalServiceError,
  JWTError,
  responseFormatter,
  responseTimingMiddleware
} from '@/middleware/apiResponse'

// Mock Request and Response objects
const mockRequest = (overrides: any = {}) => ({
  method: 'GET',
  url: '/api/test',
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('test-agent'),
  correlationId: 'test-correlation-123',
  res: {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  },
  ...overrides
})

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    on: jest.fn(),
    headersSent: false
  } as any

  return res
}

describe('ApiResponseBuilder', () => {
  describe('success()', () => {
    test('should create basic success response', () => {
      const response = ApiResponseBuilder.success({ id: 1, name: 'test' })

      expect(response.success).toBe(true)
      expect(response.data).toEqual({ id: 1, name: 'test' })
      expect(response.timestamp).toBeDefined()
      expect(response.requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/)
      expect(response.version).toBeDefined()
      expect(response.correlationId).toBeUndefined()
    })

    test('should create success response with message and metadata', () => {
      const metadata = { processingTime: 150 }
      const response = ApiResponseBuilder.success(
        { id: 1 },
        'Operation completed successfully',
        metadata,
        mockRequest() as any
      )

      expect(response.success).toBe(true)
      expect(response.message).toBe('Operation completed successfully')
      expect(response.meta?.processingTime).toBe(150)
      expect(response.correlationId).toBe('test-correlation-123')
    })

    test('should create success response with cache metadata', () => {
      const cacheMeta = { cache: { hit: true, ttl: 300, key: 'cache:key' } }
      const response = ApiResponseBuilder.success({ data: 'cached' }, undefined, cacheMeta)

      expect(response.meta?.cache?.hit).toBe(true)
      expect(response.meta?.cache?.ttl).toBe(300)
      expect(response.meta?.cache?.key).toBe('cache:key')
    })
  })

  describe('error()', () => {
    test('should create error response from CustomError', () => {
      const error = new ValidationError('Invalid input', { field: 'email' }, 'email')
      const response = ApiResponseBuilder.error(error, mockRequest() as any)

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('VALIDATION_ERROR')
      expect(response.error?.message).toBe('Invalid input')
      expect(response.error?.field).toBe('email')
      expect(response.error?.details).toEqual({ field: 'email' })
      expect(response.error?.timestamp).toBeDefined()
    })

    test('should create error response from regular Error with includeDetails', () => {
      const error = new Error('Regular error message')
      const response = ApiResponseBuilder.error(error, mockRequest() as any, true)

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('INTERNAL_SERVER_ERROR')
      expect(response.error?.message).toBe('Regular error message')
    })

    test('should hide details in production mode', () => {
      const error = new InternalServerError('Sensitive error', { sensitive: 'data' })
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      try {
        const response = ApiResponseBuilder.error(error, mockRequest() as any)
        expect(response.error?.details).toBeUndefined()
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })
  })

  describe('paginated()', () => {
    test('should create paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const pagination = { page: 1, limit: 2, total: 5 }
      const response = ApiResponseBuilder.paginated(data, pagination, 'Page 1 results')

      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
      expect(response.message).toBe('Page 1 results')
      expect(response.meta?.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
        nextPage: 2,
        prevPage: undefined
      })
    })

    test('should handle last page pagination', () => {
      const data = [{ id: 4 }, { id: 5 }]
      const pagination = { page: 3, limit: 2, total: 5 }
      const response = ApiResponseBuilder.paginated(data, pagination)

      expect(response.meta?.pagination?.hasNext).toBe(false)
      expect(response.meta?.pagination?.hasPrev).toBe(true)
      expect(response.meta?.pagination?.nextPage).toBeUndefined()
      expect(response.meta?.pagination?.prevPage).toBe(2)
    })
  })

  describe('Status Code Responses', () => {
    test('should create 201 Created response', () => {
      const req = mockRequest() as any
      const response = ApiResponseBuilder.created(
        { id: 1, created: true },
        'User created',
        '/api/users/1'
      )

      expect(response.success).toBe(true)
      expect(response.message).toBe('User created')
      expect(req.res.setHeader).toHaveBeenCalledWith('Location', '/api/users/1')
    })

    test('should create 202 Accepted response', () => {
      const response = ApiResponseBuilder.accepted(
        { taskId: 'task-123' },
        'Task queued for processing'
      )

      expect(response.success).toBe(true)
      expect(response.message).toBe('Task queued for processing')
    })

    test('should create 204 No Content response', () => {
      const req = mockRequest() as any
      ApiResponseBuilder.noContent(req)

      expect(req.res.status).toHaveBeenCalledWith(204)
      expect(req.res.send).toHaveBeenCalledWith()
    })
  })

  describe('Convenience Error Methods', () => {
    test('should create validation error response', () => {
      const errors = [
        { field: 'email', message: 'Invalid email format', value: 'invalid-email' },
        { field: 'password', message: 'Password too short', value: '123' }
      ]

      const response = ApiResponseBuilder.validationError(errors)
      
      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('VALIDATION_ERROR')
      expect(response.error?.details?.errors).toEqual(errors)
    })

    test('should create unauthorized response with realm', () => {
      const req = mockRequest() as any
      const response = ApiResponseBuilder.unauthorized('Login required', 'api')

      expect(response.error?.code).toBe('AUTHENTICATION_REQUIRED')
      expect(req.res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer realm="api"')
    })

    test('should create forbidden response', () => {
      const response = ApiResponseBuilder.forbidden('Admin access required')
      
      expect(response.error?.code).toBe('INSUFFICIENT_PERMISSIONS')
    })

    test('should create not found response', () => {
      const response = ApiResponseBuilder.notFound('User not found', 'User')
      
      expect(response.error?.code).toBe('RESOURCE_NOT_FOUND')
      expect(response.error?.message).toBe('User not found')
    })

    test('should create conflict response', () => {
      const response = ApiResponseBuilder.conflict('Email already exists', 'email')
      
      expect(response.error?.code).toBe('RESOURCE_CONFLICT')
      expect(response.error?.field).toBe('email')
    })

    test('should create rate limit response with retry after', () => {
      const req = mockRequest() as any
      const response = ApiResponseBuilder.rateLimit('Too many requests', 60)

      expect(response.error?.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(req.res.setHeader).toHaveBeenCalledWith('Retry-After', '60')
    })

    test('should create service unavailable response', () => {
      const req = mockRequest() as any
      const response = ApiResponseBuilder.serviceUnavailable(
        'Database maintenance',
        'DatabaseService',
        300
      )

      expect(response.error?.code).toBe('SERVICE_UNAVAILABLE')
      expect(req.res.setHeader).toHaveBeenCalledWith('Retry-After', '300')
    })
  })
})

describe('Custom Error Classes', () => {
  describe('Client Errors (4xx)', () => {
    test('should create ValidationError with field info', () => {
      const error = new ValidationError('Invalid email', { invalidChars: '@' }, 'email')
      
      expect(error.message).toBe('Invalid email')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.field).toBe('email')
      expect(error.details).toEqual({ invalidChars: '@' })
      expect(error.isOperational).toBe(true)
      expect(error.timestamp).toBeDefined()
    })

    test('should create AuthenticationError', () => {
      const error = new AuthenticationError('Invalid credentials')
      
      expect(error.message).toBe('Invalid credentials')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_REQUIRED')
    })

    test('should create AuthorizationError', () => {
      const error = new AuthorizationError('Insufficient role')
      
      expect(error.message).toBe('Insufficient role')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('INSUFFICIENT_PERMISSIONS')
    })

    test('should create NotFoundError with resource', () => {
      const error = new NotFoundError('User not found', 'User')
      
      expect(error.message).toBe('User not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('RESOURCE_NOT_FOUND')
      expect(error.details?.resource).toBe('User')
    })

    test('should create ConflictError with field', () => {
      const error = new ConflictError('Email taken', 'email')
      
      expect(error.message).toBe('Email taken')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('RESOURCE_CONFLICT')
      expect(error.field).toBe('email')
    })

    test('should create TooManyRequestsError with retry info', () => {
      const error = new TooManyRequestsError('Rate limit exceeded', { retryAfter: 60 })
      
      expect(error.message).toBe('Rate limit exceeded')
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(error.details?.retryAfter).toBe(60)
    })
  })

  describe('Server Errors (5xx)', () => {
    test('should create InternalServerError', () => {
      const error = new InternalServerError('Database connection failed')
      
      expect(error.message).toBe('Database connection failed')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.isOperational).toBe(true)
    })

    test('should create ServiceUnavailableError with service info', () => {
      const error = new ServiceUnavailableError('Service down', 'AuthService', 300)
      
      expect(error.message).toBe('Service down')
      expect(error.statusCode).toBe(503)
      expect(error.code).toBe('SERVICE_UNAVAILABLE')
      expect(error.details?.service).toBe('AuthService')
      expect(error.details?.retryAfter).toBe(300)
    })
  })

  describe('Domain-Specific Errors', () => {
    test('should create UserError', () => {
      const error = new UserError('Invalid user data')
      
      expect(error.message).toBe('Invalid user data')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('USER_ERROR')
    })

    test('should create TourError', () => {
      const error = new TourError('Tour not available')
      
      expect(error.message).toBe('Tour not available')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('TOUR_ERROR')
    })

    test('should create BookingError', () => {
      const error = new BookingError('Date already booked')
      
      expect(error.message).toBe('Date already booked')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('BOOKING_ERROR')
    })

    test('should create PaymentError', () => {
      const error = new PaymentError('Insufficient funds')
      
      expect(error.message).toBe('Insufficient funds')
      expect(error.statusCode).toBe(402)
      expect(error.code).toBe('PAYMENT_ERROR')
    })

    test('should create DatabaseError', () => {
      const error = new DatabaseError('Connection timeout')
      
      expect(error.message).toBe('Connection timeout')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('DATABASE_ERROR')
    })

    test('should create CacheError', () => {
      const error = new CacheError('Cache service unavailable')
      
      expect(error.message).toBe('Cache service unavailable')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('CACHE_ERROR')
    })

    test('should create ExternalServiceError with service name', () => {
      const error = new ExternalServiceError('Stripe', 'Payment processing failed')
      
      expect(error.message).toBe('Payment processing failed')
      expect(error.statusCode).toBe(502)
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR')
      expect(error.details?.service).toBe('Stripe')
    })

    test('should create JWTError', () => {
      const error = new JWTError('Token malformed')
      
      expect(error.message).toBe('Token malformed')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('JWT_ERROR')
    })
  })
})

describe('Error Normalization', () => {
  test('should normalize MongoDB duplicate key error', () => {
    const mongodbError = new Error('E11000 duplicate key error collection: users index: email_1 dup key: { email: "test@example.com" }')
    mongodbError.name = 'MongoServerError'
    ;(mongodbError as any).code = 11000

    const response = ApiResponseBuilder.error(mongodbError, mockRequest() as any)
    
    expect(response.error?.code).toBe('RESOURCE_CONFLICT')
    expect(response.error?.message).toBe('Resource conflict')
  })

  test('should normalize JSON Web Token errors', () => {
    const jwtError = new Error('jwt malformed')
    jwtError.name = 'JsonWebTokenError'

    const response = ApiResponseBuilder.error(jwtError, mockRequest() as any)
    
    expect(response.error?.code).toBe('JWT_ERROR')
    expect(response.error?.message).toBe('Token validation failed')
  })

  test('should normalize JWT expired error', () => {
    const jwtError = new Error('jwt expired')
    jwtError.name = 'TokenExpiredError'

    const response = ApiResponseBuilder.error(jwtError, mockRequest() as any)
    
    expect(response.error?.code).toBe('JWT_ERROR')
    expect(response.error?.message).toBe('Token expired')
  })

  test('should normalize JSON parsing errors', () => {
    const parseError = new Error('Unexpected token in JSON')
    parseError.name = 'SyntaxError'
    ;(parseError as any).type = 'entity.parse.failed'

    const response = ApiResponseBuilder.error(parseError, mockRequest() as any)
    
    expect(response.error?.code).toBe('VALIDATION_ERROR')
    expect(response.error?.message).toBe('Invalid JSON in request body')
  })
})

describe('Response Middleware', () => {
  describe('responseFormatter', () => {
    test('should wrap plain objects in API response format', () => {
      const req = mockRequest() as any
      const res = mockResponse()
      const next = jest.fn()

      responseFormatter(req, res, next)

      // Test that res.json wraps plain objects
      res.json({ id: 1, name: 'test' })
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { id: 1, name: 'test' }
        })
      )
    })

    test('should not wrap responses already in API format', () => {
      const req = mockRequest() as any
      const res = mockResponse()
      const next = jest.fn()

      responseFormatter(req, res, next)

      const apiResponse = { success: true, data: { id: 1 } }
      res.json(apiResponse)

      expect(res.json).toHaveBeenCalledWith(apiResponse)
    })

    test('should call next middleware', () => {
      const req = mockRequest() as any
      const res = mockResponse()
      const next = jest.fn()

      responseFormatter(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
    })
  })

  describe('responseTimingMiddleware', () => {
    test('should add response time header', () => {
      const req = mockRequest() as any
      const res = mockResponse()
      const next = jest.fn()

      // Mock Date.now for consistent timing
      const mockDateNow = jest.spyOn(Date, 'now')
      mockDateNow.mockReturnValueOnce(1000).mockReturnValueOnce(2500)

      responseTimingMiddleware(req, res, next)

      // Simulate response finish
      const finishCallback = (res.on as any).mock.calls[0][1]
      finishCallback()

      expect(res.setHeader).toHaveBeenCalledWith('X-Response-Time', '1500ms')
      expect(next).toHaveBeenCalledTimes(1)

      mockDateNow.mockRestore()
    })

    test('should log slow responses', () => {
      const req = mockRequest() as any
      const res = mockResponse()
      const next = jest.fn()

      // Mock slow response time
      const mockDateNow = jest.spyOn(Date, 'now')
      mockDateNow.mockReturnValueOnce(1000).mockReturnValueOnce(7000) // 6 seconds

      const originalWarn = console.warn
      console.warn = jest.fn()

      try {
        responseTimingMiddleware(req, res, next)

        const finishCallback = (res.on as any).mock.calls[0][1]
        finishCallback()

        expect(console.warn).toHaveBeenCalledWith(
          'Slow API response detected',
          expect.objectContaining({
            method: 'GET',
            url: '/api/test',
            duration: '6000ms'
          })
        )
      } finally {
        console.warn = originalWarn
        mockDateNow.mockRestore()
      }
    })
  })
})

describe('Edge Cases and Integration', () => {
  test('should handle empty data objects', () => {
    const response1 = ApiResponseBuilder.success(null)
    const response2 = ApiResponseBuilder.success(undefined)
    const response3 = ApiResponseBuilder.success([])

    expect(response1.data).toBeNull()
    expect(response2.data).toBeUndefined()
    expect(response3.data).toEqual([])
  })

  test('should handle complex nested metadata', () => {
    const complexMetadata = {
      pagination: { page: 1, limit: 10, total: 100 },
      filtering: {
        applied: { status: 'active', category: 'adventure' },
        available: {
          status: ['active', 'inactive', 'pending'],
          category: ['adventure', 'cultural', 'nature']
        }
      },
      sorting: {
        field: 'name',
        order: 'asc',
        available: ['name', 'price', 'rating', 'date']
      },
      processingTime: 125,
      cache: { hit: false }
    }

    const response = ApiResponseBuilder.success(
      [{ id: 1 }, { id: 2 }],
      'Complex query results',
      complexMetadata
    )

    expect(response.meta).toEqual(complexMetadata)
  })

  test('should generate unique request IDs', () => {
    const id1 = ApiResponseBuilder.success({}).requestId
    const id2 = ApiResponseBuilder.success({}).requestId

    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^req_\d+_[a-z0-9]{9}$/)
    expect(id2).toMatch(/^req_\d+_[a-z0-9]{9}$/)
  })

  test('should preserve correlation IDs through request chain', () => {
    const reqWithCorrelation = mockRequest({ correlationId: 'correlation-abc-123' }) as any
    const response = ApiResponseBuilder.success({ data: 'test' }, undefined, undefined, reqWithCorrelation)

    expect(response.correlationId).toBe('correlation-abc-123')
  })
})