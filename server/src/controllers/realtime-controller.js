import { getRealtimeSnapshot } from '../realtime/socket-server.js';
import { HttpError } from '../utils/http-error.js';
import { success } from '../utils/response.js';

export async function getOnlineUsersController(req, res) {
  if (req.user?.role !== 'admin') {
    throw new HttpError(403, '仅管理员可查看在线连接信息');
  }

  res.json(success(getRealtimeSnapshot()));
}
