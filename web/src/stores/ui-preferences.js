import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

const STORAGE_KEY = 'nextlaunch_hub_ui_preferences';

const defaultPreferences = {
  animationLevel: 2,
  density: 'comfortable',
  glassEffect: true
};

function readStoredPreferences() {
  try {
    return {
      ...defaultPreferences,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    };
  } catch (_error) {
    return { ...defaultPreferences };
  }
}

export const useUiPreferencesStore = defineStore('uiPreferences', () => {
  const preferences = ref(readStoredPreferences());

  const animationLevel = computed(() => Number(preferences.value.animationLevel) || 0);
  const motionClass = computed(() => `motion-level-${animationLevel.value}`);
  const densityClass = computed(() => `density-${preferences.value.density || defaultPreferences.density}`);
  const glassClass = computed(() => preferences.value.glassEffect ? 'glass-enabled' : 'glass-disabled');

  function setAnimationLevel(value) {
    preferences.value.animationLevel = Number(value);
  }

  function setDensity(value) {
    preferences.value.density = value;
  }

  function setGlassEffect(value) {
    preferences.value.glassEffect = Boolean(value);
  }

  function resetPreferences() {
    preferences.value = { ...defaultPreferences };
  }

  watch(
    preferences,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    },
    { deep: true }
  );

  return {
    preferences,
    animationLevel,
    motionClass,
    densityClass,
    glassClass,
    setAnimationLevel,
    setDensity,
    setGlassEffect,
    resetPreferences
  };
});
