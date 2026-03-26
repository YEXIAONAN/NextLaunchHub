import { Router } from 'express';
import { getDictionariesController } from '../controllers/dictionaries-controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/', asyncHandler(getDictionariesController));

export default router;
