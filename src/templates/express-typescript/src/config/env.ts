import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * Environment variables schema for validation
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('/api/v1'),

  // Database
  DATABASE_URL: Joi.string().required().description('PostgreSQL connection string'),

  // JWT
  JWT_SECRET: Joi.string().min(32).required().description('JWT secret key'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().description('JWT refresh secret key'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE_PATH: Joi.string().default('logs'),

  // Security
  BCRYPT_ROUNDS: Joi.number().default(10),
})
  .unknown()
  .required();

/**
 * Validate environment variables
 */
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

/**
 * Type-safe environment configuration
 */
export const env = {
  node: {
    env: envVars.NODE_ENV as 'development' | 'production' | 'test',
    isDevelopment: envVars.NODE_ENV === 'development',
    isProduction: envVars.NODE_ENV === 'production',
    isTest: envVars.NODE_ENV === 'test',
  },
  server: {
    port: envVars.PORT as number,
    apiPrefix: envVars.API_PREFIX as string,
  },
  database: {
    url: envVars.DATABASE_URL as string,
  },
  jwt: {
    secret: envVars.JWT_SECRET as string,
    expiresIn: envVars.JWT_EXPIRES_IN as string,
    refreshSecret: envVars.JWT_REFRESH_SECRET as string,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN as string,
  },
  cors: {
    origin: (envVars.CORS_ORIGIN as string).split(',').map((origin) => origin.trim()),
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS as number,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS as number,
  },
  logging: {
    level: envVars.LOG_LEVEL as string,
    filePath: envVars.LOG_FILE_PATH as string,
  },
  security: {
    bcryptRounds: envVars.BCRYPT_ROUNDS as number,
  },
} as const;
