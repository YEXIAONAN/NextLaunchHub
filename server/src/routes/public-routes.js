import { Router } from 'express';
import {
  createHelpRequestController
} from '../controllers/help-request-controller.js';
import {
  getHelpersController,
  getRequestersController
} from '../controllers/users-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();

router.get('/requesters', asyncHandler(getRequestersController));
router.get('/helpers', asyncHandler(getHelpersController));

router.post(
  '/help-requests',
  asyncHandler(async (req, res) => {
    const title = req.body.title;
    const requesterUserId = req.body.requesterUserId || req.body.requester_user_id;
    const helperUserId = req.body.helperUserId || req.body.helper_user_id;
    const content = req.body.content;

    if (!title || !requesterUserId || !helperUserId || !content) {
      throw new HttpError(400, '请完整填写求助信息');
    }

    await createHelpRequestController(req, res);
  })
);

export default router;
