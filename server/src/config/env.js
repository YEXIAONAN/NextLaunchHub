import dotenv from 'dotenv';

dotenv.config();

const requiredKeys = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CORS_ORIGIN'
];

for (const key of requiredKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

function parsePort(key, fallback) {
  const value = Number(process.env[key] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${key} must be an integer between 1 and 65535`);
  }
  return value;
}

function parseOrigins(value) {
  const origins = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (origins.length === 0 || origins.some((origin) => {
    try {
      return !['http:', 'https:'].includes(new URL(origin).protocol);
    } catch (_error) {
      return true;
    }
  })) {
    throw new Error('CORS_ORIGIN must contain valid http(s) origins separated by commas');
  }
  return origins;
}

function parseBoolean(key, fallback) {
  if (process.env[key] === undefined) {
    return fallback;
  }
  if (!['true', 'false'].includes(process.env[key])) {
    throw new Error(`${key} must be either true or false`);
  }
  return process.env[key] === 'true';
}

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production' && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters');
}

const corsOrigins = parseOrigins(process.env.CORS_ORIGIN);

export const env = {
  nodeEnv,
  port: parsePort('PORT', 3000),
  dbHost: process.env.DB_HOST,
  dbPort: parsePort('DB_PORT', 3306),
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  corsOrigins,
  cookieSecure: parseBoolean('COOKIE_SECURE', nodeEnv === 'production')
};
