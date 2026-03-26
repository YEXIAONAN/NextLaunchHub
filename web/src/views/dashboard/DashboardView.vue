<template>
  <div class="page-section dashboard-page">
    <section class="dashboard-hero">
      <article class="page-card dashboard-hero-feature">
        <div class="dashboard-hero-heading">
          <span class="eyebrow">今日工作台</span>
          <h2>{{ authStore.user?.realName || '用户' }}，先处理最重要的事项</h2>
          <p>{{ todayText }} ｜ {{ tipText }}</p>
        </div>

        <div class="dashboard-priority-card">
          <span class="dashboard-section-kicker">当前重点</span>
          <strong>{{ priorityMetric.count }}</strong>
          <h3>{{ priorityMetric.title }}</h3>
          <p>{{ priorityMetric.description }}</p>
        </div>

        <div class="dashboard-hero-note">
          <strong>{{ focusText }}</strong>
          <p>{{ priorityPanelText }}</p>
        </div>
      </article>

      <aside class="dashboard-hero-side">
        <article class="page-card dashboard-focus-panel">
          <div class="dashboard-side-metrics">
            <div class="dashboard-side-metric">
              <label>待处理数量</label>
              <strong>{{ overview.stats.pending }}</strong>
              <span>当前全局待响应事项</span>
            </div>
            <div class="dashboard-side-metric">
              <label>{{ pendingSectionTitle }}</label>
              <strong>{{ myTodoItems.length }}</strong>
              <span>{{ pendingSectionDesc }}</span>
            </div>
            <div class="dashboard-side-metric">
              <label>通知提醒</label>
              <strong>{{ notificationStore.unreadCount }}</strong>
              <span>未读系统通知待查看</span>
            </div>
          </div>

          <div v-if="systemNotificationStore.shouldShowEnableEntry" class="dashboard-system-alert">
            <div>
              <strong>系统提醒未开启</strong>
              <p>建议开启浏览器通知，及时接收状态变化提醒。</p>
            </div>
            <el-button class="secondary-action" @click="handleEnableSystemNotification">
              开启系统提醒
            </el-button>
          </div>
        </article>
      </aside>
    </section>

    <section class="dashboard-stats-band">
      <article
        v-for="item in statsCards"
        :key="item.key"
        class="stat-card"
        :class="{ 'timeout-stat-card': item.key === 'timeout' }"
      >
        <div class="stat-card-head">
          <span>{{ item.label }}</span>
          <em>{{ item.tip }}</em>
        </div>
        <strong>{{ item.value }}</strong>
        <p>{{ item.description }}</p>
      </article>
    </section>

    <section class="dashboard-content-grid">
      <div class="dashboard-primary-column">
        <article class="page-card dashboard-main-panel">
          <div class="page-header with-action">
            <div>
              <h2>{{ pendingSectionTitle }}</h2>
              <p>{{ pendingSectionDesc }}</p>
            </div>
            <div class="table-meta-note">优先展示最近需要跟进的 6 条事项</div>
          </div>

          <div v-if="myTodoItems.length" class="dashboard-work-list">
            <button
              v-for="item in myTodoItems"
              :key="`${item.status}-${item.id}`"
              class="dashboard-work-item"
              @click="goDetail(item.id)"
            >
              <div class="dashboard-work-item-main">
                <div class="dashboard-work-item-title">
                  <strong>{{ item.title }}</strong>
                  <span v-if="Number(item.is_timeout) === 1" class="timeout-pill">已超时</span>
                </div>
                <p>{{ item.request_no }} ｜ {{ item.requester_name }} ｜ {{ item.helper_name }}</p>
              </div>
              <div class="dashboard-work-item-side">
                <StatusTag :status="item.status" />
                <span>{{ item.request_datetime }}</span>
              </div>
            </button>
          </div>
          <el-empty v-else description="当前没有需要优先处理的求助单" />
        </article>

        <article class="page-card dashboard-recent-panel">
          <div class="page-header with-action">
            <div>
              <h2>最近求助记录</h2>
              <p>作为补充信息，按时间倒序展示最近 5 条求助事项</p>
            </div>
            <div class="table-meta-note">点击行可查看详情</div>
          </div>
          <el-table :data="overview.recentItems" class="custom-table" @row-click="handleRowClick">
            <el-table-column prop="request_no" label="求助单号" min-width="170" />
            <el-table-column prop="title" label="求助标题" min-width="220" />
            <el-table-column prop="requester_name" label="发起人姓名" min-width="120" />
            <el-table-column prop="helper_name" label="帮助人员" min-width="120" />
            <el-table-column label="当前状态" min-width="120">
              <template #default="{ row }">
                <StatusTag :status="row.status" />
              </template>
            </el-table-column>
            <el-table-column label="超时状态" min-width="120">
              <template #default="{ row }">
                <span v-if="Number(row.is_timeout) === 1" class="timeout-pill">已超时</span>
                <span v-else class="table-meta-note">正常</span>
              </template>
            </el-table-column>
            <el-table-column prop="request_datetime" label="发起时间" min-width="180" />
          </el-table>
        </article>
      </div>

      <aside class="dashboard-secondary-column">
        <article class="page-card dashboard-quick-panel">
          <div class="page-header">
            <div>
              <h2>快捷入口</h2>
              <p>高频页面集中展示，减少页面切换成本。</p>
            </div>
          </div>

          <div class="dashboard-shortcuts">
            <button class="dashboard-shortcut-card" @click="router.push('/notifications')">
              <span>通知中心</span>
              <strong>处理系统提醒</strong>
              <p>未读通知：{{ notificationStore.unreadCount }}</p>
            </button>
            <button class="dashboard-shortcut-card" @click="router.push('/help-center')">
              <span>求助中心</span>
              <strong>查看业务单据</strong>
              <p>进入列表页继续跟进处理状态</p>
            </button>
            <button class="dashboard-shortcut-card" @click="router.push('/help-query')">
              <span>公开查询</span>
              <strong>查看提交记录</strong>
              <p>面向发起人的公开求助查询入口</p>
            </button>
          </div>
        </article>

        <article class="page-card dashboard-side-summary">
          <div class="page-header">
            <div>
              <h2>处理概览</h2>
              <p>补充查看待确认与已完成情况。</p>
            </div>
          </div>

          <div class="dashboard-summary-list">
            <div class="dashboard-summary-item">
              <label>待确认</label>
              <strong>{{ overview.stats.waitingConfirm }}</strong>
              <span>等待发起人确认处理结果</span>
            </div>
            <div class="dashboard-summary-item">
              <label>已完成</label>
              <strong>{{ overview.stats.completed }}</strong>
              <span>当前已闭环归档的求助事项</span>
            </div>
          </div>
        </article>
      </aside>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { getDashboardOverviewApi, getHelpRequestsApi } from '../../api';
import StatusTag from '../../components/StatusTag.vue';
import { useAuthStore } from '../../stores/auth';
import { useNotificationStore } from '../../stores/notifications';
import { useSystemNotificationStore } from '../../stores/system-notification';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const systemNotificationStore = useSystemNotificationStore();

const overview = reactive({
  stats: {
    pending: 0,
    processing: 0,
    waitingConfirm: 0,
    completed: 0,
    timeout: 0
  },
  recentItems: []
});
const myTodoItems = ref([]);
const statsCards = computed(() => {
  return [
    {
      key: 'pending',
      label: '待处理求助数',
      tip: '需要尽快跟进',
      value: overview.stats.pending,
      description: '尚未进入处理流程的求助事项'
    },
    {
      key: 'processing',
      label: '处理中求助数',
      tip: '持续推进',
      value: overview.stats.processing,
      description: '已受理并正在排查或处理的事项'
    },
    {
      key: 'waitingConfirm',
      label: '待确认求助数',
      tip: '等待反馈',
      value: overview.stats.waitingConfirm,
      description: '已完成处理，待发起人确认结果'
    },
    {
      key: 'completed',
      label: '已完成求助数',
      tip: '已闭环',
      value: overview.stats.completed,
      description: '当前已结束并完成归档的事项'
    },
    {
      key: 'timeout',
      label: '超时求助数',
      tip: '需要关注',
      value: overview.stats.timeout,
      description: '已超过截止时间且仍未完成的求助事项'
    }
  ];
});

const todayText = computed(() => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(new Date());
});

const tipText = computed(() => {
  if (authStore.user?.role === 'requester') {
    return '这里会展示你发起的求助进展，优先关注待处理和处理中事项';
  }
  return authStore.user?.role === 'admin'
    ? '请优先关注全局待处理事项与跨人协同情况'
    : '请先清理自己负责的待处理事项，再跟进处理中任务';
});

const focusText = computed(() => {
  if (overview.stats.timeout > 0) {
    return `当前有 ${overview.stats.timeout} 条超时求助`;
  }
  if (overview.stats.pending > 0) {
    return `当前有 ${overview.stats.pending} 条待处理求助`;
  }
  if (overview.stats.processing > 0) {
    return `当前有 ${overview.stats.processing} 条处理中求助`;
  }
  return '当前暂无紧急待办';
});

const priorityMetric = computed(() => {
  if (overview.stats.timeout > 0) {
    return {
      count: overview.stats.timeout,
      title: '超时事项优先处理',
      description: '这些求助单已经超过截止时间，建议优先推进处理或确认状态。'
    };
  }

  if (overview.stats.pending > 0) {
    return {
      count: overview.stats.pending,
      title: '待处理事项需要响应',
      description: '尚未进入处理流程的求助单应优先被接单和跟进。'
    };
  }

  if (overview.stats.processing > 0) {
    return {
      count: overview.stats.processing,
      title: '处理中事项持续推进',
      description: '当前已有事项在推进中，建议同步关注处理进展和确认节点。'
    };
  }

  return {
    count: overview.stats.completed,
    title: '当前工作节奏稳定',
    description: '暂时没有紧急待办，可以查看记录或处理通知提醒。'
  };
});

const priorityPanelText = computed(() => {
  if (authStore.user?.role === 'admin') {
    return '先看全局重点，再处理待办与通知，最后回看最近记录。';
  }

  if (authStore.user?.role === 'requester') {
    return '先看自己发起事项的当前进展，再查看待办状态和通知反馈。';
  }

  return '先处理分配给你的事项，再查看提醒入口和最近新增记录。';
});

const pendingSectionTitle = computed(() => {
  return authStore.user?.role === 'admin' ? '全局待处理' : '我的待处理';
});

const pendingSectionDesc = computed(() => {
  return authStore.user?.role === 'admin'
    ? '管理员视角下的全局待处理求助事项'
    : authStore.user?.role === 'requester'
      ? '展示你发起且仍在处理中的求助单'
      : '展示当前分配给你的待处理和处理中求助';
});

async function loadOverview() {
  const result = await getDashboardOverviewApi();
  overview.stats = result.data.stats;
  overview.recentItems = result.data.recentItems;
}

async function loadMyTodoItems() {
  if (authStore.user?.role === 'admin') {
    const result = await getHelpRequestsApi({ status: 'pending' });
    myTodoItems.value = result.data.slice(0, 6);
    return;
  }

  if (authStore.user?.role === 'helper') {
    const [pendingResult, processingResult] = await Promise.all([
      getHelpRequestsApi({ status: 'pending' }),
      getHelpRequestsApi({ status: 'processing' })
    ]);
    myTodoItems.value = [...pendingResult.data, ...processingResult.data]
      .sort((a, b) => String(b.request_datetime).localeCompare(String(a.request_datetime)))
      .slice(0, 6);
    return;
  }

  if (authStore.user?.role === 'requester') {
    const [pendingResult, processingResult] = await Promise.all([
      getHelpRequestsApi({ status: 'pending' }),
      getHelpRequestsApi({ status: 'processing' })
    ]);
    myTodoItems.value = [...pendingResult.data, ...processingResult.data]
      .sort((a, b) => String(b.request_datetime).localeCompare(String(a.request_datetime)))
      .slice(0, 6);
    return;
  }

  myTodoItems.value = [];
}

function goDetail(id) {
  router.push(`/help-center/${id}`);
}

function handleRowClick(row) {
  goDetail(row.id);
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

onMounted(async () => {
  systemNotificationStore.refreshPermission();
  await Promise.all([
    loadOverview(),
    loadMyTodoItems(),
    notificationStore.fetchUnreadCount()
  ]);
});
</script>
