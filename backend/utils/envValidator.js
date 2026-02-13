import Joi from 'joi';
import logger from './logger.js';

// Define the schema for environment variables
const envSchema = Joi.object({
  // MongoDB
  MONGO_URI: Joi.string().allow('').optional(),
  MONGODB_URI: Joi.string().allow('').optional(),
  'any.required': 'MONGO_URI is required',
  'string.empty': 'MONGO_URI cannot be empty',
}),

  // JWT
  JWT_SECRET: Joi.string().allow('').optional(),
    JWT_ACCESS_SECRET: Joi.string().allow('').optional(),
      'any.required': 'JWT_SECRET is required',
        'string.empty': 'JWT_SECRET cannot be empty',
  }),

// Server
PORT: Joi.number().default(3001),
  HOST: Joi.string().default('0.0.0.0'),
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),

      // Email (optional - only needed for email features)
      COMPANY_EMAIL: Joi.string().allow('').optional(),
        COMPANY_EMAIL_PASSWORD: Joi.string().allow('').optional(),

          // Logging
          LOG_LEVEL: Joi.string()
            .valid('error', 'warn', 'info', 'http', 'debug')
            .default('info'),
}).unknown(); // Allow other env vars

/**
 * Validate environment variables
 * @returns {Object} Validated environment variables
 */
export const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false, // Show all errors, not just the first one
  });

  // Check valid combinations
  const mongoURI = value.MONGO_URI || value.MONGODB_URI;
  if (!mongoURI) {
    logger.error('❌ Environment validation failed: MONGO_URI or MONGODB_URI is required');
    process.exit(1);
  }

  const jwtSecret = value.JWT_SECRET || value.JWT_ACCESS_SECRET;
  if (!jwtSecret) {
    logger.error('❌ Environment validation failed: JWT_SECRET or JWT_ACCESS_SECRET is required');
    process.exit(1);
  }

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join('\n');
    logger.error('❌ Environment validation failed:');
    logger.error(errorMessages);
    logger.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  if (value.NODE_ENV === 'production') {
    if ((jwtSecret === 'supersecretkey') || (jwtSecret.length < 32)) {
      logger.error('❌ JWT Check failed: Secret must be changed from default and be at least 32 characters in production!');
      logger.error('Generate a secure secret with: openssl rand -base64 32');
      process.exit(1);
    }

    if (mongoURI.includes('localhost')) {
      logger.warn('⚠️  Using localhost MongoDB in production is not recommended');
    }
  } else {
    // Development mode - warn if secret is too short but don't fail
    if (jwtSecret && jwtSecret.length < 32) {
      logger.warn('⚠️  JWT Secret is less than 32 characters. This is acceptable for development, but production requires at least 32 characters.');
    }
  }

  logger.info('✅ Environment variables validated successfully');
  return value;
};

