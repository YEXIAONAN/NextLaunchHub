<template>
  <div class="page-section">
    <section class="page-card workbench-hero">
      <div class="workbench-hero-main">
        <span class="eyebrow">今日工作台</span>
        <h2>{{ authStore.user?.realName || '用户' }}，今天也有清晰的处理节奏</h2>
        <p>{{ todayText }} ｜ {{ tipText }}</p>
      </div>
      <div class="workbench-hero-side">
        <div class="workbench-focus-card">
          <span>当前重点</span>
          <strong>{{ focusText }}</strong>
          <p>优先处理待办事项，确保求助单状态持续推进。</p>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <div class="stat-card-head">
          <span>待处理求助数</span>
          <em>需要尽快跟进</em>
        </div>
        <strong>{{ overview.stats.pending }}</strong>
        <p>尚未进入处理流程的求助事项</p>
      </article>
      <article class="stat-card">
        <div class="stat-card-head">
          <span>处理中求助数</span>
          <em>持续推进</em>
        </div>
        <strong>{{ overview.stats.processing }}</strong>
        <p>已受理并正在排查或处理的事项</p>
      </article>
      <article class="stat-card">
        <div class="stat-card-head">
          <span>待确认求助数</span>
          <em>等待反馈</em>
        </div>
        <strong>{{ overview.stats.waitingConfirm }}</strong>
        <p>已完成处理，待发起人确认结果</p>
      </article>
      <article class="stat-card">
        <div class="stat-card-head">
          <span>已完成求助数</span>
          <em>已闭环</em>
        </div>
        <strong>{{ overview.stats.completed }}</strong>
        <p>当前已结束并完成归档的事项</p>
      </article>
      <article class="stat-card timeout-stat-card">
        <div class="stat-card-head">
          <span>超时求助数</span>
          <em>需要关注</em>
        </div>
        <strong>{{ overview.stats.timeout }}</strong>
        <p>已超过截止时间且仍未完成的求助事项</p>
      </article>
    </section>

    <section class="workbench-grid">
      <article class="page-card">
        <div class="page-header">
          <div>
            <h2>快捷入口</h2>
            <p>常用工作入口集中放置，减少切换成本。</p>
          </div>
        </div>
        <div class="quick-grid">
          <button class="quick-card" @click="router.push('/help-query')">
            <span>提交求助记录查看</span>
            <strong>查看公开求助查询</strong>
            <p>面向发起人的公开查询入口</p>
          </button>
          <button class="quick-card" @click="router.push('/help-center')">
            <span>进入求助中心</span>
            <strong>查看全部业务单据</strong>
            <p>进入列表页继续处理和跟进</p>
          </button>
          <button class="quick-card" @click="router.push('/notifications')">
            <span>进入通知中心</span>
            <strong>处理最新系统提醒</strong>
            <p>未读通知：{{ notificationStore.unreadCount }}</p>
          </button>
        </div>
      </article>

      <article class="page-card">
        <div class="page-header">
          <div>
            <h2>{{ pendingSectionTitle }}</h2>
            <p>{{ pendingSectionDesc }}</p>
          </div>
          <div class="table-meta-note">点击记录可进入详情</div>
        </div>

        <div v-if="myTodoItems.length" class="work-list">
          <button
            v-for="item in myTodoItems"
            :key="`${item.status}-${item.id}`"
            class="work-list-item"
            @click="goDetail(item.id)"
          >
            <div class="work-list-item-main">
              <strong>{{ item.title }}</strong>
              <p>{{ item.request_no }} ｜ {{ item.requester_name }} ｜ {{ item.helper_name }}</p>
            </div>
            <div class="work-list-item-side">
              <span v-if="Number(item.is_timeout) === 1" class="timeout-pill">已超时</span>
              <StatusTag :status="item.status" />
              <span>{{ item.request_datetime }}</span>
            </div>
          </button>
        </div>
        <el-empty v-else description="当前没有需要优先处理的求助单" />
      </article>
    </section>

    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>最近求助记录</h2>
          <p>展示最近 5 条求助事项</p>
        </div>
        <div class="table-meta-note">按发起时间倒序展示</div>
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
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getDashboardOverviewApi, getHelpRequestsApi } from '../../api';
import StatusTag from '../../components/StatusTag.vue';
import { useAuthStore } from '../../stores/auth';
import { useNotificationStore } from '../../stores/notifications';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

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
    const result = await getHelpRequestsApi('pending');
    myTodoItems.value = result.data.slice(0, 6);
    return;
  }

  if (authStore.user?.role === 'helper') {
    const [pendingResult, processingResult] = await Promise.all([
      getHelpRequestsApi('pending'),
      getHelpRequestsApi('processing')
    ]);
    myTodoItems.value = [...pendingResult.data, ...processingResult.data]
      .sort((a, b) => String(b.request_datetime).localeCompare(String(a.request_datetime)))
      .slice(0, 6);
    return;
  }

  if (authStore.user?.role === 'requester') {
    const [pendingResult, processingResult] = await Promise.all([
      getHelpRequestsApi('pending'),
      getHelpRequestsApi('processing')
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

onMounted(async () => {
  await Promise.all([
    loadOverview(),
    loadMyTodoItems(),
    notificationStore.fetchUnreadCount()
  ]);
});
</script>
