import { Router } from 'express';
import {
  createTaskController,
  getTaskDetailController,
  getTasksController,
  updateTaskController,
  updateTaskStatusController
} from '../controllers/tasks-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();

router.get('/', asyncHandler(getTasksController));
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const projectId = req.body.projectId || req.body.project_id;
    const title = req.body.title;

    if (!projectId || !title) {
      throw new HttpError(400, '项目ID和任务标题不能为空');
    }

    await createTaskController(req, res);
  })
);
router.get('/:id', asyncHandler(getTaskDetailController));
router.patch('/:id', asyncHandler(updateTaskController));
router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    if (!req.body.status) {
      throw new HttpError(400, '任务状态不能为空');
    }

    await updateTaskStatusController(req, res);
  })
);

export default router;
