<!-- docs/.vitepress/components/DynamicForm/DynamicForm.vue -->
<template>
  <div class="dynamic-form">
    <!-- 错误汇总提示条 -->
    <div v-if="errorSummary" class="form-error-summary">
      <span class="error-icon">⚠️</span>
      <span>{{ errorSummary }}</span>
      <button type="button" class="error-close" @click="errorSummary = ''">
        ×
      </button>
    </div>
    <!-- 表单头 -->
    <div v-if="schema.title" class="form-header">
      <h3>{{ schema.title }}</h3>
      <p v-if="schema.description" class="form-desc">
        {{ schema.description }}
      </p>
    </div>
    <!-- 表单内容 -->
    <form @submit.prevent="handleSubmit" @reset.prevent="handleReset">
      <div class="form-scroll-wrapper" :style="scrollStyle">
        <!-- 遍历字段时判断是否为 dynamic-list -->
        <template v-for="field in visibleFields" :key="field.key">
          <!-- 动态列表 -->
          <div v-if="field.type === 'dynamic-list'" class="form-field">
            <label class="form-label form-sub-label">
              <span v-if="field.required" class="form-required">*</span>
              {{ field.label }}
            </label>
            <DynamicList
              :ref="(el: any) => setDynamicListRef(field.key, el)"
              :config="field.dynamicConfig"
              :list-key="field.key"
              v-model="formData[field.key]"
              :disabled="state.submitting"
              @change="
                (idx, key, val) => onFieldChange(field.key, formData[field.key])
              "
              @list-change="(data: any[]) => handleDynamicListChange(field.key, data)"
            />
            <span v-if="field.help" class="form-help">{{ field.help }}</span>
          </div>

          <!-- 普通字段 -->
          <FormField
            v-else
            :field="field"
            v-model="formData[field.key]"
            :form-data="formData"
            :disabled="state.submitting"
            @blur="onFieldBlur"
            @change="onFieldChange"
            :ref="(el: any) => setFieldRef(field.key, el)"
          />
        </template>
      </div>

      <div class="form-actions">
        <button type="submit" class="form-submit" :disabled="state.submitting">
          <span v-if="state.submitting" class="form-spinner"></span>
          {{ schema.submitText || '提交' }}
        </button>
        <button type="reset" class="form-reset" :disabled="state.submitting">
          {{ schema.resetText || '重置' }}
        </button>
      </div>
    </form>

    <!-- 实时数据显示 -->
    <div class="form-preview">
      <h4>📋 表单数据（实时）</h4>
      <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import FormField from './FormField.vue';
import DynamicList from './DynamicList.vue';
import type { FormSchema, FieldConfig } from './types';

const props = defineProps<{
  schema: FormSchema;
}>();

const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>): void;
  (e: 'change', key: string, value: any, data: Record<string, any>): void;
  (e: 'error', errors: Record<string, string>): void;
}>();

// 滚动样式
const scrollStyle = computed(() => {
  const h = props.maxHeight || 400;
  const height = typeof h === 'number' ? `${h}px` : h;
  return {
    maxHeight: height,
    overflowY: 'auto',
    paddingRight: '8px',
  };
});

// 表单数据
const formData = reactive<Record<string, any>>({});

// 表单状态
const state = reactive({
  submitting: false,
  errors: {} as Record<string, string>,
  touched: {} as Record<string, boolean>,
});

// 普通字段引用
const fieldRefs = ref<Record<string, any>>({});

// 动态列表引用;
const dynamicListRefs = ref<Record<string, any>>({});

// 设置字段引用（用函数绑定 ref）
function setFieldRef(key: string, el: any) {
  if (el) {
    fieldRefs.value[key] = el;
  }
}
function setDynamicListRef(key: string, el: any) {
  if (el) {
    // 调试日志
    console.log(`[DynamicList] 收集 ref: ${key}`, el);
    console.log(`[DynamicList] 是否有 validate 方法:`, typeof el.validate);

    // 如果 el 是代理对象，尝试访问
    if (el && typeof el.validate === 'function') {
      dynamicListRefs.value[key] = el;
    } else {
      // 如果 el 本身没有 validate，检查 el.$ 或 el.proxy
      const instance = el.proxy || el;
      if (instance && typeof instance.validate === 'function') {
        dynamicListRefs.value[key] = instance;
      } else {
        console.warn(`[DynamicList] ${key} 没有 validate 方法`, el);
      }
    }
  }
}
// 可见字段
const visibleFields = computed(() => {
  return props.schema.fields.filter((field) => {
    if (typeof field.hidden === 'function') {
      return !field.hidden(formData);
    }
    return !field.hidden;
  });
});

// 初始化数据
function initData() {
  props.schema.fields.forEach((field) => {
    if (field.defaultValue !== undefined) {
      formData[field.key] = field.defaultValue;
    } else if (field.type === 'checkbox') {
      formData[field.key] = [];
    } else if (field.type === 'switch') {
      formData[field.key] = false;
    } else {
      formData[field.key] = '';
    }
  });
}

// 字段失焦
function onFieldBlur(key: string) {
  state.touched[key] = true;
  validateField(key);
}

// 字段变化
function onFieldChange(key: string, value: any) {
  // 如果是普通字段
  emit('change', key, value, { ...formData });

  // 查找字段配置
  const field = props.schema.fields.find((f) => f.key === key);

  // 触发字段级 watch
  if (field?.watch) {
    field.watch.forEach(({ handler }) => {
      handler(value, formData);
    });
  }

  // 如果是动态列表内的字段变化，触发联动
  // 格式：listKey|index|fieldKey
  const match = key.match(/^(.+)\|(\d+)\|(.+)$/);
  if (match) {
    const [, listKey, index, fieldKey] = match;
    const listField = props.schema.fields.find((f) => f.key === listKey);
    if (listField?.dynamicConfig) {
      const itemSchema = listField.dynamicConfig.itemSchema;
      const fieldConfig = itemSchema.find((f) => f.key === fieldKey);
      if (fieldConfig?.watch) {
        const itemData = formData[listKey]?.[parseInt(index)];
        if (itemData) {
          fieldConfig.watch.forEach(({ handler }) => {
            handler(value, itemData);
          });
        }
      }
    }

    // 动态列表内字段变化后，重新计算总金额
    calculateTotalAmount();
  }

  // 动态列表整体变化（增删条目），也重新计算
  if (key === 'items') {
    calculateTotalAmount();
  }
}

// 校验单个字段
function validateField(key: string): boolean {
  const field = props.schema.fields.find((f) => f.key === key);
  if (!field) return true;

  const ref = fieldRefs.value[key];
  if (ref && ref.validate) {
    const valid = ref.validate();
    if (!valid) {
      // 错误信息会在 FormField 内部显示
      return false;
    }
  }
  return true;
}

// 校验所有字段（包括动态列表内部）
function validateAll(): {
  valid: boolean;
  errors: Record<string, string>;
  firstErrorKey: string | null;
} {
  const errors: Record<string, string> = {};
  let firstErrorKey: string | null = null;

  // 1. 校验普通字段
  for (const field of visibleFields.value) {
    // 跳过动态列表类型（由 DynamicList 内部校验）
    if (field.type === 'dynamic-list') continue;

    const ref = fieldRefs.value[field.key];
    if (ref && typeof ref.validate === 'function') {
      const valid = ref.validate();
      if (!valid) {
        const errorMsg = ref.errorMessage || `请检查 ${field.label}`;
        errors[field.key] = errorMsg;
        if (!firstErrorKey) firstErrorKey = field.key;
      }
    }
  }

  // 2. 校验动态列表
  for (const field of visibleFields.value) {
    if (field.type === 'dynamic-list') {
      const listRef = dynamicListRefs.value[field.key];
      if (listRef && typeof listRef.validate === 'function') {
        const result = listRef.validate();
        if (!result.valid) {
          // 为动态列表内的错误生成带索引的 key
          for (const [errorKey, errorMsg] of Object.entries(result.errors)) {
            // 尝试从错误信息中提取条目索引
            // 错误格式可能是："[1] 省份：请选择省份"
            const indexMatch = errorKey.match(/^\[(\d+)\]\s*(.+)$/);
            if (indexMatch) {
              const idx = parseInt(indexMatch[1]) - 1; // 转为 0 基索引
              const fieldLabel = indexMatch[2];
              // 查找对应的字段 key
              const itemSchema = field.dynamicConfig!.itemSchema;
              let fieldKey = '';
              for (const f of itemSchema) {
                if (f.label === fieldLabel) {
                  fieldKey = f.key;
                  break;
                }
              }
              // 生成特殊 key：listKey|itemIndex|fieldKey
              const specialKey = `${field.key}|${idx}|${fieldKey}`;
              errors[specialKey] = errorMsg;
              if (!firstErrorKey) firstErrorKey = specialKey;
            } else {
              errors[errorKey] = errorMsg;
              if (!firstErrorKey) firstErrorKey = errorKey;
            }
          }
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    firstErrorKey,
  };
}

// 提交
async function handleSubmit() {
  // 1. 防止重复提交
  if (state.submitting) return;

  // 2. 标记所有字段为已触摸（触发错误显示）
  props.schema.fields.forEach((f) => {
    state.touched[f.key] = true;
  });

  // 3. 执行校验
  const result = validateAll();
  console.log(1, result);

  // 4. 校验失败 → 拦截提交 + 滚动到错误字段
  if (!result.valid) {
    // 保存错误信息
    state.errors = result.errors;

    // 触发错误事件（外部可以监听）
    emit('error', state.errors);

    // 滚动到第一个错误字段
    if (result.firstErrorKey) {
      scrollToField(result.firstErrorKey);
    }

    // 显示错误汇总（可选）
    // showErrorSummary(result.errors);

    console.warn('❌ 表单校验失败：', result.errors);
    return; // 关键：拦截提交
  }

  // 5. 校验通过 → 执行提交
  state.submitting = true;
  state.errors = {};

  try {
    const data = { ...formData };
    if (props.schema.onSubmit) {
      await props.schema.onSubmit(data);
    }
    emit('submit', data);
    console.log('✅ 提交成功：', data);

    // 提交成功后，可选：清空表单或显示成功提示
    // 这里不自动清空，让用户决定是否重置
  } catch (error) {
    console.error('❌ 提交失败：', error);
    // 可以在这里显示错误提示
  } finally {
    state.submitting = false;
  }
}

// 滚动到指定字段
function scrollToField(key: string) {
  nextTick(() => {
    // 1. 检查是否是普通字段
    const fieldRef = fieldRefs.value[key];
    if (fieldRef && fieldRef.$el) {
      scrollToElement(fieldRef.$el);
      return;
    }

    // 2. 检查是否是动态列表内的字段（格式：listKey|itemIndex|fieldKey）
    // 例如：addresses|0|province
    const match = key.match(/^(.+)\|(\d+)\|(.+)$/);
    if (match) {
      const [, listKey, itemIndex, fieldKey] = match;
      const listRef = dynamicListRefs.value[listKey];
      if (listRef && typeof listRef.scrollToItem === 'function') {
        listRef.scrollToItem(parseInt(itemIndex), fieldKey);
        return;
      }
    }

    // 3. 检查是否是动态列表本身的错误（滚动到列表容器）
    const listRef = dynamicListRefs.value[key];
    if (listRef && listRef.$el) {
      scrollToElement(listRef.$el);
      return;
    }

    console.warn(`[scrollToField] 找不到字段: ${key}`);
  });
}

// 滚动到 DOM 元素
function scrollToElement(el: HTMLElement) {
  const scrollContainer =
    el.closest('.form-scroll-wrapper') ||
    document.querySelector('.form-scroll-wrapper');
  if (scrollContainer) {
    const top = el.offsetTop - 20;
    scrollContainer.scrollTo({ top, behavior: 'smooth' });
  }

  // 尝试聚焦到输入框
  const input = el.querySelector('input, textarea, select');
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

// 显示错误汇总（在页面顶部或使用 alert）
function showErrorSummary(errors: Record<string, string>) {
  // 方式1：控制台输出
  console.warn('⚠️ 请检查以下字段：', errors);

  // 方式2：页面内提示（需要 Template 支持）
  errorSummary.value = Object.values(errors).join('；');
  setTimeout(() => {
    errorSummary.value = '';
  }, 3000);
}

// 错误汇总状态（用于显示提示条）
const errorSummary = ref('');

// 计算订单总金额
function calculateTotalAmount() {
  const items = formData.items || [];
  let total = 0;
  for (const item of items) {
    const amount = Number(item.amount) || 0;
    total += amount;
  }
  formData.totalAmount = Number(total.toFixed(2));
}

// 监听动态列表数据变化，自动计算总金额
watch(
  () => formData.items,
  () => {
    calculateTotalAmount();
  },
  { deep: true }
);

// 重置时也重置动态列表
function handleReset() {
  if (state.submitting) return;

  initData();
  state.errors = {};
  state.touched = {};
  errorSummary.value = '';

  // 重置所有动态列表
  for (const field of visibleFields.value) {
    if (field.type === 'dynamic-list') {
      const listRef = dynamicListRefs.value[field.key];
      if (listRef && typeof listRef.reset === 'function') {
        listRef.reset();
      }
    }
  }

  if (props.schema.onReset) {
    props.schema.onReset();
  }
  console.log('🔄 已重置');
}

// 设置初始值
function setValues(data: Record<string, any>) {
  Object.keys(data).forEach((key) => {
    if (key in formData) {
      formData[key] = data[key];
    }
  });
}

// 获取当前数据
function getValues(): Record<string, any> {
  return { ...formData };
}

// 初始化时也计算一次总金额
onMounted(() => {
  calculateTotalAmount();
});

// 处理动态列表内部字段变化
function handleDynamicItemChange(
  listKey: string,
  index: number,
  fieldKey: string,
  value: any
) {
  // 构造特殊 key
  const specialKey = `${listKey}|${index}|${fieldKey}`;
  // 触发字段变化（会触发联动 watch 和总金额计算）
  onFieldChange(specialKey, value);
}

// 处理动态列表整体变化（增删条目）
function handleDynamicListChange(listKey: string, data: any[]) {
  // 触发整体变化，用于重新计算总金额
  onFieldChange(listKey, data);
}

// 暴露方法
defineExpose({
  setValues,
  getValues,
  validate: validateAll,
  reset: handleReset,
  submit: handleSubmit,
});

// 初始化
initData();

// 监听数据变化，触发隐藏/显示逻辑
watch(
  formData,
  () => {
    // 重新校验可见字段
    nextTick(() => {
      visibleFields.value.forEach((f) => {
        if (state.touched[f.key]) {
          validateField(f.key);
        }
      });
    });
  },
  { deep: true }
);
</script>

<style scoped>
/* 动态列表中的条目，继承水平布局 */
.dynamic-list-item .form-field.form-field-horizontal .field-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.dynamic-list-item .form-field.form-field-horizontal .form-label {
  flex-shrink: 0;
  width: 80px; /* 列表内标签宽度稍小，节省空间 */
  text-align: right;
  padding-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.dynamic-list-item .form-field.form-field-horizontal .form-control {
  flex: 1;
  min-width: 0;
}

/* 列表内响应式 */
@media (max-width: 640px) {
  .dynamic-list-item .form-field.form-field-horizontal .field-row {
    flex-direction: column;
    gap: 6px;
  }
  .dynamic-list-item .form-field.form-field-horizontal .form-label {
    width: auto;
    text-align: left;
    padding-top: 0;
  }
}
.dynamic-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e8ecf1;
  max-width: 720px;
}
.form-field .form-sub-label {
  display: inline-block;
  margin-bottom: 10px;
  font-weight: bold;
}
.form-help {
  color: #f56c6c;
  font-size: 12px;
}
/* 滚动容器样式 */
.form-scroll-wrapper {
  overflow-y: auto;
  padding-right: 8px;
  /* 优雅的滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #d9d9d9 transparent;
}
.form-scroll-wrapper::-webkit-scrollbar {
  width: 6px;
}
.form-scroll-wrapper::-webkit-scrollbar-track {
  background: transparent;
}
.form-scroll-wrapper::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}
.form-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
.form-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f2f5;
}
.form-header h3 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #1a1a2e;
}
.form-desc {
  margin: 0;
  font-size: 14px;
  color: #999;
}
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}
.form-submit {
  padding: 10px 32px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s, transform 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.form-submit:hover:not(:disabled) {
  background: #66b1ff;
}
.form-submit:active:not(:disabled) {
  transform: scale(0.97);
}
.form-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-reset {
  padding: 10px 24px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}
.form-reset:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}
.form-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.form-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: form-spin 0.6s linear infinite;
}
@keyframes form-spin {
  to {
    transform: rotate(360deg);
  }
}
.form-preview {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fb;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
}
.form-preview h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #666;
}
.form-preview pre {
  margin: 0;
  font-size: 12px;
  color: #333;
  overflow-x: auto;
  max-height: 200px;
}
.form-error-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  margin-bottom: 16px;
  color: #f56c6c;
  font-size: 14px;
}
.error-icon {
  font-size: 16px;
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
.error-close:hover {
  opacity: 0.7;
}
</style>
