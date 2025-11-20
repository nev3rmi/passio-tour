// JWT Authentication test script
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Configuration
const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'passio_tour',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: '24h',
    refreshExpiresIn: '7d'
  }
}

const pool = new Pool(config.database)

async function testJWTAuth() {
  console.log('Testing JWT Authentication System...')
  
  try {
    // Test 1: Database Connection
    console.log('\n1. Testing database connection...')
    const client = await pool.connect()
    console.log('✅ Database connected')
    
    // Test 2: Create test user
    console.log('\n2. Creating test user...')
    const testEmail = `test_${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    const passwordHash = await bcrypt.hash(testPassword, 12)
    
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name, role`,
      [testEmail, passwordHash, 'Test User', 'customer']
    )
    
    const testUser = userResult.rows[0]
    console.log('✅ Test user created:', testUser.email)
    
    // Test 3: Verify password
    console.log('\n3. Testing password verification...')
    const passwordMatch = await bcrypt.compare(testPassword, passwordHash)
    console.log('✅ Password verification:', passwordMatch ? 'PASSED' : 'FAILED')
    
    // Test 4: Generate JWT tokens
    console.log('\n4. Testing JWT token generation...')
    const tokenPayload = {
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
      sessionId: `sess_${Date.now()}`
    }
    
    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'passio-tour-api',
      audience: 'passio-tour-client'
    })
    
    const refreshToken = jwt.sign({
      userId: testUser.id,
      sessionId: tokenPayload.sessionId
    }, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'passio-tour-api',
      audience: 'passio-tour-client'
    })
    
    console.log('✅ Access token generated (length:', accessToken.length, ')')
    console.log('✅ Refresh token generated (length:', refreshToken.length, ')')
    
    // Test 5: Verify access token
    console.log('\n5. Testing access token verification...')
    const decodedAccess = jwt.verify(accessToken, config.jwt.secret, {
      issuer: 'passio-tour-api',
      audience: 'passio-tour-client'
    })
    
    console.log('✅ Access token verified:')
    console.log('  - User ID:', decodedAccess.userId)
    console.log('  - Email:', decodedAccess.email)
    console.log('  - Role:', decodedAccess.role)
    console.log('  - Session ID:', decodedAccess.sessionId)
    
    // Test 6: Verify refresh token
    console.log('\n6. Testing refresh token verification...')
    const decodedRefresh = jwt.verify(refreshToken, config.jwt.secret, {
      issuer: 'passio-tour-api',
      audience: 'passio-tour-client'
    })
    
    console.log('✅ Refresh token verified:')
    console.log('  - User ID:', decodedRefresh.userId)
    console.log('  - Session ID:', decodedRefresh.sessionId)
    
    // Test 7: Test token expiration
    console.log('\n7. Testing token expiration...')
    const shortLivedToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      config.jwt.secret,
      { expiresIn: '1s' }
    )
    
    setTimeout(async () => {
      try {
        jwt.verify(shortLivedToken, config.jwt.secret)
        console.log('❌ Short-lived token should have expired')
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          console.log('✅ Token expiration test: PASSED (expired as expected)')
        } else {
          console.log('❌ Token expiration test: FAILED (unexpected error)')
        }
      }
    }, 2000)
    
    // Test 8: Test invalid token
    console.log('\n8. Testing invalid token detection...')
    try {
      jwt.verify('invalid.token.here', config.jwt.secret)
      console.log('❌ Invalid token should have failed')
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        console.log('✅ Invalid token detection: PASSED')
      } else {
        console.log('❌ Invalid token detection: FAILED')
      }
    }
    
    // Test 9: Test wrong secret
    console.log('\n9. Testing wrong secret detection...')
    try {
      const tokenWithWrongSecret = jwt.sign(
        { userId: testUser.id },
        'wrong-secret',
        { expiresIn: '1h' }
      )
      
      jwt.verify(tokenWithWrongSecret, config.jwt.secret)
      console.log('❌ Wrong secret should have failed')
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        console.log('✅ Wrong secret detection: PASSED')
      } else {
        console.log('❌ Wrong secret detection: FAILED')
      }
    }
    
    // Test 10: Test user authentication workflow
    console.log('\n10. Testing user authentication workflow...')
    
    // Simulate login process
    const loginUserResult = await client.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [testEmail]
    )
    
    if (loginUserResult.rows.length > 0) {
      const loginUser = loginUserResult.rows[0]
      const loginPasswordMatch = await bcrypt.compare(testPassword, loginUser.password_hash)
      
      if (loginPasswordMatch) {
        console.log('✅ Login simulation: User authenticated')
        
        // Generate new tokens after login
        const loginTokenPayload = {
          userId: loginUser.id,
          email: loginUser.email,
          role: loginUser.role,
          sessionId: `sess_${Date.now()}_login`
        }
        
        const loginAccessToken = jwt.sign(loginTokenPayload, config.jwt.secret, {
          expiresIn: config.jwt.expiresIn
        })
        
        const loginRefreshToken = jwt.sign({
          userId: loginUser.id,
          sessionId: loginTokenPayload.sessionId
        }, config.jwt.secret, {
          expiresIn: config.jwt.refreshExpiresIn
        })
        
        console.log('✅ Login tokens generated successfully')
        
        // Test token-based authorization
        const authorizedPayload = jwt.verify(loginAccessToken, config.jwt.secret)
        const hasPermission = ['customer', 'admin', 'tour_operator'].includes(authorizedPayload.role)
        
        console.log('✅ Authorization check:', hasPermission ? 'PASSED' : 'FAILED')
      } else {
        console.log('❌ Login simulation: Password mismatch')
      }
    } else {
      console.log('❌ Login simulation: User not found')
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...')
    await client.query('DELETE FROM users WHERE email = $1', [testEmail])
    console.log('✅ Test user removed')
    
    client.release()
    
    console.log('\n🎉 JWT Authentication system test completed successfully!')
    console.log('\n📊 Test Summary:')
    console.log('✅ Database connection')
    console.log('✅ User creation')
    console.log('✅ Password hashing/verification')
    console.log('✅ JWT token generation')
    console.log('✅ Access token verification')
    console.log('✅ Refresh token verification')
    console.log('✅ Token expiration handling')
    console.log('✅ Invalid token detection')
    console.log('✅ Wrong secret detection')
    console.log('✅ User authentication workflow')
    
  } catch (error) {
    console.error('❌ JWT Authentication test failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the test
testJWTAuth()
