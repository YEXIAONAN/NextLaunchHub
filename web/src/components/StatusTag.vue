<template>
  <span class="status-tag" :class="`status-${status}`">
    {{ dictionaryStore.getLabel('help_request_status', status, textMap[status]) || status }}
  </span>
</template>

<script setup>
import { onMounted } from 'vue';
import { useDictionaryStore } from '../stores/dictionaries';

defineProps({
  status: {
    type: String,
    default: 'pending'
  }
});

const dictionaryStore = useDictionaryStore();

const textMap = {
  pending: '待处理',
  processing: '处理中',
  waiting_confirm: '待确认',
  completed: '已完成'
};

onMounted(() => {
  dictionaryStore.ensureDictType('help_request_status');
});
</script>
