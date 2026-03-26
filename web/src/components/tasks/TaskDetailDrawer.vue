<template>
  <el-drawer v-model="drawerVisible" title="任务详情" size="680px">
    <div class="task-drawer-body" v-loading="loading">
      <template v-if="detail.task_code">
        <section class="task-drawer-section">
          <div class="page-header">
            <div>
              <h2>基础信息</h2>
              <p>查看任务主信息、负责人和时间安排。</p>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <label>任务编号</label>
              <span>{{ detail.task_code }}</span>
            </div>
            <div class="detail-item">
              <label>任务标题</label>
              <span>{{ detail.title }}</span>
            </div>
            <div class="detail-item">
              <label>负责人</label>
              <span>{{ detail.assignee_name || '未分配' }}</span>
            </div>
            <div class="detail-item">
              <label>优先级</label>
              <span class="task-priority-pill" :class="`task-priority-${detail.priority}`">
                {{ priorityTextMap[detail.priority] || detail.priority || '-' }}
              </span>
            </div>
            <div class="detail-item">
              <label>当前状态</label>
              <span class="task-status-pill" :class="`task-status-${detail.status}`">
                {{ statusTextMap[detail.status] || detail.status || '-' }}
              </span>
            </div>
            <div class="detail-item">
              <label>当前进度</label>
              <div class="project-progress">
                <div class="project-progress-track">
                  <div class="project-progress-fill" :style="{ width: `${Number(detail.progress || 0)}%` }"></div>
                </div>
                <span>{{ Number(detail.progress || 0) }}%</span>
              </div>
            </div>
            <div class="detail-item">
              <label>开始日期</label>
              <span>{{ detail.start_date || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>截止日期</label>
              <span>{{ detail.due_date || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>预计工时</label>
              <span>{{ detail.estimated_hours ?? '-' }}</span>
            </div>
            <div class="detail-item">
              <label>实际工时</label>
              <span>{{ detail.actual_hours ?? '-' }}</span>
            </div>
            <div class="detail-item full-width">
              <label>任务描述</label>
              <span>{{ detail.description || '暂无任务描述' }}</span>
            </div>
          </div>
        </section>

        <section class="task-drawer-section">
          <div class="page-header">
            <div>
              <h2>操作日志</h2>
              <p>记录任务创建、更新和状态变更过程。</p>
            </div>
          </div>

          <div v-if="detail.logs?.length" class="timeline-list">
            <div v-for="item in detail.logs" :key="item.id" class="timeline-item">
              <div class="timeline-axis">
                <span class="timeline-dot"></span>
                <span class="timeline-line"></span>
              </div>
              <div class="timeline-card">
                <div class="timeline-card-head">
                  <div class="timeline-title-wrap">
                    <strong>{{ actionTextMap[item.action_type] || item.action_type }}</strong>
                    <span class="timeline-operator">{{ item.operator_name }}</span>
                  </div>
                  <span class="timeline-time">{{ item.created_at }}</span>
                </div>
                <p>{{ item.action_content }}</p>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无操作日志" />
        </section>
      </template>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { getTaskDetailApi } from '../../api';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  taskId: {
    type: [Number, String, null],
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const loading = ref(false);
const detail = reactive({
  task_code: '',
  title: '',
  assignee_name: '',
  priority: '',
  status: '',
  progress: 0,
  start_date: '',
  due_date: '',
  estimated_hours: null,
  actual_hours: null,
  description: '',
  logs: []
});

const statusTextMap = {
  todo: '待开始',
  in_progress: '进行中',
  blocked: '受阻',
  done: '已完成',
  cancelled: '已取消'
};

const priorityTextMap = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
};

const actionTextMap = {
  create: '创建任务',
  update: '更新任务',
  status_update: '状态变更'
};

function resetDetail() {
  detail.task_code = '';
  detail.title = '';
  detail.assignee_name = '';
  detail.priority = '';
  detail.status = '';
  detail.progress = 0;
  detail.start_date = '';
  detail.due_date = '';
  detail.estimated_hours = null;
  detail.actual_hours = null;
  detail.description = '';
  detail.logs = [];
}

async function loadDetail() {
  if (!props.taskId) {
    return;
  }

  loading.value = true;
  try {
    const result = await getTaskDetailApi(props.taskId);
    Object.assign(detail, result.data);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.modelValue, props.taskId],
  async ([visible, taskId]) => {
    if (visible && taskId) {
      resetDetail();
      await loadDetail();
    }
  }
);
</script>
