import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { parseCookies } from './cookies.js';

const COOKIE_NAME = 'nextlaunch_public_help_request_access';
const MAX_AGE_MS = 30 * 60 * 1000;

export function setPublicHelpRequestAccessCookie(res, payload) {
  const token = jwt.sign(
    {
      helpRequestId: payload.helpRequestId,
      requestNo: payload.requestNo,
      requesterName: payload.requesterName,
      purpose: 'public_help_request_access'
    },
    env.jwtSecret,
    { expiresIn: Math.floor(MAX_AGE_MS / 1000) }
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    maxAge: MAX_AGE_MS,
    path: '/'
  });
}

export function clearPublicHelpRequestAccessCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    path: '/'
  });
}

export function getPublicHelpRequestAccessPayload(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.purpose !== 'public_help_request_access') {
      return null;
    }
    return payload;
  } catch (_error) {
    return null;
  }
}
