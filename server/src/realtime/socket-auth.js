import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

function extractToken(socket) {
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

export function authenticateSocket(socket, next) {
  const token = extractToken(socket);

  if (!token) {
    const error = new Error('未登录或登录已失效');
    error.data = { code: 401 };
    next(error);
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    socket.data.user = {
      userId: payload.id,
      username: payload.username,
      role: payload.role,
      realName: payload.realName
    };
    next();
  } catch (_error) {
    const error = new Error('登录凭证无效或已过期');
    error.data = { code: 401 };
    next(error);
  }
}
