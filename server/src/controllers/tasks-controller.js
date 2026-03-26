import {
  createTask,
  getProjectTasks,
  getTaskDetail,
  getTasks,
  updateTask,
  updateTaskStatus
} from '../services/tasks-service.js';
import { success } from '../utils/response.js';

export async function createTaskController(req, res) {
  const data = await createTask(req.user, {
    projectId: req.body.projectId || req.body.project_id,
    iterationId: req.body.iterationId || req.body.iteration_id,
    milestoneId: req.body.milestoneId || req.body.milestone_id,
    title: req.body.title,
    description: req.body.description,
    assigneeUserId: req.body.assigneeUserId || req.body.assignee_user_id,
    priority: req.body.priority,
    status: req.body.status,
    progress: req.body.progress,
    startDate: req.body.startDate || req.body.start_date,
    dueDate: req.body.dueDate || req.body.due_date,
    estimatedHours: req.body.estimatedHours || req.body.estimated_hours,
    actualHours: req.body.actualHours || req.body.actual_hours
  });

  res.json(success(data, '任务创建成功'));
}

export async function getTasksController(req, res) {
  const data = await getTasks(req.user, {
    projectId: req.query.projectId || req.query.project_id,
    keyword: req.query.keyword,
    status: req.query.status,
    priority: req.query.priority,
    assigneeUserId: req.query.assigneeUserId || req.query.assignee_user_id,
    page: req.query.page,
    pageSize: req.query.pageSize
  });

  res.json(success(data));
}

export async function getTaskDetailController(req, res) {
  const data = await getTaskDetail(req.user, Number(req.params.id));
  res.json(success(data));
}

export async function updateTaskController(req, res) {
  const data = await updateTask(req.user, Number(req.params.id), {
    iterationId: req.body.iterationId || req.body.iteration_id,
    milestoneId: req.body.milestoneId || req.body.milestone_id,
    title: req.body.title,
    description: req.body.description,
    assigneeUserId: req.body.assigneeUserId || req.body.assignee_user_id,
    priority: req.body.priority,
    status: req.body.status,
    progress: req.body.progress,
    startDate: req.body.startDate || req.body.start_date,
    dueDate: req.body.dueDate || req.body.due_date,
    estimatedHours: req.body.estimatedHours || req.body.estimated_hours,
    actualHours: req.body.actualHours || req.body.actual_hours
  });

  res.json(success(data, '任务更新成功'));
}

export async function updateTaskStatusController(req, res) {
  const data = await updateTaskStatus(
    req.user,
    Number(req.params.id),
    req.body.status
  );

  res.json(success(data, '任务状态更新成功'));
}

export async function getProjectTasksController(req, res) {
  const data = await getProjectTasks(req.user, Number(req.params.id), {
    keyword: req.query.keyword,
    status: req.query.status,
    priority: req.query.priority,
    assigneeUserId: req.query.assigneeUserId || req.query.assignee_user_id,
    page: req.query.page,
    pageSize: req.query.pageSize
  });

  res.json(success(data));
}
