import { Router, Request, Response } from 'express'
import { db } from '@/database/connection'
import { redis } from '@/database/redis'
import { asyncHandler, createErrorResponse } from '@/middleware/errorHandler'

const router = Router()

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}))

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with dependencies
 * @access  Public
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const health = {
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: {
      database: { status: 'unknown', responseTime: null },
      redis: { status: 'unknown', responseTime: null },
      memory: { status: 'unknown', usage: null },
      uptime: { status: 'healthy', value: process.uptime() }
    }
  }

  const checks = health.checks

  // Database health check
  try {
    const dbStart = Date.now()
    const dbHealthy = await db.ping()
    const dbResponseTime = Date.now() - dbStart
    
    checks.database = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      responseTime: `${dbResponseTime}ms`
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      responseTime: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    health.success = false
    health.message = 'Service unhealthy - database error'
  }

  // Redis health check
  try {
    const redisStart = Date.now()
    const redisHealthy = await redis.ping()
    const redisResponseTime = Date.now() - redisStart
    
    checks.redis = {
      status: redisHealthy === 'PONG' ? 'healthy' : 'unhealthy',
      responseTime: `${redisResponseTime}ms`
    }
  } catch (error) {
    checks.redis = {
      status: 'error',
      responseTime: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    health.success = false
    health.message = 'Service unhealthy - Redis error'
  }

  // Memory health check
  try {
    const memoryUsage = process.memoryUsage()
    const totalMemory = memoryUsage.heapTotal + memoryUsage.external + memoryUsage.rss
    const usedMemory = memoryUsage.heapUsed
    const memoryUsagePercent = (usedMemory / totalMemory) * 100
    
    checks.memory = {
      status: memoryUsagePercent > 90 ? 'warning' : 'healthy',
      usage: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        percentage: `${memoryUsagePercent.toFixed(2)}%`
      }
    }
  } catch (error) {
    checks.memory = {
      status: 'error',
      usage: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Set response status based on health
  const statusCode = health.success ? 200 : 503
  res.status(statusCode).json(health)
}))

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for Kubernetes
 * @access  Public
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if all dependencies are ready
    const dbReady = await db.ping()
    const redisReady = await redis.ping()
    
    if (dbReady && redisReady) {
      res.json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString()
      })
    } else {
      throw new Error('Dependencies not ready')
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}))

/**
 * @route   GET /health/live
 * @desc    Liveness probe for Kubernetes
 * @access  Public
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime()
  })
})

/**
 * @route   GET /health/metrics
 * @desc    Application metrics
 * @access  Public
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()
  
  // Get database stats
  const dbStats = await (async () => {
    try {
      return db.getStats()
    } catch {
      return null
    }
  })()
  
  // Get Redis stats
  const redisStats = await (async () => {
    try {
      return await redis.getStats()
    } catch {
      return null
    }
  })()

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics: {
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      database: dbStats,
      redis: redisStats
    }
  })
}))

export default router