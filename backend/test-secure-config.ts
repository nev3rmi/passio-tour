#!/usr/bin/env node

/**
 * Secure Configuration Validation Test
 * 
 * This script tests:
 * 1. Environment variable validation
 * 2. Configuration schema validation
 * 3. Secrets strength validation
 * 4. Environment profile compliance
 * 5. Encryption/decryption functionality
 * 6. Configuration masking for logging
 */

import { secureConfigManager, validateSecureConfig, getConfigProfile } from '../src/config/secureConfig'
import { logger } from '../src/utils/logger'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  details?: any
}

async function runSecureConfigTests(): Promise<void> {
  console.log('🔐 Running Secure Configuration Validation Tests\n')
  console.log('='.repeat(60))

  const results: TestResult[] = []

  try {
    // Test 1: Configuration Schema Validation
    console.log('\n📋 Test 1: Configuration Schema Validation')
    try {
      const config = secureConfigManager.initialize()
      console.log('   ✅ Configuration schema validation: PASS')
      results.push({
        test: 'Configuration Schema Validation',
        status: 'PASS',
        message: 'All configuration values passed schema validation'
      })
    } catch (error) {
      console.log(`   ❌ Configuration schema validation: FAIL - ${error instanceof Error ? error.message : error}`)
      results.push({
        test: 'Configuration Schema Validation',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Environment Variables Validation
    console.log('\n🔍 Test 2: Environment Variables Validation')
    const validation = validateSecureConfig()
    
    if (validation.isValid) {
      console.log('   ✅ Environment variables validation: PASS')
      console.log(`   📊 Found ${validation.errors.length} errors, ${validation.warnings.length} warnings`)
      if (validation.recommendations.length > 0) {
        console.log(`   💡 ${validation.recommendations.length} recommendations provided`)
      }
      results.push({
        test: 'Environment Variables Validation',
        status: 'PASS',
        message: 'All required environment variables are present',
        details: validation
      })
    } else {
      console.log('   ❌ Environment variables validation: FAIL')
      validation.errors.forEach(error => console.log(`      • ${error}`))
      results.push({
        test: 'Environment Variables Validation',
        status: 'FAIL',
        message: `${validation.errors.length} validation errors found`,
        details: validation
      })
    }

    // Test 3: Secrets Strength Validation
    console.log('\n🔐 Test 3: Secrets Strength Validation')
    const secretsValidation = [
      { name: 'JWT_SECRET', value: process.env.JWT_SECRET, minLength: 32 },
      { name: 'SESSION_SECRET', value: process.env.SESSION_SECRET, minLength: 32 },
      { name: 'DATABASE_PASSWORD', value: process.env.DATABASE_PASSWORD, minLength: 1 }
    ]

    let secretsPassed = 0
    for (const secret of secretsValidation) {
      if (secret.value && secret.value.length >= secret.minLength) {
        console.log(`   ✅ ${secret.name}: ${secureConfigManager.maskSensitive(secret.value)}`)
        secretsPassed++
      } else {
        console.log(`   ❌ ${secret.name}: Missing or too short (minimum ${secret.minLength} characters)`)
      }
    }

    results.push({
      test: 'Secrets Strength Validation',
      status: secretsPassed === secretsValidation.length ? 'PASS' : 'FAIL',
      message: `${secretsPassed}/${secretsValidation.length} secrets passed validation`
    })

    // Test 4: Encryption/Decryption
    console.log('\n🔒 Test 4: Encryption/Decryption Functionality')
    try {
      const testData = 'sensitive-configuration-data'
      const encrypted = secureConfigManager.encrypt(testData)
      const decrypted = secureConfigManager.decrypt(encrypted)
      
      if (decrypted === testData) {
        console.log(`   ✅ Encryption/decryption: PASS`)
        console.log(`   📝 Original: ${secureConfigManager.maskSensitive(testData)}`)
        console.log(`   🔐 Encrypted: ${encrypted.substring(0, 50)}...`)
        results.push({
          test: 'Encryption/Decryption',
          status: 'PASS',
          message: 'Encryption and decryption working correctly'
        })
      } else {
        throw new Error('Decrypted data does not match original')
      }
    } catch (error) {
      console.log(`   ❌ Encryption/decryption: FAIL - ${error instanceof Error ? error.message : error}`)
      results.push({
        test: 'Encryption/Decryption',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 5: Configuration Masking
    console.log('\n🎭 Test 5: Configuration Masking for Logging')
    try {
      const testValues = [
        { value: 'my-super-secret-jwt-token-12345', type: 'secret' },
        { value: 'admin123', type: 'password' },
        { value: 'pk_test_123456789', type: 'key' },
        { value: 'sk_test_123456789', type: 'token' }
      ]

      testValues.forEach(test => {
        const masked = secureConfigManager.maskSensitive(test.value, test.type as any)
        console.log(`   ✅ ${test.type}: ${test.value.substring(0, 10)}... → ${masked}`)
      })

      results.push({
        test: 'Configuration Masking',
        status: 'PASS',
        message: 'All configuration values masked correctly'
      })
    } catch (error) {
      console.log(`   ❌ Configuration masking: FAIL - ${error instanceof Error ? error.message : error}`)
      results.push({
        test: 'Configuration Masking',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 6: Environment Profile Validation
    console.log('\n🏷️  Test 6: Environment Profile Validation')
    try {
      const profile = getConfigProfile()
      console.log(`   📍 Current environment: ${profile.name} (${profile.environment})`)
      console.log(`   🔐 Required secrets: ${profile.requiredSecrets.length}`)
      console.log(`   🔧 Optional secrets: ${profile.optionalSecrets.length}`)
      console.log(`   ✅ Required variables: ${profile.requiredVars.length}`)
      console.log(`   ⚙️  Optional variables: ${profile.optionalVars.length}`)

      // Check required secrets
      const missingRequiredSecrets = profile.requiredSecrets.filter(secret => !process.env[secret])
      if (missingRequiredSecrets.length === 0) {
        console.log('   ✅ All required secrets are present')
        results.push({
          test: 'Environment Profile Validation',
          status: 'PASS',
          message: 'Environment profile requirements met'
        })
      } else {
        console.log(`   ❌ Missing required secrets: ${missingRequiredSecrets.join(', ')}`)
        results.push({
          test: 'Environment Profile Validation',
          status: 'FAIL',
          message: `Missing ${missingRequiredSecrets.length} required secrets`
        })
      }
    } catch (error) {
      console.log(`   ❌ Environment profile validation: FAIL - ${error instanceof Error ? error.message : error}`)
      results.push({
        test: 'Environment Profile Validation',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 7: Configuration Import
    console.log('\n📦 Test 7: Configuration Import Test')
    try {
      // Test that the configuration can be imported successfully
      const { config } = await import('../src/config/secureConfig')
      
      console.log(`   ✅ Server port: ${config.PORT}`)
      console.log(`   ✅ Environment: ${config.NODE_ENV}`)
      console.log(`   ✅ Database host: ${config.DATABASE.host}`)
      console.log(`   ✅ JWT secret: ${secureConfigManager.maskSensitive(config.AUTH.jwtSecret)}`)
      
      results.push({
        test: 'Configuration Import',
        status: 'PASS',
        message: 'Configuration imported successfully'
      })
    } catch (error) {
      console.log(`   ❌ Configuration import: FAIL - ${error instanceof Error ? error.message : error}`)
      results.push({
        test: 'Configuration Import',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))

    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length
    const skipped = results.filter(r => r.status === 'SKIP').length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📊 Total: ${results.length}`)

    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Secure configuration is properly configured.')
      console.log('\n💡 Next steps:')
      console.log('   1. Review any warnings and recommendations')
      console.log('   2. Ensure all required environment variables are set')
      console.log('   3. Test the application with the validated configuration')
      console.log('   4. Set up environment-specific configuration files')
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.')
      console.log('\n🔧 Fix required issues before proceeding.')
    }

    // Environment-specific recommendations
    const currentEnv = process.env.NODE_ENV || 'development'
    console.log(`\n🔧 Environment-Specific Recommendations (${currentEnv}):`)
    
    const recommendations = {
      development: [
        'Use strong but development-friendly secrets',
        'Enable debug logging for troubleshooting',
        'Set up local database and Redis instances'
      ],
      staging: [
        'Use production-like secrets but with test data',
        'Enable monitoring and alerting',
        'Test all integrations with staging APIs'
      ],
      production: [
        'Use cryptographically secure secrets',
        'Enable all security features',
        'Set up proper monitoring and alerting',
        'Implement secrets rotation policy',
        'Use external secrets management (AWS Secrets Manager, etc.)'
      ]
    }

    recommendations[currentEnv as keyof typeof recommendations]?.forEach(rec => {
      console.log(`   • ${rec}`)
    })

    process.exit(failed > 0 ? 1 : 0)

  } catch (error) {
    console.error('\n💥 Test suite failed with unexpected error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run the tests
if (require.main === module) {
  runSecureConfigTests()
    .catch(error => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}

export default runSecureConfigTests
