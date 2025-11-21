import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables if not provided
process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
process.env.DATABASE_PORT = process.env.DATABASE_PORT || '5432';
process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'passio_tour_test';
process.env.DATABASE_USERNAME = process.env.DATABASE_USERNAME || 'postgres';
process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || 'test_password';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.REDIS_DB = process.env.REDIS_DB || '1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-key-for-testing-only';

// Increase timeout for database operations
jest.setTimeout(30000);