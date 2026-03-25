import { Router } from 'express';
import {
  getHelpRequestDetailController,
  getHelpRequestsController,
  updateHelpRequestStatusController
} from '../controllers/help-request-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();

router.get('/', asyncHandler(getHelpRequestsController));
router.get('/:id', asyncHandler(getHelpRequestDetailController));

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
