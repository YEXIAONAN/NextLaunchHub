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

async function resolveHelpRequestRelation(executor, projectIdInput, taskIdInput) {
  const normalizedProjectId = projectIdInput === undefined || projectIdInput === null || projectIdInput === ''
    ? null
    : Number(projectIdInput);
  const normalizedTaskId = taskIdInput === undefined || taskIdInput === null || taskIdInput === ''
    ? null
    : Number(taskIdInput);

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
    projectName: project?.project_name || null,
    taskId: task?.id || null,
    taskTitle: task?.title || null
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
    projectId,
    taskId,
    content,
    requesterIp
  } = payload;

  const connection = await pool.getConnection();
  let realtimePayload = null;

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

    const [[helper]] = await connection.query(
      `SELECT id, real_name
       FROM users
       WHERE id = ? AND is_helper = 1 AND status = 1
       LIMIT 1`,
      [helperUserId]
    );

    if (!helper) {
      throw new HttpError(400, '帮助人员不存在或不可用');
    }

    const relation = await resolveHelpRequestRelation(connection, projectId, taskId);
    const requestNo = await generateRequestNo(connection);

    const [result] = await connection.query(
      `INSERT INTO help_requests
        (
          request_no, title, requester_user_id, requester_name,
          helper_user_id, helper_name, project_id, project_name,
          task_id, task_title, content, requester_ip,
          request_datetime, request_date, expected_handle_hours,
          deadline_at, is_timeout, status, created_at, updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), CURDATE(), 24, DATE_ADD(NOW(), INTERVAL 24 HOUR), 0, 'pending', NOW(), NOW())`,
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
        requesterIp
      ]
    );

    const helpRequestId = result.insertId;

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

    await createNotification(connection, {
      receiverUserId: helper.id,
      type: 'help_request_created',
      title: '收到新的求助单',
      content: `求助单 ${requestNo} 已提交，请及时处理。`,
      relatedId: helpRequestId
    });

    realtimePayload = {
      type: 'new_help_request',
      requestId: helpRequestId,
      requestNo,
      title,
      requesterName: requester.real_name,
      helperUserId: helper.id,
      createdAt: new Date().toISOString(),
      message: `求助单 ${requestNo}《${title}》已由 ${requester.real_name} 提交，请及时处理。`
    };

    await connection.commit();

    emitToUser(helper.id, 'new_help_request', realtimePayload);

    return {
      id: helpRequestId,
      requestNo,
      request_no: requestNo
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
    status: (filters.status || '').trim(),
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

  if (normalizedFilters.status) {
    whereSql += ' AND hr.status = ?';
    params.push(normalizedFilters.status);
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

  const [rows] = await pool.query(
    `SELECT
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
     ORDER BY hr.request_datetime DESC, hr.id DESC`,
    params
  );

  return rows;
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

  return {
    ...context.helpRequest,
    assistants: context.assistants,
    logs
  };
}

export async function queryPublicHelpRequest({ requestNo, requesterName }) {
  const [rows] = await pool.query(
    `SELECT
       hr.id,
       hr.request_no,
       hr.title,
       hr.requester_name,
       hr.helper_name,
       hr.project_id,
       hr.project_name,
       hr.task_id,
       hr.task_title,
       hr.content,
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
     WHERE hr.request_no = ?
       AND hr.requester_name = ?
     LIMIT 1`,
    [requestNo, requesterName]
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
       hr.project_id,
       hr.project_name,
       hr.task_id,
       hr.task_title,
       hr.content,
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
    [rows[0].id]
  );

  const logs = await getHelpRequestLogs(pool, rows[0].id);

  return {
    ...updatedRows[0],
    logs
  };
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
           is_timeout = CASE
             WHEN deadline_at IS NOT NULL
               AND NOW() > deadline_at
               AND ? <> 'completed'
             THEN 1
             ELSE 0
           END,
           updated_at = NOW()
       WHERE id = ?`,
      [status, status, id]
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

export async function checkHelpRequestTimeouts(user) {
  if (user.role !== 'admin') {
    throw new HttpError(403, '只有管理员可以执行超时检查');
  }

  await syncHelpRequestTimeouts(pool);

  const [[summary]] = await pool.query(
    `SELECT COUNT(*) AS timeout_count
     FROM help_requests
     WHERE is_timeout = 1`
  );

  return {
    timeoutCount: Number(summary?.timeout_count || 0)
  };
}
