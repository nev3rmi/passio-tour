import { Pool, PoolClient, PoolConfig } from 'pg'
import { config } from '@/config/config'
import { logger } from '@/utils/logger'

export class DatabaseConnection {
  private static instance: DatabaseConnection
  private pool: Pool
  private isConnected: boolean = false

  private constructor() {
    this.pool = new Pool({
      host: config.DATABASE.host,
      port: config.DATABASE.port,
      database: config.DATABASE.name,
      user: config.DATABASE.username,
      password: config.DATABASE.password,
      ssl: config.DATABASE.ssl ? { rejectUnauthorized: false } : false,
      max: config.DATABASE.max,
      idleTimeoutMillis: config.DATABASE.idleTimeoutMillis,
      connectionTimeoutMillis: config.DATABASE.connectionTimeoutMillis,
      statement_timeout: 60000, // 60 seconds
      query_timeout: 60000, // 60 seconds
    })

    this.setupEventHandlers()
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      logger.debug('New database client connected', { 
        processId: client.processID 
      })
    })

    this.pool.on('acquire', (client: PoolClient) => {
      logger.debug('Client acquired from pool', { 
        processId: client.processID 
      })
    })

    this.pool.on('release', (client: PoolClient) => {
      logger.debug('Client released back to pool', { 
        processId: client.processID,
        activeCount: this.pool.activeCount,
        idleCount: this.pool.idleCount
      })
    })

    this.pool.on('error', (err: Error) => {
      logger.error('Database pool error', { 
        error: err.message,
        stack: err.stack
      })
    })

    this.pool.on('remove', (client: PoolClient) => {
      logger.debug('Client removed from pool', { 
        processId: client.processID 
      })
    })
  }

  public async connect(): Promise<void> {
    try {
      // Test the connection
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()
      
      this.isConnected = true
      logger.info('Database connected successfully', {
        host: config.DATABASE.host,
        port: config.DATABASE.port,
        database: config.DATABASE.name,
        maxConnections: config.DATABASE.max
      })
    } catch (error) {
      logger.error('Failed to connect to database', {
        error: error instanceof Error ? error.message : error,
        host: config.DATABASE.host,
        port: config.DATABASE.port,
        database: config.DATABASE.name
      })
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.pool.end()
      this.isConnected = false
      logger.info('Database disconnected successfully')
    } catch (error) {
      logger.error('Error disconnecting from database', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  public getPool(): Pool {
    return this.pool
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start

      logger.debug('Database query executed', {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount
      })

      return result
    } catch (error) {
      logger.error('Database query failed', {
        query: text,
        params,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect()
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  public async ping(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as ping')
      return result.rows[0].ping === 1
    } catch (error) {
      logger.error('Database ping failed', {
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }

  public getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      activeCount: this.pool.activeCount,
      isConnected: this.isConnected
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
export const db = DatabaseConnection.getInstance()

// Export convenience functions
export const query = (text: string, params?: any[]) => db.query(text, params)
export const transaction = <T>(callback: (client: PoolClient) => Promise<T>) => db.transaction(callback)
export const getClient = () => db.getClient()
export const ping = () => db.ping()
export const getStats = () => db.getStats()

// Export DatabaseManager for advanced features
export { DatabaseManager, databaseManager } from './DatabaseManager'
export * from './DatabaseManager'