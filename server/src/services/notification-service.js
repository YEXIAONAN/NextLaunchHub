import { pool } from '../db/pool.js';

export async function createNotification(connection, payload) {
  const executor = connection || pool;
  const {
    receiverUserId,
    type,
    title,
    content,
    relatedId
  } = payload;

  await executor.query(
    `INSERT INTO notifications
      (receiver_user_id, type, title, content, related_id, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, NOW())`,
    [receiverUserId, type, title, content, relatedId]
  );
}

export async function getNotificationsByUser(user) {
  const params = [];
  let whereSql = 'WHERE 1 = 1';

  if (user.role !== 'admin') {
    whereSql += ' AND n.receiver_user_id = ?';
    params.push(user.id);
  }

  const [rows] = await pool.query(
    `SELECT
       n.id,
       n.type,
       n.title,
       n.content,
       n.related_id,
       n.is_read,
       n.created_at,
       u.real_name AS receiver_name
     FROM notifications n
     LEFT JOIN users u ON u.id = n.receiver_user_id
     ${whereSql}
     ORDER BY n.created_at DESC
     LIMIT 20`,
    params
  );

  return rows;
}
