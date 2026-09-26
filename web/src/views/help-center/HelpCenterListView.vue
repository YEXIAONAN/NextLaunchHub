<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>求助中心</h2>
          <p>管理员可查看全部求助单，帮助人员查看本人负责的求助单，发起人查看自己提交的求助单。</p>
        </div>
        <el-button class="primary-action small" @click="router.push('/help-request')">
          新建求助
        </el-button>
      </div>

      <div class="help-request-toolbar">
        <el-input
          v-model="filters.keyword"
          class="help-request-keyword"
          clearable
          placeholder="搜索单号、标题、人员、项目或 IP"
          @clear="handleFilterChange"
          @keyup.enter="handleFilterChange"
        />

        <el-select v-model="filters.status" placeholder="按状态筛选" clearable @change="handleFilterChange">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="待确认" value="waiting_confirm" />
          <el-option label="已完成" value="completed" />
        </el-select>

        <el-select v-model="filters.isTimeout" placeholder="按超时状态筛选" clearable @change="handleFilterChange">
          <el-option label="已超时" value="1" />
          <el-option label="正常" value="0" />
        </el-select>

        <el-select
          v-model="filters.projectId"
          filterable
          clearable
          placeholder="按项目筛选"
          :loading="loadingProjects"
          @change="handleProjectChange"
        >
          <el-option
            v-for="item in projectOptions"
            :key="item.id"
            :label="`${item.project_name}（${item.project_code}）`"
            :value="item.id"
          />
        </el-select>

        <el-select
          v-model="filters.taskId"
          filterable
          clearable
          placeholder="按任务筛选"
          :loading="loadingTasks"
          :disabled="!filters.projectId"
          @change="loadList"
        >
          <el-option
            v-for="item in taskOptions"
            :key="item.id"
            :label="`${item.title}（${item.task_code}）`"
            :value="item.id"
          />
        </el-select>

        <el-button class="secondary-action" @click="handleFilterChange">查询</el-button>
        <el-button class="secondary-action" :disabled="!hasActiveFilters" @click="resetFilters">重置</el-button>
        <el-button class="secondary-action" :loading="exporting" @click="exportCurrentList">导出当前结果</el-button>
      </div>

      <div class="table-summary-row">
        <span>共 {{ pagination.total }} 条记录</span>
        <span v-if="hasActiveFilters">已应用筛选条件</span>
      </div>

      <el-table
        v-loading="loadingList"
        :data="list"
        class="custom-table clickable-table"
        :row-class-name="getRowClassName"
        @row-click="goDetail"
      >
        <el-table-column prop="request_no" label="求助单号" min-width="170" />
        <el-table-column prop="title" label="求助标题" min-width="220" />
        <el-table-column prop="requester_name" label="发起人姓名" min-width="120" />
        <el-table-column prop="helper_name" label="帮助人员姓名" min-width="120" />
        <el-table-column label="所属项目" min-width="200">
          <template #default="{ row }">
            <div class="relation-cell">
              <strong>{{ row.project_name || '-' }}</strong>
              <span v-if="row.project_id">ID: {{ row.project_id }}</span>
            </div>
          </template>
        </el-table-column>
<!--        <el-table-column label="关联任务" min-width="220">-->
<!--          <template #default="{ row }">-->
<!--            <div class="relation-cell">-->
<!--              <strong>{{ row.task_title || '-' }}</strong>-->
<!--              <span v-if="row.task_id">ID: {{ row.task_id }}</span>-->
<!--            </div>-->
<!--          </template>-->
<!--        </el-table-column>-->
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
        <el-table-column label="发起时间" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.request_datetime) }}</template>
        </el-table-column>
        <el-table-column prop="requester_ip" label="发起 IP" min-width="140" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link class="text-action" @click.stop="goDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="help-request-pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { exportHelpRequestsApi, getHelpRequestsApi, getProjectTasksApi, getProjectsApi } from '../../api';
import StatusTag from '../../components/StatusTag.vue';
import { formatDateTime } from '../../utils/date-time';

const router = useRouter();
const route = useRoute();
const list = ref([]);
const projectOptions = ref([]);
const taskOptions = ref([]);
const loadingList = ref(false);
const loadingProjects = ref(false);
const loadingTasks = ref(false);
const exporting = ref(false);

const filters = reactive({
  keyword: String(route.query.keyword || ''),
  status: String(route.query.status || ''),
  isTimeout: String(route.query.isTimeout || ''),
  projectId: route.query.projectId ? Number(route.query.projectId) : '',
  taskId: route.query.taskId ? Number(route.query.taskId) : ''
});

const pagination = reactive({
  page: Number(route.query.page) || 1,
  pageSize: Number(route.query.pageSize) || 10,
  total: 0
});

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.keyword ||
    filters.status ||
    filters.isTimeout ||
    filters.projectId ||
    filters.taskId
  );
});

async function loadProjects() {
  loadingProjects.value = true;
  try {
    const result = await getProjectsApi({
      page: 1,
      pageSize: 100
    });
    projectOptions.value = result.data.list;
  } finally {
    loadingProjects.value = false;
  }
}

async function loadTasks(projectId) {
  if (!projectId) {
    taskOptions.value = [];
    return;
  }

  loadingTasks.value = true;
  try {
    const result = await getProjectTasksApi(projectId, {
      page: 1,
      pageSize: 100
    });
    taskOptions.value = result.data.list;
  } finally {
    loadingTasks.value = false;
  }
}

async function handleProjectChange(projectId) {
  filters.taskId = '';
  await loadTasks(projectId);
  await loadList();
}

async function loadList() {
  loadingList.value = true;
  try {
    const result = await getHelpRequestsApi({
      ...buildFilterParams(),
      page: pagination.page,
      pageSize: pagination.pageSize
    });
    list.value = result.data.list;
    pagination.page = result.data.pagination.page;
    pagination.pageSize = result.data.pagination.pageSize;
    pagination.total = result.data.pagination.total;
    syncRouteQuery();
  } finally {
    loadingList.value = false;
  }
}

function buildFilterParams() {
  return {
    keyword: filters.keyword.trim() || undefined,
    status: filters.status || undefined,
    isTimeout: filters.isTimeout || undefined,
    projectId: filters.projectId || undefined,
    taskId: filters.taskId || undefined
  };
}

function getRowClassName({ row }) {
  return Number(row.is_timeout) === 1 ? 'timeout-row' : '';
}

function goDetail(row) {
  router.push(`/help-center/${row.id}`);
}

function syncRouteQuery() {
  const query = {};
  if (filters.keyword.trim()) query.keyword = filters.keyword.trim();
  if (filters.status) query.status = filters.status;
  if (filters.isTimeout) query.isTimeout = filters.isTimeout;
  if (filters.projectId) query.projectId = filters.projectId;
  if (filters.taskId) query.taskId = filters.taskId;
  if (pagination.page > 1) query.page = pagination.page;
  if (pagination.pageSize !== 10) query.pageSize = pagination.pageSize;
  router.replace({ query });
}

function handleFilterChange() {
  pagination.page = 1;
  loadList();
}

function handlePageChange(page) {
  pagination.page = page;
  loadList();
}

function handleSizeChange(pageSize) {
  pagination.page = 1;
  pagination.pageSize = pageSize;
  loadList();
}

function resetFilters() {
  filters.keyword = '';
  filters.status = '';
  filters.isTimeout = '';
  filters.projectId = '';
  filters.taskId = '';
  taskOptions.value = [];
  pagination.page = 1;
  pagination.pageSize = 10;
  loadList();
}

async function exportCurrentList() {
  exporting.value = true;
  try {
    const response = await exportHelpRequestsApi(buildFilterParams());
    const contentDisposition = response.headers['content-disposition'] || '';
    const matchedFileName = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
    const fileName = matchedFileName
      ? decodeURIComponent(matchedFileName[1] || matchedFileName[2])
      : `求助列表-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    exporting.value = false;
  }
}

onMounted(async () => {
  await loadProjects();
  if (filters.projectId) {
    await loadTasks(filters.projectId);
  }
  await loadList();
});

watch(
  () => [
    route.query.keyword,
    route.query.status,
    route.query.isTimeout,
    route.query.projectId,
    route.query.taskId,
    route.query.page,
    route.query.pageSize
  ],
  async ([keyword, status, isTimeout, projectId, taskId, page, pageSize]) => {
    const nextProjectId = projectId ? Number(projectId) : '';
    if (String(filters.keyword) === String(keyword || '') &&
      String(filters.status) === String(status || '') &&
      String(filters.isTimeout) === String(isTimeout || '') &&
      String(filters.projectId || '') === String(nextProjectId || '') &&
      String(filters.taskId || '') === String(taskId || '') &&
      Number(pagination.page) === (Number(page) || 1) &&
      Number(pagination.pageSize) === (Number(pageSize) || 10)) {
      return;
    }

    filters.keyword = String(keyword || '');
    filters.status = String(status || '');
    filters.isTimeout = String(isTimeout || '');
    filters.projectId = nextProjectId;
    filters.taskId = taskId ? Number(taskId) : '';
    pagination.page = Number(page) || 1;
    pagination.pageSize = Number(pageSize) || 10;
    if (filters.projectId) {
      await loadTasks(filters.projectId);
    } else {
      taskOptions.value = [];
    }
    await loadList();
  }
);
</script>
