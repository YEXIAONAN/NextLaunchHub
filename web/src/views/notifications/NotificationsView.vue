<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>通知中心</h2>
          <p>查看通知提醒、筛选状态并快速跳转到对应业务页面。</p>
        </div>
        <el-button class="secondary-action" :disabled="notificationStore.unreadCount === 0" @click="handleReadAll">
          全部标记已读
        </el-button>
      </div>

      <div class="notification-toolbar">
        <el-select v-model="filters.isRead" placeholder="已读状态" clearable @change="handleFilterChange">
          <el-option label="全部状态" value="" />
          <el-option label="未读" value="0" />
          <el-option label="已读" value="1" />
        </el-select>

        <el-select v-model="filters.type" placeholder="通知类型" clearable @change="handleFilterChange">
          <el-option label="全部类型" value="" />
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <div v-if="notifications.length" class="notification-list">
        <article
          v-for="item in notifications"
          :key="item.id"
          class="notification-item"
          :class="{ unread: Number(item.is_read) === 0 }"
        >
          <button class="notification-main" @click="handleJump(item)">
            <div class="notification-head">
              <div class="notification-title-wrap">
                <strong>{{ item.title }}</strong>
                <span class="notification-type">{{ typeTextMap[item.type] || item.type }}</span>
              </div>
              <span class="notification-time">{{ item.created_at }}</span>
            </div>
            <p>{{ item.content }}</p>
            <div class="notification-meta">
              <span>{{ Number(item.is_read) === 0 ? '未读' : '已读' }}</span>
              <span>{{ item.jump_path || '-' }}</span>
            </div>
          </button>

          <div class="notification-actions">
            <el-button
              v-if="Number(item.is_read) === 0"
              class="secondary-action"
              @click="handleReadOne(item)"
            >
              标记已读
            </el-button>
            <el-button class="secondary-action" @click="handleJump(item)">查看详情</el-button>
          </div>
        </article>
      </div>
      <el-empty v-else description="暂无通知" />

      <div class="notification-pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="handlePageChange"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import {
  getNotificationsPageApi,
  markAllNotificationsReadApi,
  markNotificationReadApi
} from '../../api';
import { useNotificationStore } from '../../stores/notifications';

const router = useRouter();
const notificationStore = useNotificationStore();
const notifications = ref([]);

const filters = reactive({
  isRead: '',
  type: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const typeTextMap = {
  help_request_created: '新求助单',
  help_request_status_changed: '状态变更',
  requester_confirm: '发起人确认',
  requester_reject: '发起人退回',
  assistant_added: '协同加入'
};

const typeOptions = [
  { label: '新求助单', value: 'help_request_created' },
  { label: '状态变更', value: 'help_request_status_changed' },
  { label: '发起人确认', value: 'requester_confirm' },
  { label: '发起人退回', value: 'requester_reject' },
  { label: '协同加入', value: 'assistant_added' }
];

async function loadNotifications() {
  const result = await getNotificationsPageApi({
    page: pagination.page,
    pageSize: pagination.pageSize,
    isRead: filters.isRead,
    type: filters.type
  });

  notifications.value = result.data.list;
  pagination.page = result.data.pagination.page;
  pagination.pageSize = result.data.pagination.pageSize;
  pagination.total = result.data.pagination.total;
}

async function refreshNotifications() {
  await loadNotifications();
  await notificationStore.fetchUnreadCount();
}

function handleFilterChange() {
  pagination.page = 1;
  loadNotifications();
}

function handlePageChange(page) {
  pagination.page = page;
  loadNotifications();
}

async function handleReadOne(item) {
  await markNotificationReadApi(item.id);
  ElMessage.success('已标记为已读');
  await refreshNotifications();
}

async function handleReadAll() {
  await markAllNotificationsReadApi();
  ElMessage.success('已全部标记为已读');
  await refreshNotifications();
}

async function handleJump(item) {
  if (Number(item.is_read) === 0) {
    await markNotificationReadApi(item.id);
    await notificationStore.fetchUnreadCount();
  }

  if (item.jump_path) {
    router.push(item.jump_path);
    return;
  }

  ElMessage.warning('当前通知未配置跳转地址');
}

onMounted(async () => {
  await refreshNotifications();
});
</script>
