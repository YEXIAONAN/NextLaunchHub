import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import { buildHelpRequestListScope, canViewDashboard } from '../utils/permission.js';

export async function getOverview(user) {
  if (!canViewDashboard(user)) {
    throw new HttpError(403, '无权限查看统计信息');
  }

  const scope = buildHelpRequestListScope(user);
  const [countRows] = await pool.query(
    `SELECT
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
       SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
       SUM(CASE WHEN status = 'waiting_confirm' THEN 1 ELSE 0 END) AS waiting_confirm_count,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count
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
      completed: Number(summary.completed_count || 0)
    },
    recentItems: recentRows
  };
}
