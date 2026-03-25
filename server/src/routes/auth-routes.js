import { Router } from 'express';
import { loginController } from '../controllers/auth-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new HttpError(400, '用户名和密码不能为空');
    }
    await loginController(req, res);
  })
);

export default router;
