<!-- docs/.vitepress/components/DynamicForm/EditableTable.vue -->
<template>
  <div class="editable-table">
    <!-- 工具栏 -->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <button class="btn-add" @click="addRow" :disabled="disabled">
          {{ addText }}
        </button>
        <button
          class="btn-batch-delete"
          @click="batchDelete"
          :disabled="selectedRows.length === 0 || disabled"
        >
          删除选中（{{ selectedRows.length }}）
        </button>
        <span v-if="selectedRows.length > 0" class="selected-info">
          已选 {{ selectedRows.length }} 行
        </span>
      </div>
      <div class="toolbar-right">
        <button
          class="btn-export"
          @click="exportData"
          :disabled="localData && localData.length === 0"
        >
          📥 导出 CSV
        </button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-checkbox">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleAll"
                :disabled="disabled"
              />
            </th>
            <th v-for="col in columns" :key="col.key" class="col-header">
              {{ col.label }}
              <span v-if="col.required" class="col-required">*</span>
            </th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in localData"
            :key="rowIndex"
            class="data-row"
            :class="{ 'is-selected': selectedRows.includes(rowIndex) }"
          >
            <td class="col-checkbox">
              <input
                type="checkbox"
                :checked="selectedRows.includes(rowIndex)"
                @change="toggleRow(rowIndex)"
                :disabled="disabled"
              />
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              class="col-data"
              :class="{ 'has-error': rowErrors[`${rowIndex}_${col.key}`] }"
            >
              <!-- 编辑状态：显示输入框 -->
              <template v-if="editingRow === rowIndex">
                <input
                  v-if="col.type === 'input' || col.type === 'number'"
                  v-model="localData[rowIndex][col.key]"
                  :type="col.type === 'number' ? 'number' : 'text'"
                  :placeholder="col.placeholder"
                  class="cell-input"
                  :class="{ 'cell-error': rowErrors[`${rowIndex}_${col.key}`] }"
                  @blur="validateCell(rowIndex, col.key)"
                  @keyup.enter="saveRow(rowIndex)"
                />
                <select
                  v-else-if="col.type === 'select'"
                  v-model="localData[rowIndex][col.key]"
                  class="cell-select"
                  @change="validateCell(rowIndex, col.key)"
                >
                  <option v-if="col.placeholder" value="">
                    {{ col.placeholder }}
                  </option>
                  <option
                    v-for="opt in col.options"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </template>

              <!-- 非编辑状态：显示文本 -->
              <template v-else>
                <span
                  class="cell-text"
                  :class="{ 'cell-empty': !row[col.key] }"
                >
                  {{ row[col.key] || '-' }}
                </span>
              </template>

              <!-- 错误提示 -->
              <span
                v-if="rowErrors[`${rowIndex}_${col.key}`]"
                class="cell-error-tip"
              >
                {{ rowErrors[`${rowIndex}_${col.key}`] }}
              </span>
            </td>
            <td class="col-actions">
              <!-- 编辑状态 -->
              <template v-if="editingRow === rowIndex">
                <button
                  class="btn-save"
                  @click="saveRow(rowIndex)"
                  :disabled="disabled"
                >
                  ✅ 保存
                </button>
                <button
                  class="btn-cancel"
                  @click="cancelEdit"
                  :disabled="disabled"
                >
                  取消
                </button>
              </template>

              <!-- 非编辑状态 -->
              <template v-else>
                <button
                  class="btn-edit"
                  @click="editRow(rowIndex)"
                  :disabled="disabled"
                >
                  ✏️ 编辑
                </button>
                <button
                  class="btn-delete"
                  @click="deleteRow(rowIndex)"
                  :disabled="disabled"
                >
                  🗑️ 删除
                </button>
              </template>
            </td>
          </tr>

          <!-- 空状态 -->
          <tr v-if="localData.length === 0" class="empty-row">
            <td :colspan="columns.length + 2" class="empty-cell">
              <div class="empty-state">
                <span class="empty-icon">📭</span>
                <span>暂无数据，点击「添加」开始录入</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 底部统计 -->
    <div class="table-footer">
      <span class="footer-info">
        共 {{ localData.length }} 行数据
        <span v-if="editingRow !== null"
          >，正在编辑第 {{ editingRow + 1 }} 行</span
        >
        <span v-if="hasErrors" class="footer-error">
          ⚠️ 存在 {{ errorCount }} 个校验错误
        </span>
      </span>
      <span class="footer-actions">
        <button class="btn-submit-all" @click="submitAll" :disabled="disabled">
          {{ submitText }}
        </button>
        <button class="btn-reset-all" @click="resetAll" :disabled="disabled">
          {{ resetText }}
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import type {TableSchema} from './types'

// ==================== Props & Emits ====================
const props = defineProps<{
  schema: TableSchema;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'change', data: Record<string, any>[]): void;
  (e: 'submit', data: Record<string, any>[]): void;
  (e: 'error', errors: Record<string, string>): void;
}>();

// ==================== 状态管理 ====================
const columns = computed(() => props.schema.columns);
const addText = computed(() => props.schema.addText);
const submitText = computed(() => props.schema.submitText);
const resetText = computed(() => props.schema.resetText);
// 本地数据
const localData = ref<Record<string, any>[]>([]);
const editingRow = ref<number | null>(null);
const selectedRows = ref<number[]>([]);

// 错误存储
const rowErrors = reactive<Record<string, string>>({});

// 备份数据（用于取消编辑）
const backupData = ref<Record<string, any> | null>(null);

// 是否全选
const isAllSelected = computed(() => {
  return (
    localData.value.length > 0 &&
    selectedRows.value.length === localData.value.length
  );
});

// 是否有错误
const hasErrors = computed(() => Object.keys(rowErrors).length > 0);
const errorCount = computed(() => Object.keys(rowErrors).length);

// ==================== 方法 ====================
// 初始化数据
function initData() {
  if (props.schema.data && props.schema.data.length > 0) {
    localData.value = props.schema.data.map((row) => ({ ...row }));
  } else {
    // 默认空行
    localData.value = [];
  }
}

// 创建空行
function createEmptyRow(): Record<string, any> {
  const row: Record<string, any> = {};
  columns.value.forEach((col) => {
    row[col.key] = '';
  });
  return row;
}

// 添加行
function addRow() {
  localData.value.push(createEmptyRow());
  // 自动编辑新行
  const rowIndex = localData.value.length - 1;
  editingRow.value = rowIndex;
  nextTick(() => {
    focusFirstInput(rowIndex);
  });
}

// 编辑行
function editRow(rowIndex: number) {
  if (editingRow.value !== null) {
    // 先保存当前编辑行
    if (!saveRow(editingRow.value)) {
      return; // 保存失败，不切换
    }
  }
  // 备份当前数据
  backupData.value = { ...localData.value[rowIndex] };
  editingRow.value = rowIndex;
}

// 保存行
function saveRow(rowIndex: number): boolean {
  // 校验所有字段
  let isValid = true;
  const row = localData.value[rowIndex];

  for (const col of columns.value) {
    const error = validateCell(rowIndex, col.key);
    if (error) {
      isValid = false;
    }
  }

  if (!isValid) {
    emit('error', { ...rowErrors });
    return false;
  }

  // 保存成功，退出编辑
  editingRow.value = null;
  backupData.value = null;
  emitChange();
  return true;
}

// 取消编辑
function cancelEdit() {
  if (backupData.value && editingRow.value !== null) {
    localData.value[editingRow.value] = { ...backupData.value };
  }
  editingRow.value = null;
  backupData.value = null;
}

// 删除行
function deleteRow(rowIndex: number) {
  if (editingRow.value === rowIndex) {
    editingRow.value = null;
    backupData.value = null;
  }
  localData.value.splice(rowIndex, 1);
  // 清理选中的行
  selectedRows.value = selectedRows.value
    .filter((idx) => idx !== rowIndex)
    .map((idx) => (idx > rowIndex ? idx - 1 : idx));
  emitChange();
}

// 校验单元格
function validateCell(rowIndex: number, colKey: string): string {
  const row = localData.value[rowIndex];
  const col = columns.value.find((c) => c.key === colKey);
  if (!col) return '';

  const value = row[colKey];
  const errorKey = `${rowIndex}_${colKey}`;

  // 清除旧错误
  delete rowErrors[errorKey];

  // 必填校验
  if (col.required) {
    if (value === undefined || value === null || value === '' || value === 0) {
      rowErrors[errorKey] = `${col.label}不能为空`;
      return rowErrors[errorKey];
    }
  }

  // 自定义校验规则
  if (col.rules) {
    for (const rule of col.rules) {
      if (rule.required) {
        if (value === undefined || value === null || value === '') {
          rowErrors[errorKey] = rule.message || `${col.label}不能为空`;
          return rowErrors[errorKey];
        }
      }
      if (
        rule.min !== undefined &&
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        if (typeof value === 'string' && value.length < rule.min) {
          rowErrors[errorKey] =
            rule.message || `${col.label}不能少于 ${rule.min} 个字符`;
          return rowErrors[errorKey];
        }
        if (typeof value === 'number' && value < rule.min) {
          rowErrors[errorKey] =
            rule.message || `${col.label}不能小于 ${rule.min}`;
          return rowErrors[errorKey];
        }
      }
      if (
        rule.max !== undefined &&
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        if (typeof value === 'string' && value.length > rule.max) {
          rowErrors[errorKey] =
            rule.message || `${col.label}不能超过 ${rule.max} 个字符`;
          return rowErrors[errorKey];
        }
        if (typeof value === 'number' && value > rule.max) {
          rowErrors[errorKey] =
            rule.message || `${col.label}不能大于 ${rule.max}`;
          return rowErrors[errorKey];
        }
      }
      if (rule.pattern && value) {
        if (!rule.pattern.test(String(value))) {
          rowErrors[errorKey] = rule.message || `${col.label}格式不正确`;
          return rowErrors[errorKey];
        }
      }
      if (rule.validator) {
        const result = rule.validator(value, row);
        if (result === false) {
          rowErrors[errorKey] = rule.message || `${col.label}校验失败`;
          return rowErrors[errorKey];
        }
        if (typeof result === 'string') {
          rowErrors[errorKey] = result;
          return rowErrors[errorKey];
        }
      }
    }
  }

  return '';
}

// 校验所有行
function validateAll(): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (let i = 0; i < localData.value.length; i++) {
    for (const col of columns.value) {
      const error = validateCell(i, col.key);
      if (error) {
        errors[`${i}_${col.key}`] = error;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// 提交所有数据
async function submitAll() {
  if (props.disabled) return;

  // 如果有正在编辑的行，先保存
  if (editingRow.value !== null) {
    if (!saveRow(editingRow.value)) {
      return;
    }
  }

  // 校验所有数据
  const result = validateAll();
  if (!result.valid) {
    emit('error', result.errors);
    // 滚动到第一个错误行
    const firstErrorKey = Object.keys(result.errors)[0];
    if (firstErrorKey) {
      const [rowIndex] = firstErrorKey.split('_').map(Number);
      scrollToRow(rowIndex);
    }
    return;
  }

  // 调用外部提交逻辑
  if (props.schema.onSave) {
    await props.schema.onSave(localData.value);
  }

  emit('submit', localData.value);
  console.log('✅ 表格数据提交：', localData.value);
}

// 重置所有数据
function resetAll() {
  if (props.disabled) return;
  editingRow.value = null;
  backupData.value = null;
  selectedRows.value = [];
  Object.keys(rowErrors).forEach((key) => delete rowErrors[key]);
  initData();
  if (props.schema.onReset) {
    props.schema.onReset();
  }
  emit('change', localData.value);
}

// 导出 CSV
function exportData() {
  if (localData.value.length === 0) return;

  const headers = columns.value.map((c) => c.label).join(',');
  const rows = localData.value.map((row) =>
    columns.value.map((c) => row[c.key] || '').join(',')
  );
  const csv = [headers, ...rows].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `data_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// 滚动到指定行
function scrollToRow(rowIndex: number) {
  nextTick(() => {
    const rows = document.querySelectorAll('.data-row');
    if (rows[rowIndex]) {
      rows[rowIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      rows[rowIndex].classList.add('is-error-highlight');
      setTimeout(() => {
        rows[rowIndex].classList.remove('is-error-highlight');
      }, 2000);
    }
  });
}

// 聚焦到第一个输入框
function focusFirstInput(rowIndex: number) {
  nextTick(() => {
    const row = document.querySelectorAll('.data-row')[rowIndex];
    if (row) {
      const input = row.querySelector(
        '.cell-input, .cell-select'
      ) as HTMLElement;
      if (input) {
        input.focus();
      }
    }
  });
}

// 选中行
function toggleRow(rowIndex: number) {
  const index = selectedRows.value.indexOf(rowIndex);
  if (index > -1) {
    selectedRows.value.splice(index, 1);
  } else {
    selectedRows.value.push(rowIndex);
  }
}

// 全选/取消全选
function toggleAll() {
  if (isAllSelected.value) {
    selectedRows.value = [];
  } else {
    selectedRows.value = localData.value.map((_, index) => index);
  }
}

// 批量删除
function batchDelete() {
  if (selectedRows.value.length === 0) return;
  // 从后往前删除
  const sortedRows = [...selectedRows.value].sort((a, b) => b - a);
  for (const idx of sortedRows) {
    if (editingRow.value === idx) {
      editingRow.value = null;
      backupData.value = null;
    }
    localData.value.splice(idx, 1);
  }
  selectedRows.value = [];
  emitChange();
}

// 触发变化事件
function emitChange() {
  emit('change', localData.value);
}

// ==================== 生命周期 ====================
initData();

// 监听数据变化（外部传入）
watch(
  () => props.schema.data,
  (newData) => {
    if (newData) {
      localData.value = newData.map((row) => ({ ...row }));
    }
  },
  { deep: true }
);
</script>

<style scoped>
.editable-table {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8ecf1;
  overflow: hidden;
  max-width: 100%;
}

/* ==================== 工具栏 ==================== */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  flex-wrap: wrap;
  gap: 8px;
  background: #fafbfc;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.toolbar-right {
  display: flex;
  gap: 8px;
}

.btn-add {
  padding: 6px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}
.btn-add:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-batch-delete {
  padding: 6px 16px;
  background: #f56c6c;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}
.btn-batch-delete:hover:not(:disabled) {
  background: #f78989;
}
.btn-batch-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-export {
  padding: 6px 16px;
  background: #fff;
  color: #333;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-export:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}
.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected-info {
  font-size: 13px;
  color: #409eff;
}

/* ==================== 表格 ==================== */
.table-wrapper {
  overflow-x: auto;
  padding: 0 16px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead {
  background: #f5f7fa;
}

.data-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8ecf1;
  white-space: nowrap;
}

.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f2f5;
  vertical-align: middle;
}

.data-row:hover {
  background: #fafbfc;
}
.data-row.is-selected {
  background: #ecf5ff;
}
.data-row.is-error-highlight {
  background: #fef0f0 !important;
  animation: highlight-error 0.8s ease;
}
@keyframes highlight-error {
  0%,
  100% {
    background: #fef0f0;
  }
  50% {
    background: #fde2e2;
  }
}

.col-checkbox {
  width: 40px;
  text-align: center;
}
.col-checkbox input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #409eff;
}

.col-header {
  position: relative;
}
.col-required {
  color: #f56c6c;
  margin-left: 2px;
}

.col-data {
  min-width: 120px;
}
.col-data.has-error {
  background: #fef0f0;
}

.col-actions {
  width: 140px;
  text-align: center;
  white-space: nowrap;
}

/* ==================== 单元格控件 ==================== */
.cell-input,
.cell-select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
}
.cell-input:focus,
.cell-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}
.cell-input.cell-error,
.cell-select.cell-error {
  border-color: #f56c6c;
}
.cell-input.cell-error:focus,
.cell-select.cell-error:focus {
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.1);
}

.cell-text {
  color: #333;
}
.cell-text.cell-empty {
  color: #ccc;
}

.cell-error-tip {
  display: block;
  font-size: 12px;
  color: #f56c6c;
  margin-top: 2px;
}

/* ==================== 行操作按钮 ==================== */
.btn-edit,
.btn-delete,
.btn-save,
.btn-cancel {
  padding: 2px 10px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  margin: 0 2px;
}

.btn-edit {
  background: #ecf5ff;
  color: #409eff;
}
.btn-edit:hover:not(:disabled) {
  background: #d9ecff;
}

.btn-delete {
  background: #fef0f0;
  color: #f56c6c;
}
.btn-delete:hover:not(:disabled) {
  background: #fde2e2;
}

.btn-save {
  background: #67c23a;
  color: #fff;
}
.btn-save:hover:not(:disabled) {
  background: #85ce61;
}

.btn-cancel {
  background: #f0f2f5;
  color: #666;
}
.btn-cancel:hover:not(:disabled) {
  background: #e4e7ed;
}

.btn-edit:disabled,
.btn-delete:disabled,
.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== 空状态 ==================== */
.empty-row td {
  padding: 40px 0;
}
.empty-cell {
  text-align: center;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
}
.empty-icon {
  font-size: 48px;
}

/* ==================== 底部 ==================== */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
  flex-wrap: wrap;
  gap: 8px;
}
.footer-info {
  font-size: 13px;
  color: #666;
}
.footer-error {
  color: #f56c6c;
  margin-left: 8px;
}
.footer-actions {
  display: flex;
  gap: 8px;
}

.btn-submit-all {
  padding: 6px 20px;
  background: #67c23a;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}
.btn-submit-all:hover:not(:disabled) {
  background: #85ce61;
}
.btn-submit-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-reset-all {
  padding: 6px 20px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-reset-all:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}
.btn-reset-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-left,
  .toolbar-right {
    flex-wrap: wrap;
  }
  .table-footer {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  .col-actions {
    width: 100px;
  }
  .col-data {
    min-width: 80px;
  }
}
</style>
