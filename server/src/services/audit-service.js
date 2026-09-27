import { pool } from '../db/pool.js';

export async function writeAuditLog({ actorUserId = null, action, targetType, targetId = null, summary, ip = null }) {
  await pool.query(
    `INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, summary, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [actorUserId, action, targetType, targetId, summary, ip]
  );
}
