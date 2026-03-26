import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';

const SUPPORTED_DICT_TYPES = [
  'project_status',
  'project_priority',
  'task_status',
  'task_priority',
  'help_request_status',
  'project_member_role'
];

function ensureLoggedIn(user) {
  if (!user?.id) {
    throw new HttpError(401, '未登录或登录已失效');
  }
}

function ensureAdmin(user) {
  if (user?.role !== 'admin') {
    throw new HttpError(403, '只有管理员可以维护字典配置');
  }
}

function assertDictType(dictType, required = false) {
  const normalized = typeof dictType === 'string' ? dictType.trim() : '';

  if (!normalized) {
    if (required) {
      throw new HttpError(400, '字典类型不能为空');
    }
    return '';
  }

  if (!SUPPORTED_DICT_TYPES.includes(normalized)) {
    throw new HttpError(400, '字典类型不合法');
  }

  return normalized;
}

function normalizeStatus(status, required = false) {
  if (status === undefined || status === null || status === '') {
    if (required) {
      throw new HttpError(400, '字典状态不能为空');
    }
    return undefined;
  }

  const parsed = Number(status);
  if (![0, 1].includes(parsed)) {
    throw new HttpError(400, '字典状态值不合法');
  }

  return parsed;
}

function normalizeSortNo(sortNo) {
  if (sortNo === undefined || sortNo === null || sortNo === '') {
    return 0;
  }

  const parsed = Number(sortNo);
  if (!Number.isInteger(parsed)) {
    throw new HttpError(400, '排序号必须是整数');
  }

  return parsed;
}

async function getDictionaryBase(executor, id) {
  const [rows] = await executor.query(
    `SELECT
       id,
       dict_type,
       dict_label,
       dict_value,
       sort_no,
       status,
       created_at,
       updated_at
     FROM system_dictionaries
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    throw new HttpError(404, '字典项不存在');
  }

  return rows[0];
}

async function ensureDictionaryUnique(executor, dictType, dictValue, excludeId = null) {
  const params = [dictType, dictValue];
  let sql = `SELECT id
             FROM system_dictionaries
             WHERE dict_type = ?
               AND dict_value = ?`;

  if (excludeId !== null) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }

  sql += ' LIMIT 1';

  const [rows] = await executor.query(sql, params);
  if (rows.length > 0) {
    throw new HttpError(400, '同一字典类型下字典值不能重复');
  }
}

export async function getDictionaries(user, dictType) {
  ensureLoggedIn(user);

  const normalizedDictType = assertDictType(dictType, false);
  const params = [];
  let whereSql = 'WHERE status = 1';

  if (normalizedDictType) {
    whereSql += ' AND dict_type = ?';
    params.push(normalizedDictType);
  }

  const [rows] = await pool.query(
    `SELECT
       id,
       dict_type,
       dict_label,
       dict_value,
       sort_no,
       status
     FROM system_dictionaries
     ${whereSql}
     ORDER BY dict_type ASC, sort_no ASC, id ASC`,
    params
  );

  return rows;
}

export async function getAdminDictionaries(user, query = {}) {
  ensureAdmin(user);

  const dictType = assertDictType(query.dictType, false);
  const status = normalizeStatus(query.status, false);
  const params = [];
  let whereSql = 'WHERE 1 = 1';

  if (dictType) {
    whereSql += ' AND dict_type = ?';
    params.push(dictType);
  }

  if (status !== undefined) {
    whereSql += ' AND status = ?';
    params.push(status);
  }

  const [rows] = await pool.query(
    `SELECT
       id,
       dict_type,
       dict_label,
       dict_value,
       sort_no,
       status,
       created_at,
       updated_at
     FROM system_dictionaries
     ${whereSql}
     ORDER BY dict_type ASC, sort_no ASC, id ASC`,
    params
  );

  return rows;
}

export async function createDictionary(user, payload) {
  ensureAdmin(user);

  const dictType = assertDictType(payload.dictType, true);
  const dictLabel = (payload.dictLabel || '').trim();
  const dictValue = (payload.dictValue || '').trim();
  const sortNo = normalizeSortNo(payload.sortNo);
  const status = normalizeStatus(payload.status, false) ?? 1;

  if (!dictLabel) {
    throw new HttpError(400, '字典名称不能为空');
  }

  if (!dictValue) {
    throw new HttpError(400, '字典值不能为空');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await ensureDictionaryUnique(connection, dictType, dictValue);

    const [result] = await connection.query(
      `INSERT INTO system_dictionaries
        (dict_type, dict_label, dict_value, sort_no, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [dictType, dictLabel, dictValue, sortNo, status]
    );

    await connection.commit();

    return getDictionaryBase(pool, result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateDictionary(user, id, payload) {
  ensureAdmin(user);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, '字典ID不合法');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const current = await getDictionaryBase(connection, id);
    const updates = [];
    const params = [];

    const nextDictType = payload.dictType !== undefined
      ? assertDictType(payload.dictType, true)
      : current.dict_type;
    const nextDictValue = payload.dictValue !== undefined
      ? (payload.dictValue || '').trim()
      : current.dict_value;

    if (!nextDictValue) {
      throw new HttpError(400, '字典值不能为空');
    }

    if (
      nextDictType !== current.dict_type
      || nextDictValue !== current.dict_value
    ) {
      await ensureDictionaryUnique(connection, nextDictType, nextDictValue, id);
    }

    if (payload.dictType !== undefined) {
      updates.push('dict_type = ?');
      params.push(nextDictType);
    }

    if (payload.dictLabel !== undefined) {
      const dictLabel = (payload.dictLabel || '').trim();
      if (!dictLabel) {
        throw new HttpError(400, '字典名称不能为空');
      }
      updates.push('dict_label = ?');
      params.push(dictLabel);
    }

    if (payload.dictValue !== undefined) {
      updates.push('dict_value = ?');
      params.push(nextDictValue);
    }

    if (payload.sortNo !== undefined) {
      updates.push('sort_no = ?');
      params.push(normalizeSortNo(payload.sortNo));
    }

    if (payload.status !== undefined) {
      updates.push('status = ?');
      params.push(normalizeStatus(payload.status, true));
    }

    if (updates.length === 0) {
      throw new HttpError(400, '没有可更新的字典字段');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await connection.query(
      `UPDATE system_dictionaries
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );

    await connection.commit();

    return getDictionaryBase(pool, id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
