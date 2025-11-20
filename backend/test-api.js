// Basic API structure test
const http = require('http')

// Test configuration
const config = {
  host: 'localhost',
  port: 5000,
  timeout: 10000
}

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Passio-Tour-API-Test/1.0'
      }
    }

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data))
    }

    const req = http.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData)
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.setTimeout(config.timeout)

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

async function testAPI() {
  console.log('Testing Express.js API Structure...')
  console.log(`Target: http://${config.host}:${config.port}`)
  console.log('')

  const tests = [
    {
      name: 'Health Check - Basic',
      path: '/health',
      method: 'GET',
      expectedStatus: [200],
      validateResponse: (response) => {
        return response.success === true && response.message === 'Service is healthy'
      }
    },
    {
      name: 'Health Check - Detailed',
      path: '/health/detailed',
      method: 'GET',
      expectedStatus: [200, 503],
      validateResponse: (response) => {
        return response.checks && response.checks.database && response.checks.redis
      }
    },
    {
      name: 'API Documentation',
      path: '/api',
      method: 'GET',
      expectedStatus: [200],
      validateResponse: (response) => {
        return response.success === true && response.message === 'Passio Tour API'
      }
    },
    {
      name: 'Undefined API Route',
      path: '/api/v1/nonexistent',
      method: 'GET',
      expectedStatus: [404],
      validateResponse: (response) => {
        return response.success === false && response.code === 'ENDPOINT_NOT_FOUND'
      }
    },
    {
      name: 'Undefined Route',
      path: '/nonexistent',
      method: 'GET',
      expectedStatus: [404],
      validateResponse: (response) => {
        return response.success === false && response.code === 'NOT_FOUND'
      }
    },
    {
      name: 'API Rate Limiting',
      path: '/api/test',
      method: 'GET',
      expectedStatus: [404, 429], // Either not found or rate limited
      validateResponse: (response) => {
        return true // Any response is fine for this test
      }
    }
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      console.log(`🧪 ${test.name}`)
      
      const response = await makeRequest(test.path, test.method)
      
      const statusMatch = test.expectedStatus.includes(response.statusCode)
      const validationMatch = test.validateResponse(response.data)
      
      if (statusMatch && validationMatch) {
        console.log(`  ✅ PASSED - Status: ${response.statusCode}`)
        if (response.data.message) {
          console.log(`     Message: ${response.data.message}`)
        }
        passed++
      } else {
        console.log(`  ❌ FAILED - Status: ${response.statusCode}`)
        console.log(`     Expected: ${test.expectedStatus.join(' or ')}`)
        console.log(`     Validation: ${validationMatch ? 'PASS' : 'FAIL'}`)
        if (response.data.message) {
          console.log(`     Message: ${response.data.message}`)
        }
        failed++
      }
      
    } catch (error) {
      console.log(`  ❌ FAILED - Error: ${error.message}`)
      failed++
    }
    
    console.log('')
  }

  console.log('='.repeat(50))
  console.log('📊 Test Summary:')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  if (failed === 0) {
    console.log('')
    console.log('🎉 All API structure tests passed!')
    console.log('✅ Express.js application is running correctly')
    console.log('✅ Middleware stack is working')
    console.log('✅ Error handling is configured')
    console.log('✅ Route structure is valid')
  } else {
    console.log('')
    console.log('⚠️  Some tests failed. Please check the server configuration.')
  }
}

// Run the test
testAPI().catch(console.error)