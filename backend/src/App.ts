import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import connectRedis from 'connect-redis'
import { config } from '@/config/config'
import { logger } from '@/utils/logger'
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler'
import { authenticate, optionalAuth } from '@/middleware/auth'
import { db } from '@/database/connection'
import { redis } from '@/database/redis'

// Route imports
import authRoutes from '@/routes/auth'
import userRoutes from '@/routes/users'
import tourRoutes from '@/routes/tours'
import bookingRoutes from '@/routes/bookings'
import adminRoutes from '@/routes/admin'

// Health check route
import healthRoutes from '@/routes/health'

export class App {
  private app: Application

  constructor() {
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
  }

  private setupMiddleware(): void {
    // Trust proxy (for rate limiting behind load balancer)
    this.app.set('trust proxy', 1)

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }))

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true)
        
        const allowedOrigins = [
          config.FRONTEND_URL,
          'http://localhost:3000',
          'http://localhost:3001',
          ...config.SECURITY.corsOrigins
        ]

        if (allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          logger.warn('CORS request from unauthorized origin', { origin })
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    }))

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // Cookie parser
    this.app.use(cookieParser())

    // Compression middleware
    this.app.use(compression())

    // Session configuration (for server-side sessions if needed)
    if (config.NODE_ENV === 'production') {
      this.app.use(session({
        store: new connectRedis({ 
          client: redis.getClient() as any,
          prefix: 'sess:'
        }),
        secret: config.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        name: 'passio.sid',
        cookie: {
          secure: true, // Set to true when using HTTPS
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'strict'
        }
      }))
    }

    // Logging middleware
    if (config.NODE_ENV === 'production') {
      // Use morgan for HTTP request logging in production
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => {
            logger.info('HTTP Request', { message: message.trim() })
          }
        }
      }))
    } else {
      // More detailed logging in development
      this.app.use(morgan('dev', {
        stream: {
          write: (message: string) => {
            logger.debug('HTTP Request', { message: message.trim() })
          }
        }
      }))
    }

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT.windowMs,
      max: config.RATE_LIMIT.max,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        })

        res.status(429).json({
          success: false,
          message: 'Too many requests from this IP, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        })
      }
    })

    this.app.use('/api', limiter)

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      ;(req as any).requestId = requestId
      res.setHeader('X-Request-ID', requestId as string)
      next()
    })

    // Request logging with context
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now()
      
      res.on('finish', () => {
        const duration = Date.now() - startTime
        const requestId = (req as any).requestId
        
        logger.info('Request completed', {
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          contentLength: res.get('Content-Length') || 0
        })
      })

      next()
    })
  }

  private setupRoutes(): void {
    // Health check routes (no authentication required)
    this.app.use('/health', healthRoutes)

    // API routes
    const apiRouter = express.Router()

    // Public routes
    apiRouter.use('/auth', authRoutes)

    // Protected routes (authentication required)
    apiRouter.use('/users', authenticate, userRoutes)
    apiRouter.use('/tours', optionalAuth, tourRoutes) // Tours can be viewed without auth
    apiRouter.use('/bookings', authenticate, bookingRoutes)
    apiRouter.use('/admin', authenticate, adminRoutes)

    // Mount API router
    this.app.use('/api/v1', apiRouter)

    // API documentation route
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Passio Tour API',
        version: '1.0.0',
        documentation: {
          baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
          endpoints: {
            auth: {
              'POST /api/v1/auth/register': 'Register new user',
              'POST /api/v1/auth/login': 'User login',
              'POST /api/v1/auth/refresh': 'Refresh access token',
              'POST /api/v1/auth/logout': 'User logout',
              'POST /api/v1/auth/forgot-password': 'Request password reset',
              'POST /api/v1/auth/reset-password': 'Reset password with token'
            },
            users: {
              'GET /api/v1/users/profile': 'Get user profile',
              'PUT /api/v1/users/profile': 'Update user profile',
              'POST /api/v1/users/change-password': 'Change password'
            },
            tours: {
              'GET /api/v1/tours': 'Get all tours (with filters)',
              'GET /api/v1/tours/:id': 'Get tour by ID',
              'POST /api/v1/tours': 'Create new tour (operators/admin)',
              'PUT /api/v1/tours/:id': 'Update tour (operators/admin)',
              'DELETE /api/v1/tours/:id': 'Delete tour (operators/admin)'
            },
            bookings: {
              'GET /api/v1/bookings': 'Get user bookings',
              'POST /api/v1/bookings': 'Create new booking',
              'GET /api/v1/bookings/:id': 'Get booking by ID',
              'PUT /api/v1/bookings/:id': 'Update booking',
              'DELETE /api/v1/bookings/:id': 'Cancel booking'
            },
            admin: {
              'GET /api/v1/admin/dashboard': 'Admin dashboard data',
              'GET /api/v1/admin/users': 'Get all users (admin)',
              'GET /api/v1/admin/bookings': 'Get all bookings (admin)',
              'GET /api/v1/admin/tours': 'Get all tours (admin)'
            }
          }
        }
      })
    })

    // Catch-all for undefined API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        code: 'ENDPOINT_NOT_FOUND',
        path: req.path,
        method: req.method
      })
    })

    // Static file serving (for uploaded files, docs, etc.)
    if (config.NODE_ENV === 'development') {
      this.app.use('/static', express.static('uploads'))
    }

    // Frontend routing (for SPA) - should be last
    if (config.NODE_ENV === 'production') {
      this.app.use(express.static('frontend/dist'))
      
      this.app.get('*', (req: Request, res: Response) => {
        res.sendFile('frontend/dist/index.html', { root: process.cwd() })
      })
    }
  }

  private setupErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(notFoundHandler)

    // Global error handler
    this.app.use(errorHandler)

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      })
      
      // Graceful shutdown
      process.exit(1)
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise.toString()
      })
      
      // Graceful shutdown
      process.exit(1)
    })

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`)
      
      try {
        // Close database connections
        await db.disconnect()
        logger.info('Database connections closed')
        
        // Close Redis connection
        await redis.disconnect()
        logger.info('Redis connections closed')
        
        logger.info('Graceful shutdown completed')
        process.exit(0)
      } catch (error) {
        logger.error('Error during graceful shutdown', {
          error: error instanceof Error ? error.message : error
        })
        process.exit(1)
      }
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  }

  public getApp(): Application {
    return this.app
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await db.connect()
      logger.info('Database connected')
      
      // Initialize Redis connection
      await redis.connect()
      logger.info('Redis connected')
      
      // Start the server
      const port = config.PORT
      this.app.listen(port, () => {
        logger.info(`Server started successfully`, {
          port,
          environment: config.NODE_ENV,
          frontendUrl: config.FRONTEND_URL,
          pid: process.pid
        })
        
        if (config.NODE_ENV === 'development') {
          console.log(`
🚀 Server is running!
📍 Environment: ${config.NODE_ENV}
🌐 Port: ${port}
🔗 API URL: http://localhost:${port}/api/v1
📖 API Docs: http://localhost:${port}/api
💚 Health Check: http://localhost:${port}/health
          `)
        }
      })
      
    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }
}

export default App