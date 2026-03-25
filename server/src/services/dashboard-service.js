import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import { buildHelpRequestListScope, canViewDashboard } from '../utils/permission.js';

async function syncHelpRequestTimeouts() {
  await pool.query(
    `UPDATE help_requests
     SET is_timeout = CASE
       WHEN deadline_at IS NOT NULL
         AND NOW() > deadline_at
         AND status <> 'completed'
       THEN 1
       ELSE 0
     END
     WHERE deadline_at IS NOT NULL`
  );
}

export async function getOverview(user) {
  if (!canViewDashboard(user)) {
    throw new HttpError(403, '无权限查看统计信息');
  }

  await syncHelpRequestTimeouts();

  const scope = buildHelpRequestListScope(user);
  const [countRows] = await pool.query(
    `SELECT
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
       SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
       SUM(CASE WHEN status = 'waiting_confirm' THEN 1 ELSE 0 END) AS waiting_confirm_count,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
       SUM(CASE WHEN is_timeout = 1 THEN 1 ELSE 0 END) AS timeout_count
     FROM help_requests hr
     ${scope.clause}`,
    scope.params
  );

  const recentScope = buildHelpRequestListScope(user, 'hr');
  const [recentRows] = await pool.query(
    `SELECT
       hr.id,
       hr.request_no,
       hr.title,
       hr.requester_name,
       hr.helper_name,
       hr.status,
       hr.is_timeout,
       hr.request_datetime
     FROM help_requests hr
     ${recentScope.clause}
     ORDER BY hr.request_datetime DESC, hr.id DESC
     LIMIT 5`,
    recentScope.params
  );

  const summary = countRows[0] || {};

  return {
    stats: {
      pending: Number(summary.pending_count || 0),
      processing: Number(summary.processing_count || 0),
      waitingConfirm: Number(summary.waiting_confirm_count || 0),
      completed: Number(summary.completed_count || 0),
      timeout: Number(summary.timeout_count || 0)
    },
    recentItems: recentRows
  };
}
