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
  const [[serviceRows]] = await pool.query(
    `SELECT
       SUM(CASE WHEN deadline_at IS NOT NULL AND (status = 'completed' OR NOW() <= deadline_at) THEN 1 ELSE 0 END) AS within_sla_count,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS resolved_count,
       AVG(CASE WHEN resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, request_datetime, resolved_at) END) AS avg_resolution_minutes,
       SUM(CASE WHEN first_response_at IS NULL AND status = 'pending' THEN 1 ELSE 0 END) AS unresponded_count
     FROM help_requests hr ${scope.clause}`,
    scope.params
  );
  const service = serviceRows || {};
  const [actionItems] = await pool.query(
    `SELECT hr.id, hr.request_no, hr.title, hr.status, hr.deadline_at, hr.priority, hr.is_timeout
     FROM help_requests hr ${scope.clause}
       AND hr.status <> 'completed'
       AND (hr.is_timeout = 1 OR hr.deadline_at <= DATE_ADD(NOW(), INTERVAL 8 HOUR) OR (hr.status = 'pending' AND hr.request_datetime <= DATE_SUB(NOW(), INTERVAL 4 HOUR)))
     ORDER BY hr.is_timeout DESC, hr.deadline_at ASC
     LIMIT 8`,
    scope.params
  );

  let myTasks = [];
  if (user.role === 'admin') {
    const [rows] = await pool.query(
      `SELECT t.id, t.title, t.status, t.progress, t.due_date, t.assignee_name, p.project_name
         FROM tasks t INNER JOIN projects p ON p.id = t.project_id
        WHERE t.status NOT IN ('done', 'cancelled')
        ORDER BY (t.status = 'blocked') DESC, (t.due_date IS NOT NULL AND t.due_date < CURDATE()) DESC, t.due_date ASC
        LIMIT 6`
    );
    myTasks = rows;
  } else if (user.role === 'helper') {
    const [rows] = await pool.query(
      `SELECT t.id, t.title, t.status, t.progress, t.due_date, t.assignee_name, p.project_name
         FROM tasks t INNER JOIN projects p ON p.id = t.project_id
        WHERE t.assignee_user_id = ? AND t.status NOT IN ('done', 'cancelled')
        ORDER BY (t.status = 'blocked') DESC, (t.due_date IS NOT NULL AND t.due_date < CURDATE()) DESC, t.due_date ASC
        LIMIT 6`,
      [user.id]
    );
    myTasks = rows;
  }

  return {
    stats: {
      pending: Number(summary.pending_count || 0),
      processing: Number(summary.processing_count || 0),
      waitingConfirm: Number(summary.waiting_confirm_count || 0),
      completed: Number(summary.completed_count || 0),
      timeout: Number(summary.timeout_count || 0)
    },
    serviceMetrics: {
      slaComplianceRate: Number(service.resolved_count || 0) ? Math.round((Number(service.within_sla_count || 0) / Number(service.resolved_count)) * 100) : 100,
      avgResolutionMinutes: Math.round(Number(service.avg_resolution_minutes || 0)),
      unresponded: Number(service.unresponded_count || 0)
    },
    actionItems,
    recentItems: recentRows,
    myTasks
  };
}
