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

<!--
  样式在 src/styles/theme.css 的「状态标签」一节，不再放在这里。
  这样色值能跟着全站 token 走，「状态高对比」开关也才作用得上。
-->
