import { login } from '../services/auth-service.js';
import { clearAuthCookie, setAuthCookie } from '../utils/auth-session.js';
import { success } from '../utils/response.js';
import { writeAuditLog } from '../services/audit-service.js';
import { getClientIp } from '../utils/request-ip.js';

export async function loginController(req, res) {
  const data = await login(req.body);
  setAuthCookie(res, data.token);
  await writeAuditLog({ actorUserId: data.user.id, action: 'auth.login', targetType: 'user', targetId: data.user.id, summary: '登录成功', ip: getClientIp(req) });
  res.json(success({ user: data.user }));
}

export function currentUserController(req, res) {
  res.json(success({ user: req.user }));
}

export async function logoutController(req, res) {
  if (req.user) await writeAuditLog({ actorUserId: req.user.id, action: 'auth.logout', targetType: 'user', targetId: req.user.id, summary: '退出登录', ip: getClientIp(req) });
  clearAuthCookie(res);
  res.json(success(null, '已退出登录'));
}
