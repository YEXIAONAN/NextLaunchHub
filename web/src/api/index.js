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

export function getHelpRequestsApi(status = '') {
  return http.get('/help-requests', {
    params: { status }
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
