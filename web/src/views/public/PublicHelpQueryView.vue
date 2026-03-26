<template>
  <div class="public-page public-query-page">
    <div class="query-layout">
      <section class="page-card public-query-card">
        <div class="page-header with-action">
          <div>
            <h2>求助查询</h2>
            <p>通过求助单号与发起人姓名查询处理进展，并在待确认时完成结果确认。</p>
          </div>
          <div class="query-header-actions">
            <el-button class="secondary-action" @click="router.push('/help-request')">提交求助</el-button>
            <el-button class="secondary-action" @click="router.push('/login')">返回登录</el-button>
          </div>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="query-form">
          <div class="form-grid">
            <el-form-item label="求助单号" prop="requestNo">
              <el-input
                v-model="form.requestNo"
                maxlength="30"
                placeholder="请输入求助单号"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="发起人姓名" prop="requesterName">
              <el-input
                v-model="form.requesterName"
                maxlength="50"
                placeholder="请输入发起人姓名"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </div>

          <el-form-item>
            <el-button class="primary-action" :loading="querying" @click="handleQuery">
              查询求助单
            </el-button>
          </el-form-item>
        </el-form>
      </section>

      <template v-if="detail">
        <section class="page-card">
          <div class="page-header with-action">
            <div>
              <h2>求助详情</h2>
              <p>展示当前求助单的基础信息与最新处理状态。</p>
            </div>
            <div class="table-meta-note">当前状态：{{ statusTextMap[detail.status] || detail.status }}</div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <label>求助单号</label>
              <span>{{ detail.request_no || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>标题</label>
              <span>{{ detail.title || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>发起人姓名</label>
              <span>{{ detail.requester_name || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>帮助人员</label>
              <span>{{ detail.helper_name || '-' }}</span>
            </div>
            <div class="detail-item full-width">
              <label>内容</label>
              <span>{{ detail.content || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>当前状态</label>
              <span><StatusTag :status="detail.status" /></span>
            </div>
            <div class="detail-item">
              <label>发起时间</label>
              <span>{{ detail.request_datetime || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>发起日期</label>
              <span>{{ detail.request_date || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>发起 IP</label>
              <span>{{ detail.requester_ip || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>确认说明</label>
              <span>{{ detail.requester_feedback || '-' }}</span>
            </div>
          </div>

          <div v-if="detail.status === 'waiting_confirm'" class="status-actions">
            <el-button class="primary-action small" :loading="confirming" @click="handleConfirm('confirm')">
              确认已解决
            </el-button>
            <el-button class="secondary-action" :loading="rejecting" @click="handleConfirm('reject')">
              退回继续处理
            </el-button>
          </div>
        </section>

        <section class="page-card">
          <div class="page-header">
            <div>
              <h2>最近处理日志</h2>
              <p>展示最近的处理记录与状态变更。</p>
            </div>
          </div>

          <div v-if="recentLogs.length" class="log-list">
            <div v-for="item in recentLogs" :key="item.id" class="log-item">
              <div>
                <strong>{{ item.operator_name }}</strong>
                <p>{{ item.action_content }}</p>
              </div>
              <span>{{ item.created_at }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无处理日志" />
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import {
  confirmPublicHelpRequestApi,
  queryPublicHelpRequestApi
} from '../../api';
import StatusTag from '../../components/StatusTag.vue';

const router = useRouter();
const formRef = ref();
const querying = ref(false);
const confirming = ref(false);
const rejecting = ref(false);
const detail = ref(null);

const form = reactive({
  requestNo: '',
  requesterName: ''
});

const rules = {
  requestNo: [{ required: true, message: '请输入求助单号', trigger: 'blur' }],
  requesterName: [{ required: true, message: '请输入发起人姓名', trigger: 'blur' }]
};

const statusTextMap = {
  pending: '待处理',
  processing: '处理中',
  waiting_confirm: '待确认',
  completed: '已完成'
};

const recentLogs = computed(() => {
  return Array.isArray(detail.value?.logs) ? detail.value.logs.slice(0, 5) : [];
});

async function fetchDetail() {
  const result = await queryPublicHelpRequestApi({
    requestNo: form.requestNo.trim(),
    requesterName: form.requesterName.trim()
  });
  detail.value = result.data;
}

async function handleQuery() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  querying.value = true;
  try {
    await fetchDetail();
    ElMessage.success('查询成功');
  } finally {
    querying.value = false;
  }
}

async function handleConfirm(action) {
  const loadingRef = action === 'confirm' ? confirming : rejecting;
  const title = action === 'confirm' ? '确认已解决' : '退回继续处理';
  const prompt = action === 'confirm'
    ? '如有补充说明，可选填后提交确认。'
    : '请填写退回原因或补充说明（可选）。';

  try {
    const { value } = await ElMessageBox.prompt(prompt, title, {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入说明内容（选填）',
      inputType: 'textarea',
      inputValidator: (inputValue) => {
        if (inputValue && inputValue.length > 255) {
          return '说明内容不能超过255个字符';
        }
        return true;
      }
    });

    loadingRef.value = true;
    await confirmPublicHelpRequestApi(detail.value.id, {
      action,
      feedback: value?.trim() || ''
    });
    await fetchDetail();
    ElMessage.success(action === 'confirm' ? '已确认完成' : '已退回继续处理');
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return;
    }
    throw error;
  } finally {
    loadingRef.value = false;
  }
}
</script>
