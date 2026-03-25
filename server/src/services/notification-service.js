import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import { buildNotificationScope } from '../utils/permission.js';

export async function createNotification(connection, payload) {
  const executor = connection || pool;
  const {
    receiverUserId,
    type,
    title,
    content,
    relatedId,
    relatedType,
    jumpPath
  } = payload;
  const resolvedRelatedType = relatedType || (relatedId ? 'help_request' : null);
  const resolvedJumpPath = jumpPath || (resolvedRelatedType === 'help_request' && relatedId ? `/help-center/${relatedId}` : null);

  await executor.query(
    `INSERT INTO notifications
      (
        receiver_user_id, type, title, content, related_id,
        related_type, jump_path, is_read, created_at
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
    [receiverUserId, type, title, content, relatedId || null, resolvedRelatedType, resolvedJumpPath]
  );
}

function parsePagination(value, defaultValue) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

export async function getNotificationsByUser(user, query = {}) {
  const scope = buildNotificationScope(user, 'n');
  const params = [...scope.params];
  let whereSql = scope.clause;
  const page = parsePagination(query.page, 1);
  const pageSize = parsePagination(query.pageSize, 10);

  if (query.isRead !== undefined && query.isRead !== null && query.isRead !== '') {
    if (!['0', '1', 0, 1, 'true', 'false'].includes(query.isRead)) {
      throw new HttpError(400, '已读筛选值不合法');
    }
    const isRead = query.isRead === '1' || query.isRead === 1 || query.isRead === 'true' ? 1 : 0;
    whereSql += ' AND n.is_read = ?';
    params.push(isRead);
  }

  if (query.type) {
    whereSql += ' AND n.type = ?';
    params.push(query.type);
  }

  const countParams = [...params];
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.query(
    `SELECT
       n.id,
       n.type,
       n.title,
       n.content,
       n.related_id,
       n.related_type,
       n.jump_path,
       n.is_read,
       n.created_at,
       u.real_name AS receiver_name
     FROM notifications n
     LEFT JOIN users u ON u.id = n.receiver_user_id
     ${whereSql}
     ORDER BY n.created_at DESC
     LIMIT ?
     OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [[totalResult]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM notifications n
     ${whereSql}`,
    countParams
  );

  return {
    list: rows,
    pagination: {
      page,
      pageSize,
      total: totalResult.total
    }
  };
}

export async function markNotificationRead(user, id) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, '通知ID不合法');
  }

  const params = [id];
  let whereSql = 'WHERE id = ?';

  if (user.role !== 'admin') {
    whereSql += ' AND receiver_user_id = ?';
    params.push(user.id);
  }

  const [result] = await pool.query(
    `UPDATE notifications
     SET is_read = 1
     ${whereSql}`,
    params
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, '通知不存在或无权限操作');
  }

  return {
    id,
    is_read: 1
  };
}

export async function markAllNotificationsRead(user) {
  const params = [];
  let whereSql = 'WHERE is_read = 0';

  if (user.role !== 'admin') {
    whereSql += ' AND receiver_user_id = ?';
    params.push(user.id);
  }

  const [result] = await pool.query(
    `UPDATE notifications
     SET is_read = 1
     ${whereSql}`,
    params
  );

  return {
    updatedCount: result.affectedRows
  };
}

export async function getUnreadNotificationCount(user) {
  const scope = buildNotificationScope(user, 'n');
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS unread_count
     FROM notifications n
     ${scope.clause}
       AND n.is_read = 0`,
    scope.params
  );

  return {
    unreadCount: rows[0].unread_count
  };
}
