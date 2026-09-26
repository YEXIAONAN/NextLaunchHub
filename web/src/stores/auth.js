import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getCurrentUserApi, loginApi, logoutApi } from '../api';
import { connectRealtime, disconnectRealtime } from '../realtime/socket';
import { useNotificationStore } from './notifications';
import { useSystemNotificationStore } from './system-notification';

const USER_KEY = 'nextlaunch_hub_user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
  const initialized = ref(false);
  const isLoggedIn = computed(() => Boolean(user.value));
  const notificationStore = useNotificationStore();
  const systemNotificationStore = useSystemNotificationStore();

  async function login(formData) {
    const result = await loginApi(formData);
    user.value = result.data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    initialized.value = true;
    connectRealtime();
    await notificationStore.fetchUnreadCount();
    await systemNotificationStore.requestPermissionAfterLogin();
  }

  async function restoreSession() {
    try {
      const result = await getCurrentUserApi();
      user.value = result.data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(user.value));
      connectRealtime();
    } catch (_error) {
      user.value = null;
      localStorage.removeItem(USER_KEY);
    } finally {
      initialized.value = true;
    }
  }

  async function logout() {
    await logoutApi().catch(() => null);
    disconnectRealtime();
    user.value = null;
    localStorage.removeItem(USER_KEY);
    notificationStore.clearUnreadCount();
  }

  return {
    user,
    initialized,
    isLoggedIn,
    login,
    restoreSession,
    logout
  };
});
