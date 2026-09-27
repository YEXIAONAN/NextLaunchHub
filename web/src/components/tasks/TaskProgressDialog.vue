<template>
  <el-dialog v-model="visible" title="同步任务进度" width="520px" destroy-on-close>
    <el-form label-position="top">
      <el-form-item label="完成进度">
        <div class="progress-sync-control">
          <el-slider v-model="form.progress" :min="0" :max="100" show-input />
        </div>
      </el-form-item>
      <el-form-item label="任务状态">
        <el-select v-model="form.status" style="width: 100%">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="本次进展说明">
        <el-input v-model="form.progressNote" type="textarea" :rows="4" maxlength="300" show-word-limit placeholder="例如：已完成初稿，等待校对反馈" />
      </el-form-item>
    </el-form>
    <p class="form-hint">同步后，进度、状态和说明会写入任务动态，关联求助单的发起人也能看到最新进展。</p>
    <template #footer>
      <el-button class="secondary-action" @click="visible = false">取消</el-button>
      <el-button class="primary-action small" :loading="submitting" @click="submit">同步进度</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { updateTaskApi } from '../../api';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: null }
});
const emit = defineEmits(['update:modelValue', 'success']);
const submitting = ref(false);
const form = reactive({ progress: 0, status: 'todo', progressNote: '' });
const statusOptions = [
  { label: '待开始', value: 'todo' }, { label: '进行中', value: 'in_progress' },
  { label: '受阻', value: 'blocked' }, { label: '已完成', value: 'done' }, { label: '已取消', value: 'cancelled' }
];
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) });

watch(() => [props.modelValue, props.task], ([open, task]) => {
  if (open && task) {
    form.progress = Number(task.progress || 0);
    form.status = task.status || 'todo';
    form.progressNote = '';
  }
}, { immediate: true });

async function submit() {
  if (!props.task?.id) return;
  submitting.value = true;
  try {
    await updateTaskApi(props.task.id, { progress: form.progress, status: form.status, progressNote: form.progressNote });
    ElMessage.success('任务进度已同步');
    visible.value = false;
    emit('success');
  } finally { submitting.value = false; }
}
</script>
