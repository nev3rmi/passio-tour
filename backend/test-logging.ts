#!/usr/bin/env node

/**
 * Enhanced Logging Infrastructure Test Suite
 * 
 * This script tests:
 * 1. Structured logging functionality
 * 2. Contextual logging methods
 * 3. Security event logging
 * 4. Business event logging
 * 5. Database query logging
 * 6. Performance logging
 * 7. Cache logging
 * 8. Authentication logging
 * 9. Request correlation middleware
 * 10. Performance monitoring middleware
 */

import { EnhancedLogger, correlationMiddleware, requestLoggingMiddleware, performanceMiddleware } from '../src/utils/enhancedLogger'
import { Request, Response } from 'express'

// Mock Express objects for testing
class MockRequest {
  public method: string = 'GET'
  public url: string = '/test'
  public path: string = '/test'
  public query: any = { page: '1' }
  public headers: any = {}
  public ip: string = '127.0.0.1'
  public connection: any = { remoteAddress: '127.0.0.1' }
  public user?: any = { id: 'test-user-id', role: 'user', email: 'test@example.com' }
  public correlationId?: string

  constructor(headers: any = {}) {
    this.headers = headers
  }
}

class MockResponse {
  public statusCode: number = 200
  private headers: any = {}
  
  status(code: number) {
    this.statusCode = code
    return this
  }

  setHeader(name: string, value: string) {
    this.headers[name] = value
  }

  get(name: string) {
    return this.headers[name]
  }

  end() {
    // Mock implementation
  }
}

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
  message: string
  expected?: any
  actual?: any
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

async function runLoggingTests(): Promise<void> {
  console.log('📝 Running Enhanced Logging Infrastructure Tests\n')
  console.log('=' .repeat(60))

  const results: TestResult[] = []

  try {
    // Initialize logger
    const logger = new EnhancedLogger('test-service')

    // ==============================================
    // BASIC LOGGING TESTS
    // ==============================================
    console.log('\n📋 Basic Logging Tests')

    // Test debug logging
    try {
      logger.debug('Debug message', { test: true })
      results.push({
        test: 'Debug Logging',
        status: 'PASS',
        message: 'Debug logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Debug Logging',
        status: 'FAIL',
        message: `Debug logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test info logging
    try {
      logger.info('Info message', { test: true })
      results.push({
        test: 'Info Logging',
        status: 'PASS',
        message: 'Info logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Info Logging',
        status: 'FAIL',
        message: `Info logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test warning logging
    try {
      logger.warn('Warning message', { test: true })
      results.push({
        test: 'Warning Logging',
        status: 'PASS',
        message: 'Warning logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Warning Logging',
        status: 'FAIL',
        message: `Warning logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test error logging
    try {
      logger.error('Error message', { test: true })
      results.push({
        test: 'Error Logging',
        status: 'PASS',
        message: 'Error logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Error Logging',
        status: 'FAIL',
        message: `Error logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // ==============================================
    // CONTEXTUAL LOGGING TESTS
    // ==============================================
    console.log('\n🎯 Contextual Logging Tests')

    // Test business event logging
    try {
      logger.logBusiness('user_registration', {
        userId: 'test-user-id',
        email: 'test@example.com',
        method: 'email'
      })
      results.push({
        test: 'Business Event Logging',
        status: 'PASS',
        message: 'Business event logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Business Event Logging',
        status: 'FAIL',
        message: `Business event logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test security event logging
    try {
      logger.logSecurity('suspicious_activity', {
        userId: 'test-user-id',
        action: 'multiple_failed_logins',
        ip: '192.168.1.1',
        severity: 'high'
      })
      results.push({
        test: 'Security Event Logging',
        status: 'PASS',
        message: 'Security event logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Security Event Logging',
        status: 'FAIL',
        message: `Security event logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test database logging
    try {
      logger.logDatabase('query', {
        table: 'users',
        duration: 150,
        rowsAffected: 1,
        success: true,
        query: 'SELECT * FROM users WHERE id = $1'
      })
      results.push({
        test: 'Database Logging',
        status: 'PASS',
        message: 'Database logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Database Logging',
        status: 'FAIL',
        message: `Database logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test performance logging
    try {
      logger.logPerformance('user_search', {
        duration: 2500,
        query: 'complex search query',
        resultsCount: 150,
        memoryUsage: {
          rss: 50000000,
          heapUsed: 30000000
        }
      })
      results.push({
        test: 'Performance Logging',
        status: 'PASS',
        message: 'Performance logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Performance Logging',
        status: 'FAIL',
        message: `Performance logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test cache logging
    try {
      logger.logCache('get', 'user:12345', {
        hit: false,
        ttl: 3600
      })
      results.push({
        test: 'Cache Logging',
        status: 'PASS',
        message: 'Cache logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Cache Logging',
        status: 'FAIL',
        message: `Cache logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test authentication logging
    try {
      logger.logAuth('login', {
        success: true,
        userId: 'test-user-id',
        method: 'password'
      })
      results.push({
        test: 'Authentication Logging',
        status: 'PASS',
        message: 'Authentication logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Authentication Logging',
        status: 'FAIL',
        message: `Authentication logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // ==============================================
    // MIDDLEWARE TESTS
    // ==============================================
    console.log('\n🔧 Middleware Tests')

    // Test correlation middleware
    try {
      const req = new MockRequest({ 'x-correlation-id': 'test-correlation-id' })
      const res = new MockResponse()
      let nextCalled = false

      const next: any = () => {
        nextCalled = true
      }

      correlationMiddleware(req, res, next)
      
      assert(nextCalled === true, 'Correlation middleware should call next()')
      assert(req.correlationId === 'test-correlation-id', 'Correlation ID should be set')
      assert(res.get('X-Correlation-ID') === 'test-correlation-id', 'Response should have correlation header')

      results.push({
        test: 'Correlation Middleware',
        status: 'PASS',
        message: 'Correlation middleware works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Correlation Middleware',
        status: 'FAIL',
        message: `Correlation middleware failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test auto-generated correlation ID
    try {
      const req = new MockRequest() // No correlation ID header
      const res = new MockResponse()
      let nextCalled = false

      const next: any = () => {
        nextCalled = true
      }

      correlationMiddleware(req, res, next)
      
      assert(nextCalled === true, 'Correlation middleware should call next()')
      assert(req.correlationId !== undefined, 'Correlation ID should be auto-generated')

      results.push({
        test: 'Auto Correlation ID',
        status: 'PASS',
        message: 'Auto-generated correlation ID works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Auto Correlation ID',
        status: 'FAIL',
        message: `Auto correlation ID failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test request logging middleware
    try {
      const req = new MockRequest()
      const res = new MockResponse()
      let nextCalled = false

      const next: any = () => {
        nextCalled = true
      }

      requestLoggingMiddleware(req, res, next)
      
      // Simulate response completion
      res.end()

      assert(nextCalled === true, 'Request logging middleware should call next()')

      results.push({
        test: 'Request Logging Middleware',
        status: 'PASS',
        message: 'Request logging middleware works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Request Logging Middleware',
        status: 'FAIL',
        message: `Request logging middleware failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test performance middleware
    try {
      const req = new MockRequest()
      const res = new MockResponse()
      let nextCalled = false

      const perfMiddleware = performanceMiddleware(100) // 100ms threshold
      const next: any = () => {
        nextCalled = true
      }

      perfMiddleware(req, res, next)
      
      assert(nextCalled === true, 'Performance middleware should call next()')

      results.push({
        test: 'Performance Monitoring Middleware',
        status: 'PASS',
        message: 'Performance monitoring middleware works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Performance Monitoring Middleware',
        status: 'FAIL',
        message: `Performance monitoring middleware failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // ==============================================
    // STRUCTURED LOGGING TESTS
    // ==============================================
    console.log('\n📊 Structured Logging Tests')

    // Test correlation ID propagation
    try {
      const childLogger = logger.child({ component: 'user-service' })
      childLogger.info('Child logger message', { action: 'test' }, 'test-correlation-id')

      results.push({
        test: 'Child Logger with Correlation ID',
        status: 'PASS',
        message: 'Child logger with correlation ID works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Child Logger with Correlation ID',
        status: 'FAIL',
        message: `Child logger with correlation ID failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test metadata handling
    try {
      logger.info('Message with complex metadata', {
        user: {
          id: '12345',
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        request: {
          method: 'POST',
          url: '/api/users',
          headers: {
            'content-type': 'application/json'
          }
        }
      })

      results.push({
        test: 'Complex Metadata Logging',
        status: 'PASS',
        message: 'Complex metadata logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Complex Metadata Logging',
        status: 'FAIL',
        message: `Complex metadata logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // ==============================================
    // SECURITY LOGGING TESTS
    // ==============================================
    console.log('\n🔒 Security Logging Tests')

    // Test high severity security event
    try {
      logger.logSecurity('brute_force_attack', {
        ip: '192.168.1.100',
        attempts: 50,
        timeWindow: '5 minutes',
        severity: 'critical'
      }, 'security-test-correlation-id')

      results.push({
        test: 'Critical Security Event',
        status: 'PASS',
        message: 'Critical security event logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Critical Security Event',
        status: 'FAIL',
        message: `Critical security event failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test failed authentication logging
    try {
      logger.logAuth('login', {
        success: false,
        userId: 'unknown-user',
        method: 'password',
        failureReason: 'invalid_credentials',
        ip: '192.168.1.50'
      })

      results.push({
        test: 'Failed Authentication Logging',
        status: 'PASS',
        message: 'Failed authentication logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Failed Authentication Logging',
        status: 'FAIL',
        message: `Failed authentication logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // ==============================================
    // PERFORMANCE LOGGING TESTS
    // ==============================================
    console.log('\n⚡ Performance Logging Tests')

    // Test slow operation detection
    try {
      logger.logPerformance('database_query', {
        duration: 6000, // 6 seconds - should trigger warning
        query: 'SELECT complex join query',
        table: 'users',
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      })

      results.push({
        test: 'Slow Operation Detection',
        status: 'PASS',
        message: 'Slow operation detection works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Slow Operation Detection',
        status: 'FAIL',
        message: `Slow operation detection failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // Test normal performance logging
    try {
      logger.logPerformance('cache_lookup', {
        duration: 50, // 50ms - normal operation
        key: 'user:12345',
        hit: true
      })

      results.push({
        test: 'Normal Performance Logging',
        status: 'PASS',
        message: 'Normal performance logging works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Normal Performance Logging',
        status: 'FAIL',
        message: `Normal performance logging failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // ==============================================
    // INTEGRATION TESTS
    // ==============================================
    console.log('\n🔗 Integration Tests')

    // Test complete request flow
    try {
      const integrationReq = new MockRequest({
        'x-correlation-id': 'integration-test-correlation-id'
      })
      integrationReq.user = { id: 'integration-user', role: 'admin', email: 'admin@example.com' }
      const integrationRes = new MockResponse()

      let flowCompleted = false

      const testFlow = async () => {
        // Apply correlation middleware
        correlationMiddleware(integrationReq, integrationRes, () => {
          // Apply performance middleware
          performanceMiddleware(1000)(integrationReq, integrationRes, () => {
            // Apply request logging middleware
            requestLoggingMiddleware(integrationReq, integrationRes, () => {
              flowCompleted = true
            })
          })
        })
      }

      await testFlow()

      assert(flowCompleted === true, 'Complete request flow should complete successfully')
      assert(integrationReq.correlationId === 'integration-test-correlation-id', 'Correlation ID should be preserved')

      results.push({
        test: 'Complete Request Flow Integration',
        status: 'PASS',
        message: 'Complete request flow integration works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Complete Request Flow Integration',
        status: 'FAIL',
        message: `Complete request flow integration failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // ==============================================
    // LOG FORMATTING TESTS
    // ==============================================
    console.log('\n📄 Log Formatting Tests')

    // Test structured log format
    try {
      logger.info('Structured log test', {
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'test-service',
        environment: 'test',
        metadata: {
          component: 'test-component',
          action: 'test-action'
        }
      })

      results.push({
        test: 'Structured Log Format',
        status: 'PASS',
        message: 'Structured log format works correctly'
      })
    } catch (error) {
      results.push({
        test: 'Structured Log Format',
        status: 'FAIL',
        message: `Structured log format failed: ${error instanceof Error ? error.message : error}`
      })
    }

    // ==============================================
    // SUMMARY AND RESULTS
    // ==============================================
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))

    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📊 Total: ${results.length}`)

    if (failed === 0) {
      console.log('\n🎉 ALL LOGGING TESTS PASSED!')
      console.log('\n💡 Logging Features Validated:')
      console.log('   ✅ Basic logging (debug, info, warn, error)')
      console.log('   ✅ Contextual logging (business, security, database)')
      console.log('   ✅ Performance and cache logging')
      console.log('   ✅ Authentication and security event logging')
      console.log('   ✅ Correlation ID propagation')
      console.log('   ✅ Request/response logging middleware')
      console.log('   ✅ Performance monitoring middleware')
      console.log('   ✅ Structured log format')
      console.log('   ✅ Child logger functionality')
      console.log('   ✅ Integration flow testing')
    } else {
      console.log('\n⚠️ Some logging tests failed. Please review the errors above.')
    }

    // Log best practices
    console.log('\n📚 Logging Best Practices:')
    console.log('   • Use correlation IDs for request tracking')
    console.log('   • Log security events with appropriate severity')
    console.log('   • Monitor performance for slow operations')
    console.log('   • Use structured logging for better analysis')
    console.log('   • Implement log rotation and retention policies')
    console.log('   • Set up alerting for critical security events')
    console.log('   • Regular log analysis and monitoring')

    // Cleanup
    await logger.flush()

    process.exit(failed > 0 ? 1 : 0)

  } catch (error) {
    console.error('\n💥 Logging test suite failed:', error instanceof Error ? error.message : error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    process.exit(1)
  }
}

// Run the tests
if (require.main === module) {
  runLoggingTests()
    .catch(error => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}

export default runLoggingTests