import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config } from '@/config/config'

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

// Create transports array
const transports: winston.transport[] = []

// Console transport for development
if (config.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.LOGGING.level,
    })
  )
}

// File transports
transports.push(
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: config.LOGGING.maxSize,
    maxFiles: config.LOGGING.maxFiles,
    zippedArchive: true,
  })
)

transports.push(
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: config.LOGGING.maxSize,
    maxFiles: config.LOGGING.maxFiles,
    zippedArchive: true,
  })
)

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOGGING.level,
  format: logFormat,
  transports,
  exitOnError: false,
})

// Create logs directory if it doesn't exist
import fs from 'fs'
import path from 'path'

const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Add custom methods for common use cases
logger.logRequest = (req: any, res: any, responseTime?: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
  }
  
  logger.info('HTTP Request', logData)
}

logger.logError = (error: any, context?: string) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })
}

logger.logSecurity = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
  })
}

logger.logBusiness = (event: string, details: any) => {
  logger.info('Business Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
  })
}

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new DailyRotateFile({
    filename: 'logs/exceptions-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: config.LOGGING.maxSize,
    maxFiles: config.LOGGING.maxFiles,
  })
)

logger.rejections.handle(
  new DailyRotateFile({
    filename: 'logs/rejections-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: config.LOGGING.maxSize,
    maxFiles: config.LOGGING.maxFiles,
  })
)

export default logger