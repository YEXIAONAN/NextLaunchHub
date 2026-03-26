<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>求助详情</h2>
          <p>查看完整信息并更新当前处理状态。</p>
        </div>
        <el-button class="secondary-action" @click="router.push('/help-center')">返回列表</el-button>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <label>求助单号</label>
          <span>{{ detail.request_no }}</span>
        </div>
        <div class="detail-item">
          <label>求助标题</label>
          <span>{{ detail.title }}</span>
        </div>
        <div class="detail-item">
          <label>发起人姓名</label>
          <span>{{ detail.requester_name }}</span>
        </div>
        <div class="detail-item">
          <label>帮助人员</label>
          <span>{{ detail.helper_name }}</span>
        </div>
        <div class="detail-item full-width">
          <label>内容</label>
          <span>{{ detail.content }}</span>
        </div>
        <div class="detail-item">
          <label>IP 地址</label>
          <span>{{ detail.requester_ip }}</span>
        </div>
        <div class="detail-item">
          <label>发起时间</label>
          <span>{{ detail.request_datetime }}</span>
        </div>
        <div class="detail-item">
          <label>发起日期</label>
          <span>{{ detail.request_date }}</span>
        </div>
        <div class="detail-item">
          <label>当前状态</label>
          <span><StatusTag :status="detail.status" /></span>
        </div>
        <div class="detail-item">
          <label>创建时间</label>
          <span>{{ detail.created_at }}</span>
        </div>
      </div>

      <div class="status-actions">
        <el-button class="secondary-action" @click="changeStatus('processing')">标记为处理中</el-button>
        <el-button class="secondary-action" @click="changeStatus('waiting_confirm')">标记为待确认</el-button>
        <el-button class="primary-action small" @click="changeStatus('completed')">标记为已完成</el-button>
      </div>
    </section>

    <section class="page-card">
      <div class="page-header">
        <div>
          <h2>处理日志</h2>
          <p>记录求助单的处理变更过程</p>
        </div>
      </div>
      <div class="log-list">
        <div v-for="item in detail.logs" :key="item.id" class="log-item">
          <div>
            <strong>{{ item.operator_name }}</strong>
            <p>{{ item.action_content }}</p>
          </div>
          <span>{{ item.created_at }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { getHelpRequestDetailApi, updateHelpRequestStatusApi } from '../../api';
import StatusTag from '../../components/StatusTag.vue';

const route = useRoute();
const router = useRouter();

const detail = reactive({
  logs: []
});

async function loadDetail() {
  const result = await getHelpRequestDetailApi(route.params.id);
  Object.assign(detail, result.data);
}

async function changeStatus(status) {
  await updateHelpRequestStatusApi(route.params.id, status);
  ElMessage.success('状态更新成功');
  await loadDetail();
}

onMounted(loadDetail);
</script>
