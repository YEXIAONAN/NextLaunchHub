import { Router } from 'express';
import {
  createHelpRequestController,
  publicConfirmHelpRequestController,
  queryPublicHelpRequestController
} from '../controllers/help-request-controller.js';
import {
  getPublicProjectsController,
  getPublicProjectTasksController
} from '../controllers/projects-controller.js';
import {
  getHelpersController,
  getRequestersController
} from '../controllers/users-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';
import { createRateLimit } from '../middleware/rate-limit.js';

const router = Router();
const publicReadRateLimit = createRateLimit({ windowMs: 60 * 1000, max: 60 });
const publicWriteRateLimit = createRateLimit({ windowMs: 10 * 60 * 1000, max: 10 });

router.use(publicReadRateLimit);
router.get('/requesters', asyncHandler(getRequestersController));
router.get('/helpers', asyncHandler(getHelpersController));
router.get('/projects', asyncHandler(getPublicProjectsController));
router.get('/projects/:id/tasks', asyncHandler(getPublicProjectTasksController));
router.get('/help-requests/query', asyncHandler(queryPublicHelpRequestController));

router.post(
  '/help-requests',
  publicWriteRateLimit,
  asyncHandler(async (req, res) => {
    const title = req.body.title;
    const requesterUserId = req.body.requesterUserId || req.body.requester_user_id;
    const helperUserId = req.body.helperUserId || req.body.helper_user_id;
    const helperUserIds = req.body.helperUserIds || req.body.helper_user_ids;
    const content = req.body.content;

    const hasHelpers = Array.isArray(helperUserIds) ? helperUserIds.length > 0 : Boolean(helperUserId);

    if (!title || !requesterUserId || !hasHelpers || !content) {
      throw new HttpError(400, '请完整填写求助信息');
    }

    await createHelpRequestController(req, res);
  })
);

router.post(
  '/help-requests/:id/confirm',
  publicWriteRateLimit,
  asyncHandler(async (req, res) => {
    const action = req.body.action;

    if (!action) {
      throw new HttpError(400, '操作类型不能为空');
    }

    if (!['confirm', 'reject'].includes(action)) {
      throw new HttpError(400, '操作类型不合法');
    }

    await publicConfirmHelpRequestController(req, res);
  })
);

export default router;
