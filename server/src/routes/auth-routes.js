import { Router } from 'express';
import { currentUserController, loginController, logoutController } from '../controllers/auth-controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { createRateLimit } from '../middleware/rate-limit.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();
const loginRateLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post(
  '/login',
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new HttpError(400, '用户名和密码不能为空');
    }
    await loginController(req, res);
  })
);

router.get('/me', authMiddleware, currentUserController);
router.post('/logout', logoutController);

export default router;
