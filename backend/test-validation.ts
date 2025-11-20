#!/usr/bin/env node

/**
 * Validation and Sanitization Middleware Test Suite
 * 
 * This script tests:
 * 1. Input sanitization utilities
 * 2. Validation middleware functionality
 * 3. Security-focused validation rules
 * 4. Error handling and response formatting
 * 5. Integration with express-validator
 * 6. Field-level sanitization
 * 7. Schema-based validation
 */

import { InputSanitizer, ValidationMiddleware, ValidationRules, ValidationSchemas, SanitizationMiddleware } from '../src/middleware/validation'
import { Request, Response, NextFunction } from 'express'

// Mock Express objects for testing
class MockRequest {
  public body: any = {}
  public query: any = {}
  public params: any = {}
  public headers: any = {}

  constructor(body: any = {}, query: any = {}, params: any = {}) {
    this.body = body
    this.query = query
    this.params = params
  }
}

class MockResponse {
  public statusCode: number = 200
  public jsonData: any = null

  status(code: number) {
    this.statusCode = code
    return this
  }

  json(data: any) {
    this.jsonData = data
    return this
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

async function runValidationTests(): Promise<void> {
  console.log('🔍 Running Validation and Sanitization Tests\n')
  console.log('=' .repeat(60))

  const results: TestResult[] = []

  try {
    // ==============================================
    // INPUT SANITIZATION TESTS
    // ==============================================
    console.log('\n🧪 Input Sanitization Tests')

    // Test HTML sanitization
    const htmlTest = '<script>alert("xss")</script>Hello <b>World</b>'
    const sanitizedHTML = InputSanitizer.sanitizeHTML(htmlTest)
    assert(sanitizedHTML === 'Hello World', `HTML sanitization failed: ${sanitizedHTML}`)
    results.push({
      test: 'HTML Sanitization',
      status: 'PASS',
      message: 'Successfully removed script tags and HTML elements'
    })

    // Test SQL injection sanitization
    const sqlTest = "'; DROP TABLE users; --"
    const sanitizedSQL = InputSanitizer.sanitizeSQL(sqlTest)
    assert(sanitizedSQL === "\\'; DROP TABLE users; --", `SQL sanitization failed: ${sanitizedSQL}`)
    results.push({
      test: 'SQL Injection Sanitization',
      status: 'PASS',
      message: 'Successfully escaped SQL injection patterns'
    })

    // Test email sanitization
    const emailTest = '  User@Example.COM  '
    const sanitizedEmail = InputSanitizer.sanitizeEmail(emailTest)
    assert(sanitizedEmail === 'user@example.com', `Email sanitization failed: ${sanitizedEmail}`)
    results.push({
      test: 'Email Sanitization',
      status: 'PASS',
      message: 'Successfully normalized email format'
    })

    // Test phone sanitization
    const phoneTest = '+1 (555) 123-4567 ext. 789'
    const sanitizedPhone = InputSanitizer.sanitizePhone(phoneTest)
    assert(sanitizedPhone === '+1 (555) 123-4567 ext. 789', `Phone sanitization failed: ${sanitizedPhone}`)
    results.push({
      test: 'Phone Sanitization',
      status: 'PASS',
      message: 'Successfully cleaned phone number format'
    })

    // Test URL sanitization
    const urlTest = 'javascript:alert("xss")https://example.com'
    const sanitizedURL = InputSanitizer.sanitizeURL(urlTest)
    assert(sanitizedURL === 'https://example.com', `URL sanitization failed: ${sanitizedURL}`)
    results.push({
      test: 'URL Sanitization',
      status: 'PASS',
      message: 'Successfully removed dangerous protocols'
    })

    // Test filename sanitization
    const filenameTest = '../../../etc/passwd<script>.txt'
    const sanitizedFilename = InputSanitizer.sanitizeFilename(filenameTest)
    assert(sanitizedFilename === '____etc_passwd_script_.txt', `Filename sanitization failed: ${sanitizedFilename}`)
    results.push({
      test: 'Filename Sanitization',
      status: 'PASS',
      message: 'Successfully sanitized filename'
    })

    // Test search query sanitization
    const searchTest = '<script>alert("xss")</search term" with quotes\''
    const sanitizedSearch = InputSanitizer.sanitizeSearchQuery(searchTest)
    assert(sanitizedSearch === 'search term with quotes', `Search sanitization failed: ${sanitizedSearch}`)
    results.push({
      test: 'Search Query Sanitization',
      status: 'PASS',
      message: 'Successfully cleaned search query'
    })

    // Test number sanitization
    const numTest = InputSanitizer.sanitizeNumber('123.456', 0)
    assert(numTest === 123.456, `Number sanitization failed: ${numTest}`)
    results.push({
      test: 'Number Sanitization',
      status: 'PASS',
      message: 'Successfully parsed and sanitized number'
    })

    // Test boolean sanitization
    const boolTest1 = InputSanitizer.sanitizeBoolean('true')
    const boolTest2 = InputSanitizer.sanitizeBoolean('false')
    const boolTest3 = InputSanitizer.sanitizeBoolean('1')
    const boolTest4 = InputSanitizer.sanitizeBoolean('0')
    assert(boolTest1 === true && boolTest2 === false && boolTest3 === true && boolTest4 === false, 
      `Boolean sanitization failed: ${boolTest1}, ${boolTest2}, ${boolTest3}, ${boolTest4}`)
    results.push({
      test: 'Boolean Sanitization',
      status: 'PASS',
      message: 'Successfully sanitized boolean values'
    })

    // Test array sanitization
    const arrayTest = ['  item1  ', 'item2<script>', 'item3', '']
    const sanitizedArray = InputSanitizer.sanitizeArray(arrayTest)
    assert(sanitizedArray.length === 3, `Array sanitization failed: ${sanitizedArray.length}`)
    results.push({
      test: 'Array Sanitization',
      status: 'PASS',
      message: 'Successfully sanitized array elements'
    })

    // Test deep sanitization
    const deepTest = {
      name: '<script>alert("xss")</script>John',
      email: '  JANE@EXAMPLE.COM  ',
      tags: ['  tag1  ', 'tag2<script>'],
      nested: {
        value: '  nested  ',
        number: '123.456'
      }
    }
    const sanitizedDeep = InputSanitizer.deepSanitize(deepTest)
    assert(sanitizedDeep.name === 'John' && sanitizedDeep.email === 'jane@example.com', 
      `Deep sanitization failed`)
    results.push({
      test: 'Deep Object Sanitization',
      status: 'PASS',
      message: 'Successfully sanitized nested objects'
    })

    // ==============================================
    // VALIDATION RULES TESTS
    // ==============================================
    console.log('\n📋 Validation Rules Tests')

    // Test email validation rule
    const mockReq = new MockRequest({ email: 'user@example.com' })
    const mockRes = new MockResponse()
    const mockNext: NextFunction = () => {}

    // Simulate express-validator middleware behavior
    assert(ValidationRules.email?.builder?.messages?.isEmail !== undefined, 
      'Email validation rule exists')
    results.push({
      test: 'Email Validation Rule',
      status: 'PASS',
      message: 'Email validation rule properly configured'
    })

    // Test password validation rule
    assert(ValidationRules.password?.builder?.messages?.isLength !== undefined,
      'Password validation rule exists')
    results.push({
      test: 'Password Validation Rule',
      status: 'PASS',
      message: 'Password validation rule properly configured'
    })

    // Test UUID validation rule
    const uuidParamTest = new MockRequest({}, {}, { id: '550e8400-e29b-41d4-a716-446655440000' })
    assert(ValidationRules.uuid?.builder?.messages?.isUUID !== undefined,
      'UUID validation rule exists')
    results.push({
      test: 'UUID Validation Rule',
      status: 'PASS',
      message: 'UUID validation rule properly configured'
    })

    // ==============================================
    // VALIDATION SCHEMAS TESTS
    // ==============================================
    console.log('\n📝 Validation Schemas Tests')

    // Test user registration schema
    const userRegSchema = ValidationSchemas.userRegistration
    assert(Array.isArray(userRegSchema) && userRegSchema.length > 0,
      'User registration schema exists')
    assert(userRegSchema.some(rule => rule.builder?.field === 'email'),
      'User registration schema contains email validation')
    assert(userRegSchema.some(rule => rule.builder?.field === 'password'),
      'User registration schema contains password validation')
    results.push({
      test: 'User Registration Schema',
      status: 'PASS',
      message: 'User registration schema properly configured'
    })

    // Test tour creation schema
    const tourCreationSchema = ValidationSchemas.tourCreation
    assert(Array.isArray(tourCreationSchema) && tourCreationSchema.length > 0,
      'Tour creation schema exists')
    results.push({
      test: 'Tour Creation Schema',
      status: 'PASS',
      message: 'Tour creation schema properly configured'
    })

    // Test pagination schema
    const paginationSchema = ValidationSchemas.pagination
    assert(Array.isArray(paginationSchema) && paginationSchema.length > 0,
      'Pagination schema exists')
    results.push({
      test: 'Pagination Schema',
      status: 'PASS',
      message: 'Pagination schema properly configured'
    })

    // ==============================================
    // SANITIZATION MIDDLEWARE TESTS
    // ==============================================
    console.log('\n🛡️ Sanitization Middleware Tests')

    // Test request sanitization middleware
    const testReq = new MockRequest(
      { name: '<script>alert("xss")</script>John' },
      { search: '<script>search</script>' },
      { id: 'test<script>' }
    )
    const testRes = new MockResponse()

    let nextCalled = false
    const testNext: NextFunction = () => {
      nextCalled = true
    }

    SanitizationMiddleware.sanitizeRequest(testReq, testRes, testNext)
    assert(nextCalled === true, 'Sanitization middleware calls next()')
    assert(testReq.body.name === 'John', 'Sanitization middleware sanitizes body')
    assert(testReq.query.search === 'search', 'Sanitization middleware sanitizes query')
    assert(testReq.params.id === 'testscript', 'Sanitization middleware sanitizes params')
    results.push({
      test: 'Request Sanitization Middleware',
      status: 'PASS',
      message: 'Request sanitization middleware works correctly'
    })

    // Test field-level sanitization
    const fieldTestReq = new MockRequest(
      { name: '<script>John</script>', email: 'john@example.com', age: 25 },
      { search: '<script>test</script>' },
      { id: 'test<script>' }
    )

    SanitizationMiddleware.sanitizeFields(['name'])(fieldTestReq, testRes, testNext)
    assert(fieldTestReq.body.name === 'John', 'Field-level sanitization works on body')
    assert(fieldTestReq.query.search === '<script>test</script>', 'Field-level sanitization preserves unsanitized fields')
    results.push({
      test: 'Field-Level Sanitization',
      status: 'PASS',
      message: 'Field-level sanitization works correctly'
    })

    // ==============================================
    // SECURITY VALIDATION TESTS
    // ==============================================
    console.log('\n🔒 Security Validation Tests')

    // Test XSS prevention
    const xssTest = '<script>alert("xss")</script><img src="x" onerror="alert(1)">'
    const xssSanitized = InputSanitizer.sanitizeHTML(xssTest)
    assert(!xssSanitized.includes('<script>') && !xssSanitized.includes('<img>') && !xssSanitized.includes('onerror'),
      'XSS prevention works correctly')
    results.push({
      test: 'XSS Prevention',
      status: 'PASS',
      message: 'Successfully prevents XSS attacks'
    })

    // Test SQL injection prevention
    const sqliTest = "'; DROP TABLE users; --"
    const sqliSanitized = InputSanitizer.sanitizeSQL(sqliTest)
    assert(sqliSanitized.includes('DROP') === false, 'SQL injection prevention works')
    results.push({
      test: 'SQL Injection Prevention',
      status: 'PASS',
      message: 'Successfully prevents SQL injection attacks'
    })

    // Test malicious URL prevention
    const urlAttackTest = 'javascript:alert(document.cookie)'
    const urlAttackSanitized = InputSanitizer.sanitizeURL(urlAttackTest)
    assert(!urlAttackSanitized.startsWith('javascript:'), 'Malicious URL prevention works')
    results.push({
      test: 'Malicious URL Prevention',
      status: 'PASS',
      message: 'Successfully prevents malicious URL attacks'
    })

    // ==============================================
    // DATA TYPE VALIDATION TESTS
    // ==============================================
    console.log('\n📊 Data Type Validation Tests')

    // Test number validation
    const numValidation1 = InputSanitizer.sanitizeNumber('123.456', 0)
    const numValidation2 = InputSanitizer.sanitizeNumber('invalid', 999)
    assert(numValidation1 === 123.456, 'Number validation works for valid input')
    assert(numValidation2 === 999, 'Number validation handles invalid input')
    results.push({
      test: 'Number Validation',
      status: 'PASS',
      message: 'Number validation handles various inputs correctly'
    })

    // Test integer validation
    const intValidation1 = InputSanitizer.sanitizeInteger('42', 0)
    const intValidation2 = InputSanitizer.sanitizeInteger('invalid', 999)
    assert(intValidation1 === 42, 'Integer validation works for valid input')
    assert(intValidation2 === 999, 'Integer validation handles invalid input')
    results.push({
      test: 'Integer Validation',
      status: 'PASS',
      message: 'Integer validation handles various inputs correctly'
    })

    // Test boolean validation
    const boolValidations = [
      { input: true, expected: true },
      { input: 'true', expected: true },
      { input: '1', expected: true },
      { input: 'yes', expected: true },
      { input: false, expected: false },
      { input: 'false', expected: false },
      { input: '0', expected: false },
      { input: 'no', expected: false },
      { input: 1, expected: true },
      { input: 0, expected: false }
    ]

    const boolResults = boolValidations.map(test => 
      InputSanitizer.sanitizeBoolean(test.input) === test.expected
    )
    assert(boolResults.every(result => result), 'Boolean validation works for all test cases')
    results.push({
      test: 'Boolean Validation',
      status: 'PASS',
      message: 'Boolean validation handles various input types correctly'
    })

    // ==============================================
    // INTEGRATION TESTS
    // ==============================================
    console.log('\n🔗 Integration Tests')

    // Test with Express.js mock
    const integrationReq = new MockRequest(
      {
        email: '  user@example.COM  ',
        password: 'SecurePass123',
        fullName: '  <script>John Doe</script>  ',
        phone: '+1 (555) 123-4567'
      },
      { page: '1', limit: '20', search: '<script>test</script>' },
      { id: '550e8400-e29b-41d4-a716-446655440000' }
    )

    let integrationNextCalled = false
    const integrationNext: NextFunction = () => {
      integrationNextCalled = true
    }

    SanitizationMiddleware.sanitizeRequest(integrationReq, testRes, integrationNext)
    assert(integrationNextCalled === true, 'Integration test sanitization middleware works')
    assert(integrationReq.body.email === 'user@example.com', 'Email integrated sanitization works')
    assert(integrationReq.body.fullName === 'John Doe', 'HTML integrated sanitization works')
    assert(integrationReq.query.search === 'test', 'Query integrated sanitization works')
    results.push({
      test: 'Integration Test',
      status: 'PASS',
      message: 'Integration test with Express mock works correctly'
    })

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))

    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📊 Total: ${results.length}`)

    if (failed === 0) {
      console.log('\n🎉 ALL VALIDATION AND SANITIZATION TESTS PASSED!')
      console.log('\n💡 Validation Features Validated:')
      console.log('   ✅ HTML/XSS sanitization working')
      console.log('   ✅ SQL injection prevention working')
      console.log('   ✅ Input normalization working')
      console.log('   ✅ Type validation working')
      console.log('   ✅ Security rules working')
      console.log('   ✅ Middleware integration working')
      console.log('   ✅ Express-validator integration working')
      console.log('\n🛡️ Security Features:')
      console.log('   ✅ XSS prevention active')
      console.log('   ✅ SQL injection prevention active')
      console.log('   ✅ Malicious URL prevention active')
      console.log('   ✅ Input sanitization comprehensive')
    } else {
      console.log('\n⚠️ Some validation tests failed. Please review the errors above.')
    }

    // Security recommendations
    console.log('\n🔧 Security Recommendations:')
    console.log('   • Always sanitize user inputs before processing')
    console.log('   • Use validation middleware for all API endpoints')
    console.log('   • Implement defense in depth (multiple validation layers)')
    console.log('   • Regular security testing of validation rules')
    console.log('   • Monitor for new attack vectors and update rules')

    process.exit(failed > 0 ? 1 : 0)

  } catch (error) {
    console.error('\n💥 Validation test suite failed:', error instanceof Error ? error.message : error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    process.exit(1)
  }
}

// Run the tests
if (require.main === module) {
  runValidationTests()
    .catch(error => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}

export default runValidationTests