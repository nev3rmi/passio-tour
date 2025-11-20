import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { z } from 'zod'

// Load environment variables from .env file
dotenv.config()

/**
 * Secure Environment Configuration Manager
 * 
 * Features:
 * 1. Schema validation with Zod
 * 2. Secrets encryption/decryption
 * 3. Environment profile management
 * 4. Secure defaults and validation
 * 5. Configuration masking for logging
 * 6. Missing secrets detection
 */

export interface EncryptionOptions {
  algorithm?: string
  keyDerivation?: string
  iterations?: number
}

export interface SecureConfigOptions {
  encryptionKey?: string
  encryptionOptions?: EncryptionOptions
  environment?: 'development' | 'staging' | 'production'
  validateSecrets?: boolean
  strictMode?: boolean
}

export interface ConfigurationProfile {
  name: string
  requiredSecrets: string[]
  optionalSecrets: string[]
  requiredVars: string[]
  optionalVars: string[]
  environment: string
}

/**
 * Secure Configuration Schema with Zod validation
 */
const configSchema = z.object({
  // Server configuration
  PORT: z.number().min(1).max(65535),
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  FRONTEND_URL: z.string().url(),

  // Database configuration
  DATABASE: z.object({
    host: z.string().min(1),
    port: z.number().min(1).max(65535),
    name: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
    ssl: z.boolean(),
    max: z.number().min(1).max(100),
    idleTimeoutMillis: z.number().min(1000),
    connectionTimeoutMillis: z.number().min(1000),
  }),

  // Redis configuration
  REDIS: z.object({
    host: z.string().min(1),
    port: z.number().min(1).max(65535),
    password: z.string().optional(),
    db: z.number().min(0),
    keyPrefix: z.string().min(1),
  }),

  // Authentication
  AUTH: z.object({
    jwtSecret: z.string().min(32, 'JWT secret must be at least 32 characters'),
    jwtExpiresIn: z.string(),
    refreshTokenExpiresIn: z.string(),
    bcryptRounds: z.number().min(10).max(15),
  }),

  // Session configuration
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  SESSION: z.object({
    ttl: z.number().min(3600),
    userSessionsTTL: z.number().min(3600),
    refreshTokenTTL: z.number().min(3600),
  }),

  // Security
  SECURITY: z.object({
    corsOrigins: z.array(z.string().url()),
    helmetEnabled: z.boolean(),
    compressionEnabled: z.boolean(),
  }),

  // Rate limiting
  RATE_LIMIT: z.object({
    windowMs: z.number().min(60000),
    max: z.number().min(1),
  }),

  // Feature flags
  FEATURES: z.object({
    enableWebSockets: z.boolean(),
    enableStripe: z.boolean(),
    enablePayPal: z.boolean(),
    enableEmailNotifications: z.boolean(),
    enableS3Upload: z.boolean(),
  }),

  // Optional external services
  STRIPE: z.object({
    publishableKey: z.string().optional(),
    secretKey: z.string().optional(),
    webhookSecret: z.string().optional(),
  }).optional(),

  PAYPAL: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    mode: z.enum(['sandbox', 'live']).optional(),
  }).optional(),

  EMAIL: z.object({
    provider: z.string().optional(),
    apiKey: z.string().optional(),
    fromEmail: z.string().optional(),
    fromName: z.string().optional(),
  }).optional(),

  AWS: z.object({
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    region: z.string().optional(),
    s3Bucket: z.string().optional(),
  }).optional(),

  // Logging
  LOGGING: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']),
    file: z.string().optional(),
    maxFiles: z.number().min(1).max(50),
    maxSize: z.string().optional(),
  }).optional(),

  // File upload
  UPLOAD: z.object({
    maxFileSize: z.number().min(1024),
    allowedMimeTypes: z.array(z.string()),
    uploadPath: z.string(),
  }).optional(),
})

/**
 * Encryption/Decryption utilities
 */
class SecureConfigManager {
  private static instance: SecureConfigManager
  private encryptionKey: string
  private options: SecureConfigOptions

  private constructor(options: SecureConfigOptions = {}) {
    this.options = {
      environment: (process.env.NODE_ENV as any) || 'development',
      validateSecrets: true,
      strictMode: false,
      encryptionKey: process.env.CONFIG_ENCRYPTION_KEY,
      encryptionOptions: {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        iterations: 100000,
      },
      ...options,
    }

    // Generate encryption key if not provided
    this.encryptionKey = this.options.encryptionKey || this.generateEncryptionKey()
  }

  public static getInstance(options?: SecureConfigOptions): SecureConfigManager {
    if (!SecureConfigManager.instance) {
      SecureConfigManager.instance = new SecureConfigManager(options)
    }
    return SecureConfigManager.instance
  }

  /**
   * Encrypt sensitive configuration values
   */
  encrypt(value: string, customKey?: string): string {
    try {
      const key = customKey || this.encryptionKey
      if (!key) {
        throw new Error('Encryption key not provided')
      }

      const iv = crypto.randomBytes(16)
      const derivedKey = this.deriveKey(key)
      const cipher = crypto.createCipher(this.options.encryptionOptions!.algorithm!, derivedKey)
      cipher.setAAD(Buffer.from('secure-config'))

      let encrypted = cipher.update(value, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const authTag = cipher.getAuthTag()

      return Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64')
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * Decrypt sensitive configuration values
   */
  decrypt(encryptedValue: string, customKey?: string): string {
    try {
      const key = customKey || this.encryptionKey
      if (!key) {
        throw new Error('Decryption key not provided')
      }

      const buffer = Buffer.from(encryptedValue, 'base64')
      const iv = buffer.subarray(0, 16)
      const authTag = buffer.subarray(16, 32)
      const encrypted = buffer.subarray(32)

      const derivedKey = this.deriveKey(key)
      const decipher = crypto.createDecipher(this.options.encryptionOptions!.algorithm!, derivedKey)
      decipher.setAAD(Buffer.from('secure-config'))
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * Generate a secure encryption key
   */
  generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Derive encryption key from passphrase
   */
  private deriveKey(passphrase: string): Buffer {
    const { iterations } = this.options.encryptionOptions!
    return crypto.pbkdf2Sync(passphrase, 'secure-config-salt', iterations, 32, 'sha256')
  }

  /**
   * Mask sensitive values for logging
   */
  maskSensitive(value: string, type: 'secret' | 'password' | 'key' | 'token' = 'secret'): string {
    if (!value || value.length <= 8) {
      return type.toUpperCase().replace('_', ' ') + '_HIDDEN'
    }

    const visibleLength = Math.min(4, Math.floor(value.length / 4))
    return `${value.substring(0, visibleLength)}***${value.substring(value.length - visibleLength)}`
  }

  /**
   * Validate configuration with comprehensive checks
   */
  validateConfiguration(): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    recommendations: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []

    try {
      // Check required environment variables
      const requiredVars = [
        'JWT_SECRET',
        'SESSION_SECRET',
        'DATABASE_HOST',
        'DATABASE_NAME',
        'DATABASE_USERNAME',
        'DATABASE_PASSWORD'
      ]

      const missingRequired = requiredVars.filter(key => !process.env[key])
      if (missingRequired.length > 0) {
        errors.push(`Missing required environment variables: ${missingRequired.join(', ')}`)
      }

      // Check JWT secret strength
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters long')
      }

      // Check session secret strength
      if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
        errors.push('SESSION_SECRET must be at least 32 characters long')
      }

      // Environment-specific validations
      if (process.env.NODE_ENV === 'production') {
        // Production-specific checks
        if (!process.env.STRIPE_SECRET_KEY) {
          warnings.push('STRIPE_SECRET_KEY not set - Stripe integration disabled')
        }

        if (!process.env.EMAIL_API_KEY) {
          warnings.push('EMAIL_API_KEY not set - Email notifications disabled')
        }

        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
          warnings.push('AWS credentials not set - S3 integration disabled')
        }

        // Security recommendations
        recommendations.push('Enable SSL/TLS for database connections in production')
        recommendations.push('Use environment-specific encryption keys')
        recommendations.push('Implement secrets rotation policy')
        recommendations.push('Enable audit logging for configuration access')
      }

      // Configuration recommendations
      if (!process.env.RATE_LIMIT_WINDOW || !process.env.RATE_LIMIT_MAX) {
        recommendations.push('Configure rate limiting parameters')
      }

      if (!process.env.LOG_LEVEL) {
        warnings.push('LOG_LEVEL not set - defaulting to info level')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        recommendations
      }

    } catch (error) {
      errors.push(`Configuration validation error: ${error instanceof Error ? error.message : error}`)
      return {
        isValid: false,
        errors,
        warnings,
        recommendations
      }
    }
  }

  /**
   * Create secure configuration object
   */
  createSecureConfig(): any {
    const baseConfig = {
      // Server configuration
      PORT: parseInt(process.env.PORT || '5000', 10),
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

      // Database configuration
      DATABASE: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        name: process.env.DATABASE_NAME || 'passio_tour',
        username: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
        ssl: process.env.NODE_ENV === 'production',
        max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '2000', 10),
      },

      // Redis configuration
      REDIS: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'passio_tour:',
      },

      // Authentication
      AUTH: {
        jwtSecret: process.env.JWT_SECRET || '',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
      },

      // Session configuration
      SESSION_SECRET: process.env.SESSION_SECRET || '',
      SESSION: {
        ttl: parseInt(process.env.SESSION_TTL || '86400', 10),
        userSessionsTTL: parseInt(process.env.USER_SESSIONS_TTL || '604800', 10),
        refreshTokenTTL: parseInt(process.env.REFRESH_TOKEN_TTL || '604800', 10),
      },

      // Security
      SECURITY: {
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        helmetEnabled: process.env.HELMET_ENABLED !== 'false',
        compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
      },

      // Rate limiting
      RATE_LIMIT: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
      },

      // Feature flags
      FEATURES: {
        enableWebSockets: process.env.ENABLE_WEBSOCKETS !== 'false',
        enableStripe: process.env.ENABLE_STRIPE === 'true',
        enablePayPal: process.env.ENABLE_PAYPAL === 'true',
        enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
        enableS3Upload: process.env.ENABLE_S3_UPLOAD === 'true',
      },
    }

    // Add optional configurations if environment variables exist
    if (process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_SECRET_KEY) {
      baseConfig.STRIPE = {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      }
    }

    if (process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_SECRET) {
      baseConfig.PAYPAL = {
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        mode: (process.env.PAYPAL_MODE as any) || 'sandbox',
      }
    }

    if (process.env.EMAIL_API_KEY || process.env.EMAIL_PROVIDER) {
      baseConfig.EMAIL = {
        provider: process.env.EMAIL_PROVIDER || 'sendgrid',
        apiKey: process.env.EMAIL_API_KEY || '',
        fromEmail: process.env.EMAIL_FROM || 'noreply@passio-tour.com',
        fromName: process.env.EMAIL_FROM_NAME || 'Passio Tour',
      }
    }

    if (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_SECRET_ACCESS_KEY) {
      baseConfig.AWS = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.AWS_S3_BUCKET || '',
      }
    }

    if (process.env.LOG_LEVEL) {
      baseConfig.LOGGING = {
        level: process.env.LOG_LEVEL as any,
        file: process.env.LOG_FILE || './logs/app.log',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
        maxSize: process.env.LOG_MAX_SIZE || '20m',
      }
    }

    if (process.env.MAX_FILE_SIZE) {
      baseConfig.UPLOAD = {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
        allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp').split(','),
        uploadPath: process.env.UPLOAD_PATH || './uploads',
      }
    }

    return baseConfig
  }

  /**
   * Initialize secure configuration
   */
  initialize(): any {
    const validation = this.validateConfiguration()

    if (!validation.isValid && this.options.strictMode) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
    }

    const baseConfig = this.createSecureConfig()

    // Validate with Zod schema
    try {
      const validatedConfig = configSchema.parse(baseConfig)
      
      console.log('✅ Configuration validation successful')
      
      if (validation.warnings.length > 0) {
        console.warn('⚠️  Configuration warnings:')
        validation.warnings.forEach(warning => console.warn(`   • ${warning}`))
      }

      if (validation.recommendations.length > 0) {
        console.log('💡 Configuration recommendations:')
        validation.recommendations.forEach(rec => console.log(`   • ${rec}`))
      }

      return validatedConfig
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        throw new Error(`Configuration schema validation failed: ${errorMessages.join(', ')}`)
      }
      throw error
    }
  }

  /**
   * Get configuration profile for current environment
   */
  getConfigurationProfile(): ConfigurationProfile {
    const env = this.options.environment!

    const profiles: Record<string, ConfigurationProfile> = {
      development: {
        name: 'Development',
        requiredSecrets: ['JWT_SECRET', 'SESSION_SECRET', 'DATABASE_PASSWORD'],
        optionalSecrets: ['STRIPE_SECRET_KEY', 'EMAIL_API_KEY', 'AWS_SECRET_ACCESS_KEY'],
        requiredVars: ['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USERNAME'],
        optionalVars: ['REDIS_HOST', 'LOG_LEVEL'],
        environment: env
      },
      staging: {
        name: 'Staging',
        requiredSecrets: ['JWT_SECRET', 'SESSION_SECRET', 'DATABASE_PASSWORD', 'EMAIL_API_KEY'],
        optionalSecrets: ['STRIPE_SECRET_KEY', 'AWS_SECRET_ACCESS_KEY'],
        requiredVars: ['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USERNAME', 'REDIS_HOST'],
        optionalVars: ['LOG_LEVEL', 'RATE_LIMIT_WINDOW'],
        environment: env
      },
      production: {
        name: 'Production',
        requiredSecrets: ['JWT_SECRET', 'SESSION_SECRET', 'DATABASE_PASSWORD', 'EMAIL_API_KEY', 'STRIPE_SECRET_KEY'],
        optionalSecrets: ['AWS_SECRET_ACCESS_KEY'],
        requiredVars: ['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USERNAME', 'REDIS_HOST', 'FRONTEND_URL'],
        optionalVars: [],
        environment: env
      }
    }

    return profiles[env] || profiles.development
  }
}

// Initialize secure configuration manager
const secureConfigManager = SecureConfigManager.getInstance()

// Export the validated and secure configuration
export const config = secureConfigManager.initialize()

// Export utilities for external use
export { SecureConfigManager, secureConfigManager }

// Export validation function
export const validateSecureConfig = () => secureConfigManager.validateConfiguration()

// Export configuration profile
export const getConfigProfile = () => secureConfigManager.getConfigurationProfile()

export default config