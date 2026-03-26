<template>
  <div class="auth-page">
    <section class="auth-shell">
      <div class="auth-brand-panel">
        <div class="auth-brand-top">
          <span class="eyebrow">统一支持入口</span>
          <h1>NextLaunch Hub</h1>
          <p>统一处理求助受理、跟进与状态记录。</p>
        </div>

        <div class="auth-brand-body">
          <ul class="auth-brand-list">
            <li>
              <strong>统一受理</strong>
              <span>集中登记业务支持事项。</span>
            </li>
            <li>
              <strong>过程可追踪</strong>
              <span>处理状态与记录统一留存。</span>
            </li>
          </ul>
        </div>

        <div class="auth-brand-footer">
          <div class="auth-brand-note">
            <span>公开入口</span>
            <strong>需要提交求助时，可直接使用公开入口。</strong>
          </div>
          <div class="auth-brand-footer-action">
            <el-button class="secondary-action auth-secondary-btn" @click="router.push('/help-request')">
              提交求助
            </el-button>
          </div>
        </div>
      </div>

      <section class="auth-login-panel">
        <div class="panel-header login-header">
          <span class="panel-badge">后台登录</span>
          <h2>账号登录</h2>
          <p>请输入账号信息进入系统</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="auth-login-form">
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
            <el-button class="primary-action auth-primary-btn" :loading="loading" @click="handleLogin">
              登录并进入后台
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer-note">
          <span>登录后可查看工作台、求助记录与处理进度。</span>
        </div>
      </section>
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
