<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-scroll">
        <div class="brand-block">
          <div class="brand-mark">NL</div>
          <div class="brand-copy">
            <div class="brand-title">NextLaunch Hub</div>
            <div class="brand-subtitle">业务支持后台</div>
          </div>
        </div>

        <div class="sidebar-user-card">
          <span class="sidebar-user-name">{{ authStore.user?.realName }}</span>
          <small>{{ roleTextMap[authStore.user?.role] || '用户' }}</small>
        </div>

        <div class="sidebar-section-label">导航菜单</div>
        <nav class="menu-list">
          <router-link class="menu-item" to="/dashboard">主页</router-link>
          <router-link class="menu-item" to="/help-center">求助中心</router-link>
          <router-link class="menu-item" to="/projects">项目管理</router-link>
          <router-link class="menu-item" to="/tasks">任务管理</router-link>
          <router-link class="menu-item" to="/notifications">通知中心</router-link>
          <router-link v-if="authStore.user?.role === 'admin'" class="menu-item" to="/users">
            用户管理
          </router-link>
          <router-link v-if="authStore.user?.role === 'admin'" class="menu-item" to="/system/dictionaries">
            字典配置
          </router-link>
        </nav>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-footer-title">当前系统</div>
        <p>支持求助受理、流转处理、通知提醒与业务协同。</p>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div class="topbar-main">
          <span class="topbar-eyebrow">业务支持中心</span>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageDescription }}</p>
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

          <el-dropdown trigger="click" placement="bottom-end">
            <button class="topbar-user topbar-user-trigger">
              <div class="topbar-user-copy">
                <span>{{ authStore.user?.realName }}</span>
                <small>{{ roleTextMap[authStore.user?.role] || '用户' }}</small>
              </div>
              <span class="topbar-user-caret">⌄</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notifications';
import { useSystemNotificationStore } from '../stores/system-notification';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const systemNotificationStore = useSystemNotificationStore();

const roleTextMap = {
  admin: '管理员',
  helper: '帮助人员',
  requester: '发起人'
};

const pageMetaMap = [
  { match: (path) => path === '/dashboard', title: '主页', description: '查看重点事项、统计概览与最近求助记录。' },
  { match: (path) => path.startsWith('/help-center'), title: '求助中心', description: '统一查看求助单、处理状态与流转详情。' },
  { match: (path) => path.startsWith('/projects'), title: '项目管理', description: '管理项目进度、成员安排与里程碑信息。' },
  { match: (path) => path.startsWith('/tasks'), title: '任务管理', description: '跟进任务状态、优先级与执行安排。' },
  { match: (path) => path.startsWith('/notifications'), title: '通知中心', description: '集中处理系统消息与待办提醒。' },
  { match: (path) => path.startsWith('/users'), title: '用户管理', description: '维护系统账号、角色权限与启用状态。' },
  { match: (path) => path.startsWith('/system/dictionaries'), title: '字典配置', description: '维护基础枚举、选项值与系统配置项。' }
];

const currentPageMeta = computed(() => {
  return pageMetaMap.find((item) => item.match(route.path)) || pageMetaMap[0];
});

const pageTitle = computed(() => currentPageMeta.value.title);
const pageDescription = computed(() => currentPageMeta.value.description);

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
