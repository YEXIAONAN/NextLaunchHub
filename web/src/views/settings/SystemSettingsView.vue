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
import { useUiPreferencesStore } from '../../stores/ui-preferences';

const uiPreferencesStore = useUiPreferencesStore();

const densityOptions = [
  { label: '紧凑', value: 'compact' },
  { label: '舒适', value: 'comfortable' },
  { label: '宽松', value: 'spacious' }
];
</script>
