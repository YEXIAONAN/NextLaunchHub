import { getNotificationsByUser } from '../services/notification-service.js';
import { success } from '../utils/response.js';

export async function getNotificationsController(req, res) {
  const data = await getNotificationsByUser(req.user);
  res.json(success(data));
}
