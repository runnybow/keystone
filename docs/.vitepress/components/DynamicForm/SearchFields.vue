<!-- docs/.vitepress/components/DynamicForm/SearchFields.vue -->
<template>
  <div class="search-fields-wrapper">
    <!-- 普通字段（始终显示） -->
    <div class="search-fields">
      <div
        v-for="field in normalFields"
        :key="field.key"
        class="search-field"
        :class="[`field-${field.type}`]"
      >
        <label class="field-label">{{ field.label }}</label>
        <div class="field-control">
          <!-- Input -->
          <input
            v-if="field.type === 'input' || field.type === 'text'"
            :value="getFieldValue(field)"
            :type="field.inputType || 'text'"
            :placeholder="field.placeholder"
            class="search-input"
            @input="updateField(field, $event)"
            @keyup.enter="onEnter"
          />

          <!-- Select -->
          <select
            v-else-if="field.type === 'select'"
            :value="getFieldValue(field)"
            class="search-select"
            @change="updateField(field, $event)"
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
              :value="getDateRangeValue(field, 'start')"
              class="search-input date-input"
              :placeholder="field.startPlaceholder || '开始日期'"
              @input="updateDateRange(field, 'start', $event)"
            />
            <span class="date-separator">至</span>
            <input
              type="date"
              :value="getDateRangeValue(field, 'end')"
              class="search-input date-input"
              :placeholder="field.endPlaceholder || '结束日期'"
              @input="updateDateRange(field, 'end', $event)"
            />
          </div>

          <!-- Switch -->
          <div v-else-if="field.type === 'switch'" class="search-switch">
            <button
              type="button"
              class="switch-btn"
              :class="{ 'is-active': getFieldValue(field) }"
              @click="toggleSwitch(field)"
            >
              <span class="switch-slider"></span>
            </button>
            <span class="switch-label">{{
              getFieldValue(field) ? '是' : '否'
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 更多字段（折叠显示） -->
    <div v-if="showMore && hasMoreFields" class="more-fields">
      <div class="search-fields">
        <div
          v-for="field in moreFields"
          :key="field.key"
          class="search-field"
          :class="[`field-${field.type}`]"
        >
          <label class="field-label">{{ field.label }}</label>
          <div class="field-control">
            <!-- Input -->
            <input
              v-if="field.type === 'input' || field.type === 'text'"
              :value="getFieldValue(field)"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder"
              class="search-input"
              @input="updateField(field, $event)"
              @keyup.enter="onEnter"
            />

            <!-- Select -->
            <select
              v-else-if="field.type === 'select'"
              :value="getFieldValue(field)"
              class="search-select"
              @change="updateField(field, $event)"
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
                :value="getDateRangeValue(field, 'start')"
                class="search-input date-input"
                :placeholder="field.startPlaceholder || '开始日期'"
                @input="updateDateRange(field, 'start', $event)"
              />
              <span class="date-separator">至</span>
              <input
                type="date"
                :value="getDateRangeValue(field, 'end')"
                class="search-input date-input"
                :placeholder="field.endPlaceholder || '结束日期'"
                @input="updateDateRange(field, 'end', $event)"
              />
            </div>

            <!-- Switch -->
            <div v-else-if="field.type === 'switch'" class="search-switch">
              <button
                type="button"
                class="switch-btn"
                :class="{ 'is-active': getFieldValue(field) }"
                @click="toggleSwitch(field)"
              >
                <span class="switch-slider"></span>
              </button>
              <span class="switch-label">{{
                getFieldValue(field) ? '是' : '否'
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 展开/收起按钮 -->
    <div v-if="showToggle && hasMoreFields" class="more-toggle">
      <button class="btn-toggle" @click="toggleMore">
        {{ showMore ? '收起更多 ▲' : '展开更多 ▼' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SearchField } from './types';

// ==================== Props ====================
const props = defineProps<{
  fields: SearchField[];
  modelValue: Record<string, any>;
  showToggle?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void;
  (e: 'change', key: string, value: any): void;
  (e: 'search'): void;
}>();

// ==================== 状态 ====================
const showMore = ref(false);

// ==================== 计算属性 ====================
// 可见字段
const visibleFields = computed(() => {
  return props.fields.filter((f) => {
    if (typeof f.hidden === 'function') {
      return !f.hidden(props.modelValue);
    }
    return !f.hidden;
  });
});

// 普通字段（始终显示）
const normalFields = computed(() => {
  return visibleFields.value.filter((f) => !f.more);
});

// 更多字段（折叠显示）
const moreFields = computed(() => {
  return visibleFields.value.filter((f) => f.more);
});

// 是否有更多字段
const hasMoreFields = computed(() => {
  return moreFields.value.length > 0;
});

// 是否显示展开按钮
const showToggle = computed(() => {
  return props.showToggle !== false && hasMoreFields.value;
});

// ==================== 方法 ====================
// 获取字段值
function getFieldValue(field: SearchField): any {
  return props.modelValue[field.key] ?? '';
}

// 获取日期范围值
function getDateRangeValue(field: SearchField, type: 'start' | 'end'): string {
  const key = `${field.key}_${type}`;
  return props.modelValue[key] ?? '';
}

// 更新字段值
function updateField(field: SearchField, event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const value = target.value;
  const newData = { ...props.modelValue, [field.key]: value };
  emit('update:modelValue', newData);
  emit('change', field.key, value);
}

// 更新日期范围
function updateDateRange(
  field: SearchField,
  type: 'start' | 'end',
  event: Event
) {
  const target = event.target as HTMLInputElement;
  const key = `${field.key}_${type}`;
  const newData = { ...props.modelValue, [key]: target.value };
  emit('update:modelValue', newData);
}

// 切换 Switch
function toggleSwitch(field: SearchField) {
  const currentValue = getFieldValue(field);
  const newValue = !currentValue;
  const newData = { ...props.modelValue, [field.key]: newValue };
  emit('update:modelValue', newData);
  emit('change', field.key, newValue);
}

// 切换更多
function toggleMore() {
  showMore.value = !showMore.value;
}

// 重置更多状态
function resetMore() {
  showMore.value = false;
}

// 回车触发搜索
function onEnter() {
  emit('search');
}

// 暴露方法
defineExpose({
  resetMore,
  showMore: () => showMore.value,
});
</script>

<style scoped>
.search-fields-wrapper {
  width: 100%;
}

/* ==================== 搜索字段区域 ==================== */
.search-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px 24px;
  margin-bottom: 0;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.field-label {
  flex-shrink: 0;
  width: 80px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  line-height: 1.6;
}

.field-control {
  flex: 1;
  min-width: 0;
}

/* 日期范围占两列 */
.search-field.field-date-range {
  grid-column: span 2;
}
@media (max-width: 768px) {
  .search-field.field-date-range {
    grid-column: span 1;
  }
}

/* ==================== 输入控件 ==================== */
.search-input,
.search-select {
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
.search-input:focus,
.search-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}
.search-input::placeholder {
  color: #bfbfbf;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}
.date-range .search-input {
  flex: 1;
  min-width: 0;
}
.date-separator {
  color: #999;
  font-size: 13px;
  flex-shrink: 0;
}

.search-switch {
  display: flex;
  align-items: center;
  gap: 10px;
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

/* ==================== 更多字段 ==================== */
.more-fields {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e8ecf1;
}
.more-fields .search-fields {
  margin-bottom: 0;
}

.more-toggle {
  margin-top: 12px;
  text-align: center;
}

.btn-toggle {
  padding: 4px 16px;
  background: transparent;
  color: #409eff;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.3s;
}
.btn-toggle:hover {
  color: #66b1ff;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .search-fields {
    grid-template-columns: 1fr;
  }
  .search-field {
    flex-wrap: wrap;
  }
  .field-label {
    width: 100%;
    text-align: left;
    font-size: 12px;
  }
  .date-range {
    flex-wrap: wrap;
  }
  .date-range .search-input {
    width: 100%;
  }
}
</style>
