<template>
  <div class="page-section dashboard-page">
    <section class="dashboard-hero">
      <article class="page-card dashboard-hero-feature">
        <div class="dashboard-hero-heading">
<!--          <span class="eyebrow">今日工作台</span>-->
          <h2>尊敬的 {{ authStore.user?.realName || '用户' }} 欢迎登陆</h2>
          <p>{{ todayText }} ｜ {{ quoteText }}</p>
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
              <span>当前待响应</span>
            </div>
            <div class="dashboard-side-metric">
              <label>{{ pendingSectionTitle }}</label>
              <strong>{{ myTodoItems.length }}</strong>
              <span>{{ pendingMetricText }}</span>
            </div>
            <div class="dashboard-side-metric">
              <label>通知提醒</label>
              <strong>{{ notificationStore.unreadCount }}</strong>
              <span>未读通知</span>
            </div>
          </div>

<!--          <div v-if="systemNotificationStore.shouldShowEnableEntry" class="dashboard-system-alert">-->
<!--            <div>-->
<!--              <strong>系统提醒未开启</strong>-->
<!--              <p>建议开启浏览器通知。</p>-->
<!--            </div>-->
<!--            <el-button class="secondary-action" @click="handleEnableSystemNotification">-->
<!--              开启系统提醒-->
<!--            </el-button>-->
<!--          </div>-->
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
        </div>
        <strong>{{ item.value }}</strong>
        <p>{{ item.tip }}</p>
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
            <div class="table-meta-note">最近 6 条</div>
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
              <p>最近 5 条记录</p>
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
              <p>常用入口</p>
            </div>
          </div>

          <div class="dashboard-shortcuts">
            <button class="dashboard-shortcut-card" @click="router.push('/notifications')">
              <span>通知中心</span>
              <strong>处理系统提醒</strong>
              <p>未读 {{ notificationStore.unreadCount }}</p>
            </button>
            <button class="dashboard-shortcut-card" @click="router.push('/help-center')">
              <span>求助中心</span>
              <strong>查看求助信息</strong>
              <p>继续跟进处理</p>
            </button>
            <button class="dashboard-shortcut-card" @click="router.push('/help-query')">
              <span>公开查询</span>
              <strong>查看提交记录</strong>
              <p>查看公开记录</p>
            </button>
          </div>
        </article>

        <article class="page-card dashboard-side-summary">
          <div class="page-header">
            <div>
              <h2>处理概览</h2>
              <p>补充信息</p>
            </div>
          </div>

          <div class="dashboard-summary-list">
            <div class="dashboard-summary-item">
              <label>待确认</label>
              <strong>{{ overview.stats.waitingConfirm }}</strong>
              <span>等待确认</span>
            </div>
            <div class="dashboard-summary-item">
              <label>已完成</label>
              <strong>{{ overview.stats.completed }}</strong>
              <span>已完成归档</span>
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
const quotes = [
  '代码不会骗你，理解不到位一定会报错。',
  '写不出来，不是你不努力，是你没理解本质。',
  'Debug 的过程，就是你认知升级的过程。',
  '你今天逃避的知识，明天会用 Bug 的形式找你。',
  '不要假装理解，机器会帮你揭穿。',
  '会写 ≠ 会做项目，会做项目 ≠ 会设计系统。',
  '工程能力，远比刷题更接近现实世界。',
  '写代码不是目的，解决问题才是。',
  '复制代码能跑，不代表你会。',
  '技术的本质：抽象 + 拆解 + 复用。',
  'You don’t learn programming by watching — you learn by breaking things.',
  'If it works but you don’t understand it, it’s a time bomb.',
  'Comfort kills growth. Debugging builds engineers.',
  'The difference between junior and senior is not syntax, but thinking.',
  'Code is cheap. Thinking is expensive.',
  '不要追新技术，要追“底层逻辑”。',
  '框架会过时，但计算机原理不会。',
  '会用工具的人很多，会造工具的人很少。',
  '你写的每一行代码，都在定义你的上限。',
  '技术成长，本质是不断降低复杂度的能力。',
  'The best engineers are not faster typers — they make fewer mistakes.',
  'Simplicity is the ultimate sophistication in code.',
  'If you can’t explain it, you don’t understand it.',
  'Every bug you fix becomes part of your intuition.'
];
const quoteText = quotes[Math.floor(Math.random() * quotes.length)];
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
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(now);
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekday}`;
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
    return '先处理全局重点，再回看待办与记录。';
  }

  if (authStore.user?.role === 'requester') {
    return '先看当前进展，再查看通知反馈。';
  }

  return '先处理分配事项，再查看提醒与记录。';
});

const pendingSectionTitle = computed(() => {
  return authStore.user?.role === 'admin' ? '全局待处理' : '我的待处理';
});

const pendingSectionDesc = computed(() => {
  return authStore.user?.role === 'admin'
    ? '优先查看需要跟进的待处理事项'
    : authStore.user?.role === 'requester'
      ? '查看你发起且仍在处理中的求助单'
      : '查看当前分配给你的待处理事项';
});

const pendingMetricText = computed(() => {
  return authStore.user?.role === 'admin' ? '优先跟进' : '分配给你';
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
