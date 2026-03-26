import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  getNotificationPermission,
  hasRequestedNotificationPermission,
  requestNotificationPermission
} from '../utils/notification-permission';

export const useSystemNotificationStore = defineStore('systemNotification', () => {
  const permission = ref(getNotificationPermission());

  const isSupported = computed(() => permission.value !== 'unsupported');
  const isGranted = computed(() => permission.value === 'granted');
  const shouldShowEnableEntry = computed(() => isSupported.value && !isGranted.value);

  function refreshPermission() {
    permission.value = getNotificationPermission();
  }

  async function requestPermission(options = {}) {
    const result = await requestNotificationPermission(options);
    permission.value = result;
    return result;
  }

  async function requestPermissionAfterLogin() {
    refreshPermission();

    if (!isSupported.value || isGranted.value || hasRequestedNotificationPermission()) {
      return permission.value;
    }

    return requestPermission();
  }

  return {
    permission,
    isSupported,
    isGranted,
    shouldShowEnableEntry,
    refreshPermission,
    requestPermission,
    requestPermissionAfterLogin
  };
});
