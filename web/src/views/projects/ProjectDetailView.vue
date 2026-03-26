<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header with-action">
        <div>
          <h2>项目详情</h2>
          <p>查看项目基础信息、成员安排、任务推进以及阶段规划。</p>
        </div>
        <el-button class="secondary-action" @click="router.push('/projects')">返回列表</el-button>
      </div>

      <div class="project-detail-layout">
        <div class="project-detail-main">
          <section class="project-member-section">
            <div class="page-header with-action">
              <div>
                <h2>基础信息</h2>
                <p>项目主信息与推进状态。</p>
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <label>项目编号</label>
                <span>{{ detail.project_code }}</span>
              </div>
              <div class="detail-item">
                <label>项目名称</label>
                <span>{{ detail.project_name }}</span>
              </div>
              <div class="detail-item">
                <label>项目负责人</label>
                <span>{{ detail.owner_name }}</span>
              </div>
              <div class="detail-item">
                <label>项目优先级</label>
                <span class="project-priority-pill" :class="`project-priority-${detail.priority}`">
                  {{ dictionaryStore.getLabel('project_priority', detail.priority) || detail.priority || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <label>项目状态</label>
                <span class="project-status-pill" :class="`project-status-${detail.status}`">
                  {{ dictionaryStore.getLabel('project_status', detail.status) || detail.status || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <label>项目进度</label>
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
                <label>结束日期</label>
                <span>{{ detail.end_date || '-' }}</span>
              </div>
              <div class="detail-item full-width">
                <label>项目描述</label>
                <span>{{ detail.description || '暂无项目描述' }}</span>
              </div>
            </div>
          </section>

          <section class="page-card project-placeholder-section">
            <div class="page-header with-action">
              <div>
                <h2>任务列表</h2>
                <p>展示当前项目下的任务，优先关注状态、负责人和截止时间。</p>
              </div>
              <el-button v-if="canManageTasks" class="secondary-action" @click="taskDialogVisible = true">
                快速创建任务
              </el-button>
            </div>
            <div v-if="tasks.length" class="project-task-list">
              <div v-for="item in tasks" :key="item.id" class="project-task-item">
                <div class="project-task-main">
                  <div class="project-task-title">
                    <strong>{{ item.title }}</strong>
                    <span class="task-status-pill" :class="`task-status-${item.status}`">
                      {{ dictionaryStore.getLabel('task_status', item.status) || item.status }}
                    </span>
                  </div>
                  <p>{{ item.task_code }} ｜ {{ item.assignee_name || '未分配负责人' }}</p>
                  <div class="project-task-planning">
                    <span v-if="item.iteration_id">迭代 #{{ item.iteration_id }}</span>
                    <span v-if="item.milestone_id">里程碑 #{{ item.milestone_id }}</span>
                  </div>
                </div>
                <div class="project-task-side">
                  <span class="task-priority-pill" :class="`task-priority-${item.priority}`">
                    {{ dictionaryStore.getLabel('task_priority', item.priority) || item.priority }}
                  </span>
                  <span>{{ item.due_date || '未设置截止日期' }}</span>
                  <el-button link class="text-action" @click="openTaskDetail(item.id)">查看详情</el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="当前项目下暂无任务" />
          </section>

          <section class="page-card project-planning-board">
            <div class="page-header">
              <div>
                <h2>阶段规划</h2>
                <p>通过迭代和里程碑管理阶段目标、时间窗口与关键节点。</p>
              </div>
            </div>

            <div class="project-planning-grid">
              <section class="project-planning-panel">
                <div class="page-header with-action">
                  <div>
                    <h2>迭代管理</h2>
                    <p>聚焦每个开发周期的目标和时间安排。</p>
                  </div>
                  <el-button v-if="canManagePlanning" class="secondary-action" @click="openIterationDialog()">
                    新增迭代
                  </el-button>
                </div>

                <div v-if="iterations.length" class="planning-list">
                  <div v-for="item in iterations" :key="item.id" class="planning-card">
                    <div class="planning-card-head">
                      <div>
                        <strong>{{ item.iteration_name }}</strong>
                        <p>{{ item.goal || '暂无迭代目标' }}</p>
                      </div>
                      <span class="project-status-pill" :class="`project-status-${item.status}`">
                        {{ iterationStatusTextMap[item.status] || item.status }}
                      </span>
                    </div>
                    <div class="planning-card-meta">
                      <span>开始：{{ item.start_date || '-' }}</span>
                      <span>结束：{{ item.end_date || '-' }}</span>
                    </div>
                    <div v-if="canManagePlanning" class="planning-card-actions">
                      <el-button link class="text-action" @click="openIterationDialog(item)">编辑迭代</el-button>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无项目迭代" />
              </section>

              <section class="project-planning-panel">
                <div class="page-header with-action">
                  <div>
                    <h2>里程碑管理</h2>
                    <p>追踪关键交付节点和目标完成情况。</p>
                  </div>
                  <el-button v-if="canManagePlanning" class="secondary-action" @click="openMilestoneDialog()">
                    新增里程碑
                  </el-button>
                </div>

                <div v-if="milestones.length" class="planning-list">
                  <div v-for="item in milestones" :key="item.id" class="planning-card">
                    <div class="planning-card-head">
                      <div>
                        <strong>{{ item.milestone_name }}</strong>
                        <p>{{ item.description || '暂无里程碑说明' }}</p>
                      </div>
                      <span class="milestone-status-pill" :class="`milestone-status-${item.status}`">
                        {{ milestoneStatusTextMap[item.status] || item.status }}
                      </span>
                    </div>
                    <div class="planning-card-meta">
                      <span>截止：{{ item.due_date || '-' }}</span>
                      <span>完成：{{ item.completed_at || '-' }}</span>
                    </div>
                    <div v-if="canManagePlanning" class="planning-card-actions">
                      <el-button link class="text-action" @click="openMilestoneDialog(item)">编辑里程碑</el-button>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无项目里程碑" />
              </section>
            </div>
          </section>
        </div>

        <div class="project-detail-side">
          <section class="page-card project-member-section">
            <div class="page-header with-action">
              <div>
                <h2>项目成员</h2>
                <p>成员信息与项目角色安排。</p>
              </div>
              <el-button v-if="canManageMembers" class="secondary-action" @click="openMemberDialog">
                新增成员
              </el-button>
            </div>

            <div v-if="members.length" class="project-member-list">
              <div v-for="item in members" :key="item.id" class="project-member-item">
                <div>
                  <strong>{{ item.real_name }}</strong>
                  <p>加入时间：{{ item.created_at }}</p>
                </div>
                <span class="project-member-meta">{{ item.role_in_project }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无项目成员" />
          </section>
        </div>
      </div>
    </section>

    <el-dialog v-model="memberDialogVisible" title="新增项目成员" width="520px">
      <el-form label-position="top">
        <el-form-item label="成员姓名">
          <el-select
            v-model="memberForm.userId"
            filterable
            remote
            reserve-keyword
            placeholder="请输入姓名检索"
            :remote-method="loadHelperOptions"
            :loading="loadingHelperOptions"
            style="width: 100%"
          >
            <el-option
              v-for="item in helperOptions"
              :key="item.id"
              :label="item.real_name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="项目角色">
          <el-input v-model="memberForm.roleInProject" maxlength="50" placeholder="请输入项目角色" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="memberDialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submittingMember" @click="submitMember">
            添加成员
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="iterationDialogVisible"
      :title="iterationForm.id ? '编辑迭代' : '新增迭代'"
      width="560px"
    >
      <el-form label-position="top">
        <div class="form-grid">
          <el-form-item label="迭代名称">
            <el-input v-model="iterationForm.iterationName" maxlength="100" placeholder="请输入迭代名称" />
          </el-form-item>

          <el-form-item label="迭代状态">
            <el-select v-model="iterationForm.status" placeholder="请选择迭代状态">
              <el-option
                v-for="item in iterationStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="开始日期">
            <el-date-picker
              v-model="iterationForm.startDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择开始日期"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="结束日期">
            <el-date-picker
              v-model="iterationForm.endDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择结束日期"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <el-form-item label="迭代目标">
          <el-input
            v-model="iterationForm.goal"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            placeholder="请输入迭代目标"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="iterationDialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submittingIteration" @click="submitIteration">
            {{ iterationForm.id ? '保存迭代' : '创建迭代' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="milestoneDialogVisible"
      :title="milestoneForm.id ? '编辑里程碑' : '新增里程碑'"
      width="560px"
    >
      <el-form label-position="top">
        <div class="form-grid">
          <el-form-item label="里程碑名称">
            <el-input v-model="milestoneForm.milestoneName" maxlength="100" placeholder="请输入里程碑名称" />
          </el-form-item>

          <el-form-item label="里程碑状态">
            <el-select v-model="milestoneForm.status" placeholder="请选择里程碑状态">
              <el-option
                v-for="item in milestoneStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-grid">
          <el-form-item label="截止日期">
            <el-date-picker
              v-model="milestoneForm.dueDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择截止日期"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <el-form-item label="里程碑说明">
          <el-input
            v-model="milestoneForm.description"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            placeholder="请输入里程碑说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-action" @click="milestoneDialogVisible = false">取消</el-button>
          <el-button class="primary-action small" :loading="submittingMilestone" @click="submitMilestone">
            {{ milestoneForm.id ? '保存里程碑' : '创建里程碑' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <TaskCreateDialog
      v-model="taskDialogVisible"
      :default-project-id="route.params.id"
      :lock-project="true"
      @success="loadTasks"
    />

    <TaskDetailDrawer
      v-model="taskDrawerVisible"
      :task-id="currentTaskId"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import {
  addProjectMemberApi,
  createProjectIterationApi,
  createProjectMilestoneApi,
  getHelpersApi,
  getProjectDetailApi,
  getProjectMembersApi,
  getProjectTasksApi,
  updateIterationApi,
  updateMilestoneApi
} from '../../api';
import TaskCreateDialog from '../../components/tasks/TaskCreateDialog.vue';
import TaskDetailDrawer from '../../components/tasks/TaskDetailDrawer.vue';
import { useAuthStore } from '../../stores/auth';
import { useDictionaryStore } from '../../stores/dictionaries';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const dictionaryStore = useDictionaryStore();

const detail = reactive({
  project_code: '',
  project_name: '',
  owner_user_id: null,
  owner_name: '',
  priority: '',
  status: '',
  start_date: '',
  end_date: '',
  progress: 0,
  description: '',
  iterations: [],
  milestones: []
});

const members = ref([]);
const tasks = ref([]);
const helperOptions = ref([]);
const loadingHelperOptions = ref(false);
const memberDialogVisible = ref(false);
const submittingMember = ref(false);
const taskDialogVisible = ref(false);
const taskDrawerVisible = ref(false);
const currentTaskId = ref(null);
const iterationDialogVisible = ref(false);
const milestoneDialogVisible = ref(false);
const submittingIteration = ref(false);
const submittingMilestone = ref(false);

const memberForm = reactive({
  userId: '',
  roleInProject: ''
});

const iterationForm = reactive({
  id: null,
  iterationName: '',
  goal: '',
  status: 'not_started',
  startDate: '',
  endDate: ''
});

const milestoneForm = reactive({
  id: null,
  milestoneName: '',
  description: '',
  status: 'pending',
  dueDate: ''
});

const iterationStatusOptions = [
  { label: '未开始', value: 'not_started' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已暂停', value: 'paused' }
];

const milestoneStatusOptions = [
  { label: '待开始', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已延迟', value: 'delayed' }
];

const iterationStatusTextMap = Object.fromEntries(iterationStatusOptions.map((item) => [item.value, item.label]));
const milestoneStatusTextMap = Object.fromEntries(milestoneStatusOptions.map((item) => [item.value, item.label]));

const iterations = computed(() => detail.iterations || []);
const milestones = computed(() => detail.milestones || []);

const canManageMembers = computed(() => {
  return authStore.user?.role === 'admin' || Number(authStore.user?.id) === Number(detail.owner_user_id);
});
const canManageTasks = computed(() => {
  return authStore.user?.role === 'admin' || Number(authStore.user?.id) === Number(detail.owner_user_id);
});
const canManagePlanning = computed(() => canManageTasks.value);

async function loadDetail() {
  const result = await getProjectDetailApi(route.params.id);
  Object.assign(detail, result.data);
}

async function loadMembers() {
  const result = await getProjectMembersApi(route.params.id);
  members.value = result.data;
}

async function loadTasks() {
  const result = await getProjectTasksApi(route.params.id, {
    page: 1,
    pageSize: 20
  });
  tasks.value = result.data.list;
}

async function reloadProjectData() {
  await Promise.all([loadDetail(), loadTasks()]);
}

async function loadHelperOptions(keyword = '') {
  loadingHelperOptions.value = true;
  try {
    const result = await getHelpersApi(keyword);
    helperOptions.value = result.data;
  } finally {
    loadingHelperOptions.value = false;
  }
}

function openMemberDialog() {
  memberForm.userId = '';
  memberForm.roleInProject = '';
  helperOptions.value = [];
  memberDialogVisible.value = true;
  loadHelperOptions();
}

async function submitMember() {
  if (!memberForm.userId) {
    ElMessage.warning('请选择项目成员');
    return;
  }

  if (!memberForm.roleInProject.trim()) {
    ElMessage.warning('请输入项目角色');
    return;
  }

  submittingMember.value = true;
  try {
    await addProjectMemberApi(route.params.id, {
      userId: memberForm.userId,
      roleInProject: memberForm.roleInProject.trim()
    });
    ElMessage.success('项目成员添加成功');
    memberDialogVisible.value = false;
    await loadMembers();
  } finally {
    submittingMember.value = false;
  }
}

function resetIterationForm() {
  iterationForm.id = null;
  iterationForm.iterationName = '';
  iterationForm.goal = '';
  iterationForm.status = 'not_started';
  iterationForm.startDate = '';
  iterationForm.endDate = '';
}

function openIterationDialog(item = null) {
  resetIterationForm();
  if (item) {
    iterationForm.id = item.id;
    iterationForm.iterationName = item.iteration_name;
    iterationForm.goal = item.goal || '';
    iterationForm.status = item.status || 'not_started';
    iterationForm.startDate = item.start_date || '';
    iterationForm.endDate = item.end_date || '';
  }
  iterationDialogVisible.value = true;
}

async function submitIteration() {
  if (!iterationForm.iterationName.trim()) {
    ElMessage.warning('请输入迭代名称');
    return;
  }

  submittingIteration.value = true;
  try {
    const payload = {
      iterationName: iterationForm.iterationName.trim(),
      goal: iterationForm.goal.trim(),
      status: iterationForm.status,
      startDate: iterationForm.startDate || null,
      endDate: iterationForm.endDate || null
    };

    if (iterationForm.id) {
      await updateIterationApi(iterationForm.id, payload);
      ElMessage.success('项目迭代更新成功');
    } else {
      await createProjectIterationApi(route.params.id, payload);
      ElMessage.success('项目迭代创建成功');
    }

    iterationDialogVisible.value = false;
    await loadDetail();
  } finally {
    submittingIteration.value = false;
  }
}

function resetMilestoneForm() {
  milestoneForm.id = null;
  milestoneForm.milestoneName = '';
  milestoneForm.description = '';
  milestoneForm.status = 'pending';
  milestoneForm.dueDate = '';
}

function openMilestoneDialog(item = null) {
  resetMilestoneForm();
  if (item) {
    milestoneForm.id = item.id;
    milestoneForm.milestoneName = item.milestone_name;
    milestoneForm.description = item.description || '';
    milestoneForm.status = item.status || 'pending';
    milestoneForm.dueDate = item.due_date || '';
  }
  milestoneDialogVisible.value = true;
}

async function submitMilestone() {
  if (!milestoneForm.milestoneName.trim()) {
    ElMessage.warning('请输入里程碑名称');
    return;
  }

  submittingMilestone.value = true;
  try {
    const payload = {
      milestoneName: milestoneForm.milestoneName.trim(),
      description: milestoneForm.description.trim(),
      status: milestoneForm.status,
      dueDate: milestoneForm.dueDate || null
    };

    if (milestoneForm.id) {
      await updateMilestoneApi(milestoneForm.id, payload);
      ElMessage.success('项目里程碑更新成功');
    } else {
      await createProjectMilestoneApi(route.params.id, payload);
      ElMessage.success('项目里程碑创建成功');
    }

    milestoneDialogVisible.value = false;
    await loadDetail();
  } finally {
    submittingMilestone.value = false;
  }
}

function openTaskDetail(taskId) {
  currentTaskId.value = taskId;
  taskDrawerVisible.value = true;
}

onMounted(async () => {
  await dictionaryStore.ensureDictTypes(['project_status', 'project_priority', 'task_status', 'task_priority']);
  await Promise.all([loadDetail(), loadMembers(), loadTasks()]);
});
</script>
