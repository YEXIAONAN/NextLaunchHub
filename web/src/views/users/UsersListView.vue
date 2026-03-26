<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>用户管理</h2>
          <p>维护后台账号的姓名、角色和启用状态，保持权限边界清晰。</p>
        </div>
        <el-button class="primary-action small" @click="openCreateDialog">新建用户</el-button>
      </div>

      <div class="user-toolbar">
        <el-input
          v-model="filters.keyword"
          class="user-keyword"
          clearable
          placeholder="搜索用户名或真实姓名"
          @keyup.enter="handleFilterChange"
          @clear="handleFilterChange"
        />

        <el-select v-model="filters.role" clearable placeholder="用户角色" @change="handleFilterChange">
          <el-option label="全部角色" value="" />
          <el-option
            v-for="item in roleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select v-model="filters.status" clearable placeholder="用户状态" @change="handleFilterChange">
          <el-option label="全部状态" value="" />
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-button class="secondary-action" @click="handleFilterChange">查询</el-button>
      </div>

      <el-table :data="users" class="custom-table">
        <el-table-column prop="username" label="用户名" min-width="180" />
        <el-table-column prop="real_name" label="真实姓名" min-width="140" />
        <el-table-column label="角色" min-width="120">
          <template #default="{ row }">
            <span class="user-role-pill" :class="`user-role-${row.role}`">
              {{ roleTextMap[row.role] || row.role }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <span class="user-status-pill" :class="`user-status-${Number(row.status)}`">
              {{ Number(row.status) === 1 ? '启用' : '停用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="user-table-actions">
              <el-button link class="text-action" @click="openEditDialog(row)">编辑</el-button>
              <el-button link class="text-action" @click="openResetPasswordDialog(row)">重置密码</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="user-pagination">
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

    <el-dialog v-model="createDialogVisible" title="新建用户" width="560px">
      <el-form label-position="top">
        <div class="form-grid">
          <el-form-item label="用户名">
            <el-input v-model="createForm.username" maxlength="50" placeholder="请输入用户名" />
          </el-form-item>

          <el-form-item label="真实姓名">
            <el-input v-model="createForm.realName" maxlength="50" placeholder="请输入真实姓名" />
          </el-form-item>

          <el-form-item label="角色">
            <el-select v-model="createForm.role" placeholder="请选择角色">
              <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="createForm.status" placeholder="请选择状态">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item class="full-width" label="初始密码">
            <el-input
              v-model="createForm.password"
              type="password"
              show-password
              maxlength="50"
              placeholder="请输入初始密码"
            />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="createDialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submittingCreate" @click="submitCreate">
            创建用户
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑用户" width="560px">
      <el-form label-position="top">
        <div class="form-grid">
          <el-form-item label="用户名">
            <el-input :model-value="editForm.username" disabled />
          </el-form-item>

          <el-form-item label="真实姓名">
            <el-input v-model="editForm.realName" maxlength="50" placeholder="请输入真实姓名" />
          </el-form-item>

          <el-form-item label="角色">
            <el-select v-model="editForm.role" placeholder="请选择角色">
              <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="editForm.status" placeholder="请选择状态">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="editDialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submittingEdit" @click="submitEdit">
            保存修改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="resetPasswordDialogVisible" title="重置密码" width="480px">
      <el-form label-position="top">
        <el-form-item label="用户">
          <el-input :model-value="resetPasswordForm.username" disabled />
        </el-form-item>

        <el-form-item label="新密码">
          <el-input
            v-model="resetPasswordForm.password"
            type="password"
            show-password
            maxlength="50"
            placeholder="请输入新密码"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="resetPasswordDialogVisible = false">取消</el-button>
          <el-button
            class="primary-action small"
            :loading="submittingResetPassword"
            @click="submitResetPassword"
          >
            确认重置
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  createUserApi,
  getUsersApi,
  resetUserPasswordApi,
  updateUserApi
} from '../../api';

const users = ref([]);
const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const resetPasswordDialogVisible = ref(false);
const submittingCreate = ref(false);
const submittingEdit = ref(false);
const submittingResetPassword = ref(false);

const filters = reactive({
  keyword: '',
  role: '',
  status: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const createForm = reactive({
  username: '',
  password: '',
  realName: '',
  role: 'requester',
  status: 1
});

const editForm = reactive({
  id: null,
  username: '',
  realName: '',
  role: 'requester',
  status: 1
});

const resetPasswordForm = reactive({
  id: null,
  username: '',
  password: ''
});

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '帮助人员', value: 'helper' },
  { label: '发起人', value: 'requester' }
];

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 }
];

const roleTextMap = Object.fromEntries(roleOptions.map((item) => [item.value, item.label]));

async function loadUsers() {
  const result = await getUsersApi({
    keyword: filters.keyword,
    role: filters.role,
    status: filters.status,
    page: pagination.page,
    pageSize: pagination.pageSize
  });

  users.value = result.data.list;
  pagination.page = result.data.pagination.page;
  pagination.pageSize = result.data.pagination.pageSize;
  pagination.total = result.data.pagination.total;
}

function handleFilterChange() {
  pagination.page = 1;
  loadUsers();
}

function handlePageChange(page) {
  pagination.page = page;
  loadUsers();
}

function handleSizeChange(pageSize) {
  pagination.page = 1;
  pagination.pageSize = pageSize;
  loadUsers();
}

function resetCreateForm() {
  createForm.username = '';
  createForm.password = '';
  createForm.realName = '';
  createForm.role = 'requester';
  createForm.status = 1;
}

function openCreateDialog() {
  resetCreateForm();
  createDialogVisible.value = true;
}

async function submitCreate() {
  if (!createForm.username.trim()) {
    ElMessage.warning('请输入用户名');
    return;
  }

  if (!createForm.realName.trim()) {
    ElMessage.warning('请输入真实姓名');
    return;
  }

  if (!createForm.password.trim()) {
    ElMessage.warning('请输入初始密码');
    return;
  }

  submittingCreate.value = true;
  try {
    await createUserApi({
      username: createForm.username.trim(),
      password: createForm.password.trim(),
      realName: createForm.realName.trim(),
      role: createForm.role,
      status: createForm.status
    });
    ElMessage.success('用户创建成功');
    createDialogVisible.value = false;
    await loadUsers();
  } finally {
    submittingCreate.value = false;
  }
}

function openEditDialog(row) {
  editForm.id = row.id;
  editForm.username = row.username;
  editForm.realName = row.real_name;
  editForm.role = row.role;
  editForm.status = Number(row.status);
  editDialogVisible.value = true;
}

async function submitEdit() {
  if (!editForm.realName.trim()) {
    ElMessage.warning('请输入真实姓名');
    return;
  }

  submittingEdit.value = true;
  try {
    await updateUserApi(editForm.id, {
      realName: editForm.realName.trim(),
      role: editForm.role,
      status: editForm.status
    });
    ElMessage.success('用户更新成功');
    editDialogVisible.value = false;
    await loadUsers();
  } finally {
    submittingEdit.value = false;
  }
}

function openResetPasswordDialog(row) {
  resetPasswordForm.id = row.id;
  resetPasswordForm.username = row.username;
  resetPasswordForm.password = '';
  resetPasswordDialogVisible.value = true;
}

async function submitResetPassword() {
  if (!resetPasswordForm.password.trim()) {
    ElMessage.warning('请输入新密码');
    return;
  }

  submittingResetPassword.value = true;
  try {
    await resetUserPasswordApi(resetPasswordForm.id, {
      password: resetPasswordForm.password.trim()
    });
    ElMessage.success('密码重置成功');
    resetPasswordDialogVisible.value = false;
  } finally {
    submittingResetPassword.value = false;
  }
}

onMounted(() => {
  loadUsers();
});
</script>
