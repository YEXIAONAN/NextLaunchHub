import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { deleteSshHostController, listSshHostsController, saveSshHostController } from '../controllers/webssh-controller.js';
const router = Router();
router.get('/hosts', asyncHandler(listSshHostsController));
router.post('/hosts', asyncHandler(saveSshHostController));
router.delete('/hosts/:id', asyncHandler(deleteSshHostController));
export default router;
