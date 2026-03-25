import { Router } from 'express';
import { getNotificationsController } from '../controllers/notification-controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/', asyncHandler(getNotificationsController));

export default router;
