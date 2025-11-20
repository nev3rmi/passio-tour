import fs from 'fs'
import path from 'path'
import { query } from './connection'
import { logger } from '@/utils/logger'

export interface Migration {
  id: string
  name: string
  up: string
  down: string
  created_at: Date
  executed_at?: Date
}

export interface MigrationResult {
  success: boolean
  message: string
  migration?: Migration
  error?: string
}

export class MigrationManager {
  private migrationsTable = 'schema_migrations'
  private migrationsPath: string

  constructor(migrationsPath?: string) {
    this.migrationsPath = migrationsPath || path.join(process.cwd(), 'backend', 'src', 'database', 'migrations')
  }

  /**
   * Initialize the migrations system
   */
  public async initialize(): Promise<void> {
    try {
      await this.createMigrationsTable()
      logger.info('Migration system initialized', { 
        migrationsTable: this.migrationsTable 
      })
    } catch (error) {
      logger.error('Failed to initialize migration system', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Create the migrations tracking table
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        up TEXT NOT NULL,
        down TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        executed_at TIMESTAMP WITH TIME ZONE,
        checksum VARCHAR(64)
      );
      
      CREATE INDEX IF NOT EXISTS idx_${this.migrationsTable}_executed_at 
      ON ${this.migrationsTable} (executed_at);
    `

    await query(createTableSQL)
  }

  /**
   * Get all migration files from the filesystem
   */
  public getMigrationFiles(): { id: string; name: string; up: string; down: string }[] {
    try {
      if (!fs.existsSync(this.migrationsPath)) {
        logger.warn('Migrations directory does not exist', { 
          path: this.migrationsPath 
        })
        return []
      }

      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort()

      return files.map(file => {
        const content = fs.readFileSync(
          path.join(this.migrationsPath, file), 
          'utf8'
        )
        
        const [timestamp, name] = file.replace('.sql', '').split('_', 2)
        const [up, down] = content.split(/-- @down/i)

        return {
          id: timestamp,
          name: name || 'unknown',
          up: up.replace(/-- @up/i, '').trim(),
          down: down ? down.trim() : ''
        }
      })
    } catch (error) {
      logger.error('Failed to read migration files', {
        error: error instanceof Error ? error.message : error,
        path: this.migrationsPath
      })
      throw error
    }
  }

  /**
   * Get executed migrations from database
   */
  public async getExecutedMigrations(): Promise<Migration[]> {
    try {
      const result = await query(
        `SELECT * FROM ${this.migrationsTable} ORDER BY executed_at ASC`
      )
      return result.rows
    } catch (error) {
      logger.error('Failed to get executed migrations', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Get pending migrations
   */
  public async getPendingMigrations(): Promise<{ id: string; name: string; up: string; down: string }[]> {
    const [migrationFiles, executedMigrations] = await Promise.all([
      this.getMigrationFiles(),
      this.getExecutedMigrations()
    ])

    const executedIds = new Set(executedMigrations.map(m => m.id))
    
    return migrationFiles.filter(migration => !executedIds.has(migration.id))
  }

  /**
   * Execute a single migration
   */
  public async executeMigration(migration: { id: string; name: string; up: string; down: string }): Promise<MigrationResult> {
    try {
      logger.info('Executing migration', { 
        id: migration.id, 
        name: migration.name 
      })

      // Execute the migration in a transaction
      await query('BEGIN')
      
      try {
        // Execute the migration SQL
        await query(migration.up)
        
        // Record the migration as executed
        await query(
          `INSERT INTO ${this.migrationsTable} (id, name, up, down, executed_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [migration.id, migration.name, migration.up, migration.down]
        )
        
        await query('COMMIT')
        
        logger.info('Migration executed successfully', { 
          id: migration.id, 
          name: migration.name 
        })

        return {
          success: true,
          message: `Migration ${migration.id}_${migration.name} executed successfully`,
          migration: {
            id: migration.id,
            name: migration.name,
            up: migration.up,
            down: migration.down,
            created_at: new Date(),
            executed_at: new Date()
          }
        }
      } catch (error) {
        await query('ROLLBACK')
        throw error
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Migration execution failed', {
        id: migration.id,
        name: migration.name,
        error: errorMessage
      })

      return {
        success: false,
        message: `Migration ${migration.id}_${migration.name} failed`,
        migration,
        error: errorMessage
      }
    }
  }

  /**
   * Rollback a single migration
   */
  public async rollbackMigration(migration: Migration): Promise<MigrationResult> {
    if (!migration.down) {
      return {
        success: false,
        message: `Migration ${migration.id}_${migration.name} has no rollback script`,
        migration,
        error: 'No rollback script available'
      }
    }

    try {
      logger.info('Rolling back migration', { 
        id: migration.id, 
        name: migration.name 
      })

      // Execute rollback in a transaction
      await query('BEGIN')
      
      try {
        // Execute the rollback SQL
        await query(migration.down)
        
        // Remove the migration record
        await query(
          `DELETE FROM ${this.migrationsTable} WHERE id = $1`,
          [migration.id]
        )
        
        await query('COMMIT')
        
        logger.info('Migration rolled back successfully', { 
          id: migration.id, 
          name: migration.name 
        })

        return {
          success: true,
          message: `Migration ${migration.id}_${migration.name} rolled back successfully`
        }
      } catch (error) {
        await query('ROLLBACK')
        throw error
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Migration rollback failed', {
        id: migration.id,
        name: migration.name,
        error: errorMessage
      })

      return {
        success: false,
        message: `Migration ${migration.id}_${migration.name} rollback failed`,
        migration,
        error: errorMessage
      }
    }
  }

  /**
   * Run all pending migrations
   */
  public async migrate(): Promise<{ success: boolean; results: MigrationResult[]; errors: MigrationResult[] }> {
    const pendingMigrations = await this.getPendingMigrations()
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations found')
      return {
        success: true,
        results: [],
        errors: []
      }
    }

    logger.info('Starting migration run', { 
      pendingCount: pendingMigrations.length 
    })

    const results: MigrationResult[] = []
    const errors: MigrationResult[] = []

    for (const migration of pendingMigrations) {
      const result = await this.executeMigration(migration)
      
      if (result.success) {
        results.push(result)
      } else {
        errors.push(result)
        
        // Stop on first error to maintain consistency
        logger.error('Migration failed, stopping migration run', {
          failedMigration: result.migration?.id,
          remainingCount: pendingMigrations.length - results.length - errors.length
        })
        break
      }
    }

    const success = errors.length === 0
    
    logger.info('Migration run completed', {
      success,
      executed: results.length,
      failed: errors.length,
      total: pendingMigrations.length
    })

    return { success, results, errors }
  }

  /**
   * Rollback the last N migrations
   */
  public async rollback(count: number = 1): Promise<{ success: boolean; results: MigrationResult[]; errors: MigrationResult[] }> {
    const executedMigrations = await this.getExecutedMigrations()
    
    if (executedMigrations.length === 0) {
      logger.info('No executed migrations found to rollback')
      return {
        success: true,
        results: [],
        errors: []
      }
    }

    const migrationsToRollback = executedMigrations
      .slice(-count)
      .reverse() // Rollback in reverse order

    logger.info('Starting rollback', { 
      rollbackCount: migrationsToRollback.length 
    })

    const results: MigrationResult[] = []
    const errors: MigrationResult[] = []

    for (const migration of migrationsToRollback) {
      const result = await this.rollbackMigration(migration)
      
      if (result.success) {
        results.push(result)
      } else {
        errors.push(result)
        
        // Continue rollback even if one fails
        logger.error('Migration rollback failed, continuing with next', {
          failedMigration: migration.id,
          remainingCount: migrationsToRollback.length - results.length - errors.length
        })
      }
    }

    const success = errors.length === 0
    
    logger.info('Rollback completed', {
      success,
      rolledBack: results.length,
      failed: errors.length,
      total: migrationsToRollback.length
    })

    return { success, results, errors }
  }

  /**
   * Get migration status
   */
  public async getStatus(): Promise<{
    executed: Migration[]
    pending: { id: string; name: string; up: string; down: string }[]
    total: number
  }> {
    const [executed, pending] = await Promise.all([
      this.getExecutedMigrations(),
      this.getPendingMigrations()
    ])

    return {
      executed,
      pending,
      total: executed.length + pending.length
    }
  }

  /**
   * Create a new migration file
   */
  public createMigration(name: string, upSQL: string, downSQL: string): string {
    const timestamp = Date.now().toString()
    const filename = `${timestamp}_${name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}.sql`
    
    const content = `-- @up\n${upSQL}\n\n-- @down\n${downSQL}`
    
    const filePath = path.join(this.migrationsPath, filename)
    fs.writeFileSync(filePath, content, 'utf8')
    
    logger.info('Migration file created', { 
      filename, 
      name, 
      path: filePath 
    })
    
    return filename
  }

  /**
   * Reset database (drop all tables and re-run migrations)
   */
  public async reset(): Promise<void> {
    logger.warn('Resetting database - this will delete all data!')
    
    try {
      // Drop all tables except migrations table
      await query(`
        DO $$ 
        DECLARE 
          r RECORD;
        BEGIN
          FOR r IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename != '${this.migrationsTable}'
          ) LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `)
      
      // Delete all migration records
      await query(`DELETE FROM ${this.migrationsTable}`)
      
      logger.info('Database reset completed')
      
      // Run migrations
      await this.migrate()
      
    } catch (error) {
      logger.error('Database reset failed', {
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }
}

export default MigrationManager