<!-- docs/.vitepress/components/DynamicForm/BasicFilter.vue -->
<template>
  <div class="basic-filter">
    <!-- ============ 筛选条件区域 ============ -->
    <div class="filter-fields" :class="{ 'is-inline': layout === 'inline' }">
      <div
        v-for="field in fields"
        :key="field.key"
        class="filter-field"
        :class="[`field-${field.type}`, { 'is-hidden': isFieldHidden(field) }]"
      >
        <label v-if="field.label" class="field-label">{{ field.label }}</label>
        <div class="field-control">
          <!-- Input -->
          <input
            v-if="field.type === 'input' || field.type === 'text'"
            v-model="filterData[field.key]"
            :type="field.inputType || 'text'"
            :placeholder="field.placeholder"
            class="filter-input"
            @keyup.enter="handleSearch"
            @input="onFieldChange(field.key)"
          />

          <!-- Select -->
          <select
            v-else-if="field.type === 'select'"
            v-model="filterData[field.key]"
            class="filter-select"
            @change="handleSearch"
          >
            <option value="">{{ field.placeholder || '全部' }}</option>
            <option
              v-for="opt in field.options"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>

          <!-- Date Range -->
          <div v-else-if="field.type === 'date-range'" class="date-range">
            <input
              type="date"
              v-model="filterData[`${field.key}_start`]"
              class="filter-input date-input"
              :placeholder="field.startPlaceholder || '开始日期'"
              @change="handleSearch"
            />
            <span class="date-separator">至</span>
            <input
              type="date"
              v-model="filterData[`${field.key}_end`]"
              class="filter-input date-input"
              :placeholder="field.endPlaceholder || '结束日期'"
              @change="handleSearch"
            />
          </div>

          <!-- Switch -->
          <div v-else-if="field.type === 'switch'" class="filter-switch">
            <button
              type="button"
              class="switch-btn"
              :class="{ 'is-active': filterData[field.key] }"
              @click="
                filterData[field.key] = !filterData[field.key];
                handleSearch();
              "
            >
              <span class="switch-slider"></span>
            </button>
            <span class="switch-label">{{
              filterData[field.key] ? '是' : '否'
            }}</span>
          </div>

          <!-- Button Group -->
          <div v-else-if="field.type === 'button-group'" class="button-group">
            <button
              v-for="opt in field.options"
              :key="opt.value"
              type="button"
              class="btn-option"
              :class="{ 'is-active': filterData[field.key] === opt.value }"
              @click="
                filterData[field.key] = opt.value;
                handleSearch();
              "
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 操作按钮 ============ -->
    <div class="filter-actions">
      <button class="btn-search" @click="handleSearch" :disabled="loading">
        <span v-if="loading" class="filter-spinner"></span>
        {{ loading ? '搜索中...' : '🔍 搜索' }}
      </button>
      <button class="btn-reset" @click="handleReset" :disabled="loading">
        ↻ 重置
      </button>
    </div>
    <!-- 已选条件标签 -->
    <div v-if="showSelected && activeFilters.length > 0" class="active-tags">
      <span class="tag-label">已选：</span>
      <span
        v-for="tag in activeFilters"
        :key="tag.key"
        class="filter-tag"
        @click="removeFilter(tag.key)"
      >
        {{ tag.label }}
        <span class="tag-remove">✕</span>
      </span>
    </div>

    <!-- ============ 错误提示 ============ -->
    <div v-if="errorMessage" class="filter-error">⚠️ {{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue';
import type { FilterSchema } from 'types';

// ==================== Props ====================
const props = defineProps<{
  schema: FilterSchema;
}>();

const emit = defineEmits<{
  (e: 'search', data: Record<string, any>, results: any[]): void;
  (e: 'reset'): void;
}>();

// ==================== 状态 ====================
const filterData = reactive<Record<string, any>>({});
const loading = ref(false);
const errorMessage = ref('');
const layout = computed(() => props.schema.layout || 'inline');
const showSelected = computed(() => props.schema.showSelected || true);

// ==================== 计算属性 ====================
const fields = computed(() => props.schema.fields);

const activeFilters = computed(() => {
  const tags: Array<{ key: string; label: string }> = [];

  fields.value.forEach((field) => {
    if (field.type === 'date-range') {
      const start = filterData[`${field.key}_start`];
      const end = filterData[`${field.key}_end`];
      if (start || end) {
        tags.push({
          key: field.key,
          label: `${field.label || field.key}: ${start || '...'} ~ ${
            end || '...'
          }`,
        });
      }
      return;
    }

    const value = filterData[field.key];
    if (
      value !== '' &&
      value !== undefined &&
      value !== null &&
      value !== false
    ) {
      let label = value;
      if (field.options) {
        const opt = field.options.find((o) => o.value === value);
        if (opt) label = opt.label;
      }
      tags.push({
        key: field.key,
        label: `${field.label || field.key}: ${label}`,
      });
    }
  });

  return tags;
});

// ==================== 方法 ====================
function initFilterData() {
  fields.value.forEach((field) => {
    if (field.type === 'date-range') {
      filterData[`${field.key}_start`] = '';
      filterData[`${field.key}_end`] = '';
    } else if (field.defaultValue !== undefined) {
      filterData[field.key] = field.defaultValue;
    } else {
      filterData[field.key] = '';
    }
  });

  if (props.schema.initialData) {
    Object.assign(filterData, props.schema.initialData);
  }
}

function isFieldHidden(field: FilterField): boolean {
  if (typeof field.hidden === 'function') {
    return field.hidden(filterData);
  }
  return field.hidden || false;
}

function getSearchParams(): Record<string, any> {
  const params: Record<string, any> = {};

  fields.value.forEach((field) => {
    if (field.type === 'date-range') {
      const start = filterData[`${field.key}_start`];
      const end = filterData[`${field.key}_end`];
      if (start) params[`${field.key}_start`] = start;
      if (end) params[`${field.key}_end`] = end;
    } else {
      const value = filterData[field.key];
      if (
        value !== '' &&
        value !== undefined &&
        value !== null &&
        value !== false
      ) {
        params[field.key] = value;
      }
    }
  });

  return params;
}

async function handleSearch() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const params = getSearchParams();
    // const data = await props.schema.searchFn(params);
    emit('search', params);
  } catch (error: any) {
    console.error('❌ 筛选失败：', error);
    errorMessage.value = error.message || '筛选失败，请重试';
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  fields.value.forEach((field) => {
    if (field.type === 'date-range') {
      filterData[`${field.key}_start`] = '';
      filterData[`${field.key}_end`] = '';
    } else if (field.defaultValue !== undefined) {
      filterData[field.key] = field.defaultValue;
    } else {
      filterData[field.key] = '';
    }
  });

  errorMessage.value = '';
  emit('reset');
  console.log('🔄 已重置筛选');

  if (props.schema.autoSearch !== false) {
    nextTick(() => handleSearch());
  }
}

function onFieldChange(key: string) {
  if (props.schema.autoSearch !== false) {
    clearTimeout((filterData as any)._timer);
    (filterData as any)._timer = setTimeout(() => {
      handleSearch();
    }, 300);
  }
}

function removeFilter(key: string) {
  const field = fields.value.find((f) => f.key === key);
  if (field) {
    if (field.type === 'date-range') {
      filterData[`${key}_start`] = '';
      filterData[`${key}_end`] = '';
    } else {
      filterData[key] = '';
    }
    handleSearch();
  }
}

// 暴露方法
defineExpose({
  search: handleSearch,
  reset: handleReset,
  getData: () => ({ ...filterData }),
});

// ==================== 生命周期 ====================
initFilterData();

onMounted(() => {
  if (props.schema.autoSearch !== false) {
    setTimeout(() => handleSearch(), 300);
  }
});
</script>

<style scoped>
.basic-filter {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid #e8ecf1;
  max-width: 100%;
}

/* ==================== 筛选字段 ==================== */
.filter-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-bottom: 12px;
}

.filter-fields.is-inline .filter-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 180px;
  max-width: 300px;
}

.filter-fields.is-inline .field-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-fields.is-vertical .filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.filter-fields.is-vertical .field-label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.field-control {
  flex: 1;
  min-width: 0;
}

.filter-field.is-hidden {
  display: none;
}

/* ==================== 输入控件 ==================== */
.filter-input,
.filter-select {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
  height: 34px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.filter-input::placeholder {
  color: #bfbfbf;
}

/* Date Range */
.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.date-range .filter-input {
  flex: 1;
  min-width: 0;
}

.date-separator {
  color: #999;
  font-size: 13px;
  flex-shrink: 0;
}

/* Switch */
.filter-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 34px;
}

.switch-btn {
  position: relative;
  width: 40px;
  height: 22px;
  border: none;
  border-radius: 11px;
  background: #d9d9d9;
  cursor: pointer;
  transition: background 0.3s;
  padding: 0;
  flex-shrink: 0;
}

.switch-btn.is-active {
  background: #409eff;
}

.switch-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.switch-btn.is-active .switch-slider {
  transform: translateX(18px);
}

.switch-label {
  font-size: 13px;
  color: #666;
}

/* Button Group */
.button-group {
  display: flex;
  gap: 4px;
  height: 34px;
}

.btn-option {
  padding: 4px 16px;
  background: #f5f7fa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  color: #666;
}

.btn-option:hover:not(.is-active) {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.btn-option.is-active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

/* ==================== 操作按钮 ==================== */
.filter-actions {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.btn-search {
  padding: 7px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
}

.btn-search:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset {
  padding: 7px 16px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  height: 34px;
  line-height: 19px;
}

.btn-reset:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}

.btn-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==================== 已选标签 ==================== */
.active-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.tag-label {
  font-size: 13px;
  color: #999;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 12px;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tag:hover {
  background: #d9ecff;
}

.tag-remove {
  font-size: 12px;
  opacity: 0.6;
}

.filter-tag:hover .tag-remove {
  opacity: 1;
}

/* ==================== 错误提示 ==================== */
.filter-error {
  margin-top: 12px;
  padding: 10px 16px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  color: #f56c6c;
  font-size: 14px;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .basic-filter {
    padding: 16px;
  }

  .filter-fields.is-inline .filter-field {
    min-width: 100%;
    max-width: 100%;
  }

  .filter-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .active-tags {
    order: -1;
  }

  .btn-search,
  .btn-reset {
    width: 100%;
    justify-content: center;
  }
}
</style>
