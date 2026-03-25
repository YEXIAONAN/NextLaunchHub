import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { loginApi } from '../api';

const TOKEN_KEY = 'nextlaunch_hub_token';
const USER_KEY = 'nextlaunch_hub_user';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '');
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
  const isLoggedIn = computed(() => Boolean(token.value));

  async function login(formData) {
    const result = await loginApi(formData);
    token.value = result.data.token;
    user.value = result.data.user;
    localStorage.setItem(TOKEN_KEY, token.value);
    localStorage.setItem(USER_KEY, JSON.stringify(user.value));
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    logout
  };
});
