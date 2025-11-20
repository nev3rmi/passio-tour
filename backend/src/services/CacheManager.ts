import { redis, set, get, del, keys } from './redis'
import { logger } from '@/utils/logger'
import { config } from '@/config/config'

// Cache key prefixes
export const CACHE_PREFIXES = {
  USER: 'user:',
  TOUR: 'tour:',
  BOOKING: 'booking:',
  CATEGORY: 'category:',
  REVIEW: 'review:',
  SESSION: 'session:',
  RATE_LIMIT: 'rate_limit:',
  ANALYTICS: 'analytics:'
} as const

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600,    // 1 hour
  DAY: 86400,    // 24 hours
  WEEK: 604800   // 7 days
} as const

export interface CacheOptions {
  ttl?: number
  key?: string
}

export class CacheManager {
  private static instance: CacheManager

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Generate cache key with prefix
   */
  private generateKey(prefix: string, identifier: string | number): string {
    return `${config.REDIS.keyPrefix}${prefix}${identifier}`
  }

  /**
   * Get cached data
   */
  async get<T>(prefix: string, identifier: string | number): Promise<T | null> {
    const key = this.generateKey(prefix, identifier)
    return await get(key)
  }

  /**
   * Set data with cache
   */
  async set<T>(prefix: string, identifier: string | number, data: T, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    const key = this.generateKey(prefix, identifier)
    return await set(key, data, ttl)
  }

  /**
   * Delete cached data
   */
  async delete(prefix: string, identifier: string | number): Promise<boolean> {
    const key = this.generateKey(prefix, identifier)
    return await del(key)
  }

  /**
   * Check if key exists
   */
  async exists(prefix: string, identifier: string | number): Promise<boolean> {
    const key = this.generateKey(prefix, identifier)
    return await redis.exists(key)
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const fullPattern = `${config.REDIS.keyPrefix}${pattern}`
      const keys = await redis.keys(fullPattern)
      
      if (keys.length > 0) {
        let deletedCount = 0
        for (const key of keys) {
          if (await del(key)) {
            deletedCount++
          }
        }
        
        logger.debug('Cache invalidated by pattern', {
          pattern: fullPattern,
          deletedCount,
          totalKeys: keys.length
        })
        
        return deletedCount
      }
      
      return 0
    } catch (error) {
      logger.error('Cache invalidation failed', {
        pattern,
        error: error instanceof Error ? error.message : error
      })
      return 0
    }
  }

  /**
   * Get or set cache with fallback function
   */
  async getOrSet<T>(
    prefix: string,
    identifier: string | number,
    fallback: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(prefix, identifier)
    if (cached !== null) {
      logger.debug('Cache hit', { key: this.generateKey(prefix, identifier) })
      return cached
    }

    // Cache miss, get from fallback
    logger.debug('Cache miss, executing fallback', { key: this.generateKey(prefix, identifier) })
    const data = await fallback()
    
    // Cache the result
    await this.set(prefix, identifier, data, ttl)
    
    return data
  }

  /**
   * Cache user data
   */
  async cacheUser(userId: string, userData: any): Promise<boolean> {
    return await this.set(CACHE_PREFIXES.USER, userId, userData, CACHE_TTL.HOUR)
  }

  async getUser(userId: string): Promise<any | null> {
    return await this.get(CACHE_PREFIXES.USER, userId)
  }

  async invalidateUser(userId: string): Promise<boolean> {
    return await this.delete(CACHE_PREFIXES.USER, userId)
  }

  /**
   * Cache tour data
   */
  async cacheTour(tourId: string, tourData: any): Promise<boolean> {
    return await this.set(CACHE_PREFIXES.TOUR, tourId, tourData, CACHE_TTL.LONG)
  }

  async getTour(tourId: string): Promise<any | null> {
    return await this.get(CACHE_PREFIXES.TOUR, tourId)
  }

  async invalidateTour(tourId: string): Promise<boolean> {
    return await this.delete(CACHE_PREFIXES.TOUR, tourId)
  }

  /**
   * Cache tour categories
   */
  async cacheCategories(categories: any[]): Promise<boolean> {
    return await this.set(CACHE_PREFIXES.CATEGORY, 'all', categories, CACHE_TTL.DAY)
  }

  async getCategories(): Promise<any[] | null> {
    return await this.get(CACHE_PREFIXES.CATEGORY, 'all')
  }

  async invalidateCategories(): Promise<number> {
    return await this.invalidatePattern(`${CACHE_PREFIXES.CATEGORY}*`)
  }

  /**
   * Cache booking data
   */
  async cacheBooking(bookingId: string, bookingData: any): Promise<boolean> {
    return await this.set(CACHE_PREFIXES.BOOKING, bookingId, bookingData, CACHE_TTL.LONG)
  }

  async getBooking(bookingId: string): Promise<any | null> {
    return await this.get(CACHE_PREFIXES.BOOKING, bookingId)
  }

  async invalidateBooking(bookingId: string): Promise<boolean> {
    return await this.delete(CACHE_PREFIXES.BOOKING, bookingId)
  }

  /**
   * Cache review data
   */
  async cacheTourReviews(tourId: string, reviews: any[]): Promise<boolean> {
    return await this.set(CACHE_PREFIXES.REVIEW, `tour:${tourId}`, reviews, CACHE_TTL.LONG)
  }

  async getTourReviews(tourId: string): Promise<any[] | null> {
    return await this.get(CACHE_PREFIXES.REVIEW, `tour:${tourId}`)
  }

  async invalidateTourReviews(tourId: string): Promise<boolean> {
    return await this.delete(CACHE_PREFIXES.REVIEW, `tour:${tourId}`)
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(data: { users?: string[], tours?: string[], categories?: boolean }): Promise<void> {
    try {
      logger.info('Starting cache warm-up')
      
      // This would typically fetch from database
      // For now, just log the intent
      logger.info('Cache warm-up completed', data)
    } catch (error) {
      logger.error('Cache warm-up failed', {
        error: error instanceof Error ? error.message : error
      })
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      const info = await redis.getClient().info()
      
      // Parse Redis INFO response
      const stats = {} as any
      const lines = info.split('\r\n')
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':')
          if (key && value) {
            stats[key] = value
          }
        }
      }
      
      return {
        connectedClients: stats.connected_clients,
        usedMemory: stats.used_memory,
        usedMemoryHuman: stats.used_memory_human,
        totalCommandsProcessed: stats.total_commands_processed,
        keyspaceHits: stats.keyspace_hits,
        keyspaceMisses: stats.keyspace_misses,
        hitRate: stats.keyspace_hits && stats.keyspace_misses 
          ? (parseInt(stats.keyspace_hits) / (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses)) * 100).toFixed(2)
          : '100.00'
      }
    } catch (error) {
      logger.error('Failed to get cache stats', {
        error: error instanceof Error ? error.message : error
      })
      return null
    }
  }
}

export default CacheManager