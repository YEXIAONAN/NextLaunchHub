import { HttpError } from '../utils/http-error.js';

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
