import { Router } from 'express';
import { updateIterationController } from '../controllers/project-planning-controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.patch('/:id', asyncHandler(updateIterationController));

export default router;
