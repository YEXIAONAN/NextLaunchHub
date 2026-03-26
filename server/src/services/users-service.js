import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';

const USER_ROLES = ['admin', 'helper', 'requester'];

function ensureAdmin(user) {
  if (user?.role !== 'admin') {
    throw new HttpError(403, '只有管理员可以访问用户管理');
  }
}

function normalizeStatus(status) {
  if (status === undefined || status === null || status === '') {
    return undefined;
  }

  const parsed = Number(status);
  if (![0, 1].includes(parsed)) {
    throw new HttpError(400, '用户状态值不合法');
  }

  return parsed;
}

function assertRole(role, required = false) {
  if (role === undefined || role === null || role === '') {
    if (required) {
      throw new HttpError(400, '用户角色不能为空');
    }
    return;
  }

  if (!USER_ROLES.includes(role)) {
    throw new HttpError(400, '用户角色不合法');
  }
}

function parsePagination(value, defaultValue) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return parsed;
}

async function getUserBase(executor, userId) {
  const [rows] = await executor.query(
    `SELECT
       id,
       username,
       real_name,
       role,
       status,
       created_at,
       updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    throw new HttpError(404, '用户不存在');
  }

  return rows[0];
}

export async function searchRequesters(keyword = '') {
  const [rows] = await pool.query(
    `SELECT id, real_name
     FROM users
     WHERE role = 'requester'
       AND status = 1
       AND real_name LIKE ?
     ORDER BY real_name ASC
     LIMIT 20`,
    [`%${keyword}%`]
  );

  return rows;
}

export async function searchHelpers(keyword = '') {
  const [rows] = await pool.query(
    `SELECT id, real_name, username
     FROM users
     WHERE role = 'helper'
       AND status = 1
       AND real_name LIKE ?
     ORDER BY real_name ASC
     LIMIT 20`,
    [`%${keyword}%`]
  );

  return rows;
}

export async function getUsers(user, query = {}) {
  ensureAdmin(user);

  const keyword = (query.keyword || '').trim();
  const role = (query.role || '').trim();
  const status = normalizeStatus(query.status);
  const page = parsePagination(query.page, 1);
  const pageSize = parsePagination(query.pageSize, 10);

  assertRole(role);

  let whereSql = 'WHERE 1 = 1';
  const params = [];

  if (keyword) {
    whereSql += ' AND (username LIKE ? OR real_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (role) {
    whereSql += ' AND role = ?';
    params.push(role);
  }

  if (status !== undefined) {
    whereSql += ' AND status = ?';
    params.push(status);
  }

  const offset = (page - 1) * pageSize;

  const [rows] = await pool.query(
    `SELECT
       id,
       username,
       real_name,
       role,
       status,
       created_at,
       updated_at
     FROM users
     ${whereSql}
     ORDER BY created_at DESC, id DESC
     LIMIT ?
     OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [[totalResult]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM users
     ${whereSql}`,
    params
  );

  return {
    list: rows,
    pagination: {
      page,
      pageSize,
      total: Number(totalResult?.total || 0)
    }
  };
}

export async function createUser(currentUser, payload) {
  ensureAdmin(currentUser);

  const username = (payload.username || '').trim();
  const password = (payload.password || '').trim();
  const realName = (payload.realName || '').trim();
  const role = (payload.role || '').trim();
  const normalizedStatus = normalizeStatus(payload.status);

  if (!username) {
    throw new HttpError(400, '用户名不能为空');
  }

  if (!password) {
    throw new HttpError(400, '密码不能为空');
  }

  if (!realName) {
    throw new HttpError(400, '用户姓名不能为空');
  }

  assertRole(role, true);

  const status = normalizedStatus ?? 1;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existingUser]] = await connection.query(
      `SELECT id
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username]
    );

    if (existingUser) {
      throw new HttpError(400, '用户名已存在');
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
      `INSERT INTO users
        (username, password, real_name, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [username, encryptedPassword, realName, role, status]
    );

    await connection.commit();

    return getUserBase(pool, result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateUser(currentUser, userId, payload) {
  ensureAdmin(currentUser);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new HttpError(400, '用户ID不合法');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await getUserBase(connection, userId);

    const updates = [];
    const params = [];

    if (payload.realName !== undefined) {
      const realName = (payload.realName || '').trim();
      if (!realName) {
        throw new HttpError(400, '用户姓名不能为空');
      }
      updates.push('real_name = ?');
      params.push(realName);
    }

    if (payload.role !== undefined) {
      const role = (payload.role || '').trim();
      assertRole(role, true);
      updates.push('role = ?');
      params.push(role);
    }

    if (payload.status !== undefined) {
      const status = normalizeStatus(payload.status);
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      throw new HttpError(400, '没有可更新的用户字段');
    }

    updates.push('updated_at = NOW()');
    params.push(userId);

    await connection.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );

    await connection.commit();

    return getUserBase(pool, userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function resetUserPassword(currentUser, userId, payload) {
  ensureAdmin(currentUser);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new HttpError(400, '用户ID不合法');
  }

  const password = (payload.password || '').trim();
  if (!password) {
    throw new HttpError(400, '新密码不能为空');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await getUserBase(connection, userId);

    const encryptedPassword = await bcrypt.hash(password, 10);
    await connection.query(
      `UPDATE users
       SET password = ?, updated_at = NOW()
       WHERE id = ?`,
      [encryptedPassword, userId]
    );

    await connection.commit();

    return {
      id: userId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
