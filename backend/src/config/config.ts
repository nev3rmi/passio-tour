import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export const config = {
  // Server configuration
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
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
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'passio_tour:',
  },

  // Authentication
  AUTH: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  // Session configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
  SESSION: {
    ttl: parseInt(process.env.SESSION_TTL || '86400', 10), // 24 hours
    userSessionsTTL: parseInt(process.env.USER_SESSIONS_TTL || '604800', 10), // 7 days
    refreshTokenTTL: parseInt(process.env.REFRESH_TOKEN_TTL || '604800', 10), // 7 days
  },

  // File upload configuration
  UPLOAD: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp').split(','),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // External services
  STRIPE: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  PAYPAL: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: process.env.PAYPAL_MODE || 'sandbox', // sandbox or live
  },

  EMAIL: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    apiKey: process.env.EMAIL_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@passio-tour.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Passio Tour',
  },

  AWS: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
  },

  // Rate limiting
  RATE_LIMIT: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  },

  // Logging
  LOGGING: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
    maxSize: process.env.LOG_MAX_SIZE || '20m',
  },

  // Security
  SECURITY: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
    compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
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

// Validate critical configuration
export const validateConfig = (): void => {
  const required = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'DATABASE_HOST',
    'DATABASE_NAME',
    'DATABASE_USERNAME',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (config.NODE_ENV === 'production') {
    const productionRequired = [
      'STRIPE_SECRET_KEY',
      'EMAIL_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
    ]

    const missingProd = productionRequired.filter(key => !process.env[key])
    
    if (missingProd.length > 0) {
      console.warn(`Missing production environment variables: ${missingProd.join(', ')}`)
    }
  }
}

export default config