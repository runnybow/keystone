<!-- docs/.vitepress/components/DynamicForm/SavedFilter.vue -->
<template>
  <div class="saved-filter">
    <!-- ============ 顶部：保存的筛选列表 ============ -->
    <div class="filter-header">
      <div class="header-left">
        <span class="header-icon">📁</span>
        <span class="header-title">保存的筛选方案</span>
        <span v-if="savedFilters.length > 0" class="header-badge">
          {{ savedFilters.length }}
        </span>
      </div>
      <div class="header-right">
        <button
          class="btn-save-current"
          @click="openSaveDialog"
          :disabled="!hasValidConditions"
        >
          💾 保存当前
        </button>
      </div>
    </div>

    <!-- ============ 筛选方案列表（可滚动） ============ -->
    <div class="filter-list-container">
      <div v-if="savedFilters.length === 0" class="empty-state">
        <span class="empty-icon">📂</span>
        <span>暂无保存的筛选方案</span>
        <span class="empty-hint">构建筛选条件后点击「保存当前」</span>
      </div>

      <div
        v-for="filter in savedFilters"
        :key="filter.id"
        class="filter-item"
        :class="{ 'is-active': activeFilterId === filter.id }"
      >
        <div class="filter-item-left">
          <span class="filter-item-icon">📌</span>
          <div class="filter-item-info">
            <span class="filter-item-name">{{ filter.name }}</span>
            <span class="filter-item-meta">
              {{ filter.conditionCount }} 个条件 ·
              {{ formatTime(filter.updatedAt) }}
            </span>
          </div>
        </div>
        <div class="filter-item-actions">
          <button
            class="btn-load"
            @click="loadFilter(filter.id)"
            title="加载此筛选"
          >
            📂 加载
          </button>
          <button
            class="btn-rename"
            @click="openRenameDialog(filter.id)"
            title="重命名"
          >
            ✏️
          </button>
          <button
            class="btn-delete"
            @click="deleteFilter(filter.id)"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- ============ 整合动态筛选器 ============ -->
    <div class="filter-builder-wrapper">
      <div class="builder-header">
        <span class="builder-title">🔧 构建筛选条件</span>
        <span v-if="activeFilterName" class="builder-source">
          当前：{{ activeFilterName }}
        </span>
      </div>

      <!-- 动态筛选器组件 -->
      <DynamicFilter
        ref="dynamicFilterRef"
        :schema="dynamicFilterSchema"
        @search="onDynamicSearch"
        @reset="onDynamicReset"
      />
    </div>

    <!-- ============ 错误提示 ============ -->
    <div v-if="errorMessage" class="filter-error">⚠️ {{ errorMessage }}</div>

    <!-- ============ 保存对话框 ============ -->
    <div v-if="showSaveDialog" class="modal-overlay" @click.self="closeDialogs">
      <div class="modal-content">
        <h3>💾 保存筛选方案</h3>
        <p class="modal-desc">为当前筛选条件命名，方便以后快速加载</p>
        <input
          ref="saveInputRef"
          v-model="saveName"
          type="text"
          class="modal-input"
          placeholder="请输入方案名称，如：本月高优先级订单"
          @keyup.enter="confirmSave"
        />
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="closeDialogs">
            取消
          </button>
          <button
            class="modal-btn modal-btn-confirm"
            @click="confirmSave"
            :disabled="!saveName.trim()"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- ============ 重命名对话框 ============ -->
    <div
      v-if="showRenameDialog"
      class="modal-overlay"
      @click.self="closeDialogs"
    >
      <div class="modal-content">
        <h3>✏️ 重命名筛选方案</h3>
        <p class="modal-desc">修改筛选方案的名称</p>
        <input
          ref="renameInputRef"
          v-model="renameName"
          type="text"
          class="modal-input"
          placeholder="请输入新的方案名称"
          @keyup.enter="confirmRename"
        />
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="closeDialogs">
            取消
          </button>
          <button
            class="modal-btn modal-btn-confirm"
            @click="confirmRename"
            :disabled="!renameName.trim()"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import DynamicFilter from './DynamicFilter.vue';
import type { FilterCondition, DynamicFilterSchema } from './DynamicFilter.vue';

// ==================== 类型定义 ====================
export interface SavedFilterData {
  id: string;
  name: string;
  conditions: FilterCondition[];
  conditionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedFilterSchema {
  fields: DynamicFilterSchema['fields'];
  searchFn: DynamicFilterSchema['searchFn'];
  storageKey?: string;
}

// ==================== Props ====================
const props = defineProps<{
  schema: SavedFilterSchema;
}>();

const emit = defineEmits<{
  (e: 'search', conditions: FilterCondition[], results: any[]): void;
  (e: 'reset'): void;
  (e: 'load', conditions: FilterCondition[]): void;
  (e: 'save', filter: SavedFilterData): void;
  (e: 'delete', filterId: string): void;
}>();

// ==================== Refs ====================
const dynamicFilterRef = ref<InstanceType<typeof DynamicFilter> | null>(null);

// ==================== 状态 ====================
const savedFilters = ref<SavedFilterData[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const activeFilterId = ref<string | null>(null);
const activeFilterName = ref<string | null>(null);
let idCounter = 0;

// 保存对话框
const showSaveDialog = ref(false);
const saveName = ref('');
const saveInputRef = ref<HTMLInputElement | null>(null);

// 重命名对话框
const showRenameDialog = ref(false);
const renameId = ref<string | null>(null);
const renameName = ref('');
const renameInputRef = ref<HTMLInputElement | null>(null);

// ==================== 计算属性 ====================
const hasValidConditions = computed(() => {
  const conditions = dynamicFilterRef.value?.getConditions() || [];
  return conditions.some((c) => c.field && c.operator);
});

const storageKey = computed(() => props.schema.storageKey || 'saved_filters');

// 动态筛选器的 Schema
const dynamicFilterSchema = computed<DynamicFilterSchema>(() => ({
  fields: props.schema.fields,
  searchFn: props.schema.searchFn,
}));

// ==================== 生成 ID ====================
function generateId(): string {
  return `f_${Date.now()}_${++idCounter}`;
}

// ==================== 保存筛选 ====================
function openSaveDialog() {
  if (!hasValidConditions.value) return;
  saveName.value = '';
  showSaveDialog.value = true;
  nextTick(() => {
    saveInputRef.value?.focus();
  });
}

function confirmSave() {
  const name = saveName.value.trim();
  if (!name) return;

  const conditions = dynamicFilterRef.value?.getConditions() || [];
  const validConditions = conditions.filter((c) => c.field && c.operator);

  if (validConditions.length === 0) {
    errorMessage.value = '没有有效的筛选条件可保存';
    return;
  }

  const newFilter: SavedFilterData = {
    id: generateId(),
    name,
    conditions: JSON.parse(JSON.stringify(validConditions)),
    conditionCount: validConditions.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  savedFilters.value.unshift(newFilter);
  saveToStorage();
  emit('save', newFilter);
  activeFilterId.value = newFilter.id;
  activeFilterName.value = name;
  closeDialogs();
  console.log('💾 保存筛选方案：', name);
}

// ==================== 加载筛选 ====================
function loadFilter(filterId: string) {
  const filter = savedFilters.value.find((f) => f.id === filterId);
  if (!filter) {
    errorMessage.value = '筛选方案不存在';
    return;
  }

  // 清空动态筛选器的条件
  const conditions = filter.conditions.map((c) => ({
    ...c,
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  }));

  // 通过动态筛选器的暴露方法设置条件
  if (dynamicFilterRef.value) {
    // 先重置，再设置
    dynamicFilterRef.value.reset();
    // 直接替换条件
    const currentConditions = dynamicFilterRef.value.getConditions();
    // 清空并重新填充
    while (currentConditions.length > 0) {
      currentConditions.pop();
    }
    conditions.forEach((c) => {
      currentConditions.push(c);
    });
  }

  activeFilterId.value = filter.id;
  activeFilterName.value = filter.name;
  errorMessage.value = '';
  emit('load', conditions);
  console.log('📂 加载筛选方案：', filter.name);
}

// ==================== 重命名 ====================
function openRenameDialog(filterId: string) {
  const filter = savedFilters.value.find((f) => f.id === filterId);
  if (!filter) return;
  renameId.value = filterId;
  renameName.value = filter.name;
  showRenameDialog.value = true;
  nextTick(() => {
    renameInputRef.value?.focus();
    renameInputRef.value?.select();
  });
}

function confirmRename() {
  const name = renameName.value.trim();
  if (!name || !renameId.value) return;

  const filter = savedFilters.value.find((f) => f.id === renameId.value);
  if (filter) {
    filter.name = name;
    filter.updatedAt = new Date().toISOString();
    if (activeFilterId.value === filter.id) {
      activeFilterName.value = name;
    }
    saveToStorage();
    closeDialogs();
    console.log('✏️ 重命名成功：', name);
  }
}

// ==================== 删除筛选 ====================
function deleteFilter(filterId: string) {
  if (!confirm('确定要删除这个筛选方案吗？')) return;

  const index = savedFilters.value.findIndex((f) => f.id === filterId);
  if (index === -1) return;

  savedFilters.value.splice(index, 1);
  saveToStorage();
  emit('delete', filterId);

  if (activeFilterId.value === filterId) {
    activeFilterId.value = null;
    activeFilterName.value = null;
  }
  console.log('🗑️ 删除筛选方案');
}

// ==================== localStorage ====================
function saveToStorage() {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(savedFilters.value));
  } catch (e) {
    console.warn('保存到 localStorage 失败：', e);
  }
}

function loadFromStorage() {
  try {
    const data = localStorage.getItem(storageKey.value);
    if (data) {
      savedFilters.value = JSON.parse(data);
    }
  } catch (e) {
    console.warn('从 localStorage 加载失败：', e);
    savedFilters.value = [];
  }
}

// ==================== 动态筛选器事件 ====================
function onDynamicSearch(conditions: FilterCondition[], results: any[]) {
  // 加载时清除激活状态
  activeFilterId.value = null;
  activeFilterName.value = null;
  emit('search', conditions, results);
}

function onDynamicReset() {
  activeFilterId.value = null;
  activeFilterName.value = null;
  emit('reset');
}

// ==================== 对话框 ====================
function closeDialogs() {
  showSaveDialog.value = false;
  showRenameDialog.value = false;
  saveName.value = '';
  renameId.value = null;
  renameName.value = '';
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

// ==================== 暴露方法 ====================
defineExpose({
  getConditions: () => dynamicFilterRef.value?.getConditions() || [],
  getSavedFilters: () => savedFilters.value,
  loadFilter,
  saveToStorage,
  loadFromStorage,
  reset: () => dynamicFilterRef.value?.reset(),
  search: () => dynamicFilterRef.value?.search(),
});

// ==================== 生命周期 ====================
loadFromStorage();
</script>

<style scoped>
.saved-filter {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8ecf1;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 800px;
  position: relative;
}

/* ==================== 头部 ==================== */
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
  flex-shrink: 0;
  border-radius: 12px 12px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 16px;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.header-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #409eff;
  color: #fff;
}

.btn-save-current {
  padding: 4px 14px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-save-current:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-save-current:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== 筛选列表 ==================== */
.filter-list-container {
  overflow-y: auto;
  padding: 6px 12px;
  max-height: 120px;
  min-height: 50px;
  border-bottom: 1px solid #f0f2f5;
  flex-shrink: 0;
}

.filter-list-container::-webkit-scrollbar {
  width: 4px;
}
.filter-list-container::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  color: #999;
  font-size: 13px;
}

.empty-icon {
  font-size: 20px;
}
.empty-hint {
  color: #bfbfbf;
  font-size: 12px;
}

.filter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.filter-item:hover {
  background: #f5f7fa;
  border-color: #e8ecf1;
}

.filter-item.is-active {
  background: #ecf5ff;
  border-color: #d9ecff;
}

.filter-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.filter-item-icon {
  font-size: 13px;
}

.filter-item-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.filter-item-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.filter-item-meta {
  font-size: 11px;
  color: #999;
}

.filter-item-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.filter-item-actions button {
  padding: 1px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
}

.btn-load {
  color: #409eff;
}
.btn-load:hover {
  background: #ecf5ff;
}

.btn-rename {
  color: #999;
}
.btn-rename:hover {
  background: #f0f2f5;
}

.btn-delete {
  color: #ccc;
}
.btn-delete:hover {
  background: #fef0f0;
  color: #f56c6c;
}

/* ==================== 动态筛选器包装 ==================== */
.filter-builder-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 10px 16px 0;
  min-height: 200px;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.builder-title {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.builder-source {
  font-size: 12px;
  color: #409eff;
}

/* 🔥 覆盖动态筛选器的样式，使其适配容器 */
.filter-builder-wrapper :deep(.dynamic-filter) {
  border: none;
  border-radius: 0;
  padding: 0;
  max-height: none;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.filter-builder-wrapper :deep(.filter-scroll-container) {
  padding: 0 0 8px;
  max-height: 200px;
}

.filter-builder-wrapper :deep(.filter-toolbar) {
  padding: 6px 0 10px;
  border-top: none;
  background: transparent;
}

.filter-builder-wrapper :deep(.filter-actions) {
  padding: 8px 0 12px;
  border-top: 1px solid #f0f2f5;
  background: transparent;
}

.filter-builder-wrapper :deep(.filter-error) {
  padding: 4px 0 8px;
  margin-top: 0;
}

/* ==================== 错误提示 ==================== */
.filter-error {
  padding: 6px 16px 10px;
  color: #f56c6c;
  font-size: 13px;
  flex-shrink: 0;
}

/* ==================== 模态框 ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px 28px 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: modalIn 0.2s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-content h3 {
  margin: 0 0 4px;
  font-size: 17px;
  color: #1a1a2e;
}

.modal-desc {
  margin: 0 0 14px;
  font-size: 13px;
  color: #999;
}

.modal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.modal-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 6px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn-cancel {
  background: #f5f7fa;
  color: #666;
}
.modal-btn-cancel:hover {
  background: #e8ecf1;
}

.modal-btn-confirm {
  background: #409eff;
  color: #fff;
}
.modal-btn-confirm:hover:not(:disabled) {
  background: #66b1ff;
}
.modal-btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .saved-filter {
    max-height: 700px;
  }

  .filter-header {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .filter-list-container {
    max-height: 80px;
  }

  .filter-item {
    flex-wrap: wrap;
    gap: 4px;
  }

  .filter-item-actions {
    justify-content: flex-start;
  }

  .filter-builder-wrapper {
    padding: 8px 12px 0;
    min-height: 150px;
  }

  .filter-builder-wrapper :deep(.filter-scroll-container) {
    max-height: 150px;
  }

  .filter-builder-wrapper :deep(.condition-row) {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .filter-builder-wrapper :deep(.condition-field),
  .filter-builder-wrapper :deep(.condition-operator),
  .filter-builder-wrapper :deep(.condition-value),
  .filter-builder-wrapper :deep(.condition-logic) {
    min-width: 0;
  }

  .filter-builder-wrapper :deep(.condition-actions) {
    display: flex;
    justify-content: flex-end;
  }

  .filter-builder-wrapper :deep(.filter-actions) {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-builder-wrapper :deep(.btn-search),
  .filter-builder-wrapper :deep(.btn-reset) {
    width: 100%;
    justify-content: center;
  }

  .modal-content {
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
