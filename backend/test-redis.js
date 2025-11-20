// Simple Redis test script
const { createClient } = require('redis')

const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB || '0', 10),
}

console.log('Testing Redis connection...')
console.log('Config:', { ...config, password: '***' })

const client = createClient({
  socket: {
    host: config.host,
    port: config.port,
  },
  password: config.password,
  database: config.db,
})

async function testRedis() {
  try {
    await client.connect()
    console.log('Redis connection successful!')
    
    const pong = await client.ping()
    console.log('Redis PING:', pong)
    
    // Test basic operations
    console.log('Testing basic Redis operations...')
    
    // SET/GET
    await client.set('test_key', 'test_value', { EX: 60 })
    const getValue = await client.get('test_key')
    console.log('SET/GET test:', getValue === 'test_value' ? 'PASSED' : 'FAILED')
    
    // HSET/HGET
    await client.hSet('test_hash', 'field1', 'value1')
    const hashValue = await client.hGet('test_hash', 'field1')
    console.log('HSET/HGET test:', hashValue === 'value1' ? 'PASSED' : 'FAILED')
    
    // Session storage test
    const sessionData = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'customer'
    }
    
    await client.setEx('session:abc123', 3600, JSON.stringify(sessionData))
    const storedSession = await client.get('session:abc123')
    console.log('Session storage test:', storedSession ? 'PASSED' : 'FAILED')
    
    // Get Redis info
    console.log('Getting Redis server info...')
    const info = await client.info()
    const lines = info.split('\r\n')
    
    for (const line of lines) {
      if (line.includes('redis_version:')) {
        console.log('Redis version:', line.split(':')[1])
        break
      }
    }
    
    // Cleanup
    const testKeys = await client.keys('test_*')
    const sessionKeys = await client.keys('session:*')
    const allKeys = [...testKeys, ...sessionKeys]
    
    if (allKeys.length > 0) {
      await client.del(allKeys)
      console.log('Cleaned up', allKeys.length, 'test keys')
    }
    
    console.log('All Redis tests completed successfully!')
    
  } catch (error) {
    console.error('Redis test failed:', error.message)
    process.exit(1)
  } finally {
    await client.quit()
  }
}

testRedis()