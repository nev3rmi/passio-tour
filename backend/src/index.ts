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

// Import API routes
// Note: tours router temporarily disabled
// import { toursRouter } from '@/api/routes/tours'
// import { inventoryRouter } from '@/api/routes/inventory'
// import { authRouter } from './routes/auth'

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

    // Temporary mock auth endpoints for testing
    this.express.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body

      // Simple mock authentication (matches seed data)
      if (email === 'admin@passiotour.com' && password === 'Admin@123') {
        const token = 'mock-jwt-token-' + Date.now()
        res.json({
          success: true,
          token,
          user: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'admin@passiotour.com',
            full_name: 'Admin User',
            role: 'admin'
          }
        })
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        })
      }
    })

    this.express.get('/api/auth/me', (req, res) => {
      const authHeader = req.headers.authorization
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

      if (token && token.startsWith('mock-jwt-token-')) {
        res.json({
          success: true,
          user: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'admin@passiotour.com',
            full_name: 'Admin User',
            role: 'admin'
          }
        })
      } else {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        })
      }
    })

    // API routes
    // Note: tours router temporarily disabled due to missing dependencies
    // this.express.use('/api/v1/tours', toursRouter)
    // this.express.use('/api/v1/inventory', inventoryRouter)
    // this.express.use('/api/auth', authRouter)

    // Temporary mock tours endpoint for testing
    this.express.get('/api/v1/tours', async (req, res) => {
      try {
        res.json({
          success: true,
          data: {
            tours: [
              {
                id: '1',
                title: 'Bali Island Paradise',
                name: 'Bali Island Paradise',
                tour_type: 'LEISURE',
                status: 'PUBLISHED',
                short_description: 'Discover the beauty of Bali',
                base_price: 1299,
                currency: 'USD',
                duration_days: 7,
                duration_nights: 6,
                images: []
              }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1
            }
          }
        })
      } catch (error) {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch tours'
          }
        })
      }
    })

    // Temporary mock tour details endpoint for testing
    this.express.get('/api/v1/tours/:id', async (req, res) => {
      try {
        const { id } = req.params

        // Mock tour data with more details
        const tour = {
          id: '1',
          title: 'Bali Island Paradise',
          name: 'Bali Island Paradise',
          tour_type: 'LEISURE',
          status: 'PUBLISHED',
          short_description: 'Discover the beauty of Bali with pristine beaches, ancient temples, and lush rice terraces',
          long_description: 'Experience the magic of Bali on this comprehensive 7-day journey through the Island of Gods. From the stunning beaches of Seminyak to the cultural heart of Ubud, explore ancient temples, witness breathtaking sunsets, and immerse yourself in Balinese traditions. This tour includes visits to iconic landmarks like Tanah Lot Temple, the Tegalalang Rice Terraces, and the sacred Monkey Forest. Enjoy traditional dance performances, indulge in authentic Balinese cuisine, and relax with a rejuvenating spa treatment.',
          base_price: 1299,
          currency: 'USD',
          duration_days: 7,
          duration_nights: 6,
          max_group_size: 12,
          destination: 'Bali, Indonesia',
          images: [
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
            'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800',
            'https://images.unsplash.com/photo-1555400082-6e2a69ad0b8c?w=800'
          ],
          rating: 4.8,
          reviews_count: 127,
          highlights: [
            'Visit ancient temples including Tanah Lot and Uluwatu',
            'Explore the stunning Tegalalang Rice Terraces in Ubud',
            'Traditional Balinese cooking class and market tour',
            'Sunset dinner on Jimbaran Beach',
            'Professional local guide throughout the journey',
            'Experience traditional Kecak fire dance performance'
          ],
          included: [
            '6 nights accommodation in 4-star hotels',
            'Daily breakfast and 4 dinners',
            'All transportation in air-conditioned vehicle',
            'Professional English-speaking guide',
            'Entrance fees to all attractions',
            'Traditional Balinese massage session'
          ],
          not_included: [
            'International flights',
            'Travel insurance',
            'Personal expenses and tips',
            'Lunches (unless specified)',
            'Optional activities not mentioned in itinerary',
            'Visa fees if applicable'
          ]
        }

        if (id !== '1') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'TOUR_NOT_FOUND',
              message: 'Tour not found'
            }
          })
        }

        res.json({
          success: true,
          data: tour
        })
      } catch (error) {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch tour details'
          }
        })
      }
    })

    // API documentation endpoint
    this.express.get('/api', (req, res) => {
      res.json({
        message: 'Passio Tour API',
        version: '1.0.0',
        documentation: 'https://github.com/passio-tour/api-docs',
        endpoints: {
          health: '/health',
          auth: '/api/auth',
          tours: '/api/v1/tours',
          inventory: '/api/v1/inventory',
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