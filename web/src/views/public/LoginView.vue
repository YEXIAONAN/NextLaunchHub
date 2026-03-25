<template>
  <div class="auth-page">
    <section class="auth-panel intro-panel">
      <span class="eyebrow">统一支持入口</span>
      <h1>NextLaunch Hub</h1>
      <p>
        面向日常业务支持场景的统一受理平台，用于接收求助、分派处理并跟踪状态进展。
      </p>
      <ul class="intro-list">
        <li>集中查看个人负责的求助事项</li>
        <li>快速跟进处理进度与通知提醒</li>
        <li>保留完整日志，便于后续追踪</li>
      </ul>
      <el-button class="secondary-action" @click="router.push('/help-request')">
        提交求助
      </el-button>
    </section>

    <section class="auth-panel login-panel">
      <div class="panel-header">
        <h2>账号登录</h2>
        <p>请输入账号信息进入后台</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button class="primary-action" :loading="loading" @click="handleLogin">
            登录并进入后台
          </el-button>
        </el-form-item>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const formRef = ref();
const loading = ref(false);

const form = reactive({
  username: '',
  password: ''
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    await authStore.login(form);
    ElMessage.success('登录成功');
    router.push('/dashboard');
  } finally {
    loading.value = false;
  }
}
</script>
