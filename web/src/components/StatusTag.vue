<template>
  <span :class="tagClass">
    {{ displayText }}
  </span>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useDictionaryStore } from '../stores/dictionaries';

const props = defineProps({
  type: {
    type: String,
    default: 'status'
  },
  value: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  }
});

const dictionaryStore = useDictionaryStore();

const normalizedType = computed(() => (props.type === 'priority' ? 'priority' : 'status'));
const normalizedValue = computed(() => props.value || props.status || '');
const dictType = computed(() => {
  if (props.value) {
    return normalizedType.value === 'priority' ? 'project_priority' : 'project_status';
  }
  return 'help_request_status';
});

const fallbackTextMap = {
  help_request_status: {
    pending: '待处理',
    processing: '处理中',
    waiting_confirm: '待确认',
    completed: '已完成'
  },
  project_priority: {
    high: '高',
    medium: '中',
    low: '低'
  },
  project_status: {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    blocked: '阻塞'
  }
};

const classMap = {
  priority: {
    high: 'status-tone-danger',
    medium: 'status-tone-warning',
    low: 'status-tone-neutral'
  },
  status: {
    not_started: 'status-tone-neutral',
    in_progress: 'status-tone-info',
    completed: 'status-tone-success',
    blocked: 'status-tone-danger',
    pending: 'status-tone-neutral',
    processing: 'status-tone-info',
    waiting_confirm: 'status-tone-warning'
  }
};

const displayText = computed(() => {
  return dictionaryStore.getLabel(
    dictType.value,
    normalizedValue.value,
    fallbackTextMap[dictType.value]?.[normalizedValue.value]
  ) || normalizedValue.value;
});

const tagClass = computed(() => {
  const typeClassMap = classMap[normalizedType.value] || classMap.status;
  const colorClass = typeClassMap[normalizedValue.value] || 'status-tone-neutral';
  return ['status-tag-compact', colorClass];
});

onMounted(() => {
  dictionaryStore.ensureDictType(dictType.value);
});
</script>

<style scoped>
.status-tag-compact {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 62px;
  min-height: 26px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
}

.status-tone-danger {
  background: #fff1f1;
  border-color: #f4d2d2;
  color: #b84646;
}

.status-tone-warning {
  background: #fff8e8;
  border-color: #f1dfb8;
  color: #9a6713;
}

.status-tone-neutral {
  background: #f4f6f8;
  border-color: #dde2e8;
  color: #566273;
}

.status-tone-info {
  background: #eef5ff;
  border-color: #d5e3f6;
  color: #35699e;
}

.status-tone-success {
  background: #edf8f2;
  border-color: #d1eadc;
  color: #287653;
}
</style>
