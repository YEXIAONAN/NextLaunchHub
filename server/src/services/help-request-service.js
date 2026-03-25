import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import { generateRequestNo } from '../utils/request-no.js';
import { createNotification } from './notification-service.js';

const ALLOWED_STATUS = ['pending', 'processing', 'waiting_confirm', 'completed'];
const STATUS_TEXT_MAP = {
  pending: '待处理',
  processing: '处理中',
  waiting_confirm: '待确认',
  completed: '已完成'
};

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
     ORDER BY created_at DESC, id DESC`,
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

async function getAccessibleHelpRequest(executor, user, helpRequestId) {
  const params = [helpRequestId];
  let permissionSql = '';

  if (user.role !== 'admin') {
    permissionSql = ` AND (
      hr.helper_user_id = ?
      OR EXISTS (
        SELECT 1
        FROM help_request_assistants hra
        WHERE hra.help_request_id = hr.id
          AND hra.assistant_user_id = ?
      )
    )`;
    params.push(user.id, user.id);
  }

  const [rows] = await executor.query(
    `SELECT
       hr.id,
       hr.request_no,
       hr.title,
       hr.requester_user_id,
       hr.requester_name,
       hr.helper_user_id,
       hr.helper_name,
       hr.content,
       hr.requester_ip,
       hr.request_datetime,
       hr.request_date,
       hr.status,
       hr.requester_confirmed_at,
       hr.requester_feedback,
       hr.created_at,
       hr.updated_at
     FROM help_requests hr
     WHERE hr.id = ?
     ${permissionSql}
     LIMIT 1`,
    params
  );

  if (rows.length === 0) {
    throw new HttpError(404, '求助单不存在或无权限访问');
  }

  return rows[0];
}

async function assertCanManageAssistants(executor, user, helpRequestId) {
  const params = [helpRequestId];
  let permissionSql = '';

  if (user.role !== 'admin') {
    permissionSql = ' AND hr.helper_user_id = ?';
    params.push(user.id);
  }

  const [rows] = await executor.query(
    `SELECT
       hr.id,
       hr.request_no,
       hr.helper_user_id,
       hr.helper_name
     FROM help_requests hr
     WHERE hr.id = ?
     ${permissionSql}
     LIMIT 1`,
    params
  );

  if (rows.length === 0) {
    throw new HttpError(403, '无权限添加协同人员');
  }

  return rows[0];
}

async function assertCanAddCollaborationLog(executor, user, helpRequestId) {
  if (user.role === 'admin') {
    const [rows] = await executor.query(
      `SELECT id, request_no
       FROM help_requests
       WHERE id = ?
       LIMIT 1`,
      [helpRequestId]
    );

    if (rows.length === 0) {
      throw new HttpError(404, '求助单不存在或无权限访问');
    }

    return rows[0];
  }

  const [rows] = await executor.query(
    `SELECT hr.id, hr.request_no
     FROM help_requests hr
     WHERE hr.id = ?
       AND EXISTS (
         SELECT 1
         FROM help_request_assistants hra
         WHERE hra.help_request_id = hr.id
           AND hra.assistant_user_id = ?
       )
     LIMIT 1`,
    [helpRequestId, user.id]
  );

  if (rows.length === 0) {
    throw new HttpError(403, '只有协同人员可以新增协同处理日志');
  }

  return rows[0];
}

export async function createHelpRequest(payload) {
  const {
    title,
    requesterUserId,
    helperUserId,
    content,
    requesterIp
  } = payload;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[requester]] = await connection.query(
      `SELECT id, real_name
       FROM users
       WHERE id = ? AND role = 'requester' AND status = 1
       LIMIT 1`,
      [requesterUserId]
    );

    if (!requester) {
      throw new HttpError(400, '发起人不存在或不可用');
    }

    const [[helper]] = await connection.query(
      `SELECT id, real_name
       FROM users
       WHERE id = ? AND role = 'helper' AND status = 1
       LIMIT 1`,
      [helperUserId]
    );

    if (!helper) {
      throw new HttpError(400, '帮助人员不存在或不可用');
    }

    const requestNo = await generateRequestNo(connection);

    const [result] = await connection.query(
      `INSERT INTO help_requests
        (
          request_no, title, requester_user_id, requester_name,
          helper_user_id, helper_name, content, requester_ip,
          request_datetime, request_date, status, created_at, updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), CURDATE(), 'pending', NOW(), NOW())`,
      [
        requestNo,
        title,
        requester.id,
        requester.real_name,
        helper.id,
        helper.real_name,
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

    await connection.commit();

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
  if (user.role === 'admin') {
    return {
      whereSql: 'WHERE 1 = 1',
      params: []
    };
  }

  return {
    whereSql: `WHERE (
      hr.helper_user_id = ?
      OR EXISTS (
        SELECT 1
        FROM help_request_assistants hra
        WHERE hra.help_request_id = hr.id
          AND hra.assistant_user_id = ?
      )
    )`,
    params: [user.id, user.id]
  };
}

export async function getHelpRequests(user, status) {
  const scope = buildListScope(user);
  const params = [...scope.params];
  let whereSql = scope.whereSql;

  if (status) {
    whereSql += ' AND hr.status = ?';
    params.push(status);
  }

  const [rows] = await pool.query(
    `SELECT
       hr.id,
       hr.request_no,
       hr.title,
       hr.requester_name,
       hr.helper_name,
       hr.status,
       hr.request_datetime,
       hr.requester_ip
     FROM help_requests hr
     ${whereSql}
     ORDER BY hr.request_datetime DESC, hr.id DESC`,
    params
  );

  return rows;
}

export async function getHelpRequestDetail(user, id) {
  const detail = await getAccessibleHelpRequest(pool, user, id);
  const logs = await getHelpRequestLogs(pool, id);
  const assistants = await getHelpRequestAssistantsById(pool, id);

  return {
    ...detail,
    assistants,
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
       hr.content,
       hr.request_datetime,
       hr.request_date,
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

  const logs = await getHelpRequestLogs(pool, rows[0].id);

  return {
    ...rows[0],
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

    const params = [id];
    let permissionSql = '';

    if (user.role !== 'admin') {
      permissionSql = ' AND helper_user_id = ?';
      params.push(user.id);
    }

    const [[record]] = await connection.query(
      `SELECT id, request_no, title, status, helper_user_id, requester_user_id
       FROM help_requests
       WHERE id = ?
       ${permissionSql}
       LIMIT 1`,
      params
    );

    if (!record) {
      throw new HttpError(404, '求助单不存在或无权限操作');
    }

    await connection.query(
      `UPDATE help_requests
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, id]
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
        `将状态更新为：${STATUS_TEXT_MAP[status]}`
      ]
    );

    await createNotification(connection, {
      receiverUserId: record.requester_user_id,
      type: 'help_request_status_changed',
      title: '求助单状态已更新',
      content: `求助单 ${record.request_no} 当前状态为：${STATUS_TEXT_MAP[status]}。`,
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

export async function getHelpRequestAssistants(user, id) {
  await getAccessibleHelpRequest(pool, user, id);
  return getHelpRequestAssistantsById(pool, id);
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

    const helpRequest = await assertCanManageAssistants(connection, user, id);

    const [[assistantUser]] = await connection.query(
      `SELECT id, real_name, role, status
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [assistantUserId]
    );

    if (!assistantUser || assistantUser.status !== 1) {
      throw new HttpError(400, '协同人员不存在或不可用');
    }

    if (!['admin', 'helper'].includes(assistantUser.role)) {
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

    await assertCanAddCollaborationLog(connection, user, id);

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
           requester_confirmed_at = ${requesterConfirmedAtSql},
           requester_feedback = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [nextStatus, feedback || null, id]
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
