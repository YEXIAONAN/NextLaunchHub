import {
  addHelpRequestAssistant,
  addHelpRequestCollaborationLog,
  checkHelpRequestTimeouts,
  createHelpRequest,
  getHelpRequestAssistants,
  getHelpRequestDetail,
  getHelpRequests,
  publicConfirmHelpRequest,
  queryPublicHelpRequest,
  reassignHelpRequestHelper,
  updateHelpRequestStatus
} from '../services/help-request-service.js';
import {
  clearPublicHelpRequestAccessCookie,
  getPublicHelpRequestAccessPayload,
  setPublicHelpRequestAccessCookie
} from '../utils/public-help-request-access.js';
import { getClientIp } from '../utils/request-ip.js';
import { HttpError } from '../utils/http-error.js';
import { success } from '../utils/response.js';

export async function createHelpRequestController(req, res) {
  const payload = {
    title: req.body.title,
    requesterUserId: req.body.requesterUserId || req.body.requester_user_id,
    helperUserId: req.body.helperUserId || req.body.helper_user_id,
    projectId: req.body.projectId || req.body.project_id,
    taskId: req.body.taskId || req.body.task_id,
    content: req.body.content,
    requesterIp: getClientIp(req)
  };
  const data = await createHelpRequest(payload);
  res.json(success(data, '提交成功'));
}

export async function getHelpRequestsController(req, res) {
  const data = await getHelpRequests(req.user, {
    status: req.query.status || req.query.current_status || '',
    projectId: req.query.projectId || req.query.project_id,
    taskId: req.query.taskId || req.query.task_id
  });
  res.json(success(data));
}

export async function getHelpRequestDetailController(req, res) {
  const data = await getHelpRequestDetail(req.user, Number(req.params.id));
  res.json(success(data));
}

export async function updateHelpRequestStatusController(req, res) {
  const data = await updateHelpRequestStatus(
    req.user,
    Number(req.params.id),
    req.body.status || req.body.current_status
  );
  res.json(success(data, '状态更新成功'));
}

export async function reassignHelpRequestHelperController(req, res) {
  const data = await reassignHelpRequestHelper(req.user, Number(req.params.id), {
    helperUserId: req.body.helperUserId || req.body.helper_user_id
  });
  res.json(success(data, '改派帮助人员成功'));
}

export async function getHelpRequestAssistantsController(req, res) {
  const data = await getHelpRequestAssistants(req.user, Number(req.params.id));
  res.json(success(data));
}

export async function addHelpRequestAssistantController(req, res) {
  const data = await addHelpRequestAssistant(req.user, Number(req.params.id), {
    assistantUserId: req.body.assistantUserId || req.body.assistant_user_id
  });
  res.json(success(data, '协同人员添加成功'));
}

export async function addHelpRequestCollaborationLogController(req, res) {
  const data = await addHelpRequestCollaborationLog(req.user, Number(req.params.id), {
    content: req.body.content
  });
  res.json(success(data, '协同处理日志提交成功'));
}

export async function checkHelpRequestTimeoutController(req, res) {
  const data = await checkHelpRequestTimeouts(req.user);
  res.json(success(data, '超时检查完成'));
}

export async function queryPublicHelpRequestController(req, res) {
  const requestNo = (req.query.requestNo || req.query.request_no || '').trim();
  const requesterName = (req.query.requesterName || req.query.requester_name || '').trim();

  if (!requestNo || !requesterName) {
    throw new HttpError(400, '请填写求助单号和发起人姓名');
  }

  const data = await queryPublicHelpRequest({
    requestNo,
    requesterName
  });

  setPublicHelpRequestAccessCookie(res, {
    helpRequestId: data.id,
    requestNo: data.request_no,
    requesterName: data.requester_name
  });

  res.json(success(data));
}

export async function publicConfirmHelpRequestController(req, res) {
  const action = (req.body.action || '').trim();
  const feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() : '';
  const accessPayload = getPublicHelpRequestAccessPayload(req);

  if (!accessPayload) {
    throw new HttpError(403, '请先通过求助单号和发起人姓名完成查询后再操作');
  }

  const data = await publicConfirmHelpRequest({
    id: Number(req.params.id),
    action,
    feedback,
    accessPayload
  });

  clearPublicHelpRequestAccessCookie(res);

  res.json(success(data, action === 'confirm' ? '确认完成成功' : '已退回继续处理'));
}
