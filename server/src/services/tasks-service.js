import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import {
  buildTaskListScope,
  canCreateTask,
  canUpdateTask,
  canUpdateTaskStatus,
  canViewProject
} from '../utils/permission.js';
import { generateTaskCode } from '../utils/task-code.js';
import { validateTaskPlanningBindings } from './project-planning-service.js';

const TASK_STATUS = ['todo', 'in_progress', 'blocked', 'done', 'cancelled'];
const TASK_PRIORITY = ['low', 'medium', 'high', 'urgent'];

function parsePagination(value, defaultValue) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

function assertTaskStatus(status) {
  if (status !== undefined && status !== null && status !== '' && !TASK_STATUS.includes(status)) {
    throw new HttpError(400, '任务状态值不合法');
  }
}

function assertTaskPriority(priority) {
  if (priority !== undefined && priority !== null && priority !== '' && !TASK_PRIORITY.includes(priority)) {
    throw new HttpError(400, '任务优先级值不合法');
  }
}

function normalizeProgress(progress) {
  if (progress === undefined || progress === null || progress === '') {
    return undefined;
  }

  const parsed = Number(progress);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    throw new HttpError(400, '任务进度必须是0到100之间的整数');
  }

  return parsed;
}

function normalizeDecimalHours(value, fieldLabel) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new HttpError(400, `${fieldLabel}必须是大于等于0的数字`);
  }

  return Number(parsed.toFixed(2));
}

async function writeTaskLog(executor, payload) {
  const {
    taskId,
    operatorUserId,
    operatorName,
    actionType,
    actionContent
  } = payload;

  await executor.query(
    `INSERT INTO task_logs
      (task_id, operator_user_id, operator_name, action_type, action_content, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [taskId, operatorUserId, operatorName, actionType, actionContent]
  );
}

async function getProjectBase(executor, projectId) {
  const [rows] = await executor.query(
    `SELECT
       p.id,
       p.project_code,
       p.project_name,
       p.owner_user_id,
       p.owner_name,
       p.status
     FROM projects p
     WHERE p.id = ?
     LIMIT 1`,
    [projectId]
  );

  if (rows.length === 0) {
    throw new HttpError(404, '项目不存在');
  }

  return rows[0];
}

async function getProjectMemberUserIds(executor, projectId) {
  const [rows] = await executor.query(
    `SELECT user_id
     FROM project_members
     WHERE project_id = ?`,
    [projectId]
  );

  return rows.map((item) => Number(item.user_id));
}

async function getAccessibleProject(executor, user, projectId) {
  const project = await getProjectBase(executor, projectId);
  const memberUserIds = await getProjectMemberUserIds(executor, projectId);

  if (!canViewProject(user, project, memberUserIds)) {
    throw new HttpError(403, '项目不存在或无权限访问');
  }

  return {
    project,
    memberUserIds
  };
}

async function getTaskBase(executor, taskId) {
  const [rows] = await executor.query(
    `SELECT
       t.id,
       t.task_code,
       t.project_id,
       t.iteration_id,
       t.milestone_id,
       t.title,
       t.description,
       t.assignee_user_id,
       t.assignee_name,
       t.priority,
       t.status,
       t.progress,
       t.start_date,
       t.due_date,
       t.estimated_hours,
       t.actual_hours,
       t.created_by,
       t.created_at,
       t.updated_at
     FROM tasks t
     WHERE t.id = ?
     LIMIT 1`,
    [taskId]
  );

  if (rows.length === 0) {
    throw new HttpError(404, '任务不存在');
  }

  return rows[0];
}

async function getAccessibleTask(executor, user, taskId) {
  const task = await getTaskBase(executor, taskId);
  const { project } = await getAccessibleProject(executor, user, task.project_id);

  return {
    task,
    project
  };
}

async function getActiveUserById(executor, userId) {
  const [[user]] = await executor.query(
    `SELECT id, real_name, status
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  if (!user || user.status !== 1) {
    throw new HttpError(400, '用户不存在或不可用');
  }

  return user;
}

function buildTaskListFilters(query = {}) {
  return {
    projectId: query.projectId ? Number(query.projectId) : null,
    keyword: (query.keyword || '').trim(),
    status: (query.status || '').trim(),
    priority: (query.priority || '').trim(),
    assigneeUserId: query.assigneeUserId ? Number(query.assigneeUserId) : null,
    page: parsePagination(query.page, 1),
    pageSize: parsePagination(query.pageSize, 10)
  };
}

async function buildTaskWhereScope(user, query = {}) {
  const filters = buildTaskListFilters(query);
  assertTaskStatus(filters.status);
  assertTaskPriority(filters.priority);

  if (filters.projectId !== null && (!Number.isInteger(filters.projectId) || filters.projectId <= 0)) {
    throw new HttpError(400, '项目ID不合法');
  }

  if (filters.assigneeUserId !== null && (!Number.isInteger(filters.assigneeUserId) || filters.assigneeUserId <= 0)) {
    throw new HttpError(400, '负责人ID不合法');
  }

  const scope = buildTaskListScope(user, 't');
  const params = [...scope.params];
  let whereSql = scope.clause;

  if (filters.projectId !== null) {
    whereSql += ' AND t.project_id = ?';
    params.push(filters.projectId);
  }

  if (filters.keyword) {
    whereSql += ' AND (t.task_code LIKE ? OR t.title LIKE ?)';
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  if (filters.status) {
    whereSql += ' AND t.status = ?';
    params.push(filters.status);
  }

  if (filters.priority) {
    whereSql += ' AND t.priority = ?';
    params.push(filters.priority);
  }

  if (filters.assigneeUserId !== null) {
    whereSql += ' AND t.assignee_user_id = ?';
    params.push(filters.assigneeUserId);
  }

  return {
    filters,
    whereSql,
    params
  };
}

export async function createTask(user, payload) {
  const projectId = Number(payload.projectId);
  const title = (payload.title || '').trim();
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const assigneeUserId = payload.assigneeUserId === undefined || payload.assigneeUserId === null || payload.assigneeUserId === ''
    ? null
    : Number(payload.assigneeUserId);
  const priority = payload.priority || 'medium';
  const status = payload.status || 'todo';
  const progress = normalizeProgress(payload.progress);
  const startDate = payload.startDate || null;
  const dueDate = payload.dueDate || null;
  const estimatedHours = normalizeDecimalHours(payload.estimatedHours, '预估工时');
  const actualHours = normalizeDecimalHours(payload.actualHours, '实际工时');

  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new HttpError(400, '项目ID不合法');
  }

  if (!title) {
    throw new HttpError(400, '任务标题不能为空');
  }

  if (assigneeUserId !== null && (!Number.isInteger(assigneeUserId) || assigneeUserId <= 0)) {
    throw new HttpError(400, '任务负责人不合法');
  }

  assertTaskPriority(priority);
  assertTaskStatus(status);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { project } = await getAccessibleProject(connection, user, projectId);

    if (!canCreateTask(user, project)) {
      throw new HttpError(403, '无权限在当前项目下创建任务');
    }

    let assignee = null;
    if (assigneeUserId !== null) {
      assignee = await getActiveUserById(connection, assigneeUserId);
    }

    const { iterationId, milestoneId } = await validateTaskPlanningBindings(
      connection,
      projectId,
      payload.iterationId,
      payload.milestoneId
    );

    const taskCode = await generateTaskCode(connection);
    const [result] = await connection.query(
      `INSERT INTO tasks
        (
          task_code, project_id, iteration_id, milestone_id, title, description,
          assignee_user_id, assignee_name, priority, status, progress,
          start_date, due_date, estimated_hours, actual_hours,
          created_by, created_at, updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        taskCode,
        projectId,
        iterationId,
        milestoneId,
        title,
        description || null,
        assignee?.id || null,
        assignee?.real_name || null,
        priority,
        status,
        progress ?? 0,
        startDate,
        dueDate,
        estimatedHours ?? null,
        actualHours ?? null,
        user.id
      ]
    );

    await writeTaskLog(connection, {
      taskId: result.insertId,
      operatorUserId: user.id,
      operatorName: user.realName,
      actionType: 'create',
      actionContent: `创建任务：${title}`
    });

    await connection.commit();

    return getTaskBase(pool, result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getTasks(user, query = {}) {
  const { filters, whereSql, params } = await buildTaskWhereScope(user, query);
  const countParams = [...params];
  const offset = (filters.page - 1) * filters.pageSize;

  const [rows] = await pool.query(
    `SELECT
       t.id,
       t.task_code,
       t.project_id,
       t.iteration_id,
       t.milestone_id,
       p.project_code,
       p.project_name,
       t.title,
       t.description,
       t.assignee_user_id,
       t.assignee_name,
       t.priority,
       t.status,
       t.progress,
       t.start_date,
       t.due_date,
       t.estimated_hours,
       t.actual_hours,
       t.created_by,
       t.created_at,
       t.updated_at
     FROM tasks t
     INNER JOIN projects p ON p.id = t.project_id
     ${whereSql}
     ORDER BY t.updated_at DESC, t.id DESC
     LIMIT ?
     OFFSET ?`,
    [...params, filters.pageSize, offset]
  );

  const [[totalResult]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM tasks t
     ${whereSql}`,
    countParams
  );

  return {
    list: rows,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: Number(totalResult.total || 0)
    }
  };
}

export async function exportTasks(user, query = {}) {
  const { whereSql, params } = await buildTaskWhereScope(user, query);

  const [rows] = await pool.query(
    `SELECT
       t.task_code,
       p.project_code,
       p.project_name,
       t.title,
       t.assignee_name,
       t.priority,
       t.status,
       t.progress,
       t.start_date,
       t.due_date,
       t.estimated_hours,
       t.actual_hours,
       t.created_at
     FROM tasks t
     INNER JOIN projects p ON p.id = t.project_id
     ${whereSql}
     ORDER BY t.updated_at DESC, t.id DESC`,
    params
  );

  return rows;
}

export async function getTaskDetail(user, taskId) {
  const { task } = await getAccessibleTask(pool, user, taskId);
  const [logs] = await pool.query(
    `SELECT
       id,
       task_id,
       operator_user_id,
       operator_name,
       action_type,
       action_content,
       created_at
     FROM task_logs
     WHERE task_id = ?
     ORDER BY created_at ASC, id ASC`,
    [taskId]
  );

  return {
    ...task,
    logs
  };
}

export async function updateTask(user, taskId, payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { task, project } = await getAccessibleTask(connection, user, taskId);

    if (!canUpdateTask(user, project, task)) {
      throw new HttpError(403, '无权限更新任务');
    }

    const updates = [];
    const params = [];
    const changedFields = [];

    if (payload.title !== undefined) {
      const title = (payload.title || '').trim();
      if (!title) {
        throw new HttpError(400, '任务标题不能为空');
      }
      updates.push('title = ?');
      params.push(title);
      changedFields.push(`任务标题改为：${title}`);
    }

    if (payload.description !== undefined) {
      const description = typeof payload.description === 'string' ? payload.description.trim() : '';
      updates.push('description = ?');
      params.push(description || null);
      changedFields.push('更新任务描述');
    }

    if (payload.assigneeUserId !== undefined) {
      if (payload.assigneeUserId === null || payload.assigneeUserId === '') {
        updates.push('assignee_user_id = ?', 'assignee_name = ?');
        params.push(null, null);
        changedFields.push('清空任务负责人');
      } else {
        const assigneeUserId = Number(payload.assigneeUserId);
        if (!Number.isInteger(assigneeUserId) || assigneeUserId <= 0) {
          throw new HttpError(400, '任务负责人不合法');
        }
        const assignee = await getActiveUserById(connection, assigneeUserId);
        updates.push('assignee_user_id = ?', 'assignee_name = ?');
        params.push(assignee.id, assignee.real_name);
        changedFields.push(`任务负责人改为：${assignee.real_name}`);
      }
    }

    if (payload.priority !== undefined) {
      assertTaskPriority(payload.priority);
      updates.push('priority = ?');
      params.push(payload.priority);
      changedFields.push(`任务优先级改为：${payload.priority}`);
    }

    if (payload.status !== undefined) {
      assertTaskStatus(payload.status);
      updates.push('status = ?');
      params.push(payload.status);
      changedFields.push(`任务状态改为：${payload.status}`);
    }

    if (payload.progress !== undefined) {
      const progress = normalizeProgress(payload.progress);
      updates.push('progress = ?');
      params.push(progress);
      changedFields.push(`任务进度改为：${progress}%`);
    }

    if (payload.startDate !== undefined) {
      updates.push('start_date = ?');
      params.push(payload.startDate || null);
      changedFields.push('更新开始日期');
    }

    if (payload.dueDate !== undefined) {
      updates.push('due_date = ?');
      params.push(payload.dueDate || null);
      changedFields.push('更新截止日期');
    }

    if (payload.estimatedHours !== undefined) {
      const estimatedHours = normalizeDecimalHours(payload.estimatedHours, '预估工时');
      updates.push('estimated_hours = ?');
      params.push(estimatedHours ?? null);
      changedFields.push('更新预估工时');
    }

    if (payload.actualHours !== undefined) {
      const actualHours = normalizeDecimalHours(payload.actualHours, '实际工时');
      updates.push('actual_hours = ?');
      params.push(actualHours ?? null);
      changedFields.push('更新实际工时');
    }

    if (payload.iterationId !== undefined || payload.milestoneId !== undefined) {
      const { iterationId, milestoneId } = await validateTaskPlanningBindings(
        connection,
        task.project_id,
        payload.iterationId !== undefined ? payload.iterationId : task.iteration_id,
        payload.milestoneId !== undefined ? payload.milestoneId : task.milestone_id
      );

      if (payload.iterationId !== undefined) {
        updates.push('iteration_id = ?');
        params.push(iterationId);
        changedFields.push(iterationId === null ? '清空任务迭代绑定' : `更新任务迭代为：${iterationId}`);
      }

      if (payload.milestoneId !== undefined) {
        updates.push('milestone_id = ?');
        params.push(milestoneId);
        changedFields.push(milestoneId === null ? '清空任务里程碑绑定' : `更新任务里程碑为：${milestoneId}`);
      }
    }

    if (updates.length === 0) {
      throw new HttpError(400, '没有可更新的任务字段');
    }

    updates.push('updated_at = NOW()');
    params.push(taskId);

    await connection.query(
      `UPDATE tasks
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );

    await writeTaskLog(connection, {
      taskId,
      operatorUserId: user.id,
      operatorName: user.realName,
      actionType: 'update',
      actionContent: changedFields.join('；')
    });

    await connection.commit();

    return getTaskBase(pool, taskId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateTaskStatus(user, taskId, status) {
  assertTaskStatus(status);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { task, project } = await getAccessibleTask(connection, user, taskId);

    if (!canUpdateTaskStatus(user, project, task)) {
      throw new HttpError(403, '无权限更新任务状态');
    }

    await connection.query(
      `UPDATE tasks
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, taskId]
    );

    await writeTaskLog(connection, {
      taskId,
      operatorUserId: user.id,
      operatorName: user.realName,
      actionType: 'status_update',
      actionContent: `将任务状态从：${task.status} 更新为：${status}`
    });

    await connection.commit();

    return getTaskBase(pool, taskId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getProjectTasks(user, projectId, query = {}) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new HttpError(400, '项目ID不合法');
  }

  await getAccessibleProject(pool, user, projectId);

  return getTasks(user, {
    ...query,
    projectId
  });
}
