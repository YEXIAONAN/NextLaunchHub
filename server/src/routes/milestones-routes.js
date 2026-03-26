import { Router } from 'express';
import { updateMilestoneController } from '../controllers/project-planning-controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.patch('/:id', asyncHandler(updateMilestoneController));

export default router;
