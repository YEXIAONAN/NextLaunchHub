<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>字典配置</h2>
          <p>统一维护状态、优先级和项目角色等枚举项，供系统下拉与展示复用。</p>
        </div>
        <el-button class="primary-action small" @click="openCreateDialog">新建字典项</el-button>
      </div>

      <div class="dictionary-toolbar">
        <el-select v-model="filters.dictType" clearable placeholder="字典类型" @change="loadDictionaries">
          <el-option label="全部类型" value="" />
          <el-option
            v-for="item in dictTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select v-model="filters.status" clearable placeholder="状态" @change="loadDictionaries">
          <el-option label="全部状态" value="" />
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>

        <el-button class="secondary-action" @click="loadDictionaries">查询</el-button>
      </div>

      <el-table :data="dictionaries" class="custom-table">
        <el-table-column label="字典类型" min-width="180">
          <template #default="{ row }">
            {{ dictTypeLabelMap[row.dict_type] || row.dict_type }}
          </template>
        </el-table-column>
        <el-table-column prop="dict_label" label="字典名称" min-width="160" />
        <el-table-column prop="dict_value" label="字典值" min-width="160" />
        <el-table-column prop="sort_no" label="排序号" min-width="100" />
        <el-table-column label="状态" min-width="110">
          <template #default="{ row }">
            <span class="user-status-pill" :class="`user-status-${Number(row.status)}`">
              {{ Number(row.status) === 1 ? '启用' : '停用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link class="text-action" @click="openEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑字典项' : '新建字典项'" width="560px">
      <el-form label-position="top">
        <div class="form-grid">
          <el-form-item label="字典类型">
            <el-select v-model="form.dictType" placeholder="请选择字典类型" :disabled="Boolean(form.id)">
              <el-option
                v-for="item in dictTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="form.status" placeholder="请选择状态">
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>

          <el-form-item label="字典名称">
            <el-input v-model="form.dictLabel" maxlength="100" placeholder="请输入字典名称" />
          </el-form-item>

          <el-form-item label="字典值">
            <el-input v-model="form.dictValue" maxlength="100" placeholder="请输入字典值" />
          </el-form-item>

          <el-form-item label="排序号">
            <el-input-number v-model="form.sortNo" :step="10" style="width: 100%" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="dialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submitting" @click="submitForm">
            {{ form.id ? '保存修改' : '创建字典项' }}
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
  createDictionaryApi,
  getAdminDictionariesApi,
  updateDictionaryApi
} from '../../api';
import { useDictionaryStore } from '../../stores/dictionaries';

const dictionaryStore = useDictionaryStore();
const dictionaries = ref([]);
const dialogVisible = ref(false);
const submitting = ref(false);

const filters = reactive({
  dictType: '',
  status: ''
});

const form = reactive({
  id: null,
  dictType: 'project_status',
  dictLabel: '',
  dictValue: '',
  sortNo: 0,
  status: 1
});

const dictTypeOptions = [
  { label: '项目状态', value: 'project_status' },
  { label: '项目优先级', value: 'project_priority' },
  { label: '任务状态', value: 'task_status' },
  { label: '任务优先级', value: 'task_priority' },
  { label: '求助状态', value: 'help_request_status' },
  { label: '项目成员角色', value: 'project_member_role' }
];

const dictTypeLabelMap = Object.fromEntries(
  dictTypeOptions.map((item) => [item.value, item.label])
);

async function loadDictionaries() {
  const result = await getAdminDictionariesApi({
    dictType: filters.dictType || undefined,
    status: filters.status === '' ? undefined : filters.status
  });
  dictionaries.value = result.data;
}

function resetForm() {
  form.id = null;
  form.dictType = 'project_status';
  form.dictLabel = '';
  form.dictValue = '';
  form.sortNo = 0;
  form.status = 1;
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row) {
  form.id = row.id;
  form.dictType = row.dict_type;
  form.dictLabel = row.dict_label;
  form.dictValue = row.dict_value;
  form.sortNo = Number(row.sort_no || 0);
  form.status = Number(row.status);
  dialogVisible.value = true;
}

async function submitForm() {
  if (!form.dictType) {
    ElMessage.warning('请选择字典类型');
    return;
  }

  if (!form.dictLabel.trim()) {
    ElMessage.warning('请输入字典名称');
    return;
  }

  if (!form.dictValue.trim()) {
    ElMessage.warning('请输入字典值');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      dictType: form.dictType,
      dictLabel: form.dictLabel.trim(),
      dictValue: form.dictValue.trim(),
      sortNo: form.sortNo,
      status: form.status
    };

    if (form.id) {
      await updateDictionaryApi(form.id, payload);
      ElMessage.success('字典项更新成功');
    } else {
      await createDictionaryApi(payload);
      ElMessage.success('字典项创建成功');
    }

    dialogVisible.value = false;
    await loadDictionaries();
    await dictionaryStore.refreshDictType(form.dictType);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadDictionaries();
});
</script>
