<template>
  <div class="page-section settings-page">
    <section class="page-card settings-hero">
      <div>
        <span class="settings-eyebrow">偏好设置</span>
        <h2>让系统动起来，但保持克制</h2>
        <p>根据你的使用习惯调整页面动画、信息密度和视觉层次。设置会保存在当前浏览器中。</p>
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
            <h2>动画效果</h2>
            <p>控制页面切换、卡片浮动和交互反馈的动效强度。</p>
          </div>
          <span class="settings-value">{{ animationLevelText }}</span>
        </div>

        <el-slider
          :model-value="uiPreferencesStore.preferences.animationLevel"
          :min="0"
          :max="3"
          :step="1"
          show-stops
          @update:model-value="uiPreferencesStore.setAnimationLevel"
        />

        <div class="settings-scale">
          <span>关闭</span>
          <span>轻微</span>
          <span>标准</span>
          <span>明显</span>
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
            <p>为顶部栏和面板启用更柔和的透明层次与阴影效果。</p>
          </div>
          <el-switch
            :model-value="uiPreferencesStore.preferences.glassEffect"
            @update:model-value="uiPreferencesStore.setGlassEffect"
          />
        </div>

        <div class="settings-modern-preview">
          <div class="preview-card preview-card-primary">
            <span>统计卡片</span>
            <strong>24</strong>
          </div>
          <div class="preview-card preview-card-secondary">
            <span>处理事项</span>
            <strong>8</strong>
          </div>
        </div>
      </article>

      <article class="page-card settings-panel settings-reset-panel">
        <div>
          <h2>恢复默认</h2>
          <p>回到系统推荐的标准动画、舒适间距和现代视觉效果。</p>
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

const uiPreferencesStore = useUiPreferencesStore();

const densityOptions = [
  { label: '紧凑', value: 'compact' },
  { label: '舒适', value: 'comfortable' },
  { label: '宽松', value: 'spacious' }
];

const animationLevelText = computed(() => {
  const textMap = ['已关闭', '轻微', '标准', '明显'];
  return textMap[uiPreferencesStore.animationLevel] || '标准';
});
</script>
