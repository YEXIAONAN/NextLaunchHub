import { HttpError } from '../utils/http-error.js';
import crypto from 'node:crypto';

const buckets = new Map();

export function createRateLimit({ windowMs, max, message = '请求过于频繁，请稍后再试' }) {
  return function rateLimit(req, _res, next) {
    const now = Date.now();
    const key = `${req.ip}:${req.baseUrl}${req.route?.path || req.path}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      if (!current && buckets.size >= 10000) {
        buckets.delete(buckets.keys().next().value);
      }
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= max) {
      next(new HttpError(429, message));
      return;
    }

    current.count += 1;
    next();
  };
}

// 生产端点使用数据库桶：多 Node 实例共享同一上限，重启也不会清空计数。
export function createPersistentRateLimit({ windowMs, max, message = '请求过于频繁，请稍后再试' }) {
  return async function persistentRateLimit(req, _res, next) {
    // 延迟加载数据库：内存限流单元测试不应要求 CI 配置运行期数据库环境变量。
    const { pool } = await import('../db/pool.js');
    const rawKey = `${req.ip}:${req.baseUrl}${req.route?.path || req.path}`;
    const bucketKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[bucket]] = await connection.query('SELECT request_count, expires_at FROM rate_limit_buckets WHERE bucket_key = ? FOR UPDATE', [bucketKey]);
      if (!bucket || new Date(bucket.expires_at).getTime() <= Date.now()) {
        await connection.query(
          `INSERT INTO rate_limit_buckets (bucket_key, request_count, expires_at) VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? MICROSECOND))
           ON DUPLICATE KEY UPDATE request_count = 1, expires_at = DATE_ADD(NOW(), INTERVAL ? MICROSECOND)`,
          [bucketKey, windowMs * 1000, windowMs * 1000]
        );
      } else if (bucket.request_count >= max) {
        await connection.commit();
        next(new HttpError(429, message));
        return;
      } else {
        await connection.query('UPDATE rate_limit_buckets SET request_count = request_count + 1 WHERE bucket_key = ?', [bucketKey]);
      }
      await connection.commit();
      next();
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  };
}
