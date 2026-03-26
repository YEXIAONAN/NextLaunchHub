import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import {
  buildProjectListScope,
  canAddProjectMember,
  canUpdateProject,
  canViewProject
} from '../utils/permission.js';
import { generateProjectCode } from '../utils/project-code.js';
import {
  createProjectIteration as createProjectIterationFromPlanningService,
  createProjectMilestone as createProjectMilestoneFromPlanningService,
  getProjectIterations as getProjectIterationsFromPlanningService,
  getProjectIterationsByProjectId,
  getProjectMilestones as getProjectMilestonesFromPlanningService,
  getProjectMilestonesByProjectId
} from './project-planning-service.js';
import { getProjectTasks as getProjectTasksFromTasksService } from './tasks-service.js';

const PROJECT_STATUS = ['not_started', 'in_progress', 'paused', 'completed', 'archived'];
const PROJECT_PRIORITY = ['low', 'medium', 'high', 'urgent'];

function parsePagination(value, defaultValue) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

function buildProjectListFilters(query = {}) {
  return {
    keyword: (query.keyword || '').trim(),
    status: (query.status || '').trim(),
    priority: (query.priority || '').trim(),
    page: parsePagination(query.page, 1),
    pageSize: parsePagination(query.pageSize, 10)
  };
}

function buildProjectListQuery(user, query = {}) {
  const scope = buildProjectListScope(user, 'p');
  const params = [...scope.params];
  let whereSql = scope.clause;
  const filters = buildProjectListFilters(query);

  assertProjectStatus(filters.status);
  assertProjectPriority(filters.priority);

  if (filters.keyword) {
    whereSql += ' AND (p.project_code LIKE ? OR p.project_name LIKE ?)';
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  if (filters.status) {
    whereSql += ' AND p.status = ?';
    params.push(filters.status);
  }

  if (filters.priority) {
    whereSql += ' AND p.priority = ?';
    params.push(filters.priority);
  }

  return {
    filters,
    whereSql,
    params
  };
}

function assertProjectStatus(status) {
  if (status !== undefined && status !== null && status !== '' && !PROJECT_STATUS.includes(status)) {
    throw new HttpError(400, '项目状态值不合法');
  }
}

function assertProjectPriority(priority) {
  if (priority !== undefined && priority !== null && priority !== '' && !PROJECT_PRIORITY.includes(priority)) {
    throw new HttpError(400, '项目优先级值不合法');
  }
}

function normalizeProgress(progress) {
  if (progress === undefined || progress === null || progress === '') {
    return undefined;
  }

  const parsed = Number(progress);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    throw new HttpError(400, '项目进度必须是0到100之间的整数');
  }

  return parsed;
}

async function writeProjectLog(executor, payload) {
  const {
    projectId,
    operatorUserId,
    operatorName,
    actionType,
    actionContent
  } = payload;

  await executor.query(
    `INSERT INTO project_logs
      (project_id, operator_user_id, operator_name, action_type, action_content, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [projectId, operatorUserId, operatorName, actionType, actionContent]
  );
}

async function getProjectBase(executor, projectId) {
  const [rows] = await executor.query(
    `SELECT
       p.id,
       p.project_code,
       p.project_name,
       p.description,
       p.owner_user_id,
       p.owner_name,
       p.priority,
       p.status,
       p.start_date,
       p.end_date,
       p.progress,
       p.created_by,
       p.created_at,
       p.updated_at
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

async function getProjectMembersByProjectId(executor, projectId) {
  const [rows] = await executor.query(
    `SELECT
       id,
       project_id,
       user_id,
       real_name,
       role_in_project,
       created_at
     FROM project_members
     WHERE project_id = ?
     ORDER BY created_at ASC, id ASC`,
    [projectId]
  );

  return rows;
}

async function getProjectLogsByProjectId(executor, projectId) {
  const [rows] = await executor.query(
    `SELECT
       id,
       project_id,
       operator_user_id,
       operator_name,
       action_type,
       action_content,
       created_at
     FROM project_logs
     WHERE project_id = ?
     ORDER BY created_at ASC, id ASC`,
    [projectId]
  );

  return rows;
}

async function getProjectPermissionContext(executor, projectId) {
  const project = await getProjectBase(executor, projectId);
  const members = await getProjectMembersByProjectId(executor, projectId);
  const memberUserIds = members.map((item) => Number(item.user_id));

  return {
    project,
    members,
    memberUserIds
  };
}

async function getAccessibleProject(executor, user, projectId) {
  const context = await getProjectPermissionContext(executor, projectId);

  if (!canViewProject(user, context.project, context.memberUserIds)) {
    throw new HttpError(403, '项目不存在或无权限访问');
  }

  return context;
}

async function getActiveUserById(executor, userId) {
  const [[user]] = await executor.query(
    `SELECT id, real_name, role, status
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

export async function createProject(user, payload) {
  if (!canUpdateProject(user)) {
    throw new HttpError(403, '只有管理员可以创建项目');
  }

  const projectName = (payload.projectName || '').trim();
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const ownerUserId = Number(payload.ownerUserId);
  const priority = payload.priority || 'medium';
  const status = payload.status || 'not_started';
  const startDate = payload.startDate || null;
  const endDate = payload.endDate || null;
  const progress = normalizeProgress(payload.progress);

  if (!projectName) {
    throw new HttpError(400, '项目名称不能为空');
  }
  if (!Number.isInteger(ownerUserId) || ownerUserId <= 0) {
    throw new HttpError(400, '项目负责人不能为空');
  }

  assertProjectPriority(priority);
  assertProjectStatus(status);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const owner = await getActiveUserById(connection, ownerUserId);
    const projectCode = await generateProjectCode(connection);

    const [result] = await connection.query(
      `INSERT INTO projects
        (
          project_code, project_name, description, owner_user_id, owner_name,
          priority, status, start_date, end_date, progress, created_by, created_at, updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        projectCode,
        projectName,
        description || null,
        owner.id,
        owner.real_name,
        priority,
        status,
        startDate,
        endDate,
        progress ?? 0,
        user.id
      ]
    );

    await writeProjectLog(connection, {
      projectId: result.insertId,
      operatorUserId: user.id,
      operatorName: user.realName,
      actionType: 'create',
      actionContent: `创建项目：${projectName}`
    });

    await connection.commit();

    return getProjectBase(pool, result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getProjects(user, query = {}) {
  const { filters, whereSql, params } = buildProjectListQuery(user, query);

  const countParams = [...params];
  const offset = (filters.page - 1) * filters.pageSize;

  const [rows] = await pool.query(
    `SELECT
       p.id,
       p.project_code,
       p.project_name,
       p.description,
       p.owner_user_id,
       p.owner_name,
       p.priority,
       p.status,
       p.start_date,
       p.end_date,
       p.progress,
       p.created_by,
       p.created_at,
       p.updated_at
     FROM projects p
     ${whereSql}
     ORDER BY p.updated_at DESC, p.id DESC
     LIMIT ?
     OFFSET ?`,
    [...params, filters.pageSize, offset]
  );

  const [[totalResult]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM projects p
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

export async function exportProjects(user, query = {}) {
  const { whereSql, params } = buildProjectListQuery(user, query);

  const [rows] = await pool.query(
    `SELECT
       p.project_code,
       p.project_name,
       p.owner_name,
       p.priority,
       p.status,
       p.start_date,
       p.end_date,
       p.progress,
       p.created_at
     FROM projects p
     ${whereSql}
     ORDER BY p.updated_at DESC, p.id DESC`,
    params
  );

  return rows;
}

export async function getProjectDetail(user, projectId) {
  const context = await getAccessibleProject(pool, user, projectId);
  const logs = await getProjectLogsByProjectId(pool, projectId);
  const iterations = await getProjectIterationsByProjectId(pool, projectId);
  const milestones = await getProjectMilestonesByProjectId(pool, projectId);

  return {
    ...context.project,
    iterations,
    milestones,
    logs
  };
}

export async function updateProject(user, projectId, payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { project } = await getProjectPermissionContext(connection, projectId);

    if (!canUpdateProject(user, project)) {
      throw new HttpError(403, '只有管理员可以编辑项目');
    }

    const updates = [];
    const params = [];
    const changedFields = [];

    if (payload.projectName !== undefined) {
      const projectName = (payload.projectName || '').trim();
      if (!projectName) {
        throw new HttpError(400, '项目名称不能为空');
      }
      updates.push('project_name = ?');
      params.push(projectName);
      changedFields.push(`项目名称改为：${projectName}`);
    }

    if (payload.description !== undefined) {
      const description = typeof payload.description === 'string' ? payload.description.trim() : '';
      updates.push('description = ?');
      params.push(description || null);
      changedFields.push('更新项目描述');
    }

    if (payload.ownerUserId !== undefined) {
      const ownerUserId = Number(payload.ownerUserId);
      if (!Number.isInteger(ownerUserId) || ownerUserId <= 0) {
        throw new HttpError(400, '项目负责人不合法');
      }
      const owner = await getActiveUserById(connection, ownerUserId);
      updates.push('owner_user_id = ?', 'owner_name = ?');
      params.push(owner.id, owner.real_name);
      changedFields.push(`项目负责人改为：${owner.real_name}`);
    }

    if (payload.priority !== undefined) {
      assertProjectPriority(payload.priority);
      updates.push('priority = ?');
      params.push(payload.priority);
      changedFields.push(`项目优先级改为：${payload.priority}`);
    }

    if (payload.status !== undefined) {
      assertProjectStatus(payload.status);
      updates.push('status = ?');
      params.push(payload.status);
      changedFields.push(`项目状态改为：${payload.status}`);
    }

    if (payload.startDate !== undefined) {
      updates.push('start_date = ?');
      params.push(payload.startDate || null);
      changedFields.push('更新开始日期');
    }

    if (payload.endDate !== undefined) {
      updates.push('end_date = ?');
      params.push(payload.endDate || null);
      changedFields.push('更新结束日期');
    }

    if (payload.progress !== undefined) {
      const progress = normalizeProgress(payload.progress);
      updates.push('progress = ?');
      params.push(progress);
      changedFields.push(`项目进度改为：${progress}%`);
    }

    if (updates.length === 0) {
      throw new HttpError(400, '没有可更新的项目字段');
    }

    updates.push('updated_at = NOW()');
    params.push(projectId);

    await connection.query(
      `UPDATE projects
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );

    await writeProjectLog(connection, {
      projectId,
      operatorUserId: user.id,
      operatorName: user.realName,
      actionType: 'update',
      actionContent: changedFields.join('；')
    });

    await connection.commit();

    return getProjectBase(pool, projectId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function addProjectMember(user, projectId, payload) {
  const userId = Number(payload.userId);
  const roleInProject = (payload.roleInProject || '').trim();

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new HttpError(400, '项目成员不能为空');
  }

  if (!roleInProject) {
    throw new HttpError(400, '项目角色不能为空');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { project } = await getProjectPermissionContext(connection, projectId);

    if (!canAddProjectMember(user, project)) {
      throw new HttpError(403, '无权限添加项目成员');
    }

    const memberUser = await getActiveUserById(connection, userId);

    const [[existingMember]] = await connection.query(
      `SELECT id
       FROM project_members
       WHERE project_id = ?
         AND user_id = ?
       LIMIT 1`,
      [projectId, userId]
    );

    if (existingMember) {
      throw new HttpError(400, '该成员已在项目中');
    }

    const [result] = await connection.query(
      `INSERT INTO project_members
        (project_id, user_id, real_name, role_in_project, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [projectId, memberUser.id, memberUser.real_name, roleInProject]
    );

    await writeProjectLog(connection, {
      projectId,
      operatorUserId: user.id,
      operatorName: user.realName,
      actionType: 'add_member',
      actionContent: `添加项目成员：${memberUser.real_name}，项目角色：${roleInProject}`
    });

    await connection.commit();

    const [[createdMember]] = await pool.query(
      `SELECT
         id,
         project_id,
         user_id,
         real_name,
         role_in_project,
         created_at
       FROM project_members
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return createdMember;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getProjectMembers(user, projectId) {
  const context = await getAccessibleProject(pool, user, projectId);
  return context.members;
}

export async function getProjectTasks(user, projectId, query = {}) {
  return getProjectTasksFromTasksService(user, projectId, query);
}

export async function createProjectIteration(user, projectId, payload) {
  return createProjectIterationFromPlanningService(user, projectId, payload);
}

export async function getProjectIterations(user, projectId) {
  return getProjectIterationsFromPlanningService(user, projectId);
}

export async function createProjectMilestone(user, projectId, payload) {
  return createProjectMilestoneFromPlanningService(user, projectId, payload);
}

export async function getProjectMilestones(user, projectId) {
  return getProjectMilestonesFromPlanningService(user, projectId);
}
