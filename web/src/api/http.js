import axios from 'axios';
import { ElMessage } from 'element-plus';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('nextlaunch_hub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    const result = response.data;
    if (result.code !== 0) {
      ElMessage.error(result.message || '请求失败');
      return Promise.reject(result);
    }
    return result;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败';
    ElMessage.error(message);
    if (error.response?.status === 401) {
      localStorage.removeItem('nextlaunch_hub_token');
      localStorage.removeItem('nextlaunch_hub_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default http;
