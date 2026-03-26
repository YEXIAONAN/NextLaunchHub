import {
  createProjectIteration,
  createProjectMilestone,
  getProjectIterations,
  getProjectMilestones,
  updateIteration,
  updateMilestone
} from '../services/project-planning-service.js';
import { success } from '../utils/response.js';

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

export async function updateIterationController(req, res) {
  const data = await updateIteration(req.user, Number(req.params.id), {
    iterationName: req.body.iterationName || req.body.iteration_name,
    goal: req.body.goal,
    status: req.body.status,
    startDate: req.body.startDate || req.body.start_date,
    endDate: req.body.endDate || req.body.end_date
  });

  res.json(success(data, '项目迭代更新成功'));
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

export async function updateMilestoneController(req, res) {
  const data = await updateMilestone(req.user, Number(req.params.id), {
    milestoneName: req.body.milestoneName || req.body.milestone_name,
    description: req.body.description,
    status: req.body.status,
    dueDate: req.body.dueDate || req.body.due_date
  });

  res.json(success(data, '项目里程碑更新成功'));
}
