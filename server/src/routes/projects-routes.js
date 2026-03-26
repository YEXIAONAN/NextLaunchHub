import { Router } from 'express';
import {
  addProjectMemberController,
  createProjectIterationController,
  createProjectMilestoneController,
  createProjectController,
  exportProjectsController,
  getProjectDetailController,
  getProjectIterationsController,
  getProjectMembersController,
  getProjectMilestonesController,
  getProjectTasksController,
  getProjectsController,
  updateProjectController
} from '../controllers/projects-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();

router.get('/', asyncHandler(getProjectsController));
router.get('/export', asyncHandler(exportProjectsController));
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const projectName = req.body.projectName || req.body.project_name;
    const ownerUserId = req.body.ownerUserId || req.body.owner_user_id;

    if (!projectName || !ownerUserId) {
      throw new HttpError(400, '项目名称和项目负责人不能为空');
    }

    await createProjectController(req, res);
  })
);

router.get('/:id', asyncHandler(getProjectDetailController));
router.patch('/:id', asyncHandler(updateProjectController));
router.get('/:id/tasks', asyncHandler(getProjectTasksController));
router.get('/:id/iterations', asyncHandler(getProjectIterationsController));
router.post(
  '/:id/iterations',
  asyncHandler(async (req, res) => {
    const iterationName = req.body.iterationName || req.body.iteration_name;

    if (!iterationName) {
      throw new HttpError(400, '迭代名称不能为空');
    }

    await createProjectIterationController(req, res);
  })
);
router.get('/:id/milestones', asyncHandler(getProjectMilestonesController));
router.post(
  '/:id/milestones',
  asyncHandler(async (req, res) => {
    const milestoneName = req.body.milestoneName || req.body.milestone_name;

    if (!milestoneName) {
      throw new HttpError(400, '里程碑名称不能为空');
    }

    await createProjectMilestoneController(req, res);
  })
);
router.get('/:id/members', asyncHandler(getProjectMembersController));
router.post(
  '/:id/members',
  asyncHandler(async (req, res) => {
    const userId = req.body.userId || req.body.user_id;
    const roleInProject = req.body.roleInProject || req.body.role_in_project;

    if (!userId || !roleInProject) {
      throw new HttpError(400, '项目成员和项目角色不能为空');
    }

    await addProjectMemberController(req, res);
  })
);

export default router;
