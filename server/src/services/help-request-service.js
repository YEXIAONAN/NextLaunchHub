import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import {
  buildHelpRequestListScope,
  canAddAssistant,
  canAddCollaborationLog,
  canReassignHelper,
  canUpdateHelpRequest,
  canViewHelpRequest
} from '../utils/permission.js';
import { generateRequestNo } from '../utils/request-no.js';
import { emitToUser } from '../realtime/socket-server.js';
import { createNotification } from './notification-service.js';

const ALLOWED_STATUS = ['pending', 'processing', 'waiting_confirm', 'completed'];
const STATUS_TEXT_MAP = {
  pending: '待处理',
  processing: '处理中',
  waiting_confirm: '待确认',
  completed: '已完成'
};
const PRIORITY_SLA_HOURS = { urgent: 4, high: 8, medium: 24, low: 48 };

async function syncHelpRequestTimeouts(executor, helpRequestId = null) {
  const params = [];
  let whereSql = 'WHERE deadline_at IS NOT NULL';

  if (helpRequestId !== null) {
    whereSql += ' AND id = ?';
    params.push(helpRequestId);
  }

  await executor.query(
    `UPDATE help_requests
     SET is_timeout = CASE
       WHEN deadline_at IS NOT NULL
         AND NOW() > deadline_at
         AND status <> 'completed'
       THEN 1
       ELSE 0
     END,
     sla_breached_at = CASE
       WHEN deadline_at IS NOT NULL AND NOW() > deadline_at AND status <> 'completed' AND sla_breached_at IS NULL THEN NOW()
       ELSE sla_breached_at
     END
     ${whereSql}`,
    params
  );
}

async function getHelpRequestLogs(executor, helpRequestId) {
  const [logs] = await executor.query(
    `SELECT
       id,
       help_request_id,
       operator_user_id,
       operator_name,
       action_type,
       action_content,
       created_at
     FROM help_request_logs
     WHERE help_request_id = ?
     ORDER BY created_at ASC, id ASC`,
    [helpRequestId]
  );

  return logs;
}

async function getHelpRequestAssistantsById(executor, helpRequestId) {
  const [rows] = await executor.query(
    `SELECT
       id,
       help_request_id,
       assistant_user_id,
       assistant_name,
       added_by_user_id,
       added_by_name,
       created_at
     FROM help_request_assistants
     WHERE help_request_id = ?
     ORDER BY created_at DESC, id DESC`,
    [helpRequestId]
  );

  return rows;
}

async function getHelpRequestBase(executor, helpRequestId) {
  const [rows] = await executor.query(
    `SELECT
       hr.id,
       hr.request_no,
       hr.title,
       hr.requester_user_id,
       hr.requester_name,
       hr.helper_user_id,
       hr.helper_name,
       hr.project_id,
       hr.project_name,
       hr.task_id,
       hr.task_title,
       hr.content,
       hr.priority,
       hr.requester_ip,
       hr.request_datetime,
       hr.request_date,
       hr.expected_handle_hours,
       hr.deadline_at,
       hr.is_timeout,
       hr.status,
       hr.requester_confirmed_at,
       hr.requester_feedback,
       hr.created_at,
       hr.updated_at
     FROM help_requests hr
     WHERE hr.id = ?
     LIMIT 1`,
    [helpRequestId]
  );

  if (rows.length === 0) {
    throw new HttpError(404, '求助单不存在');
  }

  return rows[0];
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

async function resolveHelpRequestRelation(executor, projectIdInput, taskIdInput, projectNameInput, taskTitleInput) {
  const normalizedProjectId = projectIdInput === undefined || projectIdInput === null || projectIdInput === ''
    ? null
    : Number(projectIdInput);
  const normalizedTaskId = taskIdInput === undefined || taskIdInput === null || taskIdInput === ''
    ? null
    : Number(taskIdInput);
  const customProjectName = normalizeOptionalText(projectNameInput);
  const customTaskTitle = normalizeOptionalText(taskTitleInput);

  if (normalizedProjectId !== null && (!Number.isInteger(normalizedProjectId) || normalizedProjectId <= 0)) {
    throw new HttpError(400, '关联项目ID不合法');
  }

  if (normalizedTaskId !== null && (!Number.isInteger(normalizedTaskId) || normalizedTaskId <= 0)) {
    throw new HttpError(400, '关联任务ID不合法');
  }

  if (normalizedTaskId !== null && normalizedProjectId === null) {
    throw new HttpError(400, '选择任务时必须同时选择所属项目');
  }

  let project = null;
  let task = null;

  if (normalizedProjectId !== null) {
    const [[projectRow]] = await executor.query(
      `SELECT id, project_name
       FROM projects
       WHERE id = ?
       LIMIT 1`,
      [normalizedProjectId]
    );

    if (!projectRow) {
      throw new HttpError(400, '关联项目不存在');
    }

    project = projectRow;
  }

  if (normalizedTaskId !== null) {
    const [[taskRow]] = await executor.query(
      `SELECT id, project_id, title
       FROM tasks
       WHERE id = ?
       LIMIT 1`,
      [normalizedTaskId]
    );

    if (!taskRow) {
      throw new HttpError(400, '关联任务不存在');
    }

    if (Number(taskRow.project_id) !== normalizedProjectId) {
      throw new HttpError(400, '所选任务不属于当前项目');
    }

    task = taskRow;
  }

  return {
    projectId: project?.id || null,
    projectName: project?.project_name || customProjectName,
    taskId: task?.id || null,
    taskTitle: task?.title || customTaskTitle
  };
}

async function getHelpRequestPermissionContext(executor, helpRequestId) {
  const helpRequest = await getHelpRequestBase(executor, helpRequestId);
  const assistants = await getHelpRequestAssistantsById(executor, helpRequestId);
  const assistantUserIds = assistants.map((item) => Number(item.assistant_user_id));

  return {
    helpRequest,
    assistants,
    assistantUserIds
  };
}

async function getAccessibleHelpRequest(executor, user, helpRequestId) {
  const context = await getHelpRequestPermissionContext(executor, helpRequestId);

  if (!canViewHelpRequest(user, context.helpRequest, context.assistantUserIds)) {
    throw new HttpError(403, '求助单不存在或无权限访问');
  }

  return context;
}

export async function createHelpRequest(payload) {
  const {
    title,
    requesterUserId,
    helperUserId,
    helperUserIds,
    projectId,
    projectName,
    taskId,
    taskTitle,
    content,
    priority = 'medium',
    requesterIp
  } = payload;
  if (!Object.hasOwn(PRIORITY_SLA_HOURS, priority)) {
    throw new HttpError(400, '求助优先级不合法');
  }
  const normalizedHelperIds = Array.from(new Set(
    (Array.isArray(helperUserIds) && helperUserIds.length > 0 ? helperUserIds : [helperUserId])
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0)
  ));

  if (normalizedHelperIds.length === 0) {
    throw new HttpError(400, '帮助人员不能为空');
  }

  const connection = await pool.getConnection();
  let realtimePayloads = [];

  try {
    await connection.beginTransaction();

    const [[requester]] = await connection.query(
      `SELECT id, real_name
       FROM users
       WHERE id = ? AND is_requester = 1 AND status = 1
       LIMIT 1`,
      [requesterUserId]
    );

    if (!requester) {
      throw new HttpError(400, '发起人不存在或不可用');
    }

    const [helperRows] = await connection.query(
      `SELECT id, real_name
       FROM users
       WHERE id IN (?)
         AND is_helper = 1
         AND status = 1`,
      [normalizedHelperIds]
    );
    const helperMap = new Map(helperRows.map((item) => [Number(item.id), item]));
    const helpers = normalizedHelperIds.map((id) => helperMap.get(id)).filter(Boolean);

    if (helpers.length !== normalizedHelperIds.length) {
      throw new HttpError(400, '帮助人员不存在或不可用');
    }

    const [helper, ...assistantHelpers] = helpers;
    const relation = await resolveHelpRequestRelation(connection, projectId, taskId, projectName, taskTitle);
    const requestNo = await generateRequestNo(connection);

    const [result] = await connection.query(
      `INSERT INTO help_requests
        (
          request_no, title, requester_user_id, requester_name,
          helper_user_id, helper_name, project_id, project_name,
          task_id, task_title, content, priority, requester_ip,
          request_datetime, request_date, expected_handle_hours,
          deadline_at, is_timeout, status, created_at, updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), CURDATE(), ?, DATE_ADD(NOW(), INTERVAL ? HOUR), 0, 'pending', NOW(), NOW())`,
      [
        requestNo,
        title,
        requester.id,
        requester.real_name,
        helper.id,
        helper.real_name,
        relation.projectId,
        relation.projectName,
        relation.taskId,
        relation.taskTitle,
        content,
        priority,
        requesterIp,
        PRIORITY_SLA_HOURS[priority],
        PRIORITY_SLA_HOURS[priority]
      ]
    );

    const helpRequestId = result.insertId;

    if (assistantHelpers.length > 0) {
      await connection.query(
        `INSERT INTO help_request_assistants
          (
            help_request_id,
            assistant_user_id,
            assistant_name,
            added_by_user_id,
            added_by_name,
            created_at
          )
         VALUES ${assistantHelpers.map(() => '(?, ?, ?, ?, ?, NOW())').join(', ')}`,
        assistantHelpers.flatMap((assistant) => [
          helpRequestId,
          assistant.id,
          assistant.real_name,
          requester.id,
          requester.real_name
        ])
      );
    }

    await connection.query(
      `INSERT INTO help_request_logs
        (help_request_id, operator_user_id, operator_name, action_type, action_content, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        helpRequestId,
        requester.id,
        requester.real_name,
        'create',
        `创建求助单，当前状态：待处理`
      ]
    );

    if (assistantHelpers.length > 0) {
      await connection.query(
        `INSERT INTO help_request_logs
          (help_request_id, operator_user_id, operator_name, action_type, action_content, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          helpRequestId,
          requester.id,
          requester.real_name,
          'assistant_added',
          `自动添加协同人员：${assistantHelpers.map((item) => item.real_name).join('、')}`
        ]
      );
    }

    await createNotification(connection, {
      receiverUserId: helper.id,
      type: 'help_request_created',
      title: '收到新的求助单',
      content: `求助单 ${requestNo} 已提交，请及时处理。`,
      relatedId: helpRequestId
    });

    for (const assistant of assistantHelpers) {
      await createNotification(connection, {
        receiverUserId: assistant.id,
        type: 'assistant_added',
        title: '已被加入协同处理',
        content: `您已被加入求助单 ${requestNo} 的协同处理，请及时跟进。`,
        relatedId: helpRequestId
      });
    }

    realtimePayloads = helpers.map((targetHelper) => ({
      type: 'new_help_request',
      requestId: helpRequestId,
      requestNo,
      title,
      requesterName: requester.real_name,
      helperUserId: targetHelper.id,
      createdAt: new Date().toISOString(),
      message: `求助单 ${requestNo}《${title}》已由 ${requester.real_name} 提交，请及时处理。`
    }));

    await connection.commit();

    for (const payload of realtimePayloads) {
      emitToUser(payload.helperUserId, 'new_help_request', payload);
    }

    return {
      id: helpRequestId,
      requestNo,
      request_no: requestNo,
      helper_user_ids: helpers.map((item) => item.id)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function buildListScope(user) {
  const scope = buildHelpRequestListScope(user, 'hr');
  return {
    whereSql: scope.clause,
    params: scope.params
  };
}

function buildHelpRequestFilters(filters = {}) {
  return {
    keyword: (filters.keyword || '').trim(),
    status: (filters.status || '').trim(),
    isTimeout: filters.isTimeout === undefined || filters.isTimeout === null || filters.isTimeout === ''
      ? null
      : Number(filters.isTimeout),
    projectId: filters.projectId === undefined || filters.projectId === null || filters.projectId === ''
      ? null
      : Number(filters.projectId),
    taskId: filters.taskId === undefined || filters.taskId === null || filters.taskId === ''
      ? null
      : Number(filters.taskId)
  };
}

function buildHelpRequestListQuery(user, filters = {}) {
  const scope = buildListScope(user);
  const params = [...scope.params];
  let whereSql = scope.whereSql;
  const normalizedFilters = buildHelpRequestFilters(filters);

  if (normalizedFilters.projectId !== null && (!Number.isInteger(normalizedFilters.projectId) || normalizedFilters.projectId <= 0)) {
    throw new HttpError(400, '项目ID不合法');
  }

  if (normalizedFilters.taskId !== null && (!Number.isInteger(normalizedFilters.taskId) || normalizedFilters.taskId <= 0)) {
    throw new HttpError(400, '任务ID不合法');
  }

  if (normalizedFilters.isTimeout !== null && ![0, 1].includes(normalizedFilters.isTimeout)) {
    throw new HttpError(400, '超时筛选参数不合法');
  }

  if (normalizedFilters.status) {
    if (!ALLOWED_STATUS.includes(normalizedFilters.status)) {
      throw new HttpError(400, '状态筛选参数不合法');
    }
    whereSql += ' AND hr.status = ?';
    params.push(normalizedFilters.status);
  }

  if (normalizedFilters.keyword) {
    const keyword = `%${normalizedFilters.keyword}%`;
    whereSql += ` AND (
      hr.request_no LIKE ?
      OR hr.title LIKE ?
      OR hr.requester_name LIKE ?
      OR hr.helper_name LIKE ?
      OR hr.project_name LIKE ?
      OR hr.task_title LIKE ?
      OR hr.requester_ip LIKE ?
    )`;
    params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword);
  }

  if (normalizedFilters.isTimeout !== null) {
    whereSql += ' AND hr.is_timeout = ?';
    params.push(normalizedFilters.isTimeout);
  }

  if (normalizedFilters.projectId !== null) {
    whereSql += ' AND hr.project_id = ?';
    params.push(normalizedFilters.projectId);
  }

  if (normalizedFilters.taskId !== null) {
    whereSql += ' AND hr.task_id = ?';
    params.push(normalizedFilters.taskId);
  }

  return {
    filters: normalizedFilters,
    whereSql,
    params
  };
}

export async function getHelpRequests(user, filters = {}) {
  await syncHelpRequestTimeouts(pool);
  const { whereSql, params } = buildHelpRequestListQuery(user, filters);
  const hasPagination = filters.page !== undefined || filters.pageSize !== undefined;
  const page = Math.max(Number(filters.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 10, 1), 100);
  const offset = (page - 1) * pageSize;
  const selectSql = `SELECT
       hr.id,
       hr.request_no,
       hr.title,
       hr.requester_name,
       hr.helper_name,
       hr.project_id,
       hr.project_name,
       hr.task_id,
       hr.task_title,
       hr.status,
       hr.deadline_at,
       hr.is_timeout,
       hr.request_datetime,
       hr.requester_ip
     FROM help_requests hr
     ${whereSql}
     ORDER BY hr.request_datetime DESC, hr.id DESC`;

  if (!hasPagination) {
    const [rows] = await pool.query(selectSql, params);
    return rows;
  }

  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM help_requests hr
     ${whereSql}`,
    params
  );
  const [rows] = await pool.query(`${selectSql} LIMIT ? OFFSET ?`, [...params, pageSize, offset]);

  return {
    list: rows,
    pagination: {
      page,
      pageSize,
      total: Number(countRow.total) || 0
    }
  };
}

export async function exportHelpRequests(user, filters = {}) {
  await syncHelpRequestTimeouts(pool);
  const { whereSql, params } = buildHelpRequestListQuery(user, filters);

  const [rows] = await pool.query(
    `SELECT
       hr.request_no,
       hr.title,
       hr.requester_name,
       hr.helper_name,
       hr.project_name,
       hr.task_title,
       hr.status,
       hr.deadline_at,
       hr.is_timeout,
       hr.request_datetime,
       hr.requester_ip
     FROM help_requests hr
     ${whereSql}
     ORDER BY hr.request_datetime DESC, hr.id DESC`,
    params
  );

  return rows.map((item) => ({
    ...item,
    status_text: STATUS_TEXT_MAP[item.status] || item.status,
    is_timeout_text: Number(item.is_timeout) === 1 ? '是' : '否'
  }));
}

export async function getHelpRequestDetail(user, id) {
  await syncHelpRequestTimeouts(pool, id);
  const context = await getAccessibleHelpRequest(pool, user, id);
  const logs = await getHelpRequestLogs(pool, id);
  const attachments = await getHelpRequestAttachments(pool, id);

  return {
    ...context.helpRequest,
    assistants: context.assistants,
    logs,
    attachments
  };
}

// 公开查询只凭求助单号定位，但只返回发起人处理所需的最小信息。
// 姓名这层校验本来就是摆设：/api/public/requesters 是免登录接口，谁都能拿到全部
// 发起人姓名，配合旧的顺序单号照样能扫单。真正的凭证是单号里的 8 位随机码，
// 所以这里不需要再叠加姓名；下面的确认/退回仍由签名 Cookie 兜住。
export async function queryPublicHelpRequest({ requestNo }) {
  const [rows] = await pool.query(
    `SELECT
       hr.id,
       hr.request_no,
       hr.title,
       hr.requester_name,
       hr.helper_name,
       hr.project_name,
       hr.task_title,
       hr.content,
       hr.request_datetime,
       hr.request_date,
       hr.expected_handle_hours,
       hr.deadline_at,
       hr.is_timeout,
       hr.status,
       hr.requester_confirmed_at,
       hr.requester_feedback
     FROM help_requests hr
     WHERE hr.request_no = ?
     LIMIT 1`,
    [requestNo]
  );

  if (rows.length === 0) {
    throw new HttpError(404, '未查询到匹配的求助单');
  }

  await syncHelpRequestTimeouts(pool, rows[0].id);
  const [updatedRows] = await pool.query(
    `SELECT
       hr.id,
       hr.request_no,
       hr.title,
       hr.requester_name,
       hr.helper_name,
       hr.project_name,
       hr.task_title,
       hr.content,
       hr.request_datetime,
       hr.request_date,
       hr.expected_handle_hours,
       hr.deadline_at,
       hr.is_timeout,
       hr.status,
       hr.requester_confirmed_at,
       hr.requester_feedback
     FROM help_requests hr
     WHERE hr.id = ?
     LIMIT 1`,
    [rows[0].id]
  );

  return updatedRows[0];
}

export async function updateHelpRequestStatus(user, id, status) {
  if (!ALLOWED_STATUS.includes(status)) {
    throw new HttpError(400, '状态值不合法');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { helpRequest } = await getHelpRequestPermissionContext(connection, id);

    if (!canUpdateHelpRequest(user, helpRequest)) {
      throw new HttpError(403, '求助单不存在或无权限操作');
    }

    const previousStatus = helpRequest.status;

    await connection.query(
      `UPDATE help_requests
       SET status = ?,
           first_response_at = CASE WHEN first_response_at IS NULL AND ? <> 'pending' THEN NOW() ELSE first_response_at END,
           resolved_at = CASE WHEN ? = 'completed' THEN NOW() ELSE resolved_at END,
           is_timeout = CASE
             WHEN deadline_at IS NOT NULL
               AND NOW() > deadline_at
               AND ? <> 'completed'
             THEN 1
             ELSE 0
           END,
           updated_at = NOW()
       WHERE id = ?`,
      [status, status, status, status, id]
    );

    await connection.query(
      `INSERT INTO help_request_logs
        (help_request_id, operator_user_id, operator_name, action_type, action_content, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        id,
        user.id,
        user.realName,
        'status_update',
        buildStatusLogContent(previousStatus, status)
      ]
    );

    await createNotification(connection, {
      receiverUserId: helpRequest.requester_user_id,
      type: 'help_request_status_changed',
      title: '求助单状态已更新',
      content: `求助单 ${helpRequest.request_no} 当前状态为：${STATUS_TEXT_MAP[status]}。`,
      relatedId: id
    });

    await connection.query(
      `INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, summary)
       VALUES (?, 'help_request.status_updated', 'help_request', ?, ?)`,
      [user.id, id, `${helpRequest.request_no}: ${previousStatus} -> ${status}`]
    );
    await connection.commit();

    return {
      id,
      status,
      current_status: status
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getHelpRequestAttachments(executor, helpRequestId) {
  const [rows] = await executor.query(
    `SELECT id, original_name, mime_type, size_bytes, uploaded_by_user_id, created_at
     FROM help_request_attachments WHERE help_request_id = ? ORDER BY created_at DESC, id DESC`,
    [helpRequestId]
  );
  return rows;
}

export async function getAttachments(user, id) {
  const context = await getAccessibleHelpRequest(pool, user, id);
  return getHelpRequestAttachments(pool, context.helpRequest.id);
}

function buildStatusLogContent(previousStatus, nextStatus) {
  if (previousStatus === 'pending' && nextStatus === 'processing') {
    return '接单并开始处理，当前状态：处理中';
  }

  if (previousStatus === nextStatus) {
    return `重复提交状态更新，当前状态保持为：${STATUS_TEXT_MAP[nextStatus]}`;
  }

  return `将状态从：${STATUS_TEXT_MAP[previousStatus] || previousStatus} 更新为：${STATUS_TEXT_MAP[nextStatus]}`;
}

export async function getHelpRequestAssistants(user, id) {
  await syncHelpRequestTimeouts(pool, id);
  const context = await getAccessibleHelpRequest(pool, user, id);
  return context.assistants;
}

export async function addHelpRequestAssistant(user, id, payload) {
  const assistantUserId = Number(payload.assistantUserId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, '求助单ID不合法');
  }
  if (!Number.isInteger(assistantUserId) || assistantUserId <= 0) {
    throw new HttpError(400, '协同人员ID不合法');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { helpRequest } = await getHelpRequestPermissionContext(connection, id);

    if (!canAddAssistant(user, helpRequest)) {
      throw new HttpError(403, '无权限添加协同人员');
    }

    const [[assistantUser]] = await connection.query(
      `SELECT id, real_name, role, status, is_helper
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [assistantUserId]
    );

    if (!assistantUser || assistantUser.status !== 1) {
      throw new HttpError(400, '协同人员不存在或不可用');
    }

    if (!(assistantUser.role === 'admin' || Number(assistantUser.is_helper) === 1)) {
      throw new HttpError(400, '协同人员必须为管理员或帮助人员');
    }

    if (assistantUser.id === helpRequest.helper_user_id) {
      throw new HttpError(400, '当前主处理人无需重复添加为协同人员');
    }

    const [[existingAssistant]] = await connection.query(
      `SELECT id
       FROM help_request_assistants
       WHERE help_request_id = ?
         AND assistant_user_id = ?
       LIMIT 1`,
      [id, assistantUser.id]
    );

    if (existingAssistant) {
      throw new HttpError(400, '该协同人员已存在');
    }

    const [result] = await connection.query(
      `INSERT INTO help_request_assistants
        (
          help_request_id,
          assistant_user_id,
          assistant_name,
          added_by_user_id,
          added_by_name,
          created_at
        )
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, assistantUser.id, assistantUser.real_name, user.id, user.realName]
    );

    await connection.query(
      `INSERT INTO help_request_logs
        (help_request_id, operator_user_id, operator_name, action_type, action_content, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        id,
        user.id,
        user.realName,
        'assistant_added',
        `添加协同人员：${assistantUser.real_name}`
      ]
    );

    await createNotification(connection, {
      receiverUserId: assistantUser.id,
      type: 'assistant_added',
      title: '已被加入协同处理',
      content: `您已被加入求助单 ${helpRequest.request_no} 的协同处理，请及时跟进。`,
      relatedId: id
    });

    await connection.commit();

    return {
      id: result.insertId,
      help_request_id: id,
      assistant_user_id: assistantUser.id,
      assistant_name: assistantUser.real_name,
      added_by_user_id: user.id,
      added_by_name: user.realName
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function addHelpRequestCollaborationLog(user, id, payload) {
  const content = (payload.content || '').trim();
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, '求助单ID不合法');
  }
  if (!content) {
    throw new HttpError(400, '协同处理说明不能为空');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { helpRequest, assistantUserIds } = await getHelpRequestPermissionContext(connection, id);

    if (!canAddCollaborationLog(user, helpRequest, assistantUserIds)) {
      throw new HttpError(403, '只有协同人员可以新增协同处理日志');
    }

    const [result] = await connection.query(
      `INSERT INTO help_request_logs
        (help_request_id, operator_user_id, operator_name, action_type, action_content, created_at)
       VALUES (?, ?, ?, 'collaboration', ?, NOW())`,
      [id, user.id, user.realName, content]
    );

    const [[createdLog]] = await connection.query(
      `SELECT
         id,
         help_request_id,
         operator_user_id,
         operator_name,
         action_type,
         action_content,
         created_at
       FROM help_request_logs
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    const mentionedNames = Array.from(new Set([...content.matchAll(/@([^\s@，,。；;]{1,20})/g)].map((item) => item[1])));
    if (mentionedNames.length > 0) {
      const [mentionedUsers] = await connection.query(
        'SELECT id, real_name FROM users WHERE status = 1 AND real_name IN (?)',
        [mentionedNames]
      );
      for (const mentionedUser of mentionedUsers) {
        if (Number(mentionedUser.id) === Number(user.id)) continue;
        await createNotification(connection, {
          receiverUserId: mentionedUser.id,
          type: 'collaboration_mentioned',
          title: '你被提及协同处理',
          content: `${user.realName} 在求助单 ${helpRequest.request_no} 的处理记录中提及了你：${content.slice(0, 100)}`,
          relatedId: id
        });
      }
    }

    await connection.commit();

    return createdLog;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function reassignHelpRequestHelper(user, id, payload) {
  const helperUserId = Number(payload.helperUserId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, '求助单ID不合法');
  }
  if (!Number.isInteger(helperUserId) || helperUserId <= 0) {
    throw new HttpError(400, '帮助人员ID不合法');
  }

  if (!canReassignHelper(user)) {
    throw new HttpError(403, '只有管理员可以改派帮助人员');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { helpRequest } = await getHelpRequestPermissionContext(connection, id);

    const [[nextHelper]] = await connection.query(
      `SELECT id, real_name, status, is_helper
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [helperUserId]
    );

    if (!nextHelper || nextHelper.status !== 1 || Number(nextHelper.is_helper) !== 1) {
      throw new HttpError(400, '新的帮助人员不存在或不可用');
    }

    if (Number(helpRequest.helper_user_id) === nextHelper.id) {
      throw new HttpError(400, '新帮助人员与当前帮助人员一致');
    }

    const previousHelperUserId = helpRequest.helper_user_id;
    const previousHelperName = helpRequest.helper_name;

    await connection.query(
      `UPDATE help_requests
       SET helper_user_id = ?, helper_name = ?, updated_at = NOW()
       WHERE id = ?`,
      [nextHelper.id, nextHelper.real_name, id]
    );

    await connection.query(
      `INSERT INTO help_request_logs
        (help_request_id, operator_user_id, operator_name, action_type, action_content, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        id,
        user.id,
        user.realName,
        'reassign_helper',
        `将帮助人员从：${previousHelperName} 改派为：${nextHelper.real_name}`
      ]
    );

    await createNotification(connection, {
      receiverUserId: nextHelper.id,
      type: 'helper_reassigned_in',
      title: '收到改派求助单',
      content: `求助单 ${helpRequest.request_no} 已改派给您，请尽快处理。`,
      relatedId: id
    });

    await createNotification(connection, {
      receiverUserId: previousHelperUserId,
      type: 'helper_reassigned_out',
      title: '求助单已改派',
      content: `求助单 ${helpRequest.request_no} 已改派给 ${nextHelper.real_name}。`,
      relatedId: id
    });

    await connection.commit();

    return {
      id,
      helper_user_id: nextHelper.id,
      helper_name: nextHelper.real_name
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function publicConfirmHelpRequest({ id, action, feedback, accessPayload }) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, '求助单ID不合法');
  }

  if (!['confirm', 'reject'].includes(action)) {
    throw new HttpError(400, '操作类型不合法');
  }

  if (feedback.length > 255) {
    throw new HttpError(400, '说明内容不能超过255个字符');
  }

  if (Number(accessPayload.helpRequestId) !== id) {
    throw new HttpError(403, '当前操作与已查询的求助单不匹配');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[record]] = await connection.query(
      `SELECT
         id,
         request_no,
         requester_user_id,
         requester_name,
         helper_user_id,
         status
       FROM help_requests
       WHERE id = ?
         AND request_no = ?
         AND requester_name = ?
       LIMIT 1`,
      [id, accessPayload.requestNo, accessPayload.requesterName]
    );

    if (!record) {
      throw new HttpError(403, '未通过发起人身份校验，无法执行当前操作');
    }

    if (record.status !== 'waiting_confirm') {
      throw new HttpError(400, '当前状态不是待确认，不能执行该操作');
    }

    const nextStatus = action === 'confirm' ? 'completed' : 'processing';
    const actionType = action === 'confirm' ? 'requester_confirm' : 'requester_reject';
    const actionContent = action === 'confirm'
      ? `发起人确认已解决${feedback ? `，说明：${feedback}` : ''}`
      : `发起人退回继续处理${feedback ? `，说明：${feedback}` : ''}`;
    const notificationContent = action === 'confirm'
      ? `求助单 ${record.request_no} 已由发起人确认完成。`
      : `求助单 ${record.request_no} 被发起人退回继续处理。`;
    const requesterConfirmedAtSql = action === 'confirm' ? 'NOW()' : 'NULL';

    await connection.query(
      `UPDATE help_requests
       SET status = ?,
           is_timeout = CASE
             WHEN deadline_at IS NOT NULL
               AND NOW() > deadline_at
               AND ? <> 'completed'
             THEN 1
             ELSE 0
           END,
           requester_confirmed_at = ${requesterConfirmedAtSql},
           requester_feedback = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [nextStatus, nextStatus, feedback || null, id]
    );

    await connection.query(
      `INSERT INTO help_request_logs
        (help_request_id, operator_user_id, operator_name, action_type, action_content, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        id,
        record.requester_user_id,
        record.requester_name,
        actionType,
        actionContent
      ]
    );

    await createNotification(connection, {
      receiverUserId: record.helper_user_id,
      type: actionType,
      title: action === 'confirm' ? '发起人已确认完成' : '发起人退回继续处理',
      content: notificationContent,
      relatedId: id
    });

    const [[updatedRecord]] = await connection.query(
      `SELECT requester_confirmed_at, requester_feedback
       FROM help_requests
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    await connection.commit();

    return {
      id,
      status: nextStatus,
      current_status: nextStatus,
      requester_confirmed_at: updatedRecord?.requester_confirmed_at || null,
      requester_feedback: updatedRecord?.requester_feedback || null
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function runSlaEscalations() {
  await syncHelpRequestTimeouts(pool);

  const [newlyBreached] = await pool.query(
    `SELECT id, request_no, title, helper_user_id
     FROM help_requests
     WHERE is_timeout = 1 AND sla_notified_at IS NULL`
  );
  for (const item of newlyBreached) {
    await createNotification(pool, {
      receiverUserId: item.helper_user_id,
      type: 'sla_breached',
      title: '求助单 SLA 已超时',
      content: `求助单 ${item.request_no}《${item.title}》已超过处理时限，请优先处理或更新状态。`,
      relatedId: item.id
    });
  }
  if (newlyBreached.length) {
    await pool.query('UPDATE help_requests SET sla_notified_at = NOW() WHERE is_timeout = 1 AND sla_notified_at IS NULL');
  }

  const [[summary]] = await pool.query(
    `SELECT COUNT(*) AS timeout_count
     FROM help_requests
     WHERE is_timeout = 1`
  );

  return {
    timeoutCount: Number(summary?.timeout_count || 0),
    escalatedCount: newlyBreached.length
  };
}

export async function checkHelpRequestTimeouts(user) {
  if (user.role !== 'admin') {
    throw new HttpError(403, '只有管理员可以执行超时检查');
  }
  return runSlaEscalations();
}
