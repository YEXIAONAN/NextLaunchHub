import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getUnreadNotificationCountApi } from '../api';

export const useNotificationStore = defineStore('notifications', () => {
  const unreadCount = ref(0);

  async function fetchUnreadCount() {
    const result = await getUnreadNotificationCountApi();
    unreadCount.value = result.data.unreadCount || 0;
  }

  function clearUnreadCount() {
    unreadCount.value = 0;
  }

  return {
    unreadCount,
    fetchUnreadCount,
    clearUnreadCount
  };
});
