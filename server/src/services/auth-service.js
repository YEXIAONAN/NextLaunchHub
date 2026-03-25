import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';

export async function login({ username, password }) {
  const [rows] = await pool.query(
    `SELECT id, username, password, real_name, role, status
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

  const token = jwt.sign(tokenPayload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

  return {
    token,
    user: tokenPayload
  };
}
