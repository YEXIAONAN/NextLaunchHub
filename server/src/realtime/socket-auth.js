import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getActiveUserById } from '../services/auth-service.js';
import { AUTH_COOKIE_NAME } from '../utils/auth-session.js';
import { parseCookies } from '../utils/cookies.js';

function extractToken(socket) {
  const cookies = parseCookies(socket.handshake.headers?.cookie || '');
  if (cookies[AUTH_COOKIE_NAME]) {
    return cookies[AUTH_COOKIE_NAME];
  }

  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  const authorization = socket.handshake.headers?.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme === 'Bearer' && token) {
    return token;
  }

  return '';
}

export async function authenticateSocket(socket, next) {
  const token = extractToken(socket);

  if (!token) {
    const error = new Error('未登录或登录已失效');
    error.data = { code: 401 };
    next(error);
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await getActiveUserById(payload.id);
    socket.data.user = {
      userId: user.id,
      username: user.username,
      role: user.role,
      realName: user.realName
    };
    next();
  } catch (_error) {
    const error = new Error('登录凭证无效或已过期');
    error.data = { code: 401 };
    next(error);
  }
}
