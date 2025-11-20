import { db, transaction, query, getStats } from './connection'
import { PoolClient } from 'pg'
import { logger } from '@/utils/logger'

/**
 * Advanced Database Connection and Transaction Management Utilities
 * 
 * This module provides:
 * 1. Connection health monitoring
 * 2. Transaction retry mechanisms
 * 3. Connection pool optimization
 * 4. Query performance analysis
 * 5. Database maintenance operations
 * 6. Connection lifecycle management
 */

export interface DatabaseHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  activeConnections: number
  idleConnections: number
  totalConnections: number
  waitingRequests: number
  lastChecked: Date
  issues?: string[]
}

export interface QueryPerformanceMetrics {
  query: string
  executionTime: number
  rowCount: number
  timestamp: Date
  slow?: boolean
}

export interface TransactionOptions {
  retries?: number
  backoffMs?: number
  timeoutMs?: number
}

export class DatabaseManager {
  private static instance: DatabaseManager
  private healthCheckInterval?: NodeJS.Timeout
  private performanceMetrics: QueryPerformanceMetrics[] = []
  private readonly MAX_METRICS = 1000

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  /**
   * Comprehensive health check with detailed diagnostics
   */
  async performHealthCheck(): Promise<DatabaseHealthCheck> {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      const pingResult = await db.query('SELECT NOW() as timestamp')
      const responseTime = Date.now() - startTime

      // Get pool statistics
      const stats = getStats()

      // Analyze connection pool health
      const issues: string[] = []
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

      // Check response time
      if (responseTime > 1000) {
        status = 'degraded'
        issues.push('High response time (>1s)')
      } else if (responseTime > 5000) {
        status = 'unhealthy'
        issues.push('Very high response time (>5s)')
      }

      // Check connection usage
      const connectionUsagePercent = (stats.activeCount / stats.totalCount) * 100
      if (connectionUsagePercent > 80) {
        status = status === 'healthy' ? 'degraded' : status
        issues.push('High connection usage (>80%)')
      }

      // Check for waiting requests
      if (stats.waitingCount > 0) {
        status = status === 'healthy' ? 'degraded' : status
        issues.push(`${stats.waitingCount} requests waiting for connections`)
      }

      // Check for idle connections (might indicate connection leaks)
      if (stats.idleCount === 0 && stats.totalCount > 0) {
        status = status === 'healthy' ? 'degraded' : status
        issues.push('No idle connections available')
      }

      const healthCheck: DatabaseHealthCheck = {
        status,
        responseTime,
        activeConnections: stats.activeCount,
        idleConnections: stats.idleCount,
        totalConnections: stats.totalCount,
        waitingRequests: stats.waitingCount,
        lastChecked: new Date(),
        issues: issues.length > 0 ? issues : undefined
      }

      logger.debug('Database health check completed', healthCheck)

      return healthCheck
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : error
      })

      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        waitingRequests: 0,
        lastChecked: new Date(),
        issues: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Transaction with retry mechanism
   */
  async transactional<T>(
    callback: (client: PoolClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const { retries = 3, backoffMs = 1000, timeoutMs = 30000 } = options
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Transaction timed out after ${timeoutMs}ms`))
          }, timeoutMs)
        })

        const result = await Promise.race([
          transaction(callback),
          timeoutPromise
        ])

        if (attempt > 1) {
          logger.info('Transaction succeeded after retry', { 
            attempts: attempt,
            backoffMs 
          })
        }

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt <= retries) {
          logger.warn('Transaction failed, retrying', {
            attempt,
            maxRetries: retries,
            error: lastError.message
          })

          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1)))
        } else {
          logger.error('Transaction failed after all retries', {
            attempts: attempt - 1,
            error: lastError.message
          })
        }
      }
    }

    throw lastError
  }

  /**
   * Execute query with performance monitoring
   */
  async queryWithMetrics(text: string, params?: any[]): Promise<any> {
    const startTime = Date.now()
    
    try {
      const result = await db.query(text, params)
      const executionTime = Date.now() - startTime

      // Store performance metrics
      this.storeQueryMetrics({
        query: this.sanitizeQuery(text),
        executionTime,
        rowCount: result.rowCount || 0,
        timestamp: new Date(),
        slow: executionTime > 1000 // Consider queries > 1s as slow
      })

      logger.debug('Query executed with metrics', {
        executionTime: `${executionTime}ms`,
        rowCount: result.rowCount,
        query: this.sanitizeQuery(text)
      })

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      
      logger.error('Query failed', {
        executionTime: `${executionTime}ms`,
        query: this.sanitizeQuery(text),
        error: error instanceof Error ? error.message : error
      })

      throw error
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(limit: number = 100): QueryPerformanceMetrics[] {
    return this.performanceMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = 1000): QueryPerformanceMetrics[] {
    return this.performanceMetrics.filter(metric => metric.executionTime > threshold)
  }

  /**
   * Database maintenance operations
   */
  async performMaintenance(): Promise<void> {
    logger.info('Starting database maintenance operations')

    try {
      // Vacuum analyze to update statistics
      await db.query('VACUUM (ANALYZE)')
      logger.info('VACUUM ANALYZE completed')

      // Update table statistics
      await db.query('ANALYZE')
      logger.info('ANALYZE completed')

      // Check for unused indexes
      const unusedIndexes = await query(`
        SELECT schemaname, tablename, indexname 
        FROM pg_stat_user_indexes 
        WHERE idx_tup_read = 0 
        AND idx_tup_fetch = 0
      `)

      if (unusedIndexes.rows.length > 0) {
        logger.warn('Found unused indexes', {
          count: unusedIndexes.rows.length,
          indexes: unusedIndexes.rows
        })
      }

      logger.info('Database maintenance completed successfully')
    } catch (error) {
      logger.error('Database maintenance failed', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Start continuous health monitoring
   */
  startHealthMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        logger.error('Scheduled health check failed', {
          error: error instanceof Error ? error.message : error
        })
      }
    }, intervalMs)

    logger.info('Health monitoring started', { intervalMs })
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = undefined
      logger.info('Health monitoring stopped')
    }
  }

  /**
   * Get connection pool recommendations
   */
  getPoolOptimizationRecommendations(): {
    recommendation: string
    reason: string
    action: string
  }[] {
    const stats = getStats()
    const recommendations: {
      recommendation: string
      reason: string
      action: string
    }[] = []

    const activePercentage = (stats.activeCount / stats.totalCount) * 100

    if (activePercentage > 80) {
      recommendations.push({
        recommendation: 'Increase max connections',
        reason: `High connection usage (${activePercentage.toFixed(1)}%)`,
        action: 'Increase DATABASE_POOL_MAX in environment configuration'
      })
    }

    if (stats.waitingCount > 5) {
      recommendations.push({
        recommendation: 'Optimize slow queries',
        reason: `${stats.waitingCount} requests waiting for connections`,
        action: 'Review and optimize slow queries, add proper indexes'
      })
    }

    if (stats.idleCount === 0 && stats.totalCount > 0) {
      recommendations.push({
        recommendation: 'Check for connection leaks',
        reason: 'No idle connections available but there are total connections',
        action: 'Review connection usage patterns and ensure proper release'
      })
    }

    return recommendations
  }

  /**
   * Graceful shutdown with connection cleanup
   */
  async gracefulShutdown(): Promise<void> {
    logger.info('Starting graceful database shutdown')

    try {
      // Stop health monitoring
      this.stopHealthMonitoring()

      // Clear performance metrics
      this.performanceMetrics = []

      // Wait for active connections to complete (with timeout)
      const maxWaitTime = 30000 // 30 seconds
      const checkInterval = 1000 // 1 second
      const maxChecks = maxWaitTime / checkInterval

      let checks = 0
      while (getStats().activeCount > 0 && checks < maxChecks) {
        logger.info('Waiting for active connections to complete', {
          activeConnections: getStats().activeCount,
          waitTime: `${checks * checkInterval}ms`
        })
        
        await new Promise(resolve => setTimeout(resolve, checkInterval))
        checks++
      }

      const finalStats = getStats()
      if (finalStats.activeCount > 0) {
        logger.warn('Active connections remain after graceful shutdown period', {
          activeConnections: finalStats.activeCount
        })
      }

      // Close database connections
      await db.disconnect()
      logger.info('Database shutdown completed')
    } catch (error) {
      logger.error('Error during database shutdown', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  private storeQueryMetrics(metrics: QueryPerformanceMetrics): void {
    this.performanceMetrics.push(metrics)

    // Keep only the most recent metrics
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.MAX_METRICS)
    }

    // Log slow queries
    if (metrics.slow) {
      logger.warn('Slow query detected', {
        executionTime: `${metrics.executionTime}ms`,
        query: metrics.query,
        rowCount: metrics.rowCount
      })
    }
  }

  private sanitizeQuery(query: string): string {
    // Remove excessive whitespace and limit length for logging
    return query
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200) + (query.length > 200 ? '...' : '')
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance()

// Export convenience functions
export const healthCheck = () => databaseManager.performHealthCheck()
export const transactional = <T>(callback: (client: PoolClient) => Promise<T>, options?: TransactionOptions) =>
  databaseManager.transactional(callback, options)
export const queryWithMetrics = (text: string, params?: any[]) =>
  databaseManager.queryWithMetrics(text, params)
export const performMaintenance = () => databaseManager.performMaintenance()
export const getPoolRecommendations = () => databaseManager.getPoolOptimizationRecommendations()
export const gracefulShutdown = () => databaseManager.gracefulShutdown()