// Simple database test script
const { Pool } = require('pg')

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'passio_tour',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  ssl: false,
}

console.log('🔗 Testing PostgreSQL connection...')
console.log('Config:', { ...config, password: '***' })

const pool = new Pool(config)

async function testConnection() {
  try {
    // Test connection
    const client = await pool.connect()
    console.log('✅ Database connection successful!')
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version')
    console.log('✅ Database query successful!')
    console.log('Current time:', result.rows[0].current_time)
    console.log('PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1])
    
    // Check if schema_migrations table exists
    const migrationCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'schema_migrations'
    `)
    
    if (migrationCheck.rows.length > 0) {
      console.log('✅ Migration table exists')
      
      // Check executed migrations
      const executedMigrations = await client.query('SELECT COUNT(*) as count FROM schema_migrations')
      console.log(`📊 Executed migrations: ${executedMigrations.rows[0].count}`)
    } else {
      console.log('⚠️  Migration table does not exist yet')
    }
    
    // List all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log(`\n📋 Database tables (${tables.rows.length}):`)
    tables.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`)
    })
    
    client.release()
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the test
testConnection()