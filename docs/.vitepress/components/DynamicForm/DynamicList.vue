<!-- docs/.vitepress/components/DynamicForm/DynamicList.vue -->
<template>
  <div class="dynamic-list">
    <!-- 循环渲染每个条目 -->
    <div
      v-for="(item, index) in localItems"
      :key="item.id"
      class="dynamic-list-item"
      :class="{ 'is-removable': localItems.length > (config.minItems || 1) }"
    >
      <div class="item-header">
        <span class="item-index">#{{ index + 1 }}</span>
        <button
          v-if="localItems.length > (config.minItems || 1)"
          type="button"
          class="btn-remove"
          @click="removeItem(index)"
          :disabled="disabled"
        >
          ✕ 删除
        </button>
      </div>

      <div class="item-body">
        <FormField
          v-for="field in config.itemSchema"
          :key="field.key"
          :field="field"
          v-model="item.data[field.key]"
          :form-data="item.data"
          :disabled="disabled"
          @blur="onFieldBlur(index, field.key)"
          @change="onFieldChange(index, field.key, $event)"
          :ref="(el: any) => setFieldRef(index, field.key, el)"
        />
      </div>

      <!-- 每个条目独立的预览数据 -->
      <div class="item-preview">
        <pre>{{ JSON.stringify(item.data, null, 2) }}</pre>
      </div>
    </div>

    <!-- 添加按钮 -->
    <button
      v-if="!config.maxItems || localItems.length < config.maxItems"
      type="button"
      class="btn-add"
      @click="addItem"
      :disabled="disabled"
    >
      ＋ {{ config.addText || '添加一项' }}
    </button>
    <span v-else class="max-tip"
      >已达到最大条目数（{{ config.maxItems }}）</span
    >
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import FormField from './FormField.vue';
import type { DynamicListConfig, FieldConfig } from './types';

const props = defineProps<{
  config: DynamicListConfig;
  modelValue: Record<string, any>[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>[]): void;
  (e: 'change', index: number, key: string, value: any): void;
}>();

// 字段引用
const fieldRefs = ref<Record<string, any>>({});

// 设置字段引用
function setFieldRef(index: number, key: string, el: any) {
  if (el) {
    fieldRefs.value[`${index}_${key}`] = el;
  }
}

// 生成唯一 ID
let idCounter = 0;
function generateId(): string {
  return `item_${Date.now()}_${++idCounter}`;
}

// 创建空条目数据（根据 Schema 初始化）
function createEmptyItem(): Record<string, any> {
  const data: Record<string, any> = {};
  props.config.itemSchema.forEach((field) => {
    if (field.defaultValue !== undefined) {
      data[field.key] = field.defaultValue;
    } else if (field.type === 'checkbox') {
      data[field.key] = [];
    } else if (field.type === 'switch') {
      data[field.key] = false;
    } else {
      data[field.key] = '';
    }
  });
  return data;
}

// 本地条目列表（包含唯一 ID 和数据）
const localItems = ref<Array<{ id: string; data: Record<string, any> }>>([]);

// 初始化条目
function initItems() {
  const count = props.config.initialItems || 1;
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: generateId(),
      data: createEmptyItem(),
    });
  }
  localItems.value = items;
  emitValue();
}

// 添加条目
function addItem() {
  if (props.config.maxItems && localItems.value.length >= props.config.maxItems)
    return;
  localItems.value.push({
    id: generateId(),
    data: createEmptyItem(),
  });
  emitValue();
  // 触发整体变化
  emit('list-change', getValue());
}

// 删除条目
function removeItem(index: number) {
  if (localItems.value.length <= (props.config.minItems || 1)) return;
  localItems.value.splice(index, 1);
  emitValue();
  // 触发整体变化
  emit('list-change', getValue());
}

// 字段失焦
function onFieldBlur(index: number, key: string) {
  // 可以在这里触发表单级校验
}

// 字段变化
function onFieldChange(index: number, key: string, value: any) {
  // 构造特殊 key：listKey|index|fieldKey
  // listKey 是父组件中动态列表字段的 key（如 'items'）
  // 但 DynamicList 不知道自己的 key，需要通过 props 传入

  // 方案：通过事件传递索引和字段名，父组件自行构造
  emit('change', index, key, value);

  // 更新数据
  const item = localItems.value[index];
  if (item) {
    item.data[key] = value;
    emitValue();
  }
}

// 向父组件发送数据
function emitValue() {
  const data = localItems.value.map((item) => ({ ...item.data }));
  emit('update:modelValue', data);
}

// 核心：校验所有条目中的所有字段
function validate(): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (let i = 0; i < localItems.value.length; i++) {
    const item = localItems.value[i];
    for (const field of props.config.itemSchema) {
      const refKey = `${i}_${field.key}`;
      const ref = fieldRefs.value[refKey];

      if (ref && typeof ref.validate === 'function') {
        const valid = ref.validate();
        if (!valid) {
          const errorMsg =
            ref.errorMessage || `第 ${i + 1} 项 - ${field.label} 校验失败`;
          errors[`[${i + 1}] ${field.label}`] = errorMsg;
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// 重置所有条目
function resetItems() {
  // 清空所有条目，重新初始化
  const count = props.config.initialItems || 1;
  localItems.value = [];
  for (let i = 0; i < count; i++) {
    localItems.value.push({
      id: generateId(),
      data: createEmptyItem(),
    });
  }
  // 清空 fieldRefs
  fieldRefs.value = {};
  emitValue();
}

// 获取所有数据
function getValue(): Record<string, any>[] {
  return localItems.value.map((item) => ({ ...item.data }));
}

// 滚动到指定条目的某个字段
function scrollToItem(itemIndex: number, fieldKey?: string) {
  nextTick(() => {
    // 查找该条目对应的 DOM 元素
    const itemEls = document.querySelectorAll('.dynamic-list-item');
    if (itemEls[itemIndex]) {
      const targetEl = itemEls[itemIndex] as HTMLElement;

      // 如果指定了字段，尝试聚焦到该字段的输入框
      if (fieldKey) {
        const input = targetEl.querySelector(
          `[data-field-key="${fieldKey}"] input, [data-field-key="${fieldKey}"] textarea, [data-field-key="${fieldKey}"] select`
        );
        if (input) {
          (input as HTMLElement).focus();
          (input as HTMLElement).style.boxShadow =
            '0 0 0 3px rgba(245, 108, 108, 0.3)';
          (input as HTMLElement).style.borderColor = '#f56c6c';
          setTimeout(() => {
            (input as HTMLElement).style.boxShadow = '';
            (input as HTMLElement).style.borderColor = '';
          }, 2000);
        }
      }

      // 滚动到该条目
      const scrollContainer =
        targetEl.closest('.dynamic-list') ||
        targetEl.closest('.form-scroll-wrapper');
      if (scrollContainer) {
        const top = targetEl.offsetTop - 20;
        scrollContainer.scrollTo({ top, behavior: 'smooth' });
      }
    }
  });
}

// 暴露方法
defineExpose({
  validate,
  getValue,
  reset: resetItems,
  addItem,
  removeItem,
  scrollToItem,
});

// 监听外部传入的初始值（如果有）
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      // 如果外部传入了数据，用外部数据初始化
      localItems.value = newVal.map((item) => ({
        id: generateId(),
        data: { ...item },
      }));
    }
  },
  { immediate: true }
);

// 初始化
initItems();
</script>

<style scoped>
.dynamic-list {
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  padding: 16px;
  background: #fafbfc;
  margin-bottom: 16px;
}
.dynamic-list-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e8ecf1;
  position: relative;
  transition: all 0.3s;
}
.dynamic-list-item:last-child {
  margin-bottom: 0;
}
.dynamic-list-item.is-removable {
  border-color: #f0f2f5;
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f2f5;
}
.item-index {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 12px;
  border-radius: 12px;
}
.btn-remove {
  padding: 4px 12px;
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-remove:hover:not(:disabled) {
  background: #f56c6c;
  color: #fff;
  border-color: #f56c6c;
}
.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.item-body {
  padding: 4px 0;
}
.item-preview {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f8f9fb;
  border-radius: 4px;
  border: 1px solid #f0f2f5;
}
.item-preview pre {
  margin: 0;
  font-size: 11px;
  color: #666;
  overflow-x: auto;
  max-height: 100px;
}
.btn-add {
  width: 100%;
  padding: 10px;
  background: #fff;
  color: #409eff;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 12px;
}
.btn-add:hover:not(:disabled) {
  border-color: #409eff;
  background: #ecf5ff;
}
.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.max-tip {
  display: block;
  margin-top: 12px;
  padding: 8px;
  text-align: center;
  font-size: 13px;
  color: #999;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
