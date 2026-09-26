<template>
  <div class="public-page">
    <div class="page-card public-form-card">
      <div class="page-header with-action">
        <div>
          <h2>提交求助</h2>
          <p>请填写完整信息，提交后系统将自动生成求助单号并通知对应帮助人员。</p>
        </div>
        <el-button class="secondary-action" @click="router.push('/login')">返回登录</el-button>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="form-grid">
          <el-form-item label="求助标题" prop="title">
            <el-input v-model="form.title" maxlength="120" show-word-limit placeholder="请输入求助标题" />
          </el-form-item>
          <el-form-item label="发起人姓名" prop="requesterUserId">
            <el-select
              v-model="form.requesterUserId"
              filterable
              remote
              reserve-keyword
              placeholder="请输入姓名检索"
              :remote-method="loadRequesters"
              :loading="loadingRequesters"
            >
              <el-option
                v-for="item in requesterOptions"
                :key="item.id"
                :label="item.real_name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="选择帮助人员" prop="helperUserIds">
            <el-select
              v-model="form.helperUserIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              filterable
              remote
              reserve-keyword
              placeholder="可选择多个帮助人员"
              :remote-method="loadHelpers"
              :loading="loadingHelpers"
            >
              <el-option
                v-for="item in helperOptions"
                :key="item.id"
                :label="item.real_name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="所属项目">
            <el-select
              v-model="form.projectId"
              filterable
              clearable
              placeholder="请选择所属项目"
              :loading="loadingProjects"
              @change="handleProjectChange"
            >
              <el-option
                v-for="item in projectOptions"
                :key="item.id"
                :label="`${item.project_name}（${item.project_code}）`"
                :value="item.id"
              />
              <el-option label="其他" :value="OTHER_VALUE" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.projectId === OTHER_VALUE" label="其他项目名称" prop="projectName">
            <el-input v-model="form.projectName" maxlength="100" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="关联任务">
            <el-select
              v-model="form.taskId"
              filterable
              clearable
              placeholder="请选择关联任务"
              :disabled="!form.projectId"
              :loading="loadingTasks"
            >
              <el-option
                v-for="item in taskOptions"
                :key="item.id"
                :label="`${item.title}（${item.task_code}）`"
                :value="item.id"
              />
              <el-option label="其他" :value="OTHER_VALUE" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.taskId === OTHER_VALUE" label="其他任务名称" prop="taskTitle">
            <el-input v-model="form.taskTitle" maxlength="150" placeholder="请输入任务名称" />
          </el-form-item>
        </div>

        <el-form-item label="求助内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="7"
            maxlength="1000"
            show-word-limit
            placeholder="请填写问题现象、影响范围以及期望协助内容"
          />
        </el-form-item>
        <el-form-item>
          <el-button class="primary-action" :loading="submitting" @click="handleSubmit">
            提交求助
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import {
  getHelpersApi,
  getPublicProjectTasksApi,
  getPublicProjectsApi,
  getRequestersApi,
  submitHelpRequestApi
} from '../../api';

const router = useRouter();
const formRef = ref();
const submitting = ref(false);
const requesterOptions = ref([]);
const helperOptions = ref([]);
const projectOptions = ref([]);
const taskOptions = ref([]);
const loadingRequesters = ref(false);
const loadingHelpers = ref(false);
const loadingProjects = ref(false);
const loadingTasks = ref(false);
const OTHER_VALUE = '__other__';

const form = reactive({
  title: '',
  requesterUserId: '',
  helperUserIds: [],
  projectId: '',
  projectName: '',
  taskId: '',
  taskTitle: '',
  content: ''
});

const rules = {
  title: [{ required: true, message: '请输入求助标题', trigger: 'blur' }],
  requesterUserId: [{ required: true, message: '请选择发起人', trigger: 'change' }],
  helperUserIds: [{ required: true, type: 'array', min: 1, message: '请至少选择一位帮助人员', trigger: 'change' }],
  projectName: [
    {
      validator: (_rule, value, callback) => {
        if (form.projectId === OTHER_VALUE && !String(value || '').trim()) {
          callback(new Error('请输入其他项目名称'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ],
  taskTitle: [
    {
      validator: (_rule, value, callback) => {
        if (form.taskId === OTHER_VALUE && !String(value || '').trim()) {
          callback(new Error('请输入其他任务名称'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ],
  content: [{ required: true, message: '请输入求助内容', trigger: 'blur' }]
};

async function loadRequesters(keyword = '') {
  loadingRequesters.value = true;
  try {
    const result = await getRequestersApi(keyword);
    requesterOptions.value = result.data;
  } finally {
    loadingRequesters.value = false;
  }
}

async function loadHelpers(keyword = '') {
  loadingHelpers.value = true;
  try {
    const result = await getHelpersApi(keyword);
    helperOptions.value = result.data;
  } finally {
    loadingHelpers.value = false;
  }
}

async function loadProjects() {
  loadingProjects.value = true;
  try {
    const result = await getPublicProjectsApi({
      page: 1,
      pageSize: 100
    });
    projectOptions.value = result.data.list;
  } finally {
    loadingProjects.value = false;
  }
}

async function loadTasks(projectId) {
  if (!projectId || projectId === OTHER_VALUE) {
    taskOptions.value = [];
    return;
  }

  loadingTasks.value = true;
  try {
    const result = await getPublicProjectTasksApi(projectId, {
      page: 1,
      pageSize: 100
    });
    taskOptions.value = result.data.list;
  } finally {
    loadingTasks.value = false;
  }
}

async function handleProjectChange(projectId) {
  form.taskId = '';
  form.taskTitle = '';
  if (projectId !== OTHER_VALUE) {
    form.projectName = '';
  }
  await loadTasks(projectId);
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  submitting.value = true;
  try {
    const isOtherProject = form.projectId === OTHER_VALUE;
    const isOtherTask = form.taskId === OTHER_VALUE;
    const result = await submitHelpRequestApi({
      title: form.title,
      requesterUserId: form.requesterUserId,
      helperUserIds: form.helperUserIds,
      projectId: !isOtherProject && form.projectId ? form.projectId : null,
      projectName: isOtherProject ? form.projectName.trim() : null,
      taskId: !isOtherTask && form.taskId ? form.taskId : null,
      taskTitle: isOtherTask ? form.taskTitle.trim() : null,
      content: form.content
    });
    const requestNo = result.data.request_no || result.data.requestNo;
    await ElMessageBox.alert(`提交成功，求助单号：${requestNo}`, '提交成功', {
      confirmButtonText: '我知道了'
    });
    form.title = '';
    form.requesterUserId = '';
    form.helperUserIds = [];
    form.projectId = '';
    form.projectName = '';
    form.taskId = '';
    form.taskTitle = '';
    form.content = '';
    taskOptions.value = [];
    formRef.value.clearValidate();
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadRequesters();
  loadHelpers();
  loadProjects();
});
</script>
