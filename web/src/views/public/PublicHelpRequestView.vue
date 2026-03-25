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
          <el-form-item label="选择帮助人员" prop="helperUserId">
            <el-select
              v-model="form.helperUserId"
              filterable
              remote
              reserve-keyword
              placeholder="请输入姓名检索"
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
import { getHelpersApi, getRequestersApi, submitHelpRequestApi } from '../../api';

const router = useRouter();
const formRef = ref();
const submitting = ref(false);
const requesterOptions = ref([]);
const helperOptions = ref([]);
const loadingRequesters = ref(false);
const loadingHelpers = ref(false);

const form = reactive({
  title: '',
  requesterUserId: '',
  helperUserId: '',
  content: ''
});

const rules = {
  title: [{ required: true, message: '请输入求助标题', trigger: 'blur' }],
  requesterUserId: [{ required: true, message: '请选择发起人', trigger: 'change' }],
  helperUserId: [{ required: true, message: '请选择帮助人员', trigger: 'change' }],
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

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  submitting.value = true;
  try {
    const result = await submitHelpRequestApi(form);
    await ElMessageBox.alert(`提交成功，求助单号：${result.data.requestNo}`, '提交成功', {
      confirmButtonText: '我知道了'
    });
    form.title = '';
    form.requesterUserId = '';
    form.helperUserId = '';
    form.content = '';
    formRef.value.clearValidate();
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadRequesters();
  loadHelpers();
});
</script>
