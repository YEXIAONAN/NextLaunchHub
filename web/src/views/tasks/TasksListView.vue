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
              {{ priorityTextMap[row.priority] || row.priority }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <span class="task-status-pill" :class="`task-status-${row.status}`">
              {{ statusTextMap[row.status] || row.status }}
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
        <el-table-column prop="start_date" label="开始日期" min-width="130" />
        <el-table-column prop="due_date" label="截止日期" min-width="130" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link class="text-action" @click="openTaskDetail(row.id)">
              查看详情
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { getProjectsApi, getTasksApi } from '../../api';
import TaskCreateDialog from '../../components/tasks/TaskCreateDialog.vue';
import TaskDetailDrawer from '../../components/tasks/TaskDetailDrawer.vue';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
const tasks = ref([]);
const projectOptions = ref([]);
const createDialogVisible = ref(false);
const detailDrawerVisible = ref(false);
const currentTaskId = ref(null);

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

const statusOptions = [
  { label: '待开始', value: 'todo' },
  { label: '进行中', value: 'in_progress' },
  { label: '受阻', value: 'blocked' },
  { label: '已完成', value: 'done' },
  { label: '已取消', value: 'cancelled' }
];

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' }
];

const statusTextMap = Object.fromEntries(statusOptions.map((item) => [item.value, item.label]));
const priorityTextMap = Object.fromEntries(priorityOptions.map((item) => [item.value, item.label]));

const canCreateTask = computed(() => authStore.user?.role !== 'requester');

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

async function handleTaskCreated() {
  await Promise.all([loadTasks(), loadProjectOptions()]);
}

onMounted(async () => {
  await Promise.all([loadProjectOptions(), loadTasks()]);
});
</script>
