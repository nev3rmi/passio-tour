import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config } from '@/config/secureConfig'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

/**
 * Enhanced Structured Logging Infrastructure
 * 
 * Features:
 * 1. Structured logging with correlation IDs
 * 2. Contextual logging for different domains
 * 3. Performance and metrics logging
 * 4. Security event logging
 * 5. Business event logging
 * 6. Database query logging
 * 7. Request/response logging middleware
 * 8. Environment-specific configurations
 * 9. Log filtering and levels
 * 10. Integration with external monitoring
 */

// ==============================================
// LOG FORMATS AND CONFIGURATION
// ==============================================

interface LogMetadata {
  [key: string]: any
}

interface StructuredLogEntry {
  timestamp: string
  level: string
  message: string
  service: string
  environment: string
  version?: string
  correlationId?: string
  traceId?: string
  spanId?: string
  parentSpanId?: string
  metadata?: LogMetadata
}

// Enhanced log format with structured data
const structuredLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const logEntry: StructuredLogEntry = {
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: 'passio-tour-api',
      environment: config.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      correlationId: info.correlationId,
      traceId: info.traceId,
      spanId: info.spanId,
      parentSpanId: info.parentSpanId,
      metadata: info.metadata
    }

    return JSON.stringify(logEntry)
  })
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, metadata } = info
    const corrId = correlationId ? `[${correlationId}]` : ''
    const metaStr = metadata ? ` ${JSON.stringify(metadata, null, 0)}` : ''
    return `${timestamp} ${level}${corrId} ${message}${metaStr}`
  })
)

// ==============================================
// LOG TRANSPORTS CONFIGURATION
// ==============================================

interface TransportConfig {
  level: string
  filename: string
  maxSize?: string
  maxFiles?: string | number
  datePattern?: string
  format?: any
  zippedArchive?: boolean
  options?: any
}

const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = []

  // Console transport for development
  if (config.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: config.LOGGING?.level || 'debug',
      })
    )
  }

  // File transports with environment-specific configuration
  const fileTransports: TransportConfig[] = [
    {
      level: 'error',
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: config.LOGGING?.maxSize || '20m',
      maxFiles: config.LOGGING?.maxFiles || '14d',
      format: structuredLogFormat,
      zippedArchive: true
    },
    {
      level: 'warn',
      filename: 'logs/warn-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: config.LOGGING?.maxSize || '20m',
      maxFiles: config.LOGGING?.maxFiles || '14d',
      format: structuredLogFormat,
      zippedArchive: true
    },
    {
      level: 'info',
      filename: 'logs/info-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: config.LOGGING?.maxSize || '20m',
      maxFiles: config.LOGGING?.maxFiles || '14d',
      format: structuredLogFormat,
      zippedArchive: true
    },
    {
      level: 'debug',
      filename: 'logs/debug-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: config.LOGGING?.maxSize || '20m',
      maxFiles: config.LOGGING?.maxFiles || '7d',
      format: structuredLogFormat,
      zippedArchive: true,
      options: { flags: 'a' } // Append mode
    }
  ]

  // Production-specific transports
  if (config.NODE_ENV === 'production') {
    fileTransports.push(
      {
        level: 'combined',
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: '30d',
        format: structuredLogFormat,
        zippedArchive: true
      }
    )
  }

  // Create file transports
  fileTransports.forEach(transport => {
    transports.push(
      new DailyRotateFile({
        filename: transport.filename,
        datePattern: transport.datePattern,
        maxSize: transport.maxSize,
        maxFiles: transport.maxFiles,
        format: transport.format,
        zippedArchive: transport.zippedArchive,
        ...transport.options
      })
    )
  })

  return transports
}

// ==============================================
// ENHANCED LOGGER CLASS
// ==============================================

export class EnhancedLogger {
  private winstonLogger: winston.Logger
  private serviceName: string

  constructor(serviceName: string = 'passio-tour-api') {
    this.serviceName = serviceName
    this.winstonLogger = winston.createLogger({
      level: config.LOGGING?.level || 'info',
      format: structuredLogFormat,
      transports: createTransports(),
      exitOnError: false,
    })

    this.setupExceptionHandling()
    this.setupRejectionHandling()
  }

  private setupExceptionHandling(): void {
    // Uncaught exceptions
    this.winstonLogger.exceptions.handle(
      new DailyRotateFile({
        filename: 'logs/exceptions-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: config.LOGGING?.maxSize || '20m',
        maxFiles: config.LOGGING?.maxFiles || '30d',
        format: structuredLogFormat,
        zippedArchive: true
      })
    )

    // Unhandled promise rejections
    this.winstonLogger.rejections.handle(
      new DailyRotateFile({
        filename: 'logs/rejections-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: config.LOGGING?.maxSize || '20m',
        maxFiles: config.LOGGING?.maxFiles || '30d',
        format: structuredLogFormat,
        zippedArchive: true
      })
    )
  }

  // Base logging methods
  private log(level: string, message: string, metadata?: LogMetadata, correlationId?: string): void {
    this.winstonLogger.log(level, message, {
      service: this.serviceName,
      environment: config.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      correlationId: correlationId || this.getCorrelationId(),
      metadata
    })
  }

  debug(message: string, metadata?: LogMetadata, correlationId?: string): void {
    this.log('debug', message, metadata, correlationId)
  }

  info(message: string, metadata?: LogMetadata, correlationId?: string): void {
    this.log('info', message, metadata, correlationId)
  }

  warn(message: string, metadata?: LogMetadata, correlationId?: string): void {
    this.log('warn', message, metadata, correlationId)
  }

  error(message: string, metadata?: LogMetadata, correlationId?: string): void {
    this.log('error', message, metadata, correlationId)
  }

  fatal(message: string, metadata?: LogMetadata, correlationId?: string): void {
    this.log('error', `FATAL: ${message}`, metadata, correlationId)
  }

  // ==============================================
  // CONTEXTUAL LOGGING METHODS
  // ==============================================

  // HTTP Request logging
  logRequest(
    req: Request,
    res: Response,
    responseTime?: number,
    correlationId?: string
  ): void {
    const metadata: LogMetadata = {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      userAgent: req.get('User-Agent'),
      ip: this.getClientIP(req),
      contentLength: res.get('content-length'),
      referer: req.get('Referer'),
    }

    // Add user context if available
    if (req.user) {
      metadata.user = {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email
      }
    }

    // Add request context
    metadata.requestId = req.headers['x-request-id'] || correlationId

    const level = res.statusCode >= 400 ? 'warn' : 'info'
    this.log(level, 'HTTP Request', metadata, correlationId)
  }

  // Business event logging
  logBusiness(event: string, details: LogMetadata, correlationId?: string): void {
    this.info(`Business Event: ${event}`, {
      event,
      category: 'business',
      ...details
    }, correlationId)
  }

  // Security event logging
  logSecurity(
    event: string,
    details: LogMetadata & { severity?: 'low' | 'medium' | 'high' | 'critical' },
    correlationId?: string
  ): void {
    const severity = details.severity || 'medium'
    const level = severity === 'high' || severity === 'critical' ? 'error' : 'warn'

    this.log(level, `Security Event: ${event}`, {
      event,
      category: 'security',
      severity,
      ...details
    }, correlationId)

    // Alert on critical security events
    if (severity === 'critical') {
      this.fatal(`CRITICAL SECURITY EVENT: ${event}`, details, correlationId)
    }
  }

  // Database query logging
  logDatabase(
    operation: 'query' | 'transaction' | 'connection',
    details: LogMetadata & { 
      duration?: number
      rowsAffected?: number
      query?: string
      table?: string
      success?: boolean
    },
    correlationId?: string
  ): void {
    const level = details.success === false ? 'error' : 'debug'
    
    this.log(level, `Database ${operation}`, {
      operation,
      category: 'database',
      duration: details.duration ? `${details.duration}ms` : undefined,
      rowsAffected: details.rowsAffected,
      table: details.table,
      success: details.success,
      // Don't log actual query text in production for security
      query: config.NODE_ENV === 'production' ? '[REDACTED]' : details.query
    }, correlationId)
  }

  // Performance logging
  logPerformance(
    operation: string,
    details: LogMetadata & {
      duration?: number
      memoryUsage?: any
      cpuUsage?: any
    },
    correlationId?: string
  ): void {
    const metadata = {
      operation,
      category: 'performance',
      duration: details.duration ? `${details.duration}ms` : undefined,
      memoryUsage: details.memoryUsage,
      cpuUsage: details.cpuUsage,
      ...details
    }

    // Log performance warnings
    if (details.duration && details.duration > 5000) {
      this.warn(`Slow operation detected: ${operation}`, metadata, correlationId)
    } else {
      this.debug(`Performance: ${operation}`, metadata, correlationId)
    }
  }

  // Cache logging
  logCache(
    operation: 'get' | 'set' | 'delete' | 'hit' | 'miss',
    key: string,
    details?: LogMetadata & { hit?: boolean; ttl?: number },
    correlationId?: string
  ): void {
    this.debug(`Cache ${operation}`, {
      operation: `cache_${operation}`,
      category: 'cache',
      key: this.sanitizeCacheKey(key),
      hit: details?.hit,
      ttl: details?.ttl,
      ...details
    }, correlationId)
  }

  // Authentication logging
  logAuth(
    event: 'login' | 'logout' | 'token_refresh' | 'password_reset' | 'registration',
    details: LogMetadata & { 
      success?: boolean
      userId?: string
      method?: string
      failureReason?: string
    },
    correlationId?: string
  ): void {
    const level = details.success === false ? 'warn' : 'info'
    
    this.log(level, `Authentication: ${event}`, {
      event: `auth_${event}`,
      category: 'authentication',
      userId: details.userId,
      method: details.method,
      success: details.success,
      failureReason: details.failureReason,
      ...details
    }, correlationId)

    // Log security events for failed auth attempts
    if (details.success === false) {
      this.logSecurity('Authentication failure', {
        event: `auth_${event}_failure`,
        userId: details.userId,
        failureReason: details.failureReason,
        severity: 'medium'
      }, correlationId)
    }
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           'unknown'
  }

  private sanitizeCacheKey(key: string): string {
    // Remove sensitive parts from cache keys
    return key.replace(/[a-f0-9]{32,}/gi, '[REDACTED]')
  }

  private getCorrelationId(): string | undefined {
    // In a real application, this would get the correlation ID from context
    // For now, we'll generate one if needed
    return uuidv4()
  }

  // Create child logger with additional context
  child(context: LogMetadata): EnhancedLogger {
    const childLogger = new EnhancedLogger(this.serviceName)
    
    // Override the log method to include context
    const originalLog = childLogger.log.bind(childLogger)
    childLogger.log = (level: string, message: string, metadata?: LogMetadata, correlationId?: string) => {
      const mergedMetadata = { ...context, ...metadata }
      originalLog(level, message, mergedMetadata, correlationId)
    }

    return childLogger
  }

  // Flush all transports (useful for testing)
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.winstonLogger.end()
      setTimeout(resolve, 1000) // Give time for logs to be written
    })
  }
}

// ==============================================
// REQUEST CORRELATION MIDDLEWARE
// ==============================================

export const correlationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate or use existing correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4()
  
  // Attach to request for use in logging
  req.correlationId = correlationId
  
  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId)
  
  next()
}

// ==============================================
// REQUEST LOGGING MIDDLEWARE
// ==============================================

export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now()
  
  // Override res.end to capture response time
  const originalEnd = res.end
  res.end = function(...args: any[]) {
    const responseTime = Date.now() - startTime
    
    // Log the request
    logger.logRequest(req, res, responseTime, req.correlationId)
    
    // Call original end method
    originalEnd.apply(this, args)
  }
  
  next()
}

// ==============================================
// PERFORMANCE MONITORING MIDDLEWARE
// ==============================================

export const performanceMiddleware = (
  threshold: number = 1000
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint()
    
    res.on('finish', () => {
      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds
      
      if (duration > threshold) {
        logger.logPerformance('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: Math.round(duration),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        }, req.correlationId)
      }
    })
    
    next()
  }
}

// ==============================================
// EXPORTS
// ==============================================

// Create default logger instance
export const logger = new EnhancedLogger('passio-tour-api')

// Export middleware functions
export {
  correlationMiddleware,
  requestLoggingMiddleware,
  performanceMiddleware
}

// Export types for external use
export type {
  LogMetadata,
  StructuredLogEntry
}

export default logger