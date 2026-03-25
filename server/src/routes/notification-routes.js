import { Router } from 'express';
import {
  getNotificationsController,
  getUnreadNotificationCountController,
  markAllNotificationsReadController,
  markNotificationReadController
} from '../controllers/notification-controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/', asyncHandler(getNotificationsController));
router.get('/unread-count', asyncHandler(getUnreadNotificationCountController));
router.patch('/read-all', asyncHandler(markAllNotificationsReadController));
router.patch('/:id/read', asyncHandler(markNotificationReadController));

export default router;
