// Simple migration runner
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'passio_tour',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  ssl: false,
}

const pool = new Pool(config)

async function runMigrations() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting database migration...')
    
    // Create schema_migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        up TEXT NOT NULL,
        down TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        executed_at TIMESTAMP WITH TIME ZONE,
        checksum VARCHAR(64)
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at 
      ON schema_migrations (executed_at);
    `)
    
    console.log('✅ Migration table created')
    
    // Read migration file
    const migrationFile = path.join(__dirname, 'src', 'database', 'migrations', '1703123456789_initial_schema.sql')
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`)
    }
    
    const migrationContent = fs.readFileSync(migrationFile, 'utf8')
    
    // Parse migration content
    const [upSQL, downSQL] = migrationContent.split(/-- @down/i)
    const up = upSQL.replace(/-- @up/i, '').trim()
    const down = downSQL ? downSQL.trim() : ''
    
    // Check if migration already executed
    const existingMigration = await client.query(
      'SELECT * FROM schema_migrations WHERE id = $1',
      ['1703123456789']
    )
    
    if (existingMigration.rows.length > 0) {
      console.log('⏭️  Migration already executed')
      return
    }
    
    // Execute migration in transaction
    await client.query('BEGIN')
    
    try {
      console.log('📝 Executing migration SQL...')
      await client.query(up)
      
      // Record migration
      await client.query(
        `INSERT INTO schema_migrations (id, name, up, down, executed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['1703123456789', 'initial_schema', up, down]
      )
      
      await client.query('COMMIT')
      console.log('✅ Migration executed successfully!')
      
      // Verify tables were created
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `)
      
      console.log(`\n📋 Created ${tables.rows.length} tables:`)
      tables.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`)
      })
      
      // Test basic query
      const result = await client.query('SELECT COUNT(*) as count FROM tour_categories')
      console.log(`\n🎯 Verification: tour_categories table has ${result.rows[0].count} records`)
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n🎉 Migration process completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration process failed!')
    console.error(error)
    process.exit(1)
  })
