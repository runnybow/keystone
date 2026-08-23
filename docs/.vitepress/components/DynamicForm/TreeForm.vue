<!-- docs/.vitepress/components/DynamicForm/TreeForm.vue -->
<template>
  <div class="tree-form">
    <!-- 表单头部 -->
    <div v-if="schema.title" class="tree-header">
      <h3 class="tree-title">{{ schema.title }}</h3>
      <p v-if="schema.description" class="tree-desc">
        {{ schema.description }}
      </p>
    </div>

    <!-- 工具栏 -->
    <div class="tree-toolbar">
      <button class="btn-add-root" @click="addRootNode" :disabled="disabled">
        ＋ 添加根节点
      </button>
      <button class="btn-expand-all" @click="expandAll" :disabled="disabled">
        📂 展开全部
      </button>
      <button
        class="btn-collapse-all"
        @click="collapseAll"
        :disabled="disabled"
      >
        📁 收起全部
      </button>
      <span v-if="treeData.length > 0" class="tree-count">
        共 {{ treeData.length }} 个根节点
      </span>
    </div>

    <!-- 树形列表 -->
    <div class="tree-container">
      <div v-if="treeData.length === 0" class="tree-empty">
        <span class="empty-icon">🌳</span>
        <span>暂无数据，点击「添加根节点」开始</span>
      </div>

      <TreeNode
        v-for="(node, index) in treeData"
        :key="node.id"
        :node="node"
        :index="index"
        :level="0"
        :fields="schema.fields"
        :disabled="disabled"
        @update="onNodeUpdate"
        @delete="onNodeDelete"
        @add-child="onAddChild"
        @move-up="onMoveUp"
        @move-down="onMoveDown"
      />
    </div>

    <!-- 底部操作 -->
    <div class="tree-actions">
      <button
        class="btn-submit"
        @click="handleSubmit"
        :disabled="disabled || submitting"
      >
        <span v-if="submitting" class="tree-spinner"></span>
        {{ schema.submitText || '保存' }}
      </button>
      <button
        class="btn-reset"
        @click="handleReset"
        :disabled="disabled || submitting"
      >
        {{ schema.resetText || '重置' }}
      </button>
    </div>

    <!-- 错误汇总 -->
    <div v-if="errorSummary" class="tree-error-summary">
      <span class="error-icon">⚠️</span>
      <span>{{ errorSummary }}</span>
      <button type="button" class="error-close" @click="errorSummary = ''">
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue';
import TreeNode from './TreeNode.vue';
import type { TreeSchema, TreeNodeData } from './types';

// ==================== Props ====================
const props = defineProps<{
  schema: TreeSchema;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', data: TreeNodeData[]): void;
  (e: 'change', data: TreeNodeData[]): void;
  (e: 'error', errors: Record<string, string>): void;
}>();

// ==================== 状态 ====================
const treeData = ref<TreeNodeData[]>([]);
const submitting = ref(false);
const errorSummary = ref('');
let idCounter = 0;

// ==================== 方法 ====================
// 生成唯一 ID
function generateId(): string {
  return `node_${Date.now()}_${++idCounter}`;
}

// 创建空节点
function createEmptyNode(): TreeNodeData {
  const node: TreeNodeData = {
    id: generateId(),
    data: {},
  };
  props.schema.fields.forEach((field) => {
    if (field.defaultValue !== undefined) {
      node.data[field.key] = field.defaultValue;
    } else {
      node.data[field.key] = '';
    }
  });
  node.children = [];
  return node;
}

// 初始化数据
function initData() {
  if (props.schema.data && props.schema.data.length > 0) {
    treeData.value = deepClone(props.schema.data);
  } else {
    treeData.value = [];
  }
}

// 深拷贝
function deepClone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// 添加根节点
function addRootNode() {
  treeData.value.push(createEmptyNode());
  emitChange();
}

// 节点更新
function onNodeUpdate(nodeId: string, data: Record<string, any>) {
  const node = findNodeById(treeData.value, nodeId);
  if (node) {
    node.data = { ...data };
    emitChange();
  }
}

// 节点删除
function onNodeDelete(nodeId: string) {
  deleteNodeById(treeData.value, nodeId);
  emitChange();
}

// 添加子节点
function onAddChild(parentId: string) {
  const parent = findNodeById(treeData.value, parentId);
  if (parent) {
    if (!parent.children) parent.children = [];
    parent.children.push(createEmptyNode());
    emitChange();
  }
}

// 上移
function onMoveUp(nodeId: string) {
  moveNode(treeData.value, nodeId, -1);
  emitChange();
}

// 下移
function onMoveDown(nodeId: string) {
  moveNode(treeData.value, nodeId, 1);
  emitChange();
}

// 查找节点
function findNodeById(nodes: TreeNodeData[], id: string): TreeNodeData | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// 删除节点
function deleteNodeById(nodes: TreeNodeData[], id: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes.splice(i, 1);
      return true;
    }
    if (nodes[i].children) {
      if (deleteNodeById(nodes[i].children!, id)) {
        return true;
      }
    }
  }
  return false;
}

// 移动节点
function moveNode(
  nodes: TreeNodeData[],
  id: string,
  direction: number
): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      const newIndex = i + direction;
      if (newIndex < 0 || newIndex >= nodes.length) return false;
      const [item] = nodes.splice(i, 1);
      nodes.splice(newIndex, 0, item);
      return true;
    }
    if (nodes[i].children) {
      if (moveNode(nodes[i].children!, id, direction)) {
        return true;
      }
    }
  }
  return false;
}

// 展开全部
function expandAll() {
  setAllExpanded(treeData.value, true);
}

// 收起全部
function collapseAll() {
  setAllExpanded(treeData.value, false);
}

function setAllExpanded(nodes: TreeNodeData[], expanded: boolean) {
  for (const node of nodes) {
    node.expanded = expanded;
    if (node.children) {
      setAllExpanded(node.children, expanded);
    }
  }
}

// 校验所有节点
function validateAll(): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  validateNodes(treeData.value, errors, '');
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateNodes(
  nodes: TreeNodeData[],
  errors: Record<string, string>,
  prefix: string
) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodePrefix = prefix ? `${prefix} > 第 ${i + 1} 项` : `第 ${i + 1} 项`;

    for (const field of props.schema.fields) {
      if (field.required) {
        const value = node.data[field.key];
        if (value === undefined || value === null || value === '') {
          errors[
            `${node.id}_${field.key}`
          ] = `${nodePrefix} - ${field.label} 不能为空`;
        }
      }
    }

    if (node.children) {
      validateNodes(node.children, errors, nodePrefix);
    }
  }
}

// 提交
async function handleSubmit() {
  if (submitting.value || props.disabled) return;

  const result = validateAll();
  if (!result.valid) {
    errorSummary.value = Object.values(result.errors).join('；');
    emit('error', result.errors);
    setTimeout(() => {
      errorSummary.value = '';
    }, 4000);
    return;
  }

  submitting.value = true;

  try {
    const data = deepClone(treeData.value);
    if (props.schema.onSubmit) {
      await props.schema.onSubmit(data);
    }
    emit('submit', data);
    console.log('✅ 树形数据提交：', data);
  } catch (error: any) {
    console.error('❌ 提交失败：', error);
    errorSummary.value = error.message || '提交失败，请重试';
  } finally {
    submitting.value = false;
  }
}

// 重置
function handleReset() {
  if (submitting.value || props.disabled) return;
  initData();
  errorSummary.value = '';
  if (props.schema.onReset) {
    props.schema.onReset();
  }
  emit('change', treeData.value);
  console.log('🔄 已重置树形数据');
}

// 触发变化事件
function emitChange() {
  emit('change', treeData.value);
}

// ==================== 生命周期 ====================
initData();
</script>

<style scoped>
.tree-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e8ecf1;
  max-width: 100%;
}

.tree-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f2f5;
}

.tree-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.tree-desc {
  margin: 0;
  font-size: 14px;
  color: #999;
}

/* ==================== 工具栏 ==================== */
.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
}

.btn-add-root {
  padding: 6px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-add-root:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-expand-all,
.btn-collapse-all {
  padding: 6px 14px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-expand-all:hover:not(:disabled),
.btn-collapse-all:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}

.btn-add-root:disabled,
.btn-expand-all:disabled,
.btn-collapse-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tree-count {
  margin-left: auto;
  font-size: 13px;
  color: #999;
}

/* ==================== 树形容器 ==================== */
.tree-container {
  min-height: 100px;
  max-height: 600px;
  overflow-y: auto;
  padding: 8px 4px;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  background: #fafbfc;
}

.tree-container::-webkit-scrollbar {
  width: 6px;
}

.tree-container::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: #999;
}

.empty-icon {
  font-size: 48px;
}

/* ==================== 底部操作 ==================== */
.tree-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #f0f2f5;
}

.btn-submit {
  padding: 10px 32px;
  background: #67c23a;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-submit:hover:not(:disabled) {
  background: #85ce61;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset {
  padding: 10px 24px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-reset:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}

.btn-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tree-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
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

/* ==================== 错误汇总 ==================== */
.tree-error-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  margin-top: 16px;
  color: #f56c6c;
  font-size: 14px;
}

.error-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  color: #f56c6c;
  cursor: pointer;
  padding: 0 4px;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .tree-form {
    padding: 16px;
  }

  .tree-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .tree-count {
    margin-left: 0;
    text-align: center;
  }

  .tree-actions {
    flex-direction: column;
  }

  .btn-submit,
  .btn-reset {
    width: 100%;
    justify-content: center;
  }
}
</style>
