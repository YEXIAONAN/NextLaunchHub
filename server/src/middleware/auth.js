import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getActiveUserById } from '../services/auth-service.js';
import { getAuthTokenFromRequest } from '../utils/auth-session.js';
import { HttpError } from '../utils/http-error.js';

export async function authMiddleware(req, _res, next) {
  const token = getAuthTokenFromRequest(req);
  if (!token) {
    return next(new HttpError(401, '未登录或登录已失效'));
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (_error) {
    return next(new HttpError(401, '登录凭证无效或已过期'));
  }

  try {
    req.user = await getActiveUserById(payload.id);
    next();
  } catch (error) {
    next(error);
  }
}
