import { createClient, RedisClientType } from 'redis'
import { config } from '@/config/config'
import { logger } from '@/utils/logger'

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db: number
  keyPrefix: string
  ttl: number
}

export class RedisConnection {
  private static instance: RedisConnection
  private client: RedisClientType
  private isConnected: boolean = false

  private constructor() {
    this.client = createClient({
      socket: {
        host: config.REDIS.host,
        port: config.REDIS.port,
        connectTimeout: 60000,
        lazyConnect: true,
      },
      password: config.REDIS.password,
      database: config.REDIS.db,
    })

    this.setupEventHandlers()
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection()
    }
    return RedisConnection.instance
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connecting', {
        host: config.REDIS.host,
        port: config.REDIS.port,
        db: config.REDIS.db
      })
    })

    this.client.on('ready', () => {
      logger.info('Redis client ready', {
        host: config.REDIS.host,
        port: config.REDIS.port,
        db: config.REDIS.db
      })
    })

    this.client.on('error', (error) => {
      logger.error('Redis client error', {
        error: error instanceof Error ? error.message : error
      })
    })

    this.client.on('end', () => {
      logger.info('Redis client disconnected')
      this.isConnected = false
    })

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting')
    })
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect()
      this.isConnected = true
      
      // Test the connection
      const pong = await this.client.ping()
      logger.info('Redis connected successfully', { pong })
    } catch (error) {
      logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : error,
        host: config.REDIS.host,
        port: config.REDIS.port,
        db: config.REDIS.db
      })
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit()
      this.isConnected = false
      logger.info('Redis disconnected successfully')
    } catch (error) {
      logger.error('Error disconnecting from Redis', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  public getClient(): RedisClientType {
    return this.client
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, stringValue)
      } else {
        await this.client.set(key, stringValue)
      }
      
      return true
    } catch (error) {
      logger.error('Redis SET error', {
        key,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  public async get(key: string): Promise<any | null> {
    try {
      const value = await this.client.get(key)
      if (value === null) return null
      
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    } catch (error) {
      logger.error('Redis GET error', {
        key,
        error: error instanceof Error ? error.message : error
      })
      return null
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key)
      return result > 0
    } catch (error) {
      logger.error('Redis DEL error', {
        key,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result > 0
    } catch (error) {
      logger.error('Redis EXISTS error', {
        key,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttlSeconds)
      return result
    } catch (error) {
      logger.error('Redis EXPIRE error', {
        key,
        ttlSeconds,
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern)
    } catch (error) {
      logger.error('Redis KEYS error', {
        pattern,
        error: error instanceof Error ? error.message : error
      })
      return []
    }
  }

  public async flushAll(): Promise<boolean> {
    try {
      await this.client.flushAll()
      return true
    } catch (error) {
      logger.error('Redis FLUSHALL error', {
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  public async ping(): Promise<string> {
    try {
      return await this.client.ping()
    } catch (error) {
      logger.error('Redis PING error', {
        error: error instanceof Error ? error.message : error
      })
      return 'PONG'
    }
  }

  public getStats() {
    return {
      isConnected: this.isConnected,
      host: config.REDIS.host,
      port: config.REDIS.port,
      db: config.REDIS.db
    }
  }

  public async waitForConnection(timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        if (await this.ping()) {
          return true
        }
      } catch (error) {
        // Continue waiting
      }
      
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return false
  }
}

// Singleton instance
export const redis = RedisConnection.getInstance()

// Export convenience functions
export const set = (key: string, value: any, ttlSeconds?: number) => redis.set(key, value, ttlSeconds)
export const get = (key: string) => redis.get(key)
export const del = (key: string) => redis.del(key)
export const exists = (key: string) => redis.exists(key)
export const expire = (key: string, ttlSeconds: number) => redis.expire(key, ttlSeconds)
export const keys = (pattern: string) => redis.keys(pattern)
export const flushAll = () => redis.flushAll()
export const ping = () => redis.ping()
export const getStats = () => redis.getStats()