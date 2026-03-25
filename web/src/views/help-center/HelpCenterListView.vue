<template>
  <div class="page-section">
    <section class="page-card">
      <div class="page-header">
        <div>
          <h2>求助中心</h2>
          <p>管理员可查看全部求助单，帮助人员仅查看本人负责的求助单。</p>
        </div>
        <el-select v-model="status" placeholder="按状态筛选" clearable style="width: 180px" @change="loadList">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="待确认" value="waiting_confirm" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </div>
      <el-table :data="list" class="custom-table" :row-class-name="getRowClassName">
        <el-table-column prop="request_no" label="求助单号" min-width="170" />
        <el-table-column prop="title" label="求助标题" min-width="220" />
        <el-table-column prop="requester_name" label="发起人姓名" min-width="120" />
        <el-table-column prop="helper_name" label="帮助人员姓名" min-width="120" />
        <el-table-column label="当前状态" min-width="120">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="超时状态" min-width="120">
          <template #default="{ row }">
            <span v-if="Number(row.is_timeout) === 1" class="timeout-pill">已超时</span>
            <span v-else class="table-meta-note">正常</span>
          </template>
        </el-table-column>
        <el-table-column prop="request_datetime" label="发起时间" min-width="180" />
        <el-table-column prop="requester_ip" label="发起 IP" min-width="140" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link class="text-action" @click="router.push(`/help-center/${row.id}`)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getHelpRequestsApi } from '../../api';
import StatusTag from '../../components/StatusTag.vue';

const router = useRouter();
const status = ref('');
const list = ref([]);

async function loadList() {
  const result = await getHelpRequestsApi(status.value);
  list.value = result.data;
}

function getRowClassName({ row }) {
  return Number(row.is_timeout) === 1 ? 'timeout-row' : '';
}

onMounted(loadList);
</script>
