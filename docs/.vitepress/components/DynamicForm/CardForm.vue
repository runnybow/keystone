<!-- docs/.vitepress/components/DynamicForm/CardForm.vue -->
<template>
  <div class="card-form">
    <!-- 表单标题 -->
    <div v-if="schema.title" class="form-header">
      <h2 class="form-title">{{ schema.title }}</h2>
      <p v-if="schema.description" class="form-desc">
        {{ schema.description }}
      </p>
    </div>

    <!-- ============ 卡片列表 ============ -->
    <div class="card-list">
      <div
        v-for="(section, sectionIndex) in sections"
        :key="sectionIndex"
        class="card-item"
        :class="{ 'is-collapsed': collapsedSections[sectionIndex] }"
      >
        <!-- 卡片头部 -->
        <div class="card-header" @click="toggleSection(sectionIndex)">
          <div class="card-header-left">
            <span v-if="section.icon" class="card-icon">{{
              section.icon
            }}</span>
            <h3 class="card-title">{{ section.title }}</h3>
            <span v-if="section.required" class="card-required">*</span>
            <span v-if="section.badge" class="card-badge">{{
              section.badge
            }}</span>
          </div>
          <div class="card-header-right">
            <span
              class="card-status"
              :class="{ 'is-completed': isSectionCompleted(sectionIndex) }"
            >
              {{ isSectionCompleted(sectionIndex) ? '✓ 已完成' : '待填写' }}
            </span>
            <button type="button" class="card-toggle-btn">
              {{ collapsedSections[sectionIndex] ? '展开' : '收起' }}
              <span class="toggle-icon">{{
                collapsedSections[sectionIndex] ? '▶' : '▼'
              }}</span>
            </button>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div v-show="!collapsedSections[sectionIndex]" class="card-body">
          <div class="card-fields">
            <template v-for="field in section.fields" :key="field.key">
              <!-- 动态列表 -->
              <div v-if="field.type === 'dynamic-list'" class="form-field">
                <label class="form-label">
                  {{ field.label }}
                  <span v-if="field.required" class="form-required">*</span>
                </label>
                <DynamicList
                  :ref="(el: any) => setDynamicListRef(field.key, el)"
                  :config="field.dynamicConfig!"
                  :list-key="field.key"
                  v-model="formData[field.key]"
                  :disabled="state.submitting"
                  @change="(idx: number, key: string, val: any) => handleDynamicItemChange(field.key, idx, key, val)"
                  @list-change="(data: any[]) => handleDynamicListChange(field.key, data)"
                />
                <span v-if="field.help" class="form-help">{{
                  field.help
                }}</span>
              </div>

              <!-- 普通字段 -->
              <FormField
                v-else
                :ref="(el: any) => setFieldRef(field.key, el)"
                :field="field"
                v-model="formData[field.key]"
                :form-data="formData"
                :disabled="state.submitting"
                @blur="onFieldBlur"
                @change="(val: any) => onFieldChange(field.key, val)"
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 底部操作按钮 ============ -->
    <div class="form-actions">
      <button
        class="btn-submit"
        @click="handleSubmit"
        :disabled="state.submitting"
      >
        <span v-if="state.submitting" class="form-spinner"></span>
        {{ schema.submitText || '提交' }}
      </button>
      <button
        class="btn-reset"
        @click="handleReset"
        :disabled="state.submitting"
      >
        {{ schema.resetText || '重置' }}
      </button>
      <button
        v-if="showCollapseAll"
        type="button"
        class="btn-collapse-all"
        @click="toggleAllSections"
      >
        {{ allCollapsed ? '展开全部' : '收起全部' }}
      </button>
    </div>

    <!-- 错误汇总 -->
    <div v-if="errorSummary" class="form-error-summary">
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
import FormField from './FormField.vue';
import DynamicList from './DynamicList.vue';
import type { CardSchema, CardSection, FieldConfig } from './types';

// ==================== Props ====================
const props = defineProps<{
  schema: CardSchema;
  /** 是否显示收起全部按钮 */
  showCollapseAll?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>): void;
  (e: 'change', key: string, value: any, data: Record<string, any>): void;
  (e: 'error', errors: Record<string, string>): void;
}>();

// ==================== Refs ====================
const fieldRefs = ref<Record<string, any>>({});
const dynamicListRefs = ref<Record<string, any>>({});

// ==================== 状态 ====================
const formData = reactive<Record<string, any>>({});
const state = reactive({
  submitting: false,
  errors: {} as Record<string, string>,
  touched: {} as Record<string, boolean>,
});
const errorSummary = ref('');
const collapsedSections = reactive<Record<number, boolean>>({});

// ==================== 计算属性 ====================
const sections = computed(() => props.schema.sections || []);

// 是否全部收起
const allCollapsed = computed(() => {
  const keys = Object.keys(collapsedSections);
  if (keys.length === 0) return false;
  return keys.every((key) => collapsedSections[parseInt(key)] === true);
});

// 所有字段（扁平化）
const allFields = computed(() => {
  const fields: FieldConfig[] = [];
  sections.value.forEach((section) => {
    fields.push(...section.fields);
  });
  return fields;
});

// ==================== 方法 ====================
// 初始化数据
function initData() {
  allFields.value.forEach((field) => {
    if (field.defaultValue !== undefined) {
      formData[field.key] = field.defaultValue;
    } else if (field.type === 'checkbox') {
      formData[field.key] = [];
    } else if (field.type === 'switch') {
      formData[field.key] = false;
    } else if (field.type === 'number') {
      formData[field.key] = undefined;
    } else {
      formData[field.key] = '';
    }
  });
}

// 获取字段值
function getFieldValue(field: FieldConfig) {
  return formData[field.key];
}

// 判断卡片是否完成（所有字段都已填写）
function isSectionCompleted(sectionIndex: number): boolean {
  const section = sections.value[sectionIndex];
  if (!section) return false;
  const fields = section.fields;
  // 只检查必填字段
  const requiredFields = fields.filter((f) => f.required);
  if (requiredFields.length === 0) return true;
  return requiredFields.every((f) => {
    const val = formData[f.key];
    return (
      val !== undefined &&
      val !== null &&
      val !== '' &&
      !(Array.isArray(val) && val.length === 0)
    );
  });
}

// 切换卡片展开/收起
function toggleSection(index: number) {
  collapsedSections[index] = !collapsedSections[index];
}

// 切换全部展开/收起
function toggleAllSections() {
  const newState = !allCollapsed.value;
  sections.value.forEach((_, index) => {
    collapsedSections[index] = newState;
  });
}

// 设置字段引用
function setFieldRef(key: string, el: any) {
  if (el) fieldRefs.value[key] = el;
}

function setDynamicListRef(key: string, el: any) {
  if (el) dynamicListRefs.value[key] = el;
}

// 字段失焦
function onFieldBlur(key: string) {
  state.touched[key] = true;
  validateField(key);
}

// 字段变化
function onFieldChange(key: string, value: any) {
  emit('change', key, value, { ...formData });

  const field = allFields.value.find((f) => f.key === key);
  if (field?.watch) {
    field.watch.forEach(({ handler }) => {
      handler(value, formData);
    });
  }
}

// 动态列表处理
function handleDynamicItemChange(
  listKey: string,
  index: number,
  fieldKey: string,
  value: any
) {
  const specialKey = `${listKey}|${index}|${fieldKey}`;
  onFieldChange(specialKey, value);
}

function handleDynamicListChange(listKey: string, data: any[]) {
  onFieldChange(listKey, data);
}

// 校验单个字段
function validateField(key: string): boolean {
  const field = allFields.value.find((f) => f.key === key);
  if (!field) return true;

  const ref = fieldRefs.value[key];
  if (ref && typeof ref.validate === 'function') {
    return ref.validate();
  }
  return true;
}

// 校验所有字段
function validateAll(): {
  valid: boolean;
  errors: Record<string, string>;
  firstErrorKey: string | null;
} {
  const errors: Record<string, string> = {};
  let firstErrorKey: string | null = null;

  for (const field of allFields.value) {
    if (field.type === 'dynamic-list') {
      const listRef = dynamicListRefs.value[field.key];
      if (listRef && typeof listRef.validate === 'function') {
        const result = listRef.validate();
        if (!result.valid) {
          Object.assign(errors, result.errors);
          const firstListError = Object.keys(result.errors)[0];
          if (firstListError && !firstErrorKey) firstErrorKey = field.key;
        }
      }
      continue;
    }

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

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    firstErrorKey,
  };
}

// 滚动到指定字段
function scrollToField(key: string) {
  nextTick(() => {
    const fieldRef = fieldRefs.value[key];
    if (fieldRef && fieldRef.$el) {
      const el = fieldRef.$el;
      const scrollContainer =
        el.closest('.card-form') || document.querySelector('.card-form');
      if (scrollContainer) {
        const top = el.offsetTop - 80;
        scrollContainer.scrollTo({ top, behavior: 'smooth' });
      }
      const input = el.querySelector('input, textarea, select');
      if (input) {
        input.focus();
        input.style.boxShadow = '0 0 0 3px rgba(245, 108, 108, 0.3)';
        input.style.borderColor = '#f56c6c';
        setTimeout(() => {
          input.style.boxShadow = '';
          input.style.borderColor = '';
        }, 2000);
      }
    }
  });
}

// 提交
async function handleSubmit() {
  if (state.submitting) return;

  // 标记所有字段为已触摸
  allFields.value.forEach((f) => {
    state.touched[f.key] = true;
  });

  const result = validateAll();

  if (!result.valid) {
    state.errors = result.errors;
    emit('error', state.errors);
    if (result.firstErrorKey) {
      scrollToField(result.firstErrorKey);
    }
    errorSummary.value = Object.values(result.errors).join('；');
    setTimeout(() => {
      errorSummary.value = '';
    }, 4000);
    console.warn('❌ 表单校验失败：', result.errors);
    return;
  }

  state.submitting = true;
  state.errors = {};

  try {
    const data = { ...formData };
    if (props.schema.onSubmit) {
      await props.schema.onSubmit(data);
    }
    emit('submit', data);
    console.log('✅ 提交成功：', data);
  } catch (error: any) {
    console.error('❌ 提交失败：', error);
    errorSummary.value = error.message || '提交失败，请重试';
    setTimeout(() => {
      errorSummary.value = '';
    }, 4000);
  } finally {
    state.submitting = false;
  }
}

// 重置
function handleReset() {
  if (state.submitting) return;
  initData();
  state.errors = {};
  state.touched = {};
  errorSummary.value = '';

  // 重置所有动态列表
  for (const field of allFields.value) {
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

// ==================== 生命周期 ====================
initData();

// 初始化折叠状态（默认全部展开）
sections.value.forEach((_, index) => {
  collapsedSections[index] = false;
});

// 暴露方法
defineExpose({
  setValues: (data: Record<string, any>) => {
    Object.keys(data).forEach((key) => {
      if (key in formData) {
        formData[key] = data[key];
      }
    });
  },
  getValues: () => ({ ...formData }),
  validate: validateAll,
  reset: handleReset,
  submit: handleSubmit,
  toggleSection,
  toggleAllSections,
});
</script>

<style scoped>
.card-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e8ecf1;
  max-width: 900px;
}

/* ==================== 表单头部 ==================== */
.form-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f2f5;
}

.form-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
}

.form-desc {
  margin: 0;
  font-size: 14px;
  color: #999;
}

/* ==================== 卡片列表 ==================== */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.card-item {
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fff;
}

.card-item:hover {
  border-color: #d0d5dd;
}

.card-item.is-collapsed .card-body {
  display: none;
}

/* ==================== 卡片头部 ==================== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #fafbfc;
  cursor: pointer;
  transition: background 0.3s;
  user-select: none;
}

.card-header:hover {
  background: #f5f7fa;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.card-icon {
  font-size: 18px;
}

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.card-required {
  color: #f56c6c;
  font-weight: 600;
}

.card-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
  background: #ecf5ff;
  color: #409eff;
}

.card-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.card-status {
  font-size: 12px;
  color: #999;
  padding: 2px 10px;
  border-radius: 12px;
  background: #f0f2f5;
  transition: all 0.3s;
}

.card-status.is-completed {
  background: #e1f3e1;
  color: #67c23a;
}

.card-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.card-toggle-btn:hover {
  background: #e8ecf1;
}

.toggle-icon {
  font-size: 10px;
  transition: transform 0.3s;
}

.card-item.is-collapsed .toggle-icon {
  transform: rotate(-90deg);
}

/* ==================== 卡片内容 ==================== */
.card-body {
  padding: 20px 20px 24px;
  border-top: 1px solid #f0f2f5;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px 0;
}

/* ==================== 表单字段 ==================== */
.form-field {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-required {
  color: #f56c6c;
  margin-left: 2px;
}

.form-help {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

/* ==================== 底部操作按钮 ==================== */
.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 2px solid #f0f2f5;
  flex-wrap: wrap;
  align-items: center;
}

.btn-submit {
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

.btn-submit:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-submit:active:not(:disabled) {
  transform: scale(0.97);
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

.btn-collapse-all {
  padding: 10px 20px;
  background: #f5f7fa;
  color: #666;
  border: 1px solid #e8ecf1;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: auto;
}

.btn-collapse-all:hover:not(:disabled) {
  background: #ecf5ff;
  color: #409eff;
  border-color: #409eff;
}

.form-spinner {
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
.form-error-summary {
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
  .card-form {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
  }

  .card-header-right {
    width: 100%;
    justify-content: space-between;
  }

  .card-body {
    padding: 16px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-collapse-all {
    margin-left: 0;
    width: 100%;
    text-align: center;
  }

  .btn-submit,
  .btn-reset {
    width: 100%;
    justify-content: center;
  }
}
</style>
