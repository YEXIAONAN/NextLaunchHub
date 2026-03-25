import { getOverview } from '../services/dashboard-service.js';
import { success } from '../utils/response.js';

export async function getDashboardOverviewController(req, res) {
  const data = await getOverview(req.user);
  res.json(success(data));
}
