import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import { createAuthToken } from '../utils/auth-session.js';

export async function login({ username, password }) {
  const [rows] = await pool.query(
    `SELECT id, username, password, real_name, role, status, can_login
     FROM users
     WHERE username = ?
     LIMIT 1`,
    [username]
  );

  if (rows.length === 0) {
    throw new HttpError(401, '用户名或密码错误');
  }

  const user = rows[0];

  if (user.status !== 1) {
    throw new HttpError(403, '当前账号已停用');
  }

  if (Number(user.can_login) !== 1) {
    throw new HttpError(403, '当前账号不允许登录');
  }

  const matched = await bcrypt.compare(password, user.password);
  if (!matched) {
    throw new HttpError(401, '用户名或密码错误');
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    role: user.role
  };

  const token = createAuthToken(tokenPayload);

  return {
    token,
    user: tokenPayload
  };
}

export async function getActiveUserById(userId) {
  const [rows] = await pool.query(
    `SELECT id, username, real_name, role, status, can_login
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  const user = rows[0];
  if (!user || user.status !== 1 || Number(user.can_login) !== 1) {
    throw new HttpError(401, '账号不存在、已停用或不允许登录');
  }

  return {
    id: user.id,
    username: user.username,
    realName: user.real_name,
    role: user.role
  };
}
