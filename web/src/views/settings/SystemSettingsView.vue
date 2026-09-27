<template>
  <div class="page-section settings-page">
    <section class="page-card settings-hero">
      <div>
        <span class="settings-eyebrow">偏好设置</span>
        <h2>按你的习惯调整工作台</h2>
        <p>配置显示密度、侧边栏、顶部栏和表格样式。设置会立即保存到当前浏览器，刷新后继续生效。</p>
      </div>
      <div class="settings-preview" aria-hidden="true">
        <span></span>
        <strong></strong>
        <em></em>
      </div>
    </section>

    <section class="settings-grid">
      <article class="page-card settings-panel permission-guide-panel">
        <div class="settings-panel-head"><div><h2>当前身份与权限</h2><p>{{ roleGuide.summary }}</p></div></div>
        <div class="permission-guide-list">
          <div v-for="item in roleGuide.items" :key="item" class="permission-guide-item">{{ item }}</div>
        </div>
      </article>
      <article class="page-card settings-panel">
        <div class="settings-panel-head">
          <div>
            <h2>显示密度</h2>
            <p>调整页面卡片和内容间距，适合不同屏幕与工作节奏。</p>
          </div>
        </div>

        <el-segmented
          :model-value="uiPreferencesStore.preferences.density"
          :options="densityOptions"
          @update:model-value="uiPreferencesStore.setDensity"
        />
      </article>

      <article class="page-card settings-panel">
        <div class="settings-panel-head">
          <div>
            <h2>现代化视觉</h2>
            <p>保留品牌配色，同时让顶部栏和看板卡片更有层次。</p>
          </div>
          <el-switch
            :model-value="uiPreferencesStore.preferences.modernVisual"
            @update:model-value="(value) => uiPreferencesStore.setPreference('modernVisual', value)"
          />
        </div>
      </article>

      <article class="page-card settings-panel">
        <div class="settings-panel-head">
          <div>
            <h2>紧凑侧边栏</h2>
            <p>减少左侧导航宽度，给表格和详情页留出更多横向空间。</p>
          </div>
          <el-switch
            :model-value="uiPreferencesStore.preferences.compactSidebar"
            @update:model-value="(value) => uiPreferencesStore.setPreference('compactSidebar', value)"
          />
        </div>
      </article>

      <article class="page-card settings-panel">
        <div class="settings-panel-head">
          <div>
            <h2>固定顶部栏</h2>
            <p>滚动内容时保留页面标题、通知入口和用户菜单。</p>
          </div>
          <el-switch
            :model-value="uiPreferencesStore.preferences.fixedTopbar"
            @update:model-value="(value) => uiPreferencesStore.setPreference('fixedTopbar', value)"
          />
        </div>
      </article>

      <article class="page-card settings-panel">
        <div class="settings-panel-head">
          <div>
            <h2>表格斑马纹</h2>
            <p>为长列表增加隔行底色，便于横向扫读。</p>
          </div>
          <el-switch
            :model-value="uiPreferencesStore.preferences.zebraTable"
            @update:model-value="(value) => uiPreferencesStore.setPreference('zebraTable', value)"
          />
        </div>
      </article>

      <article class="page-card settings-panel">
        <div class="settings-panel-head">
          <div>
            <h2>卡片阴影</h2>
            <p>控制页面卡片的阴影层次，喜欢更平的界面可以关闭。</p>
          </div>
          <el-switch
            :model-value="uiPreferencesStore.preferences.cardShadow"
            @update:model-value="(value) => uiPreferencesStore.setPreference('cardShadow', value)"
          />
        </div>
      </article>

      <article class="page-card settings-panel">
        <div class="settings-panel-head">
          <div>
            <h2>高对比状态</h2>
            <p>增强状态标签颜色，让待处理、处理中、已完成更容易区分。</p>
          </div>
          <el-switch
            :model-value="uiPreferencesStore.preferences.highContrastStatus"
            @update:model-value="(value) => uiPreferencesStore.setPreference('highContrastStatus', value)"
          />
        </div>
      </article>

      <article class="page-card settings-panel settings-preview-panel">
        <div class="settings-panel-head">
          <div>
            <h2>效果预览</h2>
            <p>用当前配置预览卡片、表格和状态标签的显示效果。</p>
          </div>
        </div>
        <div class="settings-modern-preview">
          <div class="preview-card preview-card-primary">
            <span>待处理</span>
            <strong>24</strong>
          </div>
          <div class="preview-card preview-card-secondary">
            <span>处理中</span>
            <strong>8</strong>
          </div>
        </div>
      </article>

      <article class="page-card settings-panel settings-reset-panel">
        <div>
          <h2>恢复默认</h2>
          <p>回到系统推荐的舒适间距、固定顶部栏和现代视觉效果。</p>
        </div>
        <el-button class="secondary-action" @click="uiPreferencesStore.resetPreferences">
          恢复默认设置
        </el-button>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUiPreferencesStore } from '../../stores/ui-preferences';
import { useAuthStore } from '../../stores/auth';

const uiPreferencesStore = useUiPreferencesStore();
const authStore = useAuthStore();
const roleGuide = computed(() => {
  if (authStore.user?.role === 'admin') return { summary: '系统管理员拥有全局运营、治理与处置权限。', items: ['管理用户账号、系统角色与字典', '查看并改派全部求助单，处理超时风险', '创建、删除全部项目与任务', '查看全局项目、任务与服务运营数据'] };
  if (authStore.user?.role === 'helper') return { summary: '协作人员仅处理自己被分配或所属项目内的工作。', items: ['同步本人任务进度、状态与进展说明', '处理分配给自己的求助单并提交协同记录', '项目经理 / 产品负责人可管理项目任务、计划与成员', '观察者只能查看项目，不可修改任何内容'] };
  return { summary: '发起人可登录并跟踪自己的求助处理过程。', items: ['提交并查看本人发起的求助单', '查看关联任务的实时进度', '对待确认结果进行确认或退回', '不接触项目内部成员、任务和管理数据'] };
});

const densityOptions = [
  { label: '紧凑', value: 'compact' },
  { label: '舒适', value: 'comfortable' },
  { label: '宽松', value: 'spacious' }
];
</script>
