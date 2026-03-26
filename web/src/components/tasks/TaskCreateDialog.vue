<template>
  <el-dialog v-model="dialogVisible" title="新建任务" width="680px">
    <el-form label-position="top">
      <div class="form-grid">
        <el-form-item label="所属项目">
          <el-select
            v-model="form.projectId"
            filterable
            placeholder="请选择所属项目"
            :disabled="lockProject"
            @change="handleProjectChange"
          >
            <el-option
              v-for="item in projectOptions"
              :key="item.id"
              :label="`${item.project_name}（${item.project_code}）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="任务负责人">
          <el-select
            v-model="form.assigneeUserId"
            filterable
            remote
            reserve-keyword
            clearable
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

        <el-form-item label="任务标题">
          <el-input v-model="form.title" maxlength="150" placeholder="请输入任务标题" />
        </el-form-item>

        <el-form-item label="预计工时">
          <el-input-number
            v-model="form.estimatedHours"
            :min="0"
            :step="0.5"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="所属迭代">
          <el-select
            v-model="form.iterationId"
            clearable
            placeholder="请选择所属迭代"
            :disabled="!form.projectId"
          >
            <el-option
              v-for="item in iterationOptions"
              :key="item.id"
              :label="item.iteration_name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="所属里程碑">
          <el-select
            v-model="form.milestoneId"
            clearable
            placeholder="请选择所属里程碑"
            :disabled="!form.projectId"
          >
            <el-option
              v-for="item in milestoneOptions"
              :key="item.id"
              :label="item.milestone_name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-select v-model="form.priority" placeholder="请选择优先级">
            <el-option
              v-for="item in priorityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="任务状态">
          <el-select v-model="form.status" placeholder="请选择任务状态">
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
            v-model="form.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择开始日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="截止日期">
          <el-date-picker
            v-model="form.dueDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择截止日期"
            style="width: 100%"
          />
        </el-form-item>
      </div>

      <el-form-item label="任务描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          maxlength="2000"
          show-word-limit
          placeholder="请输入任务描述"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="secondary-action" @click="dialogVisible = false">取消</el-button>
        <el-button class="primary-action small" :loading="submitting" @click="submitTask">
          创建任务
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  createTaskApi,
  getHelpersApi,
  getProjectIterationsApi,
  getProjectMilestonesApi,
  getProjectsApi
} from '../../api';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  defaultProjectId: {
    type: [Number, String, null],
    default: null
  },
  lockProject: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'success']);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const projectOptions = ref([]);
const iterationOptions = ref([]);
const milestoneOptions = ref([]);
const helperOptions = ref([]);
const loadingHelperOptions = ref(false);
const submitting = ref(false);

const form = reactive({
  projectId: '',
  iterationId: '',
  milestoneId: '',
  title: '',
  description: '',
  assigneeUserId: '',
  priority: 'medium',
  status: 'todo',
  startDate: '',
  dueDate: '',
  estimatedHours: null
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

function resetForm() {
  form.projectId = props.defaultProjectId ? Number(props.defaultProjectId) : '';
  form.iterationId = '';
  form.milestoneId = '';
  form.title = '';
  form.description = '';
  form.assigneeUserId = '';
  form.priority = 'medium';
  form.status = 'todo';
  form.startDate = '';
  form.dueDate = '';
  form.estimatedHours = null;
}

async function loadProjectOptions() {
  const result = await getProjectsApi({
    page: 1,
    pageSize: 100
  });
  projectOptions.value = result.data.list;
}

async function loadPlanningOptions(projectId) {
  if (!projectId) {
    iterationOptions.value = [];
    milestoneOptions.value = [];
    return;
  }

  const [iterationsResult, milestonesResult] = await Promise.all([
    getProjectIterationsApi(projectId),
    getProjectMilestonesApi(projectId)
  ]);
  iterationOptions.value = iterationsResult.data;
  milestoneOptions.value = milestonesResult.data;
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

async function initializeDialog() {
  resetForm();
  helperOptions.value = [];
  iterationOptions.value = [];
  milestoneOptions.value = [];
  await loadProjectOptions();
  await loadHelperOptions();
  if (form.projectId) {
    await loadPlanningOptions(form.projectId);
  }
}

async function handleProjectChange(projectId) {
  form.iterationId = '';
  form.milestoneId = '';
  await loadPlanningOptions(projectId);
}

async function submitTask() {
  if (!form.projectId) {
    ElMessage.warning('请选择所属项目');
    return;
  }

  if (!form.title.trim()) {
    ElMessage.warning('请输入任务标题');
    return;
  }

  submitting.value = true;
  try {
    await createTaskApi({
      projectId: form.projectId,
      iterationId: form.iterationId || null,
      milestoneId: form.milestoneId || null,
      title: form.title.trim(),
      description: form.description.trim(),
      assigneeUserId: form.assigneeUserId || null,
      priority: form.priority,
      status: form.status,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      estimatedHours: form.estimatedHours
    });
    ElMessage.success('任务创建成功');
    emit('success');
    dialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      await initializeDialog();
    }
  }
);

watch(
  () => props.defaultProjectId,
  async (value) => {
    if (props.lockProject) {
      form.projectId = value ? Number(value) : '';
      form.iterationId = '';
      form.milestoneId = '';
      await loadPlanningOptions(form.projectId);
    }
  }
);
</script>
