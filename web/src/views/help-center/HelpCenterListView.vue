<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header">
        <div>
          <h2>求助中心</h2>
          <p>管理员可查看全部求助单，帮助人员查看本人负责的求助单，发起人查看自己提交的求助单。</p>
        </div>
      </div>

      <div class="help-request-toolbar">
        <el-select v-model="filters.status" placeholder="按状态筛选" clearable @change="loadList">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="待确认" value="waiting_confirm" />
          <el-option label="已完成" value="completed" />
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
      </div>

      <el-table :data="list" class="custom-table" :row-class-name="getRowClassName">
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
        <el-table-column prop="request_datetime" label="发起时间" min-width="180" />
        <el-table-column prop="requester_ip" label="发起 IP" min-width="140" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link class="text-action" @click="router.push(`/help-center/${row.id}`)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getHelpRequestsApi, getProjectTasksApi, getProjectsApi } from '../../api';
import StatusTag from '../../components/StatusTag.vue';

const router = useRouter();
const list = ref([]);
const projectOptions = ref([]);
const taskOptions = ref([]);
const loadingProjects = ref(false);
const loadingTasks = ref(false);

const filters = reactive({
  status: '',
  projectId: '',
  taskId: ''
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
  const result = await getHelpRequestsApi({
    status: filters.status,
    projectId: filters.projectId || undefined,
    taskId: filters.taskId || undefined
  });
  list.value = result.data;
}

function getRowClassName({ row }) {
  return Number(row.is_timeout) === 1 ? 'timeout-row' : '';
}

onMounted(async () => {
  await loadProjects();
  await loadList();
});
</script>
