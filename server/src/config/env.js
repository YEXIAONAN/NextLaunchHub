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

// 反向代理层数。写数字表示信任几跳（Docker 里前面只有一层 Nginx，就是 1），
// 也可以写 IP / CIDR 列表。默认 false：没有代理时不信任任何 X-Forwarded-For，
// 否则客户端能自己伪造这个头来绕过限流、并往求助单里写假的来源 IP。
function parseTrustProxy(value) {
  if (value === undefined || value.trim() === '' || value.trim() === 'false') {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed === 'true') {
    return true;
  }

  const hops = Number(trimmed);
  if (Number.isInteger(hops) && hops >= 0) {
    return hops;
  }

  return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || 'development';

// 仓库里公开出现过的示例密钥，任何环境都不允许使用，否则等于没有签名密钥
const KNOWN_PLACEHOLDER_JWT_SECRETS = [
  'replace-with-at-least-32-random-characters',
  'nextlaunch-hub-docker-default-secret-change-me',
  '请运行-openssl-rand-hex-32-生成随机串'
];

if (KNOWN_PLACEHOLDER_JWT_SECRETS.includes(process.env.JWT_SECRET)) {
  throw new Error('JWT_SECRET 还是示例值，请执行 openssl rand -hex 32 生成随机串后填入');
}

if (nodeEnv === 'production' && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters');
}

const corsOrigins = parseOrigins(process.env.CORS_ORIGIN);
const dbConnectTimeoutMs = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);
const uploadMaxBytes = Number(process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024);

if (!Number.isInteger(dbConnectTimeoutMs) || dbConnectTimeoutMs < 1000) {
  throw new Error('DB_CONNECT_TIMEOUT_MS must be an integer of at least 1000');
}

if (!Number.isInteger(uploadMaxBytes) || uploadMaxBytes < 1 || uploadMaxBytes > 20 * 1024 * 1024) {
  throw new Error('UPLOAD_MAX_BYTES must be an integer between 1 and 20971520');
}

export const env = {
  nodeEnv,
  port: parsePort('PORT', 3000),
  dbHost: process.env.DB_HOST,
  dbPort: parsePort('DB_PORT', 3306),
  dbConnectTimeoutMs,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  corsOrigins,
  cookieSecure: parseBoolean('COOKIE_SECURE', nodeEnv === 'production'),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  uploadMaxBytes
};
