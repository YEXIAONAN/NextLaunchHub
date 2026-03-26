import {
  createUser,
  getUsers,
  resetUserPassword,
  searchHelpers,
  searchRequesters,
  updateUser
} from '../services/users-service.js';
import { success } from '../utils/response.js';

export async function getRequestersController(req, res) {
  const data = await searchRequesters(req.query.keyword || '');
  res.json(success(data));
}

export async function getHelpersController(req, res) {
  const data = await searchHelpers(req.query.keyword || '');
  res.json(success(data));
}

export async function getUsersController(req, res) {
  const data = await getUsers(req.user, {
    keyword: req.query.keyword,
    role: req.query.role,
    status: req.query.status,
    page: req.query.page,
    pageSize: req.query.pageSize
  });

  res.json(success(data));
}

export async function createUserController(req, res) {
  const data = await createUser(req.user, {
    username: req.body.username,
    password: req.body.password,
    realName: req.body.realName || req.body.real_name,
    role: req.body.role,
    status: req.body.status
  });

  res.json(success(data, '用户创建成功'));
}

export async function updateUserController(req, res) {
  const data = await updateUser(req.user, Number(req.params.id), {
    realName: req.body.realName || req.body.real_name,
    role: req.body.role,
    status: req.body.status
  });

  res.json(success(data, '用户更新成功'));
}

export async function resetUserPasswordController(req, res) {
  const data = await resetUserPassword(req.user, Number(req.params.id), {
    password: req.body.password
  });

  res.json(success(data, '密码重置成功'));
}
