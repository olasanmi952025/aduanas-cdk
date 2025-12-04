import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  // Oracle Database configuration
  ORACLE_HOST: Joi.string().required(),
  ORACLE_PORT: Joi.number().default(1521),
  ORACLE_DATABASE: Joi.string().required(),
  ORACLE_SID: Joi.string().required(),
  ORACLE_USERNAME: Joi.string().required(),
  ORACLE_PASSWORD: Joi.string().required(),
  ORACLE_CLIENT_LIB_DIR: Joi.string().optional(),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  API_PORT: Joi.number().default(3000),
  API_HOST: Joi.string().default('0.0.0.0'),
  JWT_PUBLIC_KEY: Joi.string().allow('').optional(), // Public key for custom JWT validation
  CORS_ORIGIN: Joi.string().default('*'),
  // Cognito configuration
  COGNITO_JWKS_URI: Joi.string().optional(),
  COGNITO_ISSUER: Joi.string().optional(),
  COGNITO_CLIENT_ID: Joi.string().optional(),
  // AWS configuration
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  // SQS configuration
  SQS_QUEUE_URL: Joi.string().optional(),
  // S3 configuration
  S3_BUCKET_NAME: Joi.string().default('pweb-ms-guias-exports'),
});


