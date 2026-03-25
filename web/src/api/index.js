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

export function updateHelpRequestStatusApi(id, status) {
  return http.patch(`/help-requests/${id}/status`, { status });
}

export function getNotificationsApi() {
  return http.get('/notifications');
}
