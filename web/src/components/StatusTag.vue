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
    high: 'bg-red-100 text-red-600',
    medium: 'bg-yellow-100 text-yellow-600',
    low: 'bg-gray-100 text-gray-600'
  },
  status: {
    not_started: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    blocked: 'bg-red-100 text-red-600',
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-600',
    waiting_confirm: 'bg-yellow-100 text-yellow-600'
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
  const colorClass = typeClassMap[normalizedValue.value] || 'bg-gray-100 text-gray-600';
  return ['inline-flex px-2 py-1 rounded-md text-xs font-medium', colorClass];
});

onMounted(() => {
  dictionaryStore.ensureDictType(dictType.value);
});
</script>

<style scoped>
.inline-flex {
  display: inline-flex;
}

.px-2 {
  padding-left: 8px;
  padding-right: 8px;
}

.py-1 {
  padding-top: 4px;
  padding-bottom: 4px;
}

.rounded-md {
  border-radius: 6px;
}

.text-xs {
  font-size: 12px;
  line-height: 1.3334;
}

.font-medium {
  font-weight: 500;
}

.bg-red-100 {
  background: #fee2e2;
}

.text-red-600 {
  color: #dc2626;
}

.bg-yellow-100 {
  background: #fef3c7;
}

.text-yellow-600 {
  color: #d97706;
}

.bg-gray-100 {
  background: #f3f4f6;
}

.text-gray-600 {
  color: #4b5563;
}

.bg-blue-100 {
  background: #dbeafe;
}

.text-blue-600 {
  color: #2563eb;
}

.bg-green-100 {
  background: #dcfce7;
}

.text-green-600 {
  color: #16a34a;
}
</style>
