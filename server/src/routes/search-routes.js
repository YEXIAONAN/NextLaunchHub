import { Router } from 'express';
import { globalSearchController } from '../controllers/search-controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.get('/', asyncHandler(globalSearchController));
export default router;
