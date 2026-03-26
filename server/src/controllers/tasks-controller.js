import {
  createTask,
  exportTasks,
  getProjectTasks,
  getTaskDetail,
  getTasks,
  updateTask,
  updateTaskStatus
} from '../services/tasks-service.js';
import { buildExportFileName, sendExcelFile } from '../utils/excel-export.js';
import { success } from '../utils/response.js';

const TASK_STATUS_TEXT_MAP = {
  todo: '待开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
  cancelled: '已取消'
};

const TASK_PRIORITY_TEXT_MAP = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
};

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

export async function exportTasksController(req, res) {
  const rows = await exportTasks(req.user, {
    projectId: req.query.projectId || req.query.project_id,
    keyword: req.query.keyword,
    status: req.query.status,
    priority: req.query.priority,
    assigneeUserId: req.query.assigneeUserId || req.query.assignee_user_id
  });

  sendExcelFile(res, {
    fileName: buildExportFileName('任务列表'),
    sheetName: '任务列表',
    columns: [
      { header: '任务编号', value: 'task_code' },
      { header: '项目编号', value: 'project_code' },
      { header: '项目名称', value: 'project_name' },
      { header: '任务标题', value: 'title' },
      { header: '负责人', value: (row) => row.assignee_name || '' },
      { header: '优先级', value: (row) => TASK_PRIORITY_TEXT_MAP[row.priority] || row.priority },
      { header: '状态', value: (row) => TASK_STATUS_TEXT_MAP[row.status] || row.status },
      { header: '进度(%)', value: 'progress' },
      { header: '开始日期', value: (row) => row.start_date || '' },
      { header: '截止日期', value: (row) => row.due_date || '' },
      { header: '预计工时', value: (row) => row.estimated_hours ?? '' },
      { header: '实际工时', value: (row) => row.actual_hours ?? '' },
      { header: '创建时间', value: (row) => row.created_at || '' }
    ],
    rows
  });
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
