import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { getDictionariesApi } from '../api';

export const useDictionaryStore = defineStore('dictionaries', () => {
  const itemsByType = reactive({});
  const loadedTypes = ref(new Set());
  const loadingPromises = reactive({});

  async function ensureDictType(dictType) {
    if (!dictType) {
      return [];
    }

    if (loadedTypes.value.has(dictType)) {
      return itemsByType[dictType] || [];
    }

    if (loadingPromises[dictType]) {
      return loadingPromises[dictType];
    }

    loadingPromises[dictType] = getDictionariesApi({
      dictType
    })
      .then((result) => {
        itemsByType[dictType] = result.data || [];
        loadedTypes.value.add(dictType);
        return itemsByType[dictType];
      })
      .finally(() => {
        delete loadingPromises[dictType];
      });

    return loadingPromises[dictType];
  }

  async function ensureDictTypes(dictTypes = []) {
    const uniqueTypes = Array.from(new Set(dictTypes.filter(Boolean)));
    await Promise.all(uniqueTypes.map((dictType) => ensureDictType(dictType)));
  }

  async function refreshDictType(dictType) {
    if (!dictType) {
      return [];
    }

    loadedTypes.value.delete(dictType);
    delete itemsByType[dictType];
    return ensureDictType(dictType);
  }

  function getOptions(dictType) {
    return itemsByType[dictType] || [];
  }

  function getLabel(dictType, value, fallback = '') {
    const matched = getOptions(dictType).find((item) => item.dict_value === value);
    return matched?.dict_label || fallback || value || '';
  }

  function useOptions(dictType) {
    return computed(() => getOptions(dictType));
  }

  return {
    itemsByType,
    ensureDictType,
    ensureDictTypes,
    refreshDictType,
    getOptions,
    getLabel,
    useOptions
  };
});
