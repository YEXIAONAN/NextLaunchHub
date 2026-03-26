<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>项目详情</h2>
          <p>查看项目基础信息、成员安排，并为后续任务和里程碑管理预留结构。</p>
        </div>
        <el-button class="secondary-action" @click="router.push('/projects')">返回列表</el-button>
      </div>

      <div class="project-detail-layout">
        <div class="project-detail-main">
          <section class="project-member-section">
            <div class="page-header with-action">
              <div>
                <h2>基础信息</h2>
                <p>项目主信息与推进状态。</p>
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <label>项目编号</label>
                <span>{{ detail.project_code }}</span>
              </div>
              <div class="detail-item">
                <label>项目名称</label>
                <span>{{ detail.project_name }}</span>
              </div>
              <div class="detail-item">
                <label>项目负责人</label>
                <span>{{ detail.owner_name }}</span>
              </div>
              <div class="detail-item">
                <label>项目优先级</label>
                <span class="project-priority-pill" :class="`project-priority-${detail.priority}`">
                  {{ priorityTextMap[detail.priority] || detail.priority || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <label>项目状态</label>
                <span class="project-status-pill" :class="`project-status-${detail.status}`">
                  {{ statusTextMap[detail.status] || detail.status || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <label>项目进度</label>
                <div class="project-progress">
                  <div class="project-progress-track">
                    <div class="project-progress-fill" :style="{ width: `${Number(detail.progress || 0)}%` }"></div>
                  </div>
                  <span>{{ Number(detail.progress || 0) }}%</span>
                </div>
              </div>
              <div class="detail-item">
                <label>开始日期</label>
                <span>{{ detail.start_date || '-' }}</span>
              </div>
              <div class="detail-item">
                <label>结束日期</label>
                <span>{{ detail.end_date || '-' }}</span>
              </div>
              <div class="detail-item full-width">
                <label>项目描述</label>
                <span>{{ detail.description || '暂无项目描述' }}</span>
              </div>
            </div>
          </section>

          <section class="page-card project-placeholder-section">
            <div class="page-header with-action">
              <div>
                <h2>任务列表</h2>
                <p>展示当前项目下的任务，优先关注状态、负责人和截止时间。</p>
              </div>
              <el-button v-if="canManageTasks" class="secondary-action" @click="taskDialogVisible = true">
                快速创建任务
              </el-button>
            </div>
            <div v-if="tasks.length" class="project-task-list">
              <div v-for="item in tasks" :key="item.id" class="project-task-item">
                <div class="project-task-main">
                  <div class="project-task-title">
                    <strong>{{ item.title }}</strong>
                    <span class="task-status-pill" :class="`task-status-${item.status}`">
                      {{ taskStatusTextMap[item.status] || item.status }}
                    </span>
                  </div>
                  <p>{{ item.task_code }} ｜ {{ item.assignee_name || '未分配负责人' }}</p>
                </div>
                <div class="project-task-side">
                  <span class="task-priority-pill" :class="`task-priority-${item.priority}`">
                    {{ taskPriorityTextMap[item.priority] || item.priority }}
                  </span>
                  <span>{{ item.due_date || '未设置截止日期' }}</span>
                  <el-button link class="text-action" @click="openTaskDetail(item.id)">查看详情</el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="当前项目下暂无任务" />
          </section>
        </div>

        <div class="project-detail-side">
          <section class="page-card project-member-section">
            <div class="page-header with-action">
              <div>
                <h2>项目成员</h2>
                <p>成员信息与项目角色安排。</p>
              </div>
              <el-button v-if="canManageMembers" class="secondary-action" @click="openMemberDialog">
                新增成员
              </el-button>
            </div>

            <div v-if="members.length" class="project-member-list">
              <div v-for="item in members" :key="item.id" class="project-member-item">
                <div>
                  <strong>{{ item.real_name }}</strong>
                  <p>加入时间：{{ item.created_at }}</p>
                </div>
                <span class="project-member-meta">{{ item.role_in_project }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无项目成员" />
          </section>

          <section class="page-card project-placeholder-section">
            <div class="page-header">
              <div>
                <h2>里程碑区域</h2>
                <p>预留给后续阶段计划和节点达成管理。</p>
              </div>
            </div>
            <div class="project-placeholder-card">
              <span>Coming Next</span>
              <h3>里程碑模块占位</h3>
              <p>后续将在这里接入版本节点、验收目标、时间规划与阶段状态记录。</p>
            </div>
          </section>
        </div>
      </div>
    </section>

    <el-dialog v-model="memberDialogVisible" title="新增项目成员" width="520px">
      <el-form label-position="top">
        <el-form-item label="成员姓名">
          <el-select
            v-model="memberForm.userId"
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

        <el-form-item label="项目角色">
          <el-input v-model="memberForm.roleInProject" maxlength="50" placeholder="请输入项目角色" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="memberDialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submittingMember" @click="submitMember">
            添加成员
          </el-button>
        </div>
      </template>
    </el-dialog>

    <TaskCreateDialog
      v-model="taskDialogVisible"
      :default-project-id="route.params.id"
      :lock-project="true"
      @success="loadTasks"
    />

    <TaskDetailDrawer
      v-model="taskDrawerVisible"
      :task-id="currentTaskId"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import {
  addProjectMemberApi,
  getHelpersApi,
  getProjectDetailApi,
  getProjectMembersApi,
  getProjectTasksApi
} from '../../api';
import TaskCreateDialog from '../../components/tasks/TaskCreateDialog.vue';
import TaskDetailDrawer from '../../components/tasks/TaskDetailDrawer.vue';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const detail = reactive({
  project_code: '',
  project_name: '',
  owner_user_id: null,
  owner_name: '',
  priority: '',
  status: '',
  start_date: '',
  end_date: '',
  progress: 0,
  description: ''
});

const members = ref([]);
const tasks = ref([]);
const helperOptions = ref([]);
const loadingHelperOptions = ref(false);
const memberDialogVisible = ref(false);
const submittingMember = ref(false);
const taskDialogVisible = ref(false);
const taskDrawerVisible = ref(false);
const currentTaskId = ref(null);

const memberForm = reactive({
  userId: '',
  roleInProject: ''
});

const statusOptions = [
  { label: '未开始', value: 'not_started' },
  { label: '进行中', value: 'in_progress' },
  { label: '已暂停', value: 'paused' },
  { label: '已完成', value: 'completed' },
  { label: '已归档', value: 'archived' }
];

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' }
];

const statusTextMap = Object.fromEntries(statusOptions.map((item) => [item.value, item.label]));
const priorityTextMap = Object.fromEntries(priorityOptions.map((item) => [item.value, item.label]));
const taskStatusTextMap = {
  todo: '待开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
  cancelled: '已取消'
};
const taskPriorityTextMap = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
};

const canManageMembers = computed(() => {
  return authStore.user?.role === 'admin' || Number(authStore.user?.id) === Number(detail.owner_user_id);
});
const canManageTasks = computed(() => {
  return authStore.user?.role === 'admin' || Number(authStore.user?.id) === Number(detail.owner_user_id);
});

async function loadDetail() {
  const result = await getProjectDetailApi(route.params.id);
  Object.assign(detail, result.data);
}

async function loadMembers() {
  const result = await getProjectMembersApi(route.params.id);
  members.value = result.data;
}

async function loadTasks() {
  const result = await getProjectTasksApi(route.params.id, {
    page: 1,
    pageSize: 20
  });
  tasks.value = result.data.list;
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

function openMemberDialog() {
  memberForm.userId = '';
  memberForm.roleInProject = '';
  helperOptions.value = [];
  memberDialogVisible.value = true;
  loadHelperOptions();
}

async function submitMember() {
  if (!memberForm.userId) {
    ElMessage.warning('请选择项目成员');
    return;
  }

  if (!memberForm.roleInProject.trim()) {
    ElMessage.warning('请输入项目角色');
    return;
  }

  submittingMember.value = true;
  try {
    await addProjectMemberApi(route.params.id, {
      userId: memberForm.userId,
      roleInProject: memberForm.roleInProject.trim()
    });
    ElMessage.success('项目成员添加成功');
    memberDialogVisible.value = false;
    await loadMembers();
  } finally {
    submittingMember.value = false;
  }
}

function openTaskDetail(taskId) {
  currentTaskId.value = taskId;
  taskDrawerVisible.value = true;
}

onMounted(async () => {
  await Promise.all([loadDetail(), loadMembers(), loadTasks()]);
});
</script>
