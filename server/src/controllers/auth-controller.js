import { login } from '../services/auth-service.js';
import { clearAuthCookie, setAuthCookie } from '../utils/auth-session.js';
import { success } from '../utils/response.js';

export async function loginController(req, res) {
  const data = await login(req.body);
  setAuthCookie(res, data.token);
  res.json(success({ user: data.user }));
}

export function currentUserController(req, res) {
  res.json(success({ user: req.user }));
}

export function logoutController(_req, res) {
  clearAuthCookie(res);
  res.json(success(null, '已退出登录'));
}
