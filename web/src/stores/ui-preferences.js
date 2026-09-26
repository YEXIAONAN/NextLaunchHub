import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const STORAGE_KEY = 'nextlaunch_hub_ui_preferences';

const defaultPreferences = {
  density: 'comfortable',
  modernVisual: true,
  compactSidebar: false,
  fixedTopbar: true,
  zebraTable: false,
  cardShadow: true,
  highContrastStatus: false
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

  const densityClass = computed(() => `density-${preferences.value.density || defaultPreferences.density}`);
  const preferenceClasses = computed(() => [
    densityClass.value,
    preferences.value.modernVisual ? 'modern-visual-enabled' : 'modern-visual-disabled',
    preferences.value.compactSidebar ? 'sidebar-compact-enabled' : 'sidebar-compact-disabled',
    preferences.value.fixedTopbar ? 'topbar-fixed-enabled' : 'topbar-fixed-disabled',
    preferences.value.zebraTable ? 'zebra-table-enabled' : 'zebra-table-disabled',
    preferences.value.cardShadow ? 'card-shadow-enabled' : 'card-shadow-disabled',
    preferences.value.highContrastStatus ? 'status-contrast-enabled' : 'status-contrast-disabled'
  ]);

  function savePreferences(nextPreferences) {
    preferences.value = {
      ...defaultPreferences,
      ...nextPreferences
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.value));
  }

  function setPreference(key, value) {
    savePreferences({
      ...preferences.value,
      [key]: value
    });
  }

  function setDensity(value) {
    setPreference('density', value);
  }

  function resetPreferences() {
    savePreferences({ ...defaultPreferences });
  }

  return {
    preferences,
    densityClass,
    preferenceClasses,
    setPreference,
    setDensity,
    resetPreferences
  };
});
