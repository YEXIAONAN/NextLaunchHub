<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>任务管理</h2>
          <p>优先关注任务状态、负责人和截止时间，快速定位需要推进的工作项。</p>
        </div>
        <el-button v-if="canCreateTask" class="primary-action small" @click="createDialogVisible = true">
          新建任务
        </el-button>
      </div>

      <div class="task-toolbar">
        <el-input
          v-model="filters.keyword"
          class="task-keyword"
          clearable
          placeholder="搜索任务编号或标题"
          @keyup.enter="handleFilterChange"
          @clear="handleFilterChange"
        />

        <el-select v-model="filters.projectId" clearable placeholder="所属项目" @change="handleFilterChange">
          <el-option label="全部项目" value="" />
          <el-option
            v-for="item in projectOptions"
            :key="item.id"
            :label="item.project_name"
            :value="item.id"
          />
        </el-select>

        <el-select v-model="filters.status" clearable placeholder="任务状态" @change="handleFilterChange">
          <el-option label="全部状态" value="" />
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select v-model="filters.priority" clearable placeholder="任务优先级" @change="handleFilterChange">
          <el-option label="全部优先级" value="" />
          <el-option
            v-for="item in priorityOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-button class="secondary-action" @click="handleFilterChange">查询</el-button>
      </div>

      <el-table :data="tasks" class="custom-table">
        <el-table-column prop="task_code" label="任务编号" min-width="170" />
        <el-table-column label="所属项目" min-width="220">
          <template #default="{ row }">
            <div class="task-project-cell">
              <strong>{{ row.project_name }}</strong>
              <span>{{ row.project_code }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="任务标题" min-width="220" />
        <el-table-column prop="assignee_name" label="负责人" min-width="120">
          <template #default="{ row }">
            <span>{{ row.assignee_name || '未分配' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优先级" min-width="110">
          <template #default="{ row }">
            <span class="task-priority-pill" :class="`task-priority-${row.priority}`">
              {{ dictionaryStore.getLabel('task_priority', row.priority) || row.priority }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <span class="task-status-pill" :class="`task-status-${row.status}`">
              {{ dictionaryStore.getLabel('task_status', row.status) || row.status }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="进度" min-width="170">
          <template #default="{ row }">
            <div class="project-progress">
              <div class="project-progress-track">
                <div class="project-progress-fill" :style="{ width: `${Number(row.progress || 0)}%` }"></div>
              </div>
              <span>{{ Number(row.progress || 0) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="开始日期" min-width="130">
          <template #default="{ row }">{{ formatDate(row.start_date) }}</template>
        </el-table-column>
        <el-table-column label="截止日期" min-width="130">
          <template #default="{ row }">{{ formatDate(row.due_date) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canSyncTask(row)" link class="text-action" @click="openProgressSync(row)">同步进度</el-button>
            <el-button link class="text-action" @click="openTaskDetail(row.id)">
              查看详情
            </el-button>
            <el-button v-if="canDeleteTask" link type="danger" @click="handleDeleteTask(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="task-pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="pagination.total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </section>

    <TaskCreateDialog
      v-model="createDialogVisible"
      @success="handleTaskCreated"
    />

    <TaskDetailDrawer
      v-model="detailDrawerVisible"
      :task-id="currentTaskId"
    />
    <TaskProgressDialog v-model="progressDialogVisible" :task="currentTask" @success="loadTasks" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { deleteTaskApi, getProjectsApi, getTasksApi } from '../../api';
import TaskCreateDialog from '../../components/tasks/TaskCreateDialog.vue';
import TaskDetailDrawer from '../../components/tasks/TaskDetailDrawer.vue';
import TaskProgressDialog from '../../components/tasks/TaskProgressDialog.vue';
import { useAuthStore } from '../../stores/auth';
import { useDictionaryStore } from '../../stores/dictionaries';
import { formatDate } from '../../utils/date-time';

const authStore = useAuthStore();
const dictionaryStore = useDictionaryStore();
const tasks = ref([]);
const projectOptions = ref([]);
const createDialogVisible = ref(false);
const detailDrawerVisible = ref(false);
const currentTaskId = ref(null);
const currentTask = ref(null);
const progressDialogVisible = ref(false);

const filters = reactive({
  keyword: '',
  projectId: '',
  status: '',
  priority: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const statusOptions = computed(() => dictionaryStore.getOptions('task_status').map((item) => ({
  label: item.dict_label,
  value: item.dict_value
})));

const priorityOptions = computed(() => dictionaryStore.getOptions('task_priority').map((item) => ({
  label: item.dict_label,
  value: item.dict_value
})));

const canCreateTask = computed(() => authStore.user?.role !== 'requester');
const canDeleteTask = computed(() => authStore.user?.role === 'admin');
function canSyncTask(task) {
  return authStore.user?.role === 'admin' || Number(task.assignee_user_id) === Number(authStore.user?.id);
}

async function loadProjectOptions() {
  const result = await getProjectsApi({
    page: 1,
    pageSize: 100
  });
  projectOptions.value = result.data.list;
}

async function loadTasks() {
  const result = await getTasksApi({
    keyword: filters.keyword,
    projectId: filters.projectId || undefined,
    status: filters.status,
    priority: filters.priority,
    page: pagination.page,
    pageSize: pagination.pageSize
  });

  tasks.value = result.data.list;
  pagination.page = result.data.pagination.page;
  pagination.pageSize = result.data.pagination.pageSize;
  pagination.total = result.data.pagination.total;
}

function handleFilterChange() {
  pagination.page = 1;
  loadTasks();
}

function handlePageChange(page) {
  pagination.page = page;
  loadTasks();
}

function handleSizeChange(pageSize) {
  pagination.page = 1;
  pagination.pageSize = pageSize;
  loadTasks();
}

function openTaskDetail(taskId) {
  currentTaskId.value = taskId;
  detailDrawerVisible.value = true;
}

function openProgressSync(task) {
  currentTask.value = task;
  progressDialogVisible.value = true;
}

async function handleTaskCreated() {
  await Promise.all([loadTasks(), loadProjectOptions()]);
}

async function handleDeleteTask(row) {
  const confirmed = await ElMessageBox.confirm(
    `确认删除任务“${row.title}”吗？历史求助记录会保留任务名称。`,
    '删除任务',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).catch(() => false);

  if (!confirmed) {
    return;
  }

  await deleteTaskApi(row.id);
  ElMessage.success('任务已删除');

  if (tasks.value.length === 1 && pagination.page > 1) {
    pagination.page -= 1;
  }

  await loadTasks();
}

onMounted(async () => {
  await dictionaryStore.ensureDictTypes(['task_status', 'task_priority']);
  await Promise.all([loadProjectOptions(), loadTasks()]);
});
</script>
