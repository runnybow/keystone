<!-- docs/.vitepress/components/DynamicForm/GroupFilter.vue -->
<template>
  <div class="group-filter">
    <!-- ============ 滚动容器 ============ -->
    <div class="group-scroll-container">
      <!-- 条件组列表 -->
      <div class="group-list">
        <div
          v-for="(group, groupIndex) in groups"
          :key="group.id"
          class="group-item"
          :class="{ 'is-or': group.logic === 'OR' }"
        >
          <!-- 组标题 -->
          <div class="group-header">
            <div class="group-header-left">
              <span class="group-icon">{{
                group.logic === 'OR' ? '🔀' : '🔗'
              }}</span>
              <span class="group-label">{{
                group.logic === 'OR' ? 'OR 组' : 'AND 组'
              }}</span>
              <span class="group-badge"
                >{{ getConditionCount(group) }} 个条件</span
              >
            </div>
            <div class="group-header-right">
              <select
                v-model="group.logic"
                class="group-logic-select"
                @change="onGroupChange"
              >
                <option value="AND">AND（所有条件都满足）</option>
                <option value="OR">OR（任一条件满足）</option>
              </select>
              <button
                class="btn-remove-group"
                @click="removeGroup(groupIndex)"
                :disabled="groups.length <= 1"
                title="删除组"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- 组内条件列表 -->
          <div class="group-conditions">
            <div
              v-for="(condition, condIndex) in group.conditions"
              :key="condition.id"
              class="condition-row"
            >
              <!-- 字段选择 -->
              <div class="condition-field">
                <select
                  :value="condition.field"
                  class="cond-select"
                  @change="updateConditionField(groupIndex, condIndex, $event)"
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
                  @change="
                    updateConditionOperator(groupIndex, condIndex, $event)
                  "
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
                    @click="toggleBooleanValue(groupIndex, condIndex)"
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
                    condition.operator === 'empty'
                      ? '（值为空）'
                      : '（值不为空）'
                  }}
                </span>

                <!-- 3. 区间操作符 → 区间输入 -->
                <div
                  v-else-if="condition.operator === 'between'"
                  class="between-inputs"
                >
                  <input
                    :value="condition.valueStart"
                    :type="getBetweenInputType(condition.field)"
                    class="cond-input between-input"
                    :placeholder="getStartPlaceholder(condition.field)"
                    @input="updateConditionStart(groupIndex, condIndex, $event)"
                  />
                  <span class="between-separator">至</span>
                  <input
                    :value="condition.valueEnd"
                    :type="getBetweenInputType(condition.field)"
                    class="cond-input between-input"
                    :placeholder="getEndPlaceholder(condition.field)"
                    @input="updateConditionEnd(groupIndex, condIndex, $event)"
                  />
                </div>

                <!-- 4. select 类型 → 下拉选择 -->
                <select
                  v-else-if="getFieldType(condition.field) === 'select'"
                  :value="condition.value"
                  class="cond-select"
                  @change="updateConditionValue(groupIndex, condIndex, $event)"
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
                  @change="updateConditionValue(groupIndex, condIndex, $event)"
                />

                <!-- 6. number 类型 → 数字输入 -->
                <input
                  v-else-if="getFieldType(condition.field) === 'number'"
                  :value="condition.value"
                  type="number"
                  class="cond-input"
                  :placeholder="getValuePlaceholder(condition)"
                  @input="updateConditionNumber(groupIndex, condIndex, $event)"
                />

                <!-- 7. text 类型 → 文本输入 -->
                <input
                  v-else-if="getFieldType(condition.field) === 'text'"
                  :value="condition.value"
                  type="text"
                  class="cond-input"
                  :placeholder="getValuePlaceholder(condition)"
                  @input="updateConditionValue(groupIndex, condIndex, $event)"
                />

                <!-- 8. 兜底 -->
                <input
                  v-else
                  :value="condition.value"
                  type="text"
                  class="cond-input"
                  placeholder="请输入值"
                  @input="updateConditionValue(groupIndex, condIndex, $event)"
                />
              </div>

              <!-- 条件操作 -->
              <div class="condition-actions">
                <button
                  class="btn-remove-cond"
                  @click="removeCondition(groupIndex, condIndex)"
                  :disabled="group.conditions.length <= 1"
                  title="删除条件"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- 添加条件到组 -->
            <button class="btn-add-cond" @click="addCondition(groupIndex)">
              ＋ 添加条件
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 固定底部操作栏 ============ -->
    <div class="filter-footer">
      <div class="filter-actions">
        <button class="btn-add-group" @click="addGroup">＋ 添加条件组</button>
        <div class="filter-operate">
          <button class="btn-search" @click="handleSearch" :disabled="loading">
            <span v-if="loading" class="filter-spinner"></span>
            {{ loading ? '搜索中...' : '🔍 搜索' }}
          </button>
          <button class="btn-reset" @click="handleReset" :disabled="loading">
            ↻ 重置
          </button>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="filter-error">⚠️ {{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { GroupFilterSchema } from './types';
import { OPERATORS } from './preset';

// ==================== Props ====================
const props = defineProps<{
  schema: GroupFilterSchema;
}>();

const emit = defineEmits<{
  (e: 'search', groups: FilterGroup[], results: any[]): void;
  (e: 'reset'): void;
}>();

// ==================== 状态 ====================
const groups = ref<FilterGroup[]>([]);
const loading = ref(false);
const errorMessage = ref('');
let idCounter = 0;

const availableFields = computed(() => props.schema.fields);

// ==================== 核心方法 ====================

function getFieldType(fieldKey: string): string {
  if (!fieldKey) return 'text';
  const field = availableFields.value.find((f) => f.key === fieldKey);
  return field?.type || 'text';
}

function getFieldOptions(
  fieldKey: string
): Array<{ label: string; value: any }> {
  const field = availableFields.value.find((f) => f.key === fieldKey);
  return field?.options || [];
}

function getOperators(
  fieldKey: string
): Array<{ value: string; label: string }> {
  if (!fieldKey) return [];
  const type = getFieldType(fieldKey);
  return OPERATORS[type] || [];
}

function getValuePlaceholder(condition: FilterCondition): string {
  const field = availableFields.value.find((f) => f.key === condition.field);
  if (!field) return '请输入值';
  return field.placeholder || `请输入${field.label}`;
}

function getBetweenInputType(fieldKey: string): string {
  const type = getFieldType(fieldKey);
  if (type === 'number') return 'number';
  if (type === 'date' || type === 'date-range') return 'date';
  return 'text';
}

function getStartPlaceholder(fieldKey: string): string {
  const type = getFieldType(fieldKey);
  if (type === 'number') return '最小值';
  if (type === 'date' || type === 'date-range') return '开始日期';
  return '起始值';
}

function getEndPlaceholder(fieldKey: string): string {
  const type = getFieldType(fieldKey);
  if (type === 'number') return '最大值';
  if (type === 'date' || type === 'date-range') return '结束日期';
  return '结束值';
}

function getConditionCount(group: FilterGroup): number {
  return group.conditions.filter((c) => c.field && c.operator).length;
}

// ==================== ID 生成 ====================
function generateId(): string {
  return `g_${Date.now()}_${++idCounter}`;
}

function generateCondId(): string {
  return `c_${Date.now()}_${++idCounter}`;
}

// ==================== 条件管理 ====================
function createEmptyCondition(): FilterCondition {
  return {
    id: generateCondId(),
    field: '',
    operator: '',
    value: '',
  };
}

function createEmptyGroup(logic: 'AND' | 'OR' = 'AND'): FilterGroup {
  return {
    id: generateId(),
    logic,
    conditions: [createEmptyCondition()],
  };
}

function initGroups() {
  groups.value = [createEmptyGroup('AND')];
}

function addGroup() {
  const lastGroup = groups.value[groups.value.length - 1];
  groups.value.push(
    createEmptyGroup(lastGroup?.logic === 'OR' ? 'AND' : 'AND')
  );
}

function removeGroup(index: number) {
  if (groups.value.length <= 1) return;
  groups.value.splice(index, 1);
}

function addCondition(groupIndex: number) {
  groups.value[groupIndex].conditions.push(createEmptyCondition());
}

function removeCondition(groupIndex: number, condIndex: number) {
  const group = groups.value[groupIndex];
  if (group.conditions.length <= 1) return;
  group.conditions.splice(condIndex, 1);
}

// ==================== 更新方法 ====================
function updateConditionField(
  groupIndex: number,
  condIndex: number,
  event: Event
) {
  const target = event.target as HTMLSelectElement;
  const condition = groups.value[groupIndex].conditions[condIndex];
  if (condition) {
    condition.field = target.value;
    condition.operator = '';
    condition.value = '';
    condition.valueStart = '';
    condition.valueEnd = '';
  }
}

function updateConditionOperator(
  groupIndex: number,
  condIndex: number,
  event: Event
) {
  const target = event.target as HTMLSelectElement;
  const condition = groups.value[groupIndex].conditions[condIndex];
  if (condition) {
    condition.operator = target.value;
    condition.value = '';
    condition.valueStart = '';
    condition.valueEnd = '';
  }
}

function updateConditionValue(
  groupIndex: number,
  condIndex: number,
  event: Event
) {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const condition = groups.value[groupIndex].conditions[condIndex];
  if (condition) {
    condition.value = target.value;
  }
}

function updateConditionNumber(
  groupIndex: number,
  condIndex: number,
  event: Event
) {
  const target = event.target as HTMLInputElement;
  const condition = groups.value[groupIndex].conditions[condIndex];
  if (condition) {
    condition.value = target.value !== '' ? Number(target.value) : '';
  }
}

function updateConditionStart(
  groupIndex: number,
  condIndex: number,
  event: Event
) {
  const target = event.target as HTMLInputElement;
  const condition = groups.value[groupIndex].conditions[condIndex];
  if (condition) {
    condition.valueStart = target.value;
  }
}

function updateConditionEnd(
  groupIndex: number,
  condIndex: number,
  event: Event
) {
  const target = event.target as HTMLInputElement;
  const condition = groups.value[groupIndex].conditions[condIndex];
  if (condition) {
    condition.valueEnd = target.value;
  }
}

function toggleBooleanValue(groupIndex: number, condIndex: number) {
  const condition = groups.value[groupIndex].conditions[condIndex];
  if (condition) {
    condition.value = condition.value === true ? false : true;
  }
}

function onGroupChange() {
  // 组逻辑变化时触发
}

// ==================== 搜索与重置 ====================
async function handleSearch() {
  loading.value = true;
  errorMessage.value = '';

  try {
    // 检查是否有有效条件
    const hasValidCondition = groups.value.some((group) =>
      group.conditions.some((c) => c.field && c.operator)
    );

    if (!hasValidCondition) {
      loading.value = false;
      errorMessage.value = '请至少添加一个有效的筛选条件';
      return;
    }

    const data = await props.schema.searchFn(groups.value);
    emit('search', groups.value, data);
    console.log('🔍 分组筛选结果：', data.length, '条');
  } catch (error: any) {
    console.error('❌ 筛选失败：', error);
    errorMessage.value = error.message || '筛选失败，请重试';
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  initGroups();
  errorMessage.value = '';
  emit('reset');
  console.log('🔄 已重置筛选');
}

// ==================== 暴露方法 ====================
defineExpose({
  search: handleSearch,
  reset: handleReset,
  getGroups: () => groups.value,
});

// ==================== 初始化 ====================
initGroups();
</script>

<style scoped>
.group-filter {
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
.group-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 16px;
  max-height: 480px;
}

.group-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.group-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.group-scroll-container::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.group-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* ==================== 组列表 ==================== */
.group-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.group-item {
  border: 2px solid #e8ecf1;
  border-radius: 10px;
  padding: 16px;
  background: #fafbfc;
  transition: border-color 0.3s;
}

.group-item.is-or {
  border-color: #f5dab1;
  background: #fdf8f0;
}

/* ==================== 组头部 ==================== */
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-icon {
  font-size: 18px;
}

.group-label {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.group-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  background: #f0f2f5;
  color: #666;
}

.group-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-logic-select {
  padding: 4px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
  height: 30px;
}

.btn-remove-group {
  width: 30px;
  height: 30px;
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

.btn-remove-group:hover:not(:disabled) {
  background: #fef0f0;
  color: #f56c6c;
}

.btn-remove-group:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ==================== 组内条件 ==================== */
.group-conditions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
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

.btn-remove-cond {
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

.btn-remove-cond:hover:not(:disabled) {
  background: #fef0f0;
  color: #f56c6c;
}

.btn-remove-cond:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ==================== 添加按钮 ==================== */
.btn-add-cond {
  padding: 4px 14px;
  background: transparent;
  color: #409eff;
  border: 1px dashed #409eff;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-start;
  margin-top: 4px;
}

.btn-add-cond:hover {
  background: #ecf5ff;
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

.cond-empty {
  color: #999;
  font-size: 13px;
  padding: 4px 0;
}
/* ==================== 固定底部操作栏 ==================== */
.filter-footer {
  flex-shrink: 0;
  padding: 16px 24px 20px;
  border-top: 2px solid #f0f2f5;
  background: #fff;
  border-radius: 0 0 12px 12px;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-add-group {
  padding: 7px 16px;
  background: #ecf5ff;
  color: #409eff;
  border: 1px dashed #409eff;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add-group:hover {
  background: #d9ecff;
}

.filter-operate {
  display: flex;
  gap: 10px;
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
  .group-filter {
    padding: 16px;
  }

  .group-header {
    flex-direction: column;
    align-items: stretch;
  }

  .group-header-right {
    justify-content: space-between;
  }

  .condition-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .condition-field,
  .condition-operator,
  .condition-value {
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
  .btn-reset,
  .btn-add-group {
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
