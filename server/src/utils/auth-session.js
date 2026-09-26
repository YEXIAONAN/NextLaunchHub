import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { parseCookies } from './cookies.js';

export const AUTH_COOKIE_NAME = 'nextlaunch_hub_session';

const cookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  path: '/'
};

export function createAuthToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
}

export function getAuthTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies[AUTH_COOKIE_NAME]) {
    return cookies[AUTH_COOKIE_NAME];
  }

  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' ? token || '' : '';
}
