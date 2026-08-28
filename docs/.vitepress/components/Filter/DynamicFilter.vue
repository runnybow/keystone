<!-- docs/.vitepress/components/DynamicForm/DynamicFilter.vue -->
<template>
  <div class="dynamic-filter">
    <div class="filter-scroll-container">
      <!-- ============ 筛选条件列表 ============ -->
      <div class="filter-conditions">
        <div
          v-for="(condition, index) in conditions"
          :key="condition.id"
          class="condition-row"
        >
          <!-- 字段选择 -->
          <div class="condition-field">
            <select
              :value="condition.field"
              class="cond-select"
              @change="updateConditionField(index, $event)"
            >
              <option value="">选择字段</option>
              <option
                v-for="field in availableFields"
                :key="field.key"
                :value="field.key"
              >
                {{ field.label }}
              </option>
            </select>
          </div>

          <!-- 操作符选择 -->
          <div class="condition-operator">
            <select
              :value="condition.operator"
              class="cond-select"
              @change="updateConditionOperator(index, $event)"
            >
              <option value="">操作符</option>
              <option
                v-for="op in getOperators(condition.field)"
                :key="op.value"
                :value="op.value"
              >
                {{ op.label }}
              </option>
            </select>
          </div>

          <!-- 值输入 -->
          <div class="condition-value">
            <!-- 1. 布尔类型 → 开关 -->
            <div
              v-if="getFieldType(condition.field) === 'boolean'"
              class="boolean-switch"
            >
              <button
                type="button"
                class="switch-btn"
                :class="{ 'is-active': condition.value === true }"
                @click="toggleBooleanValue(index)"
              >
                <span class="switch-slider"></span>
              </button>
              <span class="switch-label">{{
                condition.value === true ? '是' : '否'
              }}</span>
            </div>

            <!-- 2. 空/非空操作符 → 无需输入 -->
            <span
              v-else-if="['empty', 'notEmpty'].includes(condition.operator)"
              class="cond-empty"
            >
              {{
                condition.operator === 'empty' ? '（值为空）' : '（值不为空）'
              }}
            </span>

            <!-- 3. 区间操作符 (between) → 区间输入 -->
            <div
              v-else-if="condition.operator === 'between'"
              class="between-inputs"
            >
              <input
                :value="condition.valueStart"
                :type="getBetweenInputType(condition.field)"
                class="cond-input between-input"
                :placeholder="getStartPlaceholder(condition.field)"
                @input="updateConditionStart(index, $event)"
              />
              <span class="between-separator">至</span>
              <input
                :value="condition.valueEnd"
                :type="getBetweenInputType(condition.field)"
                class="cond-input between-input"
                :placeholder="getEndPlaceholder(condition.field)"
                @input="updateConditionEnd(index, $event)"
              />
            </div>

            <!-- 4. select 类型 → 下拉选择 -->
            <select
              v-else-if="getFieldType(condition.field) === 'select'"
              :value="condition.value"
              class="cond-select"
              @change="updateConditionValue(index, $event)"
            >
              <option value="">请选择</option>
              <option
                v-for="opt in getFieldOptions(condition.field)"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>

            <!-- 5. date 类型 → 日期输入 -->
            <input
              v-else-if="
                getFieldType(condition.field) === 'date' ||
                getFieldType(condition.field) === 'date-range'
              "
              :value="condition.value"
              type="date"
              class="cond-input"
              @change="updateConditionValue(index, $event)"
            />

            <!-- 6. number 类型 → 数字输入 -->
            <input
              v-else-if="getFieldType(condition.field) === 'number'"
              :value="condition.value"
              type="number"
              class="cond-input"
              :placeholder="getValuePlaceholder(condition)"
              @input="updateConditionNumber(index, $event)"
            />

            <!-- 7. text 类型 → 文本输入 -->
            <input
              v-else-if="getFieldType(condition.field) === 'text'"
              :value="condition.value"
              type="text"
              class="cond-input"
              :placeholder="getValuePlaceholder(condition)"
              @input="updateConditionValue(index, $event)"
            />

            <!-- 8. 兜底：未知类型 → 文本输入 -->
            <input
              v-else
              :value="condition.value"
              type="text"
              class="cond-input"
              placeholder="请输入值"
              @input="updateConditionValue(index, $event)"
            />
          </div>

          <!-- 逻辑连接符 -->
          <div v-if="index < conditions.length - 1" class="condition-logic">
            <select
              :value="condition.logic"
              class="cond-select logic-select"
              @change="updateConditionLogic(index, $event)"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>

          <!-- 操作按钮 -->
          <div class="condition-actions">
            <button
              class="btn-remove"
              @click="removeCondition(index)"
              :disabled="conditions.length <= 1"
              title="删除条件"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- ============ 添加按钮 ============ -->
    <div class="filter-toolbar">
      <button class="btn-add" @click="addCondition">＋ 添加条件</button>
      <button
        class="btn-clear"
        @click="clearConditions"
        :disabled="conditions.length <= 1"
      >
        清空所有
      </button>
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

    <!-- ============ 错误提示 ============ -->
    <div v-if="errorMessage" class="filter-error">⚠️ {{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DynamicFilterSchema } from './types';
import { OPERATORS } from './preset';

// ==================== Props ====================
const props = defineProps<{
  schema: DynamicFilterSchema;
}>();

const emit = defineEmits<{
  (e: 'search', conditions: FilterCondition[], results: any[]): void;
  (e: 'reset'): void;
}>();

// ==================== 状态 ====================
const conditions = ref<FilterCondition[]>([]);
const loading = ref(false);
const errorMessage = ref('');
let idCounter = 0;

const availableFields = computed(() => props.schema.fields);

// ==================== 核心方法 ====================

/** 获取字段类型 */
function getFieldType(fieldKey: string): string {
  if (!fieldKey) return 'text';
  const field = availableFields.value.find((f) => f.key === fieldKey);
  return field?.type || 'text';
}

/** 获取字段选项 */
function getFieldOptions(
  fieldKey: string
): Array<{ label: string; value: any }> {
  const field = availableFields.value.find((f) => f.key === fieldKey);
  return field?.options || [];
}

/** 获取操作符列表 */
function getOperators(
  fieldKey: string
): Array<{ value: string; label: string }> {
  if (!fieldKey) return [];
  const type = getFieldType(fieldKey);
  return OPERATORS[type] || [];
}

/** 获取占位符 */
function getValuePlaceholder(condition: FilterCondition): string {
  const field = availableFields.value.find((f) => f.key === condition.field);
  if (!field) return '请输入值';
  return field.placeholder || `请输入${field.label}`;
}

/** 获取区间输入类型 */
function getBetweenInputType(fieldKey: string): string {
  const type = getFieldType(fieldKey);
  if (type === 'number') return 'number';
  if (type === 'date' || type === 'date-range') return 'date';
  return 'text';
}

/** 获取开始占位符 */
function getStartPlaceholder(fieldKey: string): string {
  const type = getFieldType(fieldKey);
  if (type === 'number') return '最小值';
  if (type === 'date' || type === 'date-range') return '开始日期';
  return '起始值';
}

/** 获取结束占位符 */
function getEndPlaceholder(fieldKey: string): string {
  const type = getFieldType(fieldKey);
  if (type === 'number') return '最大值';
  if (type === 'date' || type === 'date-range') return '结束日期';
  return '结束值';
}

// ==================== 工具方法 ====================
function generateId(): string {
  return `cond_${Date.now()}_${++idCounter}`;
}

function createEmptyCondition(): FilterCondition {
  return {
    id: generateId(),
    field: '',
    operator: '',
    value: '',
    logic: 'AND',
  };
}

// ==================== 更新方法 ====================
function updateConditionField(index: number, event: Event) {
  const target = event.target as HTMLSelectElement;
  const condition = conditions.value[index];
  if (condition) {
    condition.field = target.value;
    condition.operator = '';
    condition.value = '';
    condition.valueStart = '';
    condition.valueEnd = '';
  }
}

function updateConditionOperator(index: number, event: Event) {
  const target = event.target as HTMLSelectElement;
  const condition = conditions.value[index];
  if (condition) {
    condition.operator = target.value;
    condition.value = '';
    condition.valueStart = '';
    condition.valueEnd = '';
  }
}

function updateConditionValue(index: number, event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const condition = conditions.value[index];
  if (condition) {
    condition.value = target.value;
  }
}

function updateConditionNumber(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const condition = conditions.value[index];
  if (condition) {
    condition.value = target.value !== '' ? Number(target.value) : '';
  }
}

function updateConditionStart(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const condition = conditions.value[index];
  if (condition) {
    condition.valueStart = target.value;
  }
}

function updateConditionEnd(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const condition = conditions.value[index];
  if (condition) {
    condition.valueEnd = target.value;
  }
}

function updateConditionLogic(index: number, event: Event) {
  const target = event.target as HTMLSelectElement;
  const condition = conditions.value[index];
  if (condition) {
    condition.logic = target.value as 'AND' | 'OR';
  }
}

function toggleBooleanValue(index: number) {
  const condition = conditions.value[index];
  if (condition) {
    condition.value = condition.value === true ? false : true;
  }
}

// ==================== 条件管理 ====================
function initConditions() {
  conditions.value = [createEmptyCondition()];
}

function addCondition() {
  const lastCondition = conditions.value[conditions.value.length - 1];
  const newCondition = createEmptyCondition();
  if (lastCondition) {
    newCondition.logic = lastCondition.logic || 'AND';
  }
  conditions.value.push(newCondition);
}

function removeCondition(index: number) {
  if (conditions.value.length <= 1) return;
  conditions.value.splice(index, 1);
}

function clearConditions() {
  conditions.value = [createEmptyCondition()];
}

// ==================== 搜索与重置 ====================
async function handleSearch() {
  loading.value = true;
  errorMessage.value = '';

  try {
    // 过滤有效的条件（有字段和操作符）
    const validConditions = conditions.value.filter(
      (c) => c.field && c.operator
    );

    if (validConditions.length === 0) {
      loading.value = false;
      errorMessage.value = '请至少添加一个有效的筛选条件';
      return;
    }

    // const data = await props.schema.searchFn(conditions.value);
    emit('search', conditions.value);
  } catch (error: any) {
    console.error('❌ 筛选失败：', error);
    errorMessage.value = error.message || '筛选失败，请重试';
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  initConditions();
  errorMessage.value = '';
  emit('reset');
  console.log('🔄 已重置筛选');
}

// ==================== 暴露方法 ====================
defineExpose({
  search: handleSearch,
  reset: handleReset,
  getConditions: () => conditions.value,
});

// ==================== 初始化 ====================
initConditions();
</script>

<style scoped>
.dynamic-filter {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8ecf1;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 600px;
  position: relative;
}
/* ==================== 滚动容器 ==================== */
.filter-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 12px;
  max-height: 380px;
}
/* 自定义滚动条 */
.filter-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.filter-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.filter-scroll-container::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.filter-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* ==================== 条件行 ==================== */
.filter-conditions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.condition-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: #f8f9fb;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
  transition: border-color 0.3s;
}

.condition-row:hover {
  border-color: #e0e4ea;
}

.condition-field {
  flex: 1.2;
  min-width: 120px;
}
.condition-operator {
  flex: 1;
  min-width: 100px;
}
.condition-value {
  flex: 1.5;
  min-width: 140px;
}
.condition-logic {
  flex: 0 0 80px;
}
.condition-actions {
  flex: 0 0 32px;
}

.cond-select,
.cond-input {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  transition: border-color 0.3s, box-shadow 0.3s;
  height: 34px;
  box-sizing: border-box;
}

.cond-select:focus,
.cond-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.cond-input[type='number']::-webkit-outer-spin-button,
.cond-input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.cond-input[type='number'] {
  -moz-appearance: textfield;
}

.logic-select {
  text-align: center;
  font-weight: 600;
  color: #409eff;
  border-color: #d9ecff;
  background: #ecf5ff;
}

.cond-empty {
  color: #999;
  font-size: 13px;
  padding: 4px 0;
}

.btn-remove {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-remove:hover:not(:disabled) {
  background: #fef0f0;
  color: #f56c6c;
}
.btn-remove:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ==================== 区间输入 ==================== */
.between-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.between-inputs .between-input {
  flex: 1;
  min-width: 0;
}
.between-separator {
  color: #999;
  font-size: 13px;
  flex-shrink: 0;
}

/* ==================== 布尔开关 ==================== */
.boolean-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 34px;
}
.boolean-switch .switch-btn {
  position: relative;
  width: 44px;
  height: 24px;
  border: none;
  border-radius: 12px;
  background: #d9d9d9;
  cursor: pointer;
  transition: background 0.3s;
  padding: 0;
  flex-shrink: 0;
}
.boolean-switch .switch-btn.is-active {
  background: #409eff;
}
.boolean-switch .switch-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.boolean-switch .switch-btn.is-active .switch-slider {
  transform: translateX(20px);
}
.boolean-switch .switch-label {
  font-size: 13px;
  color: #666;
  min-width: 20px;
}

/* ==================== 工具栏 ==================== */
.filter-toolbar {
  display: flex;
  gap: 10px;
  margin: 12px;
  flex-wrap: wrap;
}

.btn-add {
  padding: 6px 16px;
  background: #ecf5ff;
  color: #409eff;
  border: 1px dashed #409eff;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-add:hover {
  background: #d9ecff;
}

.btn-clear {
  padding: 6px 16px;
  background: #f5f7fa;
  color: #999;
  border: 1px solid #e8ecf1;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-clear:hover:not(:disabled) {
  color: #f56c6c;
  border-color: #fde2e2;
}
.btn-clear:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ==================== 操作按钮 ==================== */
.filter-actions {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px;
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
  .dynamic-filter {
    padding: 16px;
  }
  .condition-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .condition-field,
  .condition-operator,
  .condition-value,
  .condition-logic {
    flex: 1 1 auto;
    min-width: 0;
  }
  .condition-actions {
    flex: 1 1 auto;
    display: flex;
    justify-content: flex-end;
  }
  .filter-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-search,
  .btn-reset {
    width: 100%;
    justify-content: center;
  }
  .between-inputs {
    flex-wrap: wrap;
  }
  .between-inputs .between-input {
    flex: 1 1 100%;
  }
  .between-separator {
    padding: 0 4px;
  }
}
</style>
