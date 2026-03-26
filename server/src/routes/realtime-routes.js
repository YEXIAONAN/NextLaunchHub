import { Router } from 'express';
import { getOnlineUsersController } from '../controllers/realtime-controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/online-users', asyncHandler(getOnlineUsersController));

export default router;
