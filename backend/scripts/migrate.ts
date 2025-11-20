#!/usr/bin/env ts-node
import { db } from '../src/database/connection'
import MigrationManager from '../src/database/migrations/MigrationManager'
import { logger } from '../src/utils/logger'

async function runMigrations() {
  try {
    logger.info('Starting database migration process...')

    // Connect to database
    await db.connect()
    logger.info('Database connection established')

    // Initialize migration system
    const migrationManager = new MigrationManager()
    await migrationManager.initialize()
    logger.info('Migration system initialized')

    // Get status before migration
    const statusBefore = await migrationManager.getStatus()
    logger.info('Migration status before execution', {
      executed: statusBefore.executed.length,
      pending: statusBefore.pending.length,
      total: statusBefore.total
    })

    // Run migrations
    const result = await migrationManager.migrate()

    if (result.success) {
      logger.info('All migrations executed successfully', {
        executed: result.results.length,
        total: result.results.length
      })
      
      // Get status after migration
      const statusAfter = await migrationManager.getStatus()
      logger.info('Migration status after execution', {
        executed: statusAfter.executed.length,
        pending: statusAfter.pending.length,
        total: statusAfter.total
      })
      
      console.log('\n✅ Database migration completed successfully!')
      console.log(`Executed ${result.results.length} migrations`)
      
      result.results.forEach(r => {
        console.log(`  - ${r.migration?.id}_${r.migration?.name}: ${r.message}`)
      })
      
    } else {
      logger.error('Migration failed', {
        executed: result.results.length,
        failed: result.errors.length
      })
      
      console.log('\n❌ Database migration failed!')
      
      result.results.forEach(r => {
        console.log(`✅ ${r.migration?.id}_${r.migration?.name}: ${r.message}`)
      })
      
      result.errors.forEach(e => {
        console.log(`❌ ${e.migration?.id}_${e.migration?.name}: ${e.error}`)
      })
      
      process.exit(1)
    }

    // Verify database connectivity
    const pingResult = await db.ping()
    if (pingResult) {
      logger.info('Database connectivity verified')
      console.log('✅ Database connectivity verified')
    } else {
      throw new Error('Database ping failed')
    }

  } catch (error) {
    logger.error('Migration process failed', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    console.log('\n❌ Migration process failed!')
    console.error(error)
    process.exit(1)
  } finally {
    await db.disconnect()
    logger.info('Database connection closed')
  }
}

// CLI command handling
const command = process.argv[2]

async function handleCommand() {
  try {
    await db.connect()
    const migrationManager = new MigrationManager()
    await migrationManager.initialize()

    switch (command) {
      case 'status':
        const status = await migrationManager.getStatus()
        console.log('\n📊 Migration Status:')
        console.log(`Executed: ${status.executed.length}`)
        console.log(`Pending: ${status.pending.length}`)
        console.log(`Total: ${status.total}`)
        
        if (status.executed.length > 0) {
          console.log('\n✅ Executed Migrations:')
          status.executed.forEach(m => {
            console.log(`  - ${m.id}_${m.name} (${m.executed_at})`)
          })
        }
        
        if (status.pending.length > 0) {
          console.log('\n⏳ Pending Migrations:')
          status.pending.forEach(m => {
            console.log(`  - ${m.id}_${m.name}`)
          })
        }
        break

      case 'rollback':
        const count = parseInt(process.argv[3] || '1')
        console.log(`\n🔄 Rolling back ${count} migration(s)...`)
        const rollbackResult = await migrationManager.rollback(count)
        
        if (rollbackResult.success) {
          console.log(`✅ Rolled back ${rollbackResult.results.length} migration(s)`)
        } else {
          console.log(`❌ Rollback failed with ${rollbackResult.errors.length} error(s)`)
          rollbackResult.errors.forEach(e => console.log(`  - ${e.error}`))
        }
        break

      case 'reset':
        console.log('\n⚠️  This will delete all data and re-run migrations!')
        const confirm = process.argv[3] === '--confirm'
        
        if (!confirm) {
          console.log('Use --confirm flag to proceed with reset')
          process.exit(1)
        }
        
        console.log('🔄 Resetting database...')
        await migrationManager.reset()
        console.log('✅ Database reset completed')
        break

      case 'create':
        const name = process.argv[3]
        const upSQL = process.argv[4] || ''
        const downSQL = process.argv[5] || ''
        
        if (!name) {
          console.log('Usage: npm run migrate:create <name> [up_sql] [down_sql]')
          process.exit(1)
        }
        
        const filename = migrationManager.createMigration(name, upSQL, downSQL)
        console.log(`✅ Migration file created: ${filename}`)
        break

      default:
        console.log('\n🚀 Running migrations...')
        await runMigrations()
        break
    }

  } catch (error) {
    console.error('Command failed:', error)
    process.exit(1)
  } finally {
    await db.disconnect()
  }
}

// Run the command
handleCommand().catch(console.error)