import http from './http';

export function loginApi(payload) {
  return http.post('/auth/login', payload);
}

export function getRequestersApi(keyword = '') {
  return http.get('/public/requesters', {
    params: { keyword }
  });
}

export function getHelpersApi(keyword = '') {
  return http.get('/public/helpers', {
    params: { keyword }
  });
}

export function submitHelpRequestApi(payload) {
  return http.post('/public/help-requests', payload);
}

export function queryPublicHelpRequestApi(params) {
  return http.get('/public/help-requests/query', {
    params
  });
}

export function confirmPublicHelpRequestApi(id, payload) {
  return http.post(`/public/help-requests/${id}/confirm`, payload);
}

export function getDashboardOverviewApi() {
  return http.get('/dashboard/overview');
}

export function getProjectsApi(params) {
  return http.get('/projects', {
    params
  });
}

export function createProjectApi(payload) {
  return http.post('/projects', payload);
}

export function getProjectDetailApi(id) {
  return http.get(`/projects/${id}`);
}

export function updateProjectApi(id, payload) {
  return http.patch(`/projects/${id}`, payload);
}

export function getProjectMembersApi(id) {
  return http.get(`/projects/${id}/members`);
}

export function addProjectMemberApi(id, payload) {
  return http.post(`/projects/${id}/members`, payload);
}

export function getProjectTasksApi(id, params) {
  return http.get(`/projects/${id}/tasks`, {
    params
  });
}

export function getProjectIterationsApi(id) {
  return http.get(`/projects/${id}/iterations`);
}

export function createProjectIterationApi(id, payload) {
  return http.post(`/projects/${id}/iterations`, payload);
}

export function updateIterationApi(id, payload) {
  return http.patch(`/iterations/${id}`, payload);
}

export function getProjectMilestonesApi(id) {
  return http.get(`/projects/${id}/milestones`);
}

export function createProjectMilestoneApi(id, payload) {
  return http.post(`/projects/${id}/milestones`, payload);
}

export function updateMilestoneApi(id, payload) {
  return http.patch(`/milestones/${id}`, payload);
}

export function getTasksApi(params) {
  return http.get('/tasks', {
    params
  });
}

export function createTaskApi(payload) {
  return http.post('/tasks', payload);
}

export function getTaskDetailApi(id) {
  return http.get(`/tasks/${id}`);
}

export function updateTaskApi(id, payload) {
  return http.patch(`/tasks/${id}`, payload);
}

export function updateTaskStatusApi(id, status) {
  return http.patch(`/tasks/${id}/status`, { status });
}

export function getHelpRequestsApi(params = {}) {
  return http.get('/help-requests', {
    params
  });
}

export function getHelpRequestDetailApi(id) {
  return http.get(`/help-requests/${id}`);
}

export function getHelpRequestAssistantsApi(id) {
  return http.get(`/help-requests/${id}/assistants`);
}

export function addHelpRequestAssistantApi(id, payload) {
  return http.post(`/help-requests/${id}/assistants`, payload);
}

export function addHelpRequestCollaborationLogApi(id, payload) {
  return http.post(`/help-requests/${id}/collaboration-log`, payload);
}

export function updateHelpRequestStatusApi(id, status) {
  return http.patch(`/help-requests/${id}/status`, { status });
}

export function reassignHelpRequestHelperApi(id, payload) {
  return http.patch(`/help-requests/${id}/reassign-helper`, payload);
}

export function getNotificationsApi() {
  return http.get('/notifications');
}

export function getNotificationsPageApi(params) {
  return http.get('/notifications', {
    params
  });
}

export function markNotificationReadApi(id) {
  return http.patch(`/notifications/${id}/read`);
}

export function markAllNotificationsReadApi() {
  return http.patch('/notifications/read-all');
}

export function getUnreadNotificationCountApi() {
  return http.get('/notifications/unread-count');
}
