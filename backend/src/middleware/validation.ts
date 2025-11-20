import { body, param, query, header, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { ValidationError } from './errorHandler'
import { logger } from '@/utils/logger'

/**
 * Comprehensive Input Validation and Sanitization Middleware
 * 
 * Features:
 * 1. Express-validator integration with custom rules
 * 2. Input sanitization for different data types
 * 3. Validation middleware factories
 * 4. Sanitization utilities
 * 5. Security-focused validation rules
 */

// ==============================================
// SANITIZATION UTILITIES
// ==============================================

export class InputSanitizer {
  /**
   * Sanitize HTML/script content
   */
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/[<>]/g, '') // Remove < and > brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/on\w+='[^']*'/gi, '') // Remove event handlers with single quotes
      .trim()
  }

  /**
   * Sanitize SQL injection patterns
   */
  static sanitizeSQL(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|script|exec)\b)/gi, '')
      .replace(/(['";\\])/g, '\\$1') // Escape quotes and backslashes
      .trim()
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return ''
    
    return email
      .toLowerCase()
      .replace(/[^a-z0-9@._+-]/g, '') // Allow only valid email characters
      .trim()
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhone(phone: string): string {
    if (typeof phone !== 'string') return ''
    
    return phone
      .replace(/[^\d+\-\s()]/g, '') // Remove invalid characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url: string): string {
    if (typeof url !== 'string') return ''
    
    // Remove dangerous protocols and scripts
    return url
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim()
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') return ''
    
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 255) // Limit length
  }

  /**
   * Sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    if (typeof query !== 'string') return ''
    
    return query
      .replace(/[<>"']/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 200) // Limit length
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: any, defaultValue: number = 0): number {
    const num = parseFloat(input)
    return isNaN(num) ? defaultValue : num
  }

  /**
   * Sanitize integer input
   */
  static sanitizeInteger(input: any, defaultValue: number = 0): number {
    const num = parseInt(input, 10)
    return isNaN(num) ? defaultValue : num
  }

  /**
   * Sanitize boolean input
   */
  static sanitizeBoolean(input: any): boolean {
    if (typeof input === 'boolean') return input
    if (typeof input === 'string') {
      const lower = input.toLowerCase().trim()
      return ['true', '1', 'yes', 'on'].includes(lower)
    }
    if (typeof input === 'number') return input > 0
    return false
  }

  /**
   * Sanitize array input
   */
  static sanitizeArray(input: any): string[] {
    if (!Array.isArray(input)) return []
    return input
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0)
  }

  /**
   * Deep sanitize object (recursive)
   */
  static deepSanitize(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj === 'string') return this.sanitizeHTML(obj)
    if (Array.isArray(obj)) return obj.map(item => this.deepSanitize(item))
    if (typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.deepSanitize(value)
      }
      return sanitized
    }
    return obj
  }
}

// ==============================================
// VALIDATION RULES
// ==============================================

export const ValidationRules = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .customSanitizer((value: string) => InputSanitizer.sanitizeEmail(value)),

  // Password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .trim(),

  // Full name validation
  fullName: body('fullName')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters')
    .customSanitizer((value: string) => InputSanitizer.sanitizeHTML(value))
    .trim(),

  // First name validation
  firstName: body('firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .customSanitizer((value: string) => InputSanitizer.sanitizeHTML(value))
    .trim(),

  // Last name validation
  lastName: body('lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .customSanitizer((value: string) => InputSanitizer.sanitizeHTML(value))
    .trim(),

  // Phone validation
  phone: body('phone')
    .optional()
    .matches(/^[\+]?[\d\s\-\(\)]{10,20}$/)
    .withMessage('Please provide a valid phone number')
    .customSanitizer((value: string) => InputSanitizer.sanitizePhone(value)),

  // UUID validation
  uuid: param('id')
    .isUUID()
    .withMessage('Invalid ID format'),

  // MongoDB ObjectId validation
  objectId: param('id')
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid ID format'),

  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000')
    .toInt()
    .customSanitizer((value: number) => Math.max(1, value)),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
    .customSanitizer((value: number) => Math.min(100, Math.max(1, value))),

  // Search query validation
  search: query('search')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters')
    .customSanitizer((value: string) => InputSanitizer.sanitizeSearchQuery(value)),

  // Price validation
  price: body('basePrice')
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Price must be between 0 and 999999.99')
    .toFloat()
    .customSanitizer((value: number) => Math.round(value * 100) / 100), // Round to 2 decimal places

  // Tour type validation
  tourType: body('type')
    .isIn([
      'adventure', 'cultural', 'historical', 'nature', 'food', 'city',
      'beach', 'mountain', 'wildlife', 'religious', 'luxury', 'budget',
      'family', 'solo', 'couple', 'group', 'custom'
    ])
    .withMessage('Invalid tour type'),

  // Difficulty validation
  difficulty: body('difficulty')
    .optional()
    .isIn(['easy', 'moderate', 'challenging', 'difficult'])
    .withMessage('Invalid difficulty level'),

  // Status validation
  status: body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft', 'archived'])
    .withMessage('Invalid status'),

  // Date validation
  date: body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .toDate(),

  // URL validation
  url: body('url')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Please provide a valid URL')
    .customSanitizer((value: string) => InputSanitizer.sanitizeURL(value)),

  // Array validation
  tags: body('tags')
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage('Tags must be an array with 0-10 items')
    .customSanitizer((value: string[]) => InputSanitizer.sanitizeArray(value)),

  // Description validation
  description: body('description')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters')
    .customSanitizer((value: string) => InputSanitizer.sanitizeHTML(value))
    .trim(),

  // Short description validation
  shortDescription: body('shortDescription')
    .optional()
    .isLength({ min: 0, max: 500 })
    .withMessage('Short description must be between 0 and 500 characters')
    .customSanitizer((value: string) => InputSanitizer.sanitizeHTML(value))
    .trim(),
}

// ==============================================
// VALIDATION MIDDLEWARE FACTORIES
// ==============================================

export class ValidationMiddleware {
  /**
   * Create validation middleware for request body
   */
  static validateBody(validationRules: any[] = []) {
    return [
      ...validationRules,
      (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req)
        
        if (!errors.isEmpty()) {
          logger.warn('Validation failed for request body', {
            errors: errors.array(),
            body: req.body,
            path: req.path,
            method: req.method
          })
          
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: {
                errors: errors.array().map(error => ({
                  field: error.type === 'field' ? error.path : 'unknown',
                  message: error.msg,
                  value: error.type === 'field' ? error.value : undefined
                }))
              }
            }
          })
        }

        // Sanitize the body if validation passes
        req.body = InputSanitizer.deepSanitize(req.body)
        next()
      }
    ]
  }

  /**
   * Create validation middleware for URL parameters
   */
  static validateParams(validationRules: any[] = []) {
    return [
      ...validationRules,
      (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req)
        
        if (!errors.isEmpty()) {
          logger.warn('Validation failed for URL parameters', {
            errors: errors.array(),
            params: req.params,
            path: req.path,
            method: req.method
          })
          
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Parameter validation failed',
              details: {
                errors: errors.array().map(error => ({
                  field: error.type === 'field' ? error.path : 'unknown',
                  message: error.msg,
                  value: error.type === 'field' ? error.value : undefined
                }))
              }
            }
          })
        }

        // Sanitize the parameters if validation passes
        req.params = InputSanitizer.deepSanitize(req.params)
        next()
      }
    ]
  }

  /**
   * Create validation middleware for query parameters
   */
  static validateQuery(validationRules: any[] = []) {
    return [
      ...validationRules,
      (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req)
        
        if (!errors.isEmpty()) {
          logger.warn('Validation failed for query parameters', {
            errors: errors.array(),
            query: req.query,
            path: req.path,
            method: req.method
          })
          
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Query validation failed',
              details: {
                errors: errors.array().map(error => ({
                  field: error.type === 'field' ? error.path : 'unknown',
                  message: error.msg,
                  value: error.type === 'field' ? error.value : undefined
                }))
              }
            }
          })
        }

        // Sanitize the query if validation passes
        req.query = InputSanitizer.deepSanitize(req.query)
        next()
      }
    ]
  }

  /**
   * Create validation middleware for headers
   */
  static validateHeaders(validationRules: any[] = []) {
    return [
      ...validationRules,
      (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req)
        
        if (!errors.isEmpty()) {
          logger.warn('Validation failed for headers', {
            errors: errors.array(),
            headers: req.headers,
            path: req.path,
            method: req.method
          })
          
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Header validation failed',
              details: {
                errors: errors.array().map(error => ({
                  field: error.type === 'field' ? error.path : 'unknown',
                  message: error.msg
                }))
              }
            }
          })
        }

        next()
      }
    ]
  }

  /**
   * Generic validation middleware that validates body, params, and query
   */
  static validate(
    bodyRules: any[] = [],
    paramRules: any[] = [],
    queryRules: any[] = []
  ) {
    return [
      // First validate and sanitize params
      ...ValidationMiddleware.validateParams(paramRules),
      // Then validate and sanitize query
      ...ValidationMiddleware.validateQuery(queryRules),
      // Finally validate and sanitize body
      ...ValidationMiddleware.validateBody(bodyRules)
    ]
  }
}

// ==============================================
// PREBUILT VALIDATION SCHEMAS
// ==============================================

export const ValidationSchemas = {
  // User registration
  userRegistration: [
    ValidationRules.email,
    ValidationRules.password,
    ValidationRules.fullName,
    body('firstName').optional().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters').trim(),
    body('lastName').optional().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters').trim(),
    body('phone').optional().matches(/^[\+]?[\d\s\-\(\)]{10,20}$/).withMessage('Please provide a valid phone number')
  ],

  // User login
  userLogin: [
    ValidationRules.email,
    body('password').notEmpty().withMessage('Password is required').trim()
  ],

  // Tour creation
  tourCreation: [
    body('title').isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters').trim(),
    ValidationRules.description,
    body('shortDescription').optional().isLength({ min: 0, max: 500 }).withMessage('Short description must be between 0 and 500 characters').trim(),
    ValidationRules.tourType,
    ValidationRules.price,
    body('duration').isObject().withMessage('Duration must be an object'),
    body('location').isObject().withMessage('Location must be an object'),
    body('maxParticipants').isInt({ min: 1, max: 1000 }).withMessage('Max participants must be between 1 and 1000').toInt(),
    ValidationRules.difficulty
  ],

  // Tour update
  tourUpdate: [
    body('title').optional().isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters').trim(),
    body('description').optional().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters').trim(),
    body('shortDescription').optional().isLength({ min: 0, max: 500 }).withMessage('Short description must be between 0 and 500 characters').trim(),
    body('basePrice').optional().isFloat({ min: 0, max: 999999.99 }).withMessage('Price must be between 0 and 999999.99').toFloat(),
    body('maxParticipants').optional().isInt({ min: 1, max: 1000 }).withMessage('Max participants must be between 1 and 1000').toInt(),
    ValidationRules.status
  ],

  // Booking creation
  bookingCreation: [
    body('tourId').isUUID().withMessage('Invalid tour ID'),
    body('participants').isInt({ min: 1, max: 20 }).withMessage('Participants must be between 1 and 20').toInt(),
    body('bookingDate').isISO8601().withMessage('Please provide a valid booking date').toDate(),
    body('specialRequests').optional().isLength({ max: 1000 }).withMessage('Special requests must be less than 1000 characters').trim()
  ],

  // Common pagination
  pagination: [
    ValidationRules.page,
    ValidationRules.limit,
    query('sortBy').optional().isIn(['created_at', 'updated_at', 'title', 'price']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],

  // Common ID parameter
  idParam: [
    ValidationRules.uuid
  ],

  // Search query
  search: [
    ValidationRules.search
  ]
}

// ==============================================
// INPUT SANITIZATION MIDDLEWARE
// ==============================================

export const SanitizationMiddleware = {
  /**
   * Sanitize all inputs in request
   */
  sanitizeRequest: (req: Request, res: Response, next: NextFunction) => {
    // Sanitize body
    if (req.body) {
      req.body = InputSanitizer.deepSanitize(req.body)
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = InputSanitizer.deepSanitize(req.query)
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = InputSanitizer.deepSanitize(req.params)
    }

    next()
  },

  /**
   * Sanitize specific fields only
   */
  sanitizeFields: (fields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const sanitizeField = (obj: any, field: string) => {
        if (obj[field]) {
          if (typeof obj[field] === 'string') {
            obj[field] = InputSanitizer.sanitizeHTML(obj[field])
          } else if (Array.isArray(obj[field])) {
            obj[field] = obj[field].map((item: any) => 
              typeof item === 'string' ? InputSanitizer.sanitizeHTML(item) : item
            )
          }
        }
      }

      // Sanitize body fields
      if (req.body) {
        fields.forEach(field => sanitizeField(req.body, field))
      }

      // Sanitize query fields
      if (req.query) {
        fields.forEach(field => sanitizeField(req.query, field))
      }

      // Sanitize param fields
      if (req.params) {
        fields.forEach(field => sanitizeField(req.params, field))
      }

      next()
    }
  }
}

export default ValidationMiddleware