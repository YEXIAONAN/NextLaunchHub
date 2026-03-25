import { Router } from 'express';
import {
  addHelpRequestAssistantController,
  addHelpRequestCollaborationLogController,
  getHelpRequestAssistantsController,
  getHelpRequestDetailController,
  getHelpRequestsController,
  updateHelpRequestStatusController
} from '../controllers/help-request-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();

router.get('/', asyncHandler(getHelpRequestsController));
router.get('/:id', asyncHandler(getHelpRequestDetailController));
router.get('/:id/assistants', asyncHandler(getHelpRequestAssistantsController));

router.post(
  '/:id/assistants',
  asyncHandler(async (req, res) => {
    const assistantUserId = req.body.assistantUserId || req.body.assistant_user_id;
    if (!assistantUserId) {
      throw new HttpError(400, '协同人员不能为空');
    }
    await addHelpRequestAssistantController(req, res);
  })
);

router.post(
  '/:id/collaboration-log',
  asyncHandler(async (req, res) => {
    const content = (req.body.content || '').trim();
    if (!content) {
      throw new HttpError(400, '协同处理说明不能为空');
    }
    await addHelpRequestCollaborationLogController(req, res);
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const status = req.body.status || req.body.current_status;
    if (!status) {
      throw new HttpError(400, '状态不能为空');
    }
    await updateHelpRequestStatusController(req, res);
  })
);

export default router;
