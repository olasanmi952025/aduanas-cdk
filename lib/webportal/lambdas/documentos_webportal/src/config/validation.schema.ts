import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  ORACLE_HOST: Joi.string().optional(),
  ORACLE_PORT: Joi.number().default(1521),
  ORACLE_DATABASE: Joi.string().optional(),
  ORACLE_SID: Joi.string().optional(),
  ORACLE_USERNAME: Joi.string().optional(),
  ORACLE_PASSWORD: Joi.string().optional(),
  ORACLE_CLIENT_LIB_DIR: Joi.string().optional(),
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().optional(),
  DB_DATABASE: Joi.string().optional(),
  DB_SID: Joi.string().optional(),
  DB_USERNAME: Joi.string().optional(),
  DB_PASSWORD: Joi.string().optional(),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  API_PORT: Joi.number().default(3000),
  API_HOST: Joi.string().default('0.0.0.0'),
  JWT_PUBLIC_KEY: Joi.string().allow('').optional(), // Public key for custom JWT validation
  CORS_ORIGIN: Joi.string().default('*'),
  // Cognito configuration
  COGNITO_JWKS_URI: Joi.string().optional(),
  COGNITO_ISSUER: Joi.string().optional(),
  COGNITO_CLIENT_ID: Joi.string().optional(),
});


