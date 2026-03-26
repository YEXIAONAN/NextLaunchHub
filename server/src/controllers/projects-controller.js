import {
  createProjectIteration,
  createProjectMilestone,
  addProjectMember,
  createProject,
  exportProjects,
  getProjectDetail,
  getProjectIterations,
  getProjectMembers,
  getProjectMilestones,
  getPublicProjects,
  getPublicProjectTasks,
  getProjectTasks,
  getProjects,
  updateProject
} from '../services/projects-service.js';
import { buildExportFileName, sendExcelFile } from '../utils/excel-export.js';
import { success } from '../utils/response.js';

const PROJECT_STATUS_TEXT_MAP = {
  not_started: '未开始',
  in_progress: '进行中',
  paused: '已暂停',
  completed: '已完成',
  archived: '已归档'
};

const PROJECT_PRIORITY_TEXT_MAP = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
};

export async function createProjectController(req, res) {
  const data = await createProject(req.user, {
    projectName: req.body.projectName || req.body.project_name,
    description: req.body.description,
    ownerUserId: req.body.ownerUserId || req.body.owner_user_id,
    priority: req.body.priority,
    status: req.body.status,
    startDate: req.body.startDate || req.body.start_date,
    endDate: req.body.endDate || req.body.end_date,
    progress: req.body.progress
  });
  res.json(success(data, '项目创建成功'));
}

export async function getProjectsController(req, res) {
  const data = await getProjects(req.user, {
    keyword: req.query.keyword,
    status: req.query.status,
    priority: req.query.priority,
    page: req.query.page,
    pageSize: req.query.pageSize
  });
  res.json(success(data));
}

export async function getPublicProjectsController(req, res) {
  const data = await getPublicProjects({
    keyword: req.query.keyword,
    status: req.query.status,
    priority: req.query.priority,
    page: req.query.page,
    pageSize: req.query.pageSize
  });
  res.json(success(data));
}

export async function exportProjectsController(req, res) {
  const rows = await exportProjects(req.user, {
    keyword: req.query.keyword,
    status: req.query.status,
    priority: req.query.priority
  });

  sendExcelFile(res, {
    fileName: buildExportFileName('项目列表'),
    sheetName: '项目列表',
    columns: [
      { header: '项目编号', value: 'project_code' },
      { header: '项目名称', value: 'project_name' },
      { header: '项目负责人', value: 'owner_name' },
      { header: '优先级', value: (row) => PROJECT_PRIORITY_TEXT_MAP[row.priority] || row.priority },
      { header: '状态', value: (row) => PROJECT_STATUS_TEXT_MAP[row.status] || row.status },
      { header: '开始日期', value: (row) => row.start_date || '' },
      { header: '结束日期', value: (row) => row.end_date || '' },
      { header: '进度(%)', value: 'progress' },
      { header: '创建时间', value: (row) => row.created_at || '' }
    ],
    rows
  });
}

export async function getProjectDetailController(req, res) {
  const data = await getProjectDetail(req.user, Number(req.params.id));
  res.json(success(data));
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

export async function getPublicProjectTasksController(req, res) {
  const data = await getPublicProjectTasks(Number(req.params.id), {
    keyword: req.query.keyword,
    status: req.query.status,
    priority: req.query.priority,
    assigneeUserId: req.query.assigneeUserId || req.query.assignee_user_id,
    page: req.query.page,
    pageSize: req.query.pageSize
  });
  res.json(success(data));
}

export async function createProjectIterationController(req, res) {
  const data = await createProjectIteration(req.user, Number(req.params.id), {
    iterationName: req.body.iterationName || req.body.iteration_name,
    goal: req.body.goal,
    status: req.body.status,
    startDate: req.body.startDate || req.body.start_date,
    endDate: req.body.endDate || req.body.end_date
  });

  res.json(success(data, '项目迭代创建成功'));
}

export async function getProjectIterationsController(req, res) {
  const data = await getProjectIterations(req.user, Number(req.params.id));
  res.json(success(data));
}

export async function createProjectMilestoneController(req, res) {
  const data = await createProjectMilestone(req.user, Number(req.params.id), {
    milestoneName: req.body.milestoneName || req.body.milestone_name,
    description: req.body.description,
    status: req.body.status,
    dueDate: req.body.dueDate || req.body.due_date
  });

  res.json(success(data, '项目里程碑创建成功'));
}

export async function getProjectMilestonesController(req, res) {
  const data = await getProjectMilestones(req.user, Number(req.params.id));
  res.json(success(data));
}

export async function updateProjectController(req, res) {
  const data = await updateProject(req.user, Number(req.params.id), {
    projectName: req.body.projectName || req.body.project_name,
    description: req.body.description,
    ownerUserId: req.body.ownerUserId || req.body.owner_user_id,
    priority: req.body.priority,
    status: req.body.status,
    startDate: req.body.startDate || req.body.start_date,
    endDate: req.body.endDate || req.body.end_date,
    progress: req.body.progress
  });
  res.json(success(data, '项目更新成功'));
}

export async function addProjectMemberController(req, res) {
  const data = await addProjectMember(req.user, Number(req.params.id), {
    userId: req.body.userId || req.body.user_id,
    roleInProject: req.body.roleInProject || req.body.role_in_project
  });
  res.json(success(data, '项目成员添加成功'));
}

export async function getProjectMembersController(req, res) {
  const data = await getProjectMembers(req.user, Number(req.params.id));
  res.json(success(data));
}
