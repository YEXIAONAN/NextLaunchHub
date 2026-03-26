import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http-error.js';
import { canCreateTask, canViewProject } from '../utils/permission.js';

const ITERATION_STATUS = ['not_started', 'in_progress', 'completed', 'paused'];
const MILESTONE_STATUS = ['pending', 'in_progress', 'completed', 'delayed'];

function assertIterationStatus(status) {
  if (status !== undefined && status !== null && status !== '' && !ITERATION_STATUS.includes(status)) {
    throw new HttpError(400, '迭代状态值不合法');
  }
}

function assertMilestoneStatus(status) {
  if (status !== undefined && status !== null && status !== '' && !MILESTONE_STATUS.includes(status)) {
    throw new HttpError(400, '里程碑状态值不合法');
  }
}

async function getProjectBase(executor, projectId) {
  const [rows] = await executor.query(
    `SELECT
       p.id,
       p.owner_user_id
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

async function getManageableProject(executor, user, projectId) {
  const { project } = await getAccessibleProject(executor, user, projectId);

  if (!canCreateTask(user, project)) {
    throw new HttpError(403, '无权限操作当前项目的规划信息');
  }

  return project;
}

async function getIterationBase(executor, iterationId) {
  const [rows] = await executor.query(
    `SELECT
       id,
       project_id,
       iteration_name,
       goal,
       status,
       start_date,
       end_date,
       created_at,
       updated_at
     FROM project_iterations
     WHERE id = ?
     LIMIT 1`,
    [iterationId]
  );

  if (rows.length === 0) {
    throw new HttpError(404, '迭代不存在');
  }

  return rows[0];
}

async function getMilestoneBase(executor, milestoneId) {
  const [rows] = await executor.query(
    `SELECT
       id,
       project_id,
       milestone_name,
       description,
       status,
       due_date,
       completed_at,
       created_at,
       updated_at
     FROM project_milestones
     WHERE id = ?
     LIMIT 1`,
    [milestoneId]
  );

  if (rows.length === 0) {
    throw new HttpError(404, '里程碑不存在');
  }

  return rows[0];
}

export async function getProjectIterationsByProjectId(executor, projectId) {
  const [rows] = await executor.query(
    `SELECT
       id,
       project_id,
       iteration_name,
       goal,
       status,
       start_date,
       end_date,
       created_at,
       updated_at
     FROM project_iterations
     WHERE project_id = ?
     ORDER BY start_date ASC, created_at ASC, id ASC`,
    [projectId]
  );

  return rows;
}

export async function getProjectMilestonesByProjectId(executor, projectId) {
  const [rows] = await executor.query(
    `SELECT
       id,
       project_id,
       milestone_name,
       description,
       status,
       due_date,
       completed_at,
       created_at,
       updated_at
     FROM project_milestones
     WHERE project_id = ?
     ORDER BY due_date ASC, created_at ASC, id ASC`,
    [projectId]
  );

  return rows;
}

export async function validateTaskPlanningBindings(executor, projectId, iterationIdInput, milestoneIdInput) {
  const iterationId = iterationIdInput === undefined || iterationIdInput === null || iterationIdInput === ''
    ? null
    : Number(iterationIdInput);
  const milestoneId = milestoneIdInput === undefined || milestoneIdInput === null || milestoneIdInput === ''
    ? null
    : Number(milestoneIdInput);

  if (iterationId !== null && (!Number.isInteger(iterationId) || iterationId <= 0)) {
    throw new HttpError(400, '迭代ID不合法');
  }

  if (milestoneId !== null && (!Number.isInteger(milestoneId) || milestoneId <= 0)) {
    throw new HttpError(400, '里程碑ID不合法');
  }

  if (iterationId !== null) {
    const iteration = await getIterationBase(executor, iterationId);
    if (Number(iteration.project_id) !== Number(projectId)) {
      throw new HttpError(400, '所选迭代不属于当前项目');
    }
  }

  if (milestoneId !== null) {
    const milestone = await getMilestoneBase(executor, milestoneId);
    if (Number(milestone.project_id) !== Number(projectId)) {
      throw new HttpError(400, '所选里程碑不属于当前项目');
    }
  }

  return {
    iterationId,
    milestoneId
  };
}

export async function createProjectIteration(user, projectId, payload) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new HttpError(400, '项目ID不合法');
  }

  const iterationName = (payload.iterationName || '').trim();
  const goal = typeof payload.goal === 'string' ? payload.goal.trim() : '';
  const status = payload.status || 'not_started';
  const startDate = payload.startDate || null;
  const endDate = payload.endDate || null;

  if (!iterationName) {
    throw new HttpError(400, '迭代名称不能为空');
  }

  assertIterationStatus(status);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await getManageableProject(connection, user, projectId);

    const [result] = await connection.query(
      `INSERT INTO project_iterations
        (project_id, iteration_name, goal, status, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [projectId, iterationName, goal || null, status, startDate, endDate]
    );

    await connection.commit();

    return getIterationBase(pool, result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getProjectIterations(user, projectId) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new HttpError(400, '项目ID不合法');
  }

  await getAccessibleProject(pool, user, projectId);
  return getProjectIterationsByProjectId(pool, projectId);
}

export async function updateIteration(user, iterationId, payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const iteration = await getIterationBase(connection, iterationId);
    await getManageableProject(connection, user, Number(iteration.project_id));

    const updates = [];
    const params = [];

    if (payload.iterationName !== undefined) {
      const iterationName = (payload.iterationName || '').trim();
      if (!iterationName) {
        throw new HttpError(400, '迭代名称不能为空');
      }
      updates.push('iteration_name = ?');
      params.push(iterationName);
    }

    if (payload.goal !== undefined) {
      const goal = typeof payload.goal === 'string' ? payload.goal.trim() : '';
      updates.push('goal = ?');
      params.push(goal || null);
    }

    if (payload.status !== undefined) {
      assertIterationStatus(payload.status);
      updates.push('status = ?');
      params.push(payload.status);
    }

    if (payload.startDate !== undefined) {
      updates.push('start_date = ?');
      params.push(payload.startDate || null);
    }

    if (payload.endDate !== undefined) {
      updates.push('end_date = ?');
      params.push(payload.endDate || null);
    }

    if (updates.length === 0) {
      throw new HttpError(400, '没有可更新的迭代字段');
    }

    updates.push('updated_at = NOW()');
    params.push(iterationId);

    await connection.query(
      `UPDATE project_iterations
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );

    await connection.commit();

    return getIterationBase(pool, iterationId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createProjectMilestone(user, projectId, payload) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new HttpError(400, '项目ID不合法');
  }

  const milestoneName = (payload.milestoneName || '').trim();
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const status = payload.status || 'pending';
  const dueDate = payload.dueDate || null;

  if (!milestoneName) {
    throw new HttpError(400, '里程碑名称不能为空');
  }

  assertMilestoneStatus(status);

  const completedAt = status === 'completed' ? new Date() : null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await getManageableProject(connection, user, projectId);

    const [result] = await connection.query(
      `INSERT INTO project_milestones
        (
          project_id, milestone_name, description, status,
          due_date, completed_at, created_at, updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [projectId, milestoneName, description || null, status, dueDate, completedAt]
    );

    await connection.commit();

    return getMilestoneBase(pool, result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getProjectMilestones(user, projectId) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new HttpError(400, '项目ID不合法');
  }

  await getAccessibleProject(pool, user, projectId);
  return getProjectMilestonesByProjectId(pool, projectId);
}

export async function updateMilestone(user, milestoneId, payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const milestone = await getMilestoneBase(connection, milestoneId);
    await getManageableProject(connection, user, Number(milestone.project_id));

    const updates = [];
    const params = [];

    if (payload.milestoneName !== undefined) {
      const milestoneName = (payload.milestoneName || '').trim();
      if (!milestoneName) {
        throw new HttpError(400, '里程碑名称不能为空');
      }
      updates.push('milestone_name = ?');
      params.push(milestoneName);
    }

    if (payload.description !== undefined) {
      const description = typeof payload.description === 'string' ? payload.description.trim() : '';
      updates.push('description = ?');
      params.push(description || null);
    }

    if (payload.status !== undefined) {
      assertMilestoneStatus(payload.status);
      updates.push('status = ?');
      params.push(payload.status);
      updates.push('completed_at = ?');
      params.push(payload.status === 'completed' ? new Date() : null);
    }

    if (payload.dueDate !== undefined) {
      updates.push('due_date = ?');
      params.push(payload.dueDate || null);
    }

    if (updates.length === 0) {
      throw new HttpError(400, '没有可更新的里程碑字段');
    }

    updates.push('updated_at = NOW()');
    params.push(milestoneId);

    await connection.query(
      `UPDATE project_milestones
       SET ${updates.join(', ')}
       WHERE id = ?`,
      params
    );

    await connection.commit();

    return getMilestoneBase(pool, milestoneId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
