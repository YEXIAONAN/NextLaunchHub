import {
  createProjectIteration,
  createProjectMilestone,
  addProjectMember,
  createProject,
  getProjectDetail,
  getProjectIterations,
  getProjectMembers,
  getProjectMilestones,
  getProjectTasks,
  getProjects,
  updateProject
} from '../services/projects-service.js';
import { success } from '../utils/response.js';

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
