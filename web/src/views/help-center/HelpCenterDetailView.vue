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
        <div class="detail-item">
          <label>所属项目</label>
          <span>{{ detail.project_name || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>关联任务</label>
          <span>{{ detail.task_title || '-' }}</span>
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
          <label>超时状态</label>
          <span>
            <span v-if="Number(detail.is_timeout) === 1" class="timeout-pill">已超时</span>
            <span v-else class="table-meta-note">正常</span>
          </span>
        </div>
        <div class="detail-item">
          <label>截止时间</label>
          <span>{{ detail.deadline_at || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>创建时间</label>
          <span>{{ detail.created_at }}</span>
        </div>
      </div>

      <div v-if="canUpdateStatus || isAdmin" class="status-actions">
        <el-button class="secondary-action" @click="changeStatus('processing')">标记为处理中</el-button>
        <el-button class="secondary-action" @click="changeStatus('waiting_confirm')">标记为待确认</el-button>
        <el-button class="primary-action small" @click="changeStatus('completed')">标记为已完成</el-button>
        <el-button v-if="isAdmin" class="secondary-action" @click="openReassignDialog">改派帮助人员</el-button>
      </div>
    </section>

    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>协同处理</h2>
          <p>查看协同人员、补充协同记录，并保持处理过程可追踪。</p>
        </div>
        <el-button v-if="canAddAssistant" class="secondary-action" @click="openAssistantDialog">
          添加协同人员
        </el-button>
      </div>

      <div class="collaboration-layout">
        <div class="collaboration-block">
          <div class="collaboration-block-header">
            <h3>当前协同人员</h3>
            <span class="table-meta-note">共 {{ assistants.length }} 人</span>
          </div>
          <div v-if="assistants.length" class="assistant-list">
            <div v-for="item in assistants" :key="item.id" class="assistant-item">
              <div>
                <strong>{{ item.assistant_name }}</strong>
                <p>加入时间：{{ item.created_at }}</p>
              </div>
              <span>添加人：{{ item.added_by_name }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无协同人员" />
        </div>

        <div class="collaboration-block">
          <div class="collaboration-block-header">
            <h3>新增协同处理记录</h3>
            <span class="table-meta-note">
              {{ canSubmitCollaborationLog ? '可提交协同记录' : '当前无提交权限' }}
            </span>
          </div>

          <el-input
            v-model="collaborationForm.content"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            placeholder="请输入协同处理说明"
            :disabled="!canSubmitCollaborationLog"
          />

          <div class="collaboration-actions">
            <el-button
              class="primary-action small"
              :loading="submittingCollaborationLog"
              :disabled="!canSubmitCollaborationLog"
              @click="submitCollaborationLog"
            >
              提交协同记录
            </el-button>
          </div>
        </div>
      </div>

      <div class="collaboration-log-section">
        <div class="collaboration-block-header">
          <h3>协同处理记录</h3>
          <span class="table-meta-note">按时间倒序展示</span>
        </div>
        <div v-if="collaborationLogs.length" class="log-list">
          <div v-for="item in collaborationLogs" :key="item.id" class="log-item">
            <div>
              <strong>{{ item.operator_name }}</strong>
              <p>{{ item.action_content }}</p>
            </div>
            <span>{{ item.created_at }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无协同处理记录" />
      </div>
    </section>

    <section class="page-card">
      <div class="page-header">
        <div>
          <h2>处理日志</h2>
          <p>记录求助单的处理变更过程</p>
        </div>
      </div>
      <div class="timeline-list">
        <div v-for="item in detail.logs" :key="item.id" class="timeline-item">
          <div class="timeline-axis">
            <span class="timeline-dot"></span>
            <span class="timeline-line"></span>
          </div>
          <div class="timeline-card">
            <div class="timeline-card-head">
              <div class="timeline-title-wrap">
                <strong>{{ actionTypeTextMap[item.action_type] || item.action_type }}</strong>
                <span class="timeline-operator">{{ item.operator_name }}</span>
              </div>
              <span class="timeline-time">{{ item.created_at }}</span>
            </div>
            <p>{{ item.action_content }}</p>
          </div>
        </div>
      </div>
    </section>

    <el-dialog v-model="assistantDialogVisible" title="添加协同人员" width="520px">
      <el-form label-position="top">
        <el-form-item label="帮助人员">
          <el-select
            v-model="assistantForm.assistantUserId"
            filterable
            remote
            reserve-keyword
            placeholder="请输入姓名检索"
            :remote-method="loadHelperOptions"
            :loading="loadingHelperOptions"
            style="width: 100%"
          >
            <el-option
              v-for="item in helperOptions"
              :key="item.id"
              :label="item.real_name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="assistantDialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submittingAssistant" @click="submitAssistant">
            添加
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="reassignDialogVisible" title="改派帮助人员" width="520px">
      <el-form label-position="top">
        <el-form-item label="新的帮助人员">
          <el-select
            v-model="reassignForm.helperUserId"
            filterable
            remote
            reserve-keyword
            placeholder="请输入姓名检索"
            :remote-method="loadHelperOptions"
            :loading="loadingHelperOptions"
            style="width: 100%"
          >
            <el-option
              v-for="item in helperOptions"
              :key="item.id"
              :label="item.real_name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="reassignDialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submittingReassign" @click="submitReassign">
            确认改派
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import {
  addHelpRequestAssistantApi,
  addHelpRequestCollaborationLogApi,
  getHelpRequestAssistantsApi,
  getHelpRequestDetailApi,
  getHelpersApi,
  reassignHelpRequestHelperApi,
  updateHelpRequestStatusApi
} from '../../api';
import StatusTag from '../../components/StatusTag.vue';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const assistantDialogVisible = ref(false);
const reassignDialogVisible = ref(false);
const submittingAssistant = ref(false);
const submittingCollaborationLog = ref(false);
const submittingReassign = ref(false);
const loadingHelperOptions = ref(false);
const helperOptions = ref([]);
const assistants = ref([]);

const detail = reactive({
  assistants: [],
  logs: []
});
const collaborationForm = reactive({
  content: ''
});
const assistantForm = reactive({
  assistantUserId: ''
});
const reassignForm = reactive({
  helperUserId: ''
});
const actionTypeTextMap = {
  create: '发起求助',
  status_update: '状态更新',
  add_assistant: '添加协同人员',
  assistant_added: '添加协同人员',
  reassign_helper: '改派帮助人员',
  collaboration: '协同处理记录',
  requester_confirm: '发起人确认完成',
  requester_reject: '发起人退回处理'
};

const collaborationLogs = computed(() => {
  return (detail.logs || []).filter((item) => item.action_type === 'collaboration');
});

const canAddAssistant = computed(() => {
  return authStore.user?.role === 'admin' || authStore.user?.id === detail.helper_user_id;
});

const canSubmitCollaborationLog = computed(() => {
  return authStore.user?.role === 'admin'
    || assistants.value.some((item) => item.assistant_user_id === authStore.user?.id);
});
const isAdmin = computed(() => authStore.user?.role === 'admin');
const canUpdateStatus = computed(() => {
  return authStore.user?.role === 'admin' || authStore.user?.id === detail.helper_user_id;
});

async function loadDetail() {
  const result = await getHelpRequestDetailApi(route.params.id);
  Object.assign(detail, result.data);
  assistants.value = Array.isArray(result.data.assistants) ? result.data.assistants : [];
}

async function loadAssistants() {
  const result = await getHelpRequestAssistantsApi(route.params.id);
  assistants.value = result.data;
  detail.assistants = result.data;
}

async function loadHelperOptions(keyword = '') {
  loadingHelperOptions.value = true;
  try {
    const result = await getHelpersApi(keyword);
    helperOptions.value = result.data;
  } finally {
    loadingHelperOptions.value = false;
  }
}

async function changeStatus(status) {
  await updateHelpRequestStatusApi(route.params.id, status);
  ElMessage.success('状态更新成功');
  await loadDetail();
  await loadAssistants();
}

function openAssistantDialog() {
  assistantForm.assistantUserId = '';
  helperOptions.value = [];
  assistantDialogVisible.value = true;
  loadHelperOptions();
}

function openReassignDialog() {
  reassignForm.helperUserId = '';
  helperOptions.value = [];
  reassignDialogVisible.value = true;
  loadHelperOptions();
}

async function submitAssistant() {
  if (!assistantForm.assistantUserId) {
    ElMessage.warning('请选择协同人员');
    return;
  }

  submittingAssistant.value = true;
  try {
    await addHelpRequestAssistantApi(route.params.id, {
      assistantUserId: assistantForm.assistantUserId
    });
    ElMessage.success('协同人员添加成功');
    assistantDialogVisible.value = false;
    await loadDetail();
    await loadAssistants();
  } finally {
    submittingAssistant.value = false;
  }
}

async function submitCollaborationLog() {
  const content = collaborationForm.content.trim();
  if (!content) {
    ElMessage.warning('请输入协同处理说明');
    return;
  }

  submittingCollaborationLog.value = true;
  try {
    await addHelpRequestCollaborationLogApi(route.params.id, { content });
    ElMessage.success('协同处理记录提交成功');
    collaborationForm.content = '';
    await loadDetail();
  } finally {
    submittingCollaborationLog.value = false;
  }
}

async function submitReassign() {
  if (!reassignForm.helperUserId) {
    ElMessage.warning('请选择新的帮助人员');
    return;
  }

  submittingReassign.value = true;
  try {
    await reassignHelpRequestHelperApi(route.params.id, {
      helperUserId: reassignForm.helperUserId
    });
    ElMessage.success('改派帮助人员成功');
    reassignDialogVisible.value = false;
    await loadDetail();
    await loadAssistants();
  } finally {
    submittingReassign.value = false;
  }
}

onMounted(async () => {
  await loadDetail();
  await loadAssistants();
});
</script>
