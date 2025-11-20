import { config } from '@/config/config'

export const validateEnv = (): void => {
  const required = [
    'NODE_ENV',
    'PORT',
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_NAME',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'REDIS_HOST',
    'REDIS_PORT',
    'JWT_SECRET',
    'SESSION_SECRET',
    'FRONTEND_URL',
  ]

  const missing: string[] = []

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }

  // Validate specific formats
  const port = parseInt(process.env.PORT || '5000', 10)
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error('Invalid PORT environment variable. Must be a number between 1 and 65535.')
  }

  const dbPort = parseInt(process.env.DATABASE_PORT || '5432', 10)
  if (isNaN(dbPort) || dbPort <= 0 || dbPort > 65535) {
    throw new Error('Invalid DATABASE_PORT environment variable. Must be a number between 1 and 65535.')
  }

  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10)
  if (isNaN(redisPort) || redisPort <= 0 || redisPort > 65535) {
    throw new Error('Invalid REDIS_PORT environment variable. Must be a number between 1 and 65535.')
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security.')
  }

  // Validate session secret length
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long for security.')
  }

  // Validate NODE_ENV
  const validEnv = ['development', 'test', 'production']
  if (!validEnv.includes(process.env.NODE_ENV || '')) {
    throw new Error(`NODE_ENV must be one of: ${validEnv.join(', ')}`)
  }

  console.log('✅ Environment validation passed')
}