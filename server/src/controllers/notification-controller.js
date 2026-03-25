import {
  getNotificationsByUser,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead
} from '../services/notification-service.js';
import { success } from '../utils/response.js';

export async function getNotificationsController(req, res) {
  const data = await getNotificationsByUser(req.user, {
    page: req.query.page,
    pageSize: req.query.pageSize,
    isRead: req.query.isRead,
    type: req.query.type
  });
  res.json(success(data));
}

export async function markNotificationReadController(req, res) {
  const data = await markNotificationRead(req.user, Number(req.params.id));
  res.json(success(data, '标记已读成功'));
}

export async function markAllNotificationsReadController(req, res) {
  const data = await markAllNotificationsRead(req.user);
  res.json(success(data, '全部标记已读成功'));
}

export async function getUnreadNotificationCountController(req, res) {
  const data = await getUnreadNotificationCount(req.user);
  res.json(success(data));
}
