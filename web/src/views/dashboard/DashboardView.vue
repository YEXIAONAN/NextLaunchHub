<template>
  <div class="page-section">
    <section class="stats-grid">
      <article class="stat-card">
        <span>待处理求助数</span>
        <strong>{{ overview.stats.pending }}</strong>
      </article>
      <article class="stat-card">
        <span>处理中求助数</span>
        <strong>{{ overview.stats.processing }}</strong>
      </article>
      <article class="stat-card">
        <span>待确认求助数</span>
        <strong>{{ overview.stats.waitingConfirm }}</strong>
      </article>
      <article class="stat-card">
        <span>已完成求助数</span>
        <strong>{{ overview.stats.completed }}</strong>
      </article>
    </section>

    <section class="page-card">
      <div class="page-header">
        <div>
          <h2>最近求助记录</h2>
          <p>展示最近 5 条求助事项</p>
        </div>
      </div>
      <el-table :data="overview.recentItems" class="custom-table">
        <el-table-column prop="request_no" label="求助单号" min-width="170" />
        <el-table-column prop="title" label="求助标题" min-width="220" />
        <el-table-column prop="requester_name" label="发起人姓名" min-width="120" />
        <el-table-column prop="helper_name" label="帮助人员" min-width="120" />
        <el-table-column label="当前状态" min-width="120">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="request_datetime" label="发起时间" min-width="180" />
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { getDashboardOverviewApi } from '../../api';
import StatusTag from '../../components/StatusTag.vue';

const overview = reactive({
  stats: {
    pending: 0,
    processing: 0,
    waitingConfirm: 0,
    completed: 0
  },
  recentItems: []
});

async function loadOverview() {
  const result = await getDashboardOverviewApi();
  overview.stats = result.data.stats;
  overview.recentItems = result.data.recentItems;
}

onMounted(loadOverview);
</script>
