<!-- docs/.vitepress/components/DynamicForm/TreeNode.vue -->
<template>
  <div class="tree-node" :style="{ paddingLeft: level * 28 + 'px' }">
    <div class="node-wrapper" :class="{ 'is-editing': isEditing }">
      <!-- 缩进 + 展开图标 -->
      <div class="node-indent">
        <button
          v-if="hasChildren"
          class="node-toggle"
          @click="toggleExpand"
          :disabled="disabled"
        >
          {{ node.expanded ? '▼' : '▶' }}
        </button>
        <span v-else class="node-leaf">•</span>
      </div>

      <!-- 字段编辑区 -->
      <div class="node-fields">
        <div v-for="field in fields" :key="field.key" class="node-field">
          <label class="node-label">{{ field.label }}</label>
          <input
            v-if="field.type === 'input' || field.type === 'text'"
            :value="node.data[field.key]"
            :placeholder="field.placeholder"
            class="node-input"
            :disabled="disabled"
            @input="updateField(field.key, $event)"
          />
          <select
            v-else-if="field.type === 'select'"
            :value="node.data[field.key]"
            class="node-select"
            :disabled="disabled"
            @change="updateField(field.key, $event)"
          >
            <option value="">{{ field.placeholder || '请选择' }}</option>
            <option
              v-for="opt in field.options"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
          <span
            v-if="field.required && !node.data[field.key]"
            class="node-required"
            >*</span
          >
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="node-actions">
        <button
          class="btn-add-child"
          @click="addChild"
          :disabled="disabled"
          title="添加子节点"
        >
          ＋
        </button>
        <button
          class="btn-move-up"
          @click="moveUp"
          :disabled="disabled || index === 0"
          title="上移"
        >
          ↑
        </button>
        <button
          class="btn-move-down"
          @click="moveDown"
          :disabled="disabled"
          title="下移"
        >
          ↓
        </button>
        <button
          class="btn-delete"
          @click="deleteNode"
          :disabled="disabled"
          title="删除"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 子节点 -->
    <div v-if="hasChildren && node.expanded" class="node-children">
      <TreeNode
        v-for="(child, childIndex) in node.children!"
        :key="child.id"
        :node="child"
        :index="childIndex"
        :level="level + 1"
        :fields="fields"
        :disabled="disabled"
        @update="onChildUpdate"
        @delete="onChildDelete"
        @add-child="onChildAdd"
        @move-up="onChildMoveUp"
        @move-down="onChildMoveDown"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FieldConfig, TreeNodeData } from './types';

// ==================== Props ====================
const props = defineProps<{
  node: TreeNodeData;
  index: number;
  level: number;
  fields: FieldConfig[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update', nodeId: string, data: Record<string, any>): void;
  (e: 'delete', nodeId: string): void;
  (e: 'add-child', parentId: string): void;
  (e: 'move-up', nodeId: string): void;
  (e: 'move-down', nodeId: string): void;
}>();

// ==================== 状态 ====================
const isEditing = ref(false);

// ==================== 计算属性 ====================
const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

// ==================== 方法 ====================
function updateField(key: string, event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const newData = { ...props.node.data, [key]: target.value };
  props.node.data = newData;
  emit('update', props.node.id, newData);
}

function toggleExpand() {
  if (props.disabled) return;
  props.node.expanded = !props.node.expanded;
}

function addChild() {
  if (props.disabled) return;
  emit('add-child', props.node.id);
}

function deleteNode() {
  if (props.disabled) return;
  if (confirm('确定要删除这个节点及其所有子节点吗？')) {
    emit('delete', props.node.id);
  }
}

function moveUp() {
  if (props.disabled || props.index === 0) return;
  emit('move-up', props.node.id);
}

function moveDown() {
  if (props.disabled) return;
  emit('move-down', props.node.id);
}

// 子节点事件转发
function onChildUpdate(nodeId: string, data: Record<string, any>) {
  emit('update', nodeId, data);
}

function onChildDelete(nodeId: string) {
  emit('delete', nodeId);
}

function onChildAdd(parentId: string) {
  emit('add-child', parentId);
}

function onChildMoveUp(nodeId: string) {
  emit('move-up', nodeId);
}

function onChildMoveDown(nodeId: string) {
  emit('move-down', nodeId);
}
</script>

<style scoped>
.tree-node {
  margin-bottom: 2px;
}

.node-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.node-wrapper:hover {
  background: #f5f7fa;
  border-color: #e8ecf1;
}

.node-wrapper.is-editing {
  background: #ecf5ff;
  border-color: #409eff;
}

.node-indent {
  flex-shrink: 0;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-toggle {
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.3s;
}

.node-toggle:hover:not(:disabled) {
  background: #e8ecf1;
}

.node-toggle:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.node-leaf {
  color: #ccc;
  font-size: 10px;
}

.node-fields {
  flex: 1;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.node-field {
  display: flex;
  align-items: center;
  gap: 4px;
}

.node-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.node-input,
.node-select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
  min-width: 100px;
  max-width: 160px;
  height: 30px;
  transition: border-color 0.3s;
}

.node-input:focus,
.node-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.node-input:disabled,
.node-select:disabled {
  background: #f5f7fa;
  cursor: not-allowed;
}

.node-required {
  color: #f56c6c;
  font-weight: 600;
  font-size: 14px;
}

.node-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.node-actions button {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-add-child {
  background: #ecf5ff;
  color: #409eff;
}

.btn-add-child:hover:not(:disabled) {
  background: #d9ecff;
}

.btn-move-up,
.btn-move-down {
  background: #f5f7fa;
  color: #666;
}

.btn-move-up:hover:not(:disabled),
.btn-move-down:hover:not(:disabled) {
  background: #e8ecf1;
}

.btn-move-up:disabled,
.btn-move-down:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-delete {
  background: #fef0f0;
  color: #f56c6c;
}

.btn-delete:hover:not(:disabled) {
  background: #fde2e2;
}

.btn-delete:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.node-children {
  margin-top: 2px;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .node-wrapper {
    flex-wrap: wrap;
  }

  .node-fields {
    flex: 1 1 100%;
    gap: 6px;
  }

  .node-field {
    flex: 1 1 100%;
  }

  .node-input,
  .node-select {
    min-width: 60px;
    max-width: 100%;
    flex: 1;
  }

  .node-actions {
    margin-left: 28px;
  }
}
</style>
