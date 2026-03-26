import { Router } from 'express';
import {
  createUserController,
  getUsersController,
  resetUserPasswordController,
  updateUserController
} from '../controllers/users-controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/http-error.js';

const router = Router();

router.get('/', asyncHandler(getUsersController));

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const realName = req.body.realName || req.body.real_name;
    const role = req.body.role;

    if (!username || !password || !realName || !role) {
      throw new HttpError(400, '用户名、密码、姓名和角色不能为空');
    }

    await createUserController(req, res);
  })
);

router.patch('/:id', asyncHandler(updateUserController));

router.patch(
  '/:id/reset-password',
  asyncHandler(async (req, res) => {
    if (!req.body.password) {
      throw new HttpError(400, '新密码不能为空');
    }

    await resetUserPasswordController(req, res);
  })
);

export default router;
