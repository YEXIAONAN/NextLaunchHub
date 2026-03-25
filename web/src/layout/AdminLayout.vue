<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="brand-block">
          <div class="brand-mark">NL</div>
          <div class="brand-copy">
            <div class="brand-title">NextLaunch Hub</div>
            <div class="brand-subtitle">业务支持后台</div>
          </div>
        </div>
        <div class="sidebar-section-label">导航</div>
        <nav class="menu-list">
          <router-link class="menu-item" to="/dashboard">主页</router-link>
          <router-link class="menu-item" to="/help-center">求助中心</router-link>
        </nav>
      </div>
      <div class="sidebar-bottom">
        <div class="sidebar-user-card">
          <span class="sidebar-user-name">{{ authStore.user?.realName }}</span>
          <small>{{ roleTextMap[authStore.user?.role] || '用户' }}</small>
        </div>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div class="topbar-main">
          <span class="topbar-eyebrow">业务支持中心</span>
          <h1>NextLaunch Hub</h1>
          <p>求助受理与处理中心</p>
        </div>
        <div class="topbar-user">
          <span>{{ authStore.user?.realName }}</span>
          <small>{{ roleTextMap[authStore.user?.role] || '用户' }}</small>
        </div>
      </header>
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const roleTextMap = {
  admin: '管理员',
  helper: '帮助人员'
};

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>
