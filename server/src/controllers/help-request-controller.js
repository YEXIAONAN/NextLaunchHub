import {
  createHelpRequest,
  getHelpRequestDetail,
  getHelpRequests,
  updateHelpRequestStatus
} from '../services/help-request-service.js';
import { getClientIp } from '../utils/request-ip.js';
import { success } from '../utils/response.js';

export async function createHelpRequestController(req, res) {
  const payload = {
    title: req.body.title,
    requesterUserId: req.body.requesterUserId,
    helperUserId: req.body.helperUserId,
    content: req.body.content,
    requesterIp: getClientIp(req)
  };
  const data = await createHelpRequest(payload);
  res.json(success(data, '提交成功'));
}

export async function getHelpRequestsController(req, res) {
  const data = await getHelpRequests(req.user, req.query.status || '');
  res.json(success(data));
}

export async function getHelpRequestDetailController(req, res) {
  const data = await getHelpRequestDetail(req.user, Number(req.params.id));
  res.json(success(data));
}

export async function updateHelpRequestStatusController(req, res) {
  const data = await updateHelpRequestStatus(req.user, Number(req.params.id), req.body.status);
  res.json(success(data, '状态更新成功'));
}
