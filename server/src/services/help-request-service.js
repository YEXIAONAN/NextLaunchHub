import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import { generateRequestNo } from '../utils/request-no.js';
import { createNotification } from './notification-service.js';

const ALLOWED_STATUS = ['pending', 'processing', 'waiting_confirm', 'completed'];

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
      requestNo
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
    whereSql: 'WHERE hr.helper_user_id = ?',
    params: [user.id]
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
  const params = [id];
  let permissionSql = '';

  if (user.role !== 'admin') {
    permissionSql = ' AND hr.helper_user_id = ?';
    params.push(user.id);
  }

  const [rows] = await pool.query(
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

  const [logs] = await pool.query(
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
    [id]
  );

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

    const statusTextMap = {
      pending: '待处理',
      processing: '处理中',
      waiting_confirm: '待确认',
      completed: '已完成'
    };

    await connection.query(
      `INSERT INTO help_request_logs
        (help_request_id, operator_user_id, operator_name, action_type, action_content, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        id,
        user.id,
        user.realName,
        'status_update',
        `将状态更新为：${statusTextMap[status]}`
      ]
    );

    await createNotification(connection, {
      receiverUserId: record.requester_user_id,
      type: 'help_request_status_changed',
      title: '求助单状态已更新',
      content: `求助单 ${record.request_no} 当前状态为：${statusTextMap[status]}。`,
      relatedId: id
    });

    await connection.commit();

    return {
      id,
      status
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
