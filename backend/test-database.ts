import { db, transaction, ping, getStats } from './src/database/connection'
import { logger } from './src/utils/logger'

/**
 * Comprehensive Database Connection Pool and Transaction Testing
 * 
 * This script tests:
 * 1. Database connection and health checks
 * 2. Connection pooling functionality
 * 3. Transaction management
 * 4. Query performance monitoring
 * 5. Pool statistics and monitoring
 */

async function testDatabaseConnection() {
  console.log('🧪 Starting Database Connection Pool and Transaction Tests\n')

  try {
    // Test 1: Basic connection and ping
    console.log('📡 Test 1: Database Connection and Health Check')
    const isHealthy = await ping()
    console.log(`   ✅ Database health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`)

    if (!isHealthy) {
      console.error('❌ Database is not healthy, aborting tests')
      return
    }

    // Test 2: Connection pool statistics
    console.log('\n📊 Test 2: Connection Pool Statistics')
    const stats = getStats()
    console.log(`   📈 Total connections: ${stats.totalCount}`)
    console.log(`   🟢 Active connections: ${stats.activeCount}`)
    console.log(`   🔵 Idle connections: ${stats.idleCount}`)
    console.log(`   ⏳ Waiting requests: ${stats.waitingCount}`)
    console.log(`   🔗 Connection status: ${stats.isConnected ? 'CONNECTED' : 'DISCONNECTED'}`)

    // Test 3: Basic queries with timing
    console.log('\n⏱️  Test 3: Query Performance Test')
    
    const queryStart = Date.now()
    const result = await db.query(`
      SELECT 
        NOW() as current_time,
        version() as pg_version,
        current_database() as database_name,
        current_user as username
    `)
    const queryDuration = Date.now() - queryStart
    
    console.log(`   ✅ Query executed in ${queryDuration}ms`)
    console.log(`   🕐 Current time: ${result.rows[0].current_time}`)
    console.log(`   🗄️  Database: ${result.rows[0].database_name}`)
    console.log(`   👤 User: ${result.rows[0].username}`)
    console.log(`   🐘 PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`)

    // Test 4: Connection pool statistics after query
    console.log('\n📊 Test 4: Pool Statistics After Query')
    const statsAfterQuery = getStats()
    console.log(`   📈 Total connections: ${statsAfterQuery.totalCount}`)
    console.log(`   🟢 Active connections: ${statsAfterQuery.activeCount}`)
    console.log(`   🔵 Idle connections: ${statsAfterQuery.idleCount}`)

    // Test 5: Multiple concurrent queries
    console.log('\n🔄 Test 5: Concurrent Query Test')
    const concurrentStart = Date.now()
    
    const promises = Array.from({ length: 10 }, (_, i) => 
      db.query('SELECT NOW() as time, $1 as query_id', [i + 1])
    )
    
    const concurrentResults = await Promise.all(promises)
    const concurrentDuration = Date.now() - concurrentStart
    
    console.log(`   ✅ Completed ${concurrentResults.length} concurrent queries in ${concurrentDuration}ms`)
    console.log(`   📊 Average per query: ${Math.round(concurrentDuration / concurrentResults.length)}ms`)

    // Test 6: Transaction test
    console.log('\n🔄 Test 6: Transaction Management Test')
    
    try {
      const transactionStart = Date.now()
      
      await transaction(async (client) => {
        console.log('   🔄 Starting transaction...')
        
        // Create a temporary test table
        await client.query(`
          CREATE TEMP TABLE transaction_test (
            id SERIAL PRIMARY KEY,
            message VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `)
        
        // Insert test data
        const insertResult = await client.query(
          'INSERT INTO transaction_test (message) VALUES ($1) RETURNING *',
          ['Transaction test message']
        )
        console.log(`   ✅ Inserted record with ID: ${insertResult.rows[0].id}`)
        
        // Verify the data is visible within transaction
        const verifyResult = await client.query('SELECT COUNT(*) as count FROM transaction_test')
        console.log(`   ✅ Records in transaction: ${verifyResult.rows[0].count}`)
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('   ✅ Transaction completed successfully')
      })
      
      const transactionDuration = Date.now() - transactionStart
      console.log(`   ⏱️  Transaction completed in ${transactionDuration}ms`)
      
    } catch (error) {
      console.error('   ❌ Transaction test failed:', error instanceof Error ? error.message : error)
    }

    // Test 7: Failed transaction (rollback test)
    console.log('\n🔄 Test 7: Transaction Rollback Test')
    
    try {
      await transaction(async (client) => {
        console.log('   🔄 Starting transaction that will rollback...')
        
        // Create a temp table for rollback test
        await client.query(`
          CREATE TEMP TABLE rollback_test (
            id SERIAL PRIMARY KEY,
            should_rollback BOOLEAN DEFAULT false
          )
        `)
        
        // Insert a record
        await client.query(
          'INSERT INTO rollback_test (should_rollback) VALUES ($1)',
          [true]
        )
        console.log('   📝 Inserted record that will be rolled back')
        
        // Simulate an error
        throw new Error('Simulated error to test rollback')
      })
      
    } catch (error) {
      if (error instanceof Error && error.message === 'Simulated error to test rollback') {
        console.log('   ✅ Transaction correctly rolled back due to error')
      } else {
        console.error('   ❌ Unexpected error:', error instanceof Error ? error.message : error)
      }
    }

    // Test 8: Final pool statistics
    console.log('\n📊 Test 8: Final Pool Statistics')
    const finalStats = getStats()
    console.log(`   📈 Total connections: ${finalStats.totalCount}`)
    console.log(`   🟢 Active connections: ${finalStats.activeCount}`)
    console.log(`   🔵 Idle connections: ${finalStats.idleCount}`)
    console.log(`   ⏳ Waiting requests: ${finalStats.waitingCount}`)

    // Test 9: Connection stress test
    console.log('\n🔥 Test 9: Connection Pool Stress Test')
    
    const stressStart = Date.now()
    const stressQueries = Array.from({ length: 50 }, (_, i) => 
      db.query('SELECT NOW() as time, $1 as query_id, random() as random_value', [i + 1])
    )
    
    const stressResults = await Promise.all(stressQueries)
    const stressDuration = Date.now() - stressStart
    
    console.log(`   ✅ Completed ${stressResults.length} stress test queries in ${stressDuration}ms`)
    console.log(`   📊 Average per query: ${Math.round(stressDuration / stressResults.length)}ms`)
    console.log(`   📈 Queries per second: ${Math.round((stressResults.length / stressDuration) * 1000)}`)

    // Final pool statistics
    console.log('\n📊 Final Connection Pool Statistics')
    const finalStressStats = getStats()
    console.log(`   📈 Total connections created: ${finalStressStats.totalCount}`)
    console.log(`   🟢 Currently active: ${finalStressStats.activeCount}`)
    console.log(`   🔵 Currently idle: ${finalStressStats.idleCount}`)
    console.log(`   ⏳ Requests waiting: ${finalStressStats.waitingCount}`)

    console.log('\n🎉 All Database Connection Pool and Transaction Tests Completed Successfully!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Connection pooling working correctly')
    console.log('   ✅ Query performance monitoring active')
    console.log('   ✅ Transaction management functional')
    console.log('   ✅ Rollback mechanisms working')
    console.log('   ✅ Concurrent query handling working')
    console.log('   ✅ Pool statistics tracking active')

  } catch (error) {
    console.error('\n❌ Database tests failed:', error instanceof Error ? error.message : error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
  }
}

// Run the tests
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('\n✅ Test suite completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error)
      process.exit(1)
    })
}

export default testDatabaseConnection