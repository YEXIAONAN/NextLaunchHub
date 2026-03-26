<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>项目管理</h2>
          <p>按状态和优先级筛选项目，优先关注当前推进中的项目进展。</p>
        </div>
        <el-button v-if="canCreateProject" class="primary-action small" @click="openCreateDialog">
          新建项目
        </el-button>
      </div>

      <div class="project-toolbar">
        <el-input
          v-model="filters.keyword"
          class="project-keyword"
          clearable
          placeholder="搜索项目编号或项目名称"
          @keyup.enter="handleFilterChange"
          @clear="handleFilterChange"
        />

        <el-select v-model="filters.status" clearable placeholder="项目状态" @change="handleFilterChange">
          <el-option label="全部状态" value="" />
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select v-model="filters.priority" clearable placeholder="项目优先级" @change="handleFilterChange">
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

      <el-table :data="projects" class="custom-table">
        <el-table-column prop="project_code" label="项目编号" min-width="180" />
        <el-table-column prop="project_name" label="项目名称" min-width="220" />
        <el-table-column prop="owner_name" label="负责人" min-width="120" />
        <el-table-column label="优先级" min-width="110">
          <template #default="{ row }">
            <StatusTag type="priority" :value="row.priority" />
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <StatusTag type="status" :value="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" min-width="130" />
        <el-table-column prop="end_date" label="结束日期" min-width="130" />
        <el-table-column label="进度" min-width="180">
          <template #default="{ row }">
            <div class="project-progress">
              <div class="project-progress-track">
                <div class="project-progress-fill" :style="{ width: `${Number(row.progress || 0)}%` }"></div>
              </div>
              <span>{{ Number(row.progress || 0) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link class="text-action" @click="router.push(`/projects/${row.id}`)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="project-pagination">
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

    <el-dialog v-model="createDialogVisible" title="新建项目" width="620px">
      <el-form label-position="top">
        <div class="form-grid">
          <el-form-item label="项目名称">
            <el-input v-model="createForm.projectName" maxlength="100" placeholder="请输入项目名称" />
          </el-form-item>

          <el-form-item label="项目负责人">
            <el-select
              v-model="createForm.ownerUserId"
              filterable
              remote
              reserve-keyword
              placeholder="请输入姓名检索"
              :remote-method="loadHelperOptions"
              :loading="loadingHelperOptions"
            >
              <el-option
                v-for="item in helperOptions"
                :key="item.id"
                :label="item.real_name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="优先级">
            <el-select v-model="createForm.priority" placeholder="请选择优先级">
              <el-option
                v-for="item in priorityOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="项目状态">
            <el-select v-model="createForm.status" placeholder="请选择项目状态">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="开始日期">
            <el-date-picker
              v-model="createForm.startDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择开始日期"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="结束日期">
            <el-date-picker
              v-model="createForm.endDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择结束日期"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <el-form-item label="项目描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            placeholder="请输入项目描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="createDialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submitting" @click="submitCreate">
            创建项目
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { createProjectApi, getHelpersApi, getProjectsApi } from '../../api';
import StatusTag from '../../components/StatusTag.vue';
import { useAuthStore } from '../../stores/auth';
import { useDictionaryStore } from '../../stores/dictionaries';

const router = useRouter();
const authStore = useAuthStore();
const dictionaryStore = useDictionaryStore();
const projects = ref([]);
const createDialogVisible = ref(false);
const loadingHelperOptions = ref(false);
const helperOptions = ref([]);
const submitting = ref(false);

const filters = reactive({
  keyword: '',
  status: '',
  priority: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const createForm = reactive({
  projectName: '',
  description: '',
  ownerUserId: '',
  priority: 'medium',
  status: 'not_started',
  startDate: '',
  endDate: ''
});

const statusOptions = computed(() => dictionaryStore.getOptions('project_status').map((item) => ({
  label: item.dict_label,
  value: item.dict_value
})));

const priorityOptions = computed(() => dictionaryStore.getOptions('project_priority').map((item) => ({
  label: item.dict_label,
  value: item.dict_value
})));

const canCreateProject = computed(() => authStore.user?.role === 'admin');

async function loadProjects() {
  const result = await getProjectsApi({
    keyword: filters.keyword,
    status: filters.status,
    priority: filters.priority,
    page: pagination.page,
    pageSize: pagination.pageSize
  });

  projects.value = result.data.list;
  pagination.page = result.data.pagination.page;
  pagination.pageSize = result.data.pagination.pageSize;
  pagination.total = result.data.pagination.total;
}

function handleFilterChange() {
  pagination.page = 1;
  loadProjects();
}

function handlePageChange(page) {
  pagination.page = page;
  loadProjects();
}

function handleSizeChange(pageSize) {
  pagination.page = 1;
  pagination.pageSize = pageSize;
  loadProjects();
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

function resetCreateForm() {
  createForm.projectName = '';
  createForm.description = '';
  createForm.ownerUserId = '';
  createForm.priority = 'medium';
  createForm.status = 'not_started';
  createForm.startDate = '';
  createForm.endDate = '';
}

function openCreateDialog() {
  resetCreateForm();
  helperOptions.value = [];
  createDialogVisible.value = true;
  loadHelperOptions();
}

async function submitCreate() {
  if (!createForm.projectName.trim()) {
    ElMessage.warning('请输入项目名称');
    return;
  }

  if (!createForm.ownerUserId) {
    ElMessage.warning('请选择项目负责人');
    return;
  }

  submitting.value = true;
  try {
    await createProjectApi({
      projectName: createForm.projectName.trim(),
      description: createForm.description.trim(),
      ownerUserId: createForm.ownerUserId,
      priority: createForm.priority,
      status: createForm.status,
      startDate: createForm.startDate || null,
      endDate: createForm.endDate || null
    });
    ElMessage.success('项目创建成功');
    createDialogVisible.value = false;
    await loadProjects();
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await dictionaryStore.ensureDictTypes(['project_status', 'project_priority']);
  await loadProjects();
});
</script>
