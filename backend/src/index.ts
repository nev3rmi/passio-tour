import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import rateLimit from 'express-rate-limit'
import { Server } from 'socket.io'
import { createServer } from 'http'

import { config } from '@/config/config'
import { logger } from '@/utils/logger'
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler'
import { validateEnv } from '@/utils/validateEnv'

// Import routes (will be created in later phases)
// import authRoutes from '@/api/routes/auth'
// import tourRoutes from '@/api/routes/tours'

class App {
  public express: express.Application
  public server: any
  public io: Server

  constructor() {
    this.express = express()
    this.server = createServer(this.express)
    this.io = new Server(this.server, {
      cors: {
        origin: config.FRONTEND_URL,
        credentials: true,
      },
    })

    this.initializeMiddlewares()
    this.initializeRoutes()
    this.initializeErrorHandling()
    this.initializeWebSocket()
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.express.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }))

    // CORS configuration
    this.express.use(cors({
      origin: config.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }))

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
    this.express.use(limiter)

    // Body parsing middleware
    this.express.use(express.json({ limit: '10mb' }))
    this.express.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // Cookie parsing
    this.express.use(cookieParser())

    // Session management
    this.express.use(session({
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }))

    // Compression middleware
    this.express.use(compression())

    // Logging middleware
    if (process.env.NODE_ENV !== 'test') {
      this.express.use(morgan('combined', {
        stream: { write: message => logger.info(message.trim()) }
      }))
    }

    // Request logging for development
    if (process.env.NODE_ENV === 'development') {
      this.express.use(morgan('dev'))
    }
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.express.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        message: 'Passio Tour API is running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      })
    })

    // API routes will be added here in later phases
    // this.express.use('/api/v1/auth', authRoutes)
    // this.express.use('/api/v1/tours', tourRoutes)

    // API documentation endpoint
    this.express.get('/api', (req, res) => {
      res.json({
        message: 'Passio Tour API',
        version: '1.0.0',
        documentation: 'https://github.com/passio-tour/api-docs',
        endpoints: {
          health: '/health',
          auth: '/api/v1/auth',
          tours: '/api/v1/tours',
          bookings: '/api/v1/bookings',
          users: '/api/v1/users',
        },
      })
    })
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.express.use(notFoundHandler)

    // Global error handler
    this.express.use(errorHandler)
  }

  private initializeWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`)

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`)
      })

      // TODO: Add WebSocket event handlers for real-time features
      // - Real-time inventory updates
      // - Booking notifications
      // - User presence
    })
  }

  public listen(): void {
    this.server.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT}`)
      logger.info(`📱 Frontend URL: ${config.FRONTEND_URL}`)
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`📚 API Documentation: http://localhost:${config.PORT}/api`)
    })
  }
}

// Validate environment variables
try {
  validateEnv()
} catch (error) {
  logger.error('Environment validation failed:', error)
  process.exit(1)
}

// Create and start the server
const app = new App()

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  app.server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  app.server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start the server only if this file is run directly (not when imported)
if (require.main === module) {
  app.listen()
}

export default app