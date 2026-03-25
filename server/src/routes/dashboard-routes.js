import { Router } from 'express';
import { getDashboardOverviewController } from '../controllers/dashboard-controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/overview', asyncHandler(getDashboardOverviewController));

export default router;
