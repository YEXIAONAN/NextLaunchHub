<template>
  <span class="status-tag" :class="`status-${status}`">
    {{ textMap[status] || status }}
  </span>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    default: 'pending'
  }
});

const textMap = {
  pending: '待处理',
  processing: '处理中',
  waiting_confirm: '待确认',
  completed: '已完成'
};
</script>
