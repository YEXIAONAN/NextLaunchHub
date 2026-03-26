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
          <router-link class="menu-item" to="/projects">项目管理</router-link>
          <router-link class="menu-item" to="/tasks">任务管理</router-link>
          <router-link v-if="authStore.user?.role === 'admin'" class="menu-item" to="/users">
            用户管理
          </router-link>
          <router-link v-if="authStore.user?.role === 'admin'" class="menu-item" to="/system/dictionaries">
            字典配置
          </router-link>
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
        <div class="topbar-actions">
          <el-button
            v-if="systemNotificationStore.shouldShowEnableEntry"
            class="secondary-action topbar-alert-btn"
            size="small"
            @click="handleEnableSystemNotification"
          >
            开启系统提醒
          </el-button>
          <button class="topbar-notification" @click="router.push('/notifications')">
            <span>通知中心</span>
            <em v-if="notificationStore.unreadCount > 0">{{ notificationStore.unreadCount }}</em>
          </button>
          <div class="topbar-user">
            <span>{{ authStore.user?.realName }}</span>
            <small>{{ roleTextMap[authStore.user?.role] || '用户' }}</small>
          </div>
        </div>
      </header>
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notifications';
import { useSystemNotificationStore } from '../stores/system-notification';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const systemNotificationStore = useSystemNotificationStore();

const roleTextMap = {
  admin: '管理员',
  helper: '帮助人员',
  requester: '发起人'
};

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

async function handleEnableSystemNotification() {
  const permission = await systemNotificationStore.requestPermission({ force: true });

  if (permission === 'granted') {
    ElMessage.success('系统提醒已开启');
    return;
  }

  if (permission === 'denied') {
    ElMessage.warning('浏览器已拒绝系统提醒，请在浏览器设置中重新允许通知权限');
    return;
  }

  ElMessage.info('系统提醒暂未开启');
}

onMounted(() => {
  systemNotificationStore.refreshPermission();
  if (authStore.token) {
    notificationStore.fetchUnreadCount();
  }
});
</script>
