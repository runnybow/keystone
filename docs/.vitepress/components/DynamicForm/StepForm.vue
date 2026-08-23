<!-- docs/.vitepress/components/DynamicForm/StepForm.vue -->
<template>
  <div class="step-form">
    <!-- 步骤指示器 -->
    <div class="step-indicators">
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        class="step-item"
        :class="{
          'is-active': index === currentStep,
          'is-completed': index < currentStep,
          'is-clickable': index < currentStep && !state.submitting,
        }"
        @click="goToStep(index)"
      >
        <div class="step-number">
          <span v-if="index < currentStep" class="step-check">✓</span>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="step-info">
          <div class="step-title">
            <span v-if="step.icon" class="step-icon">{{ step.icon }}</span>
            {{ step.title }}
          </div>
          <div v-if="step.description" class="step-desc">
            {{ step.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤内容 -->
    <div class="step-content">
      <!-- 循环渲染所有步骤，只有当前步骤可见 -->
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        class="step-panel"
        v-show="index === currentStep"
      >
        <!-- 渲染该步骤的字段 -->
        <template v-for="field in getStepFields(step)" :key="field.key">
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
            <span v-if="field.help" class="form-help">{{ field.help }}</span>
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

    <!-- 操作按钮 -->
    <div class="step-actions">
      <button
        v-if="currentStep > 0"
        type="button"
        class="btn-prev"
        @click="prevStep"
        :disabled="state.submitting"
      >
        ← 上一步
      </button>

      <button
        v-if="currentStep < steps.length - 1"
        type="button"
        class="btn-next"
        @click="nextStep"
        :disabled="state.submitting"
      >
        下一步 →
      </button>

      <button
        v-else
        type="button"
        class="btn-submit"
        @click="handleSubmit"
        :disabled="state.submitting"
      >
        <span v-if="state.submitting" class="form-spinner"></span>
        {{ schema.submitText || '提交' }}
      </button>

      <button
        type="button"
        class="btn-reset"
        @click="handleReset"
        :disabled="state.submitting"
      >
        {{ schema.resetText || '重置' }}
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
import { ref, reactive, computed, nextTick, watch } from 'vue';
import FormField from './FormField.vue';
import DynamicList from './DynamicList.vue';
import type { FormSchema, FieldConfig } from './types';

const props = defineProps<{
  schema: FormSchema;
  maxHeight?: string | number;
}>();

const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>): void;
  (e: 'change', key: string, value: any, data: Record<string, any>): void;
  (e: 'step-change', from: number, to: number): void;
}>();

// Refs
const fieldRefs = ref<Record<string, any>>({});
const dynamicListRefs = ref<Record<string, any>>({});

// 表单数据
const formData = reactive<Record<string, any>>({});

// 状态
const state = reactive({
  submitting: false,
  errors: {} as Record<string, string>,
  touched: {} as Record<string, boolean>,
});

const errorSummary = ref('');
const currentStep = ref(0);

// 步骤列表
const steps = computed(() => props.schema.steps || []);

// 获取当前步骤的字段
function getStepFields(step: (typeof steps.value)[0]): FieldConfig[] {
  if (step.fields && step.fields.length > 0) {
    return props.schema.fields.filter((f) => step.fields!.includes(f.key));
  }
  // 如果没有指定 fields，自动分配：按顺序分配到各步骤
  // 这里简化：所有字段按顺序平均分配到各个步骤
  // 更精确的方式是在 schema 中为每个字段标记 step
  return props.schema.fields.filter((f) => (f as any).step === step.key);
}

// 初始化数据
function initData() {
  props.schema.fields.forEach((field) => {
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

// 校验当前步骤
function validateStep(stepIndex: number): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const step = steps.value[stepIndex];
  if (!step) return { valid: true, errors: {} };

  const errors: Record<string, string> = {};
  const stepFields = getStepFields(step);

  for (const field of stepFields) {
    if (field.type === 'dynamic-list') {
      const listRef = dynamicListRefs.value[field.key];
      if (listRef && typeof listRef.validate === 'function') {
        const result = listRef.validate();
        if (!result.valid) {
          Object.assign(errors, result.errors);
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
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// 下一步
async function nextStep() {
  if (state.submitting) return;

  // 校验当前步骤
  const result = validateStep(currentStep.value);
  if (!result.valid) {
    errorSummary.value = Object.values(result.errors).join('；');
    setTimeout(() => {
      errorSummary.value = '';
    }, 4000);
    return;
  }

  // 标记当前步骤的字段为已触摸
  const step = steps.value[currentStep.value];
  if (step) {
    getStepFields(step).forEach((f) => {
      state.touched[f.key] = true;
    });
  }

  const oldStep = currentStep.value;
  currentStep.value++;
  emit('step-change', oldStep, currentStep.value);
  errorSummary.value = '';
}

// 上一步
function prevStep() {
  if (state.submitting || currentStep.value <= 0) return;
  const oldStep = currentStep.value;
  currentStep.value--;
  emit('step-change', oldStep, currentStep.value);
  errorSummary.value = '';
}

// 跳转到指定步骤
function goToStep(index: number) {
  if (state.submitting) return;
  if (index < 0 || index >= steps.value.length) return;
  if (index === currentStep.value) return;

  // 只能跳到已完成的步骤（index < currentStep）
  if (index < currentStep.value) {
    const oldStep = currentStep.value;
    currentStep.value = index;
    emit('step-change', oldStep, currentStep.value);
    errorSummary.value = '';
  }
}

// 提交（所有步骤校验）
async function handleSubmit() {
  if (state.submitting) return;

  // 校验所有步骤
  const allErrors: Record<string, string> = {};
  let firstErrorStep = -1;

  for (let i = 0; i < steps.value.length; i++) {
    const result = validateStep(i);
    if (!result.valid) {
      Object.assign(allErrors, result.errors);
      if (firstErrorStep === -1) {
        firstErrorStep = i;
      }
    }
  }

  if (Object.keys(allErrors).length > 0) {
    errorSummary.value = Object.values(allErrors).join('；');
    // 跳转到第一个有错误的步骤
    if (firstErrorStep !== -1) {
      currentStep.value = firstErrorStep;
    }
    setTimeout(() => {
      errorSummary.value = '';
    }, 4000);
    return;
  }

  // 所有步骤校验通过，提交
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
  currentStep.value = 0;
  if (props.schema.onReset) {
    props.schema.onReset();
  }
  console.log('🔄 已重置');
}

// 字段失焦
function onFieldBlur(key: string) {
  state.touched[key] = true;
}

// 字段变化
function onFieldChange(key: string, value: any) {
  emit('change', key, value, { ...formData });
}

// 动态列表处理
function setFieldRef(key: string, el: any) {
  if (el) fieldRefs.value[key] = el;
}

function setDynamicListRef(key: string, el: any) {
  if (el) dynamicListRefs.value[key] = el;
}

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
  goToStep,
  reset: handleReset,
  submit: handleSubmit,
});

// 初始化
initData();
</script>

<style scoped>
.step-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e8ecf1;
  max-width: 720px;
}

/* 步骤指示器 */
.step-indicators {
  display: flex;
  gap: 0;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f2f5;
  position: relative;
}
.step-item {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  cursor: default;
  position: relative;
}
.step-item.is-clickable {
  cursor: pointer;
}
.step-item.is-clickable:hover {
  background: #f5f7fa;
  border-radius: 8px;
}
.step-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  background: #f0f2f5;
  color: #999;
  transition: all 0.3s;
}
.step-item.is-active .step-number {
  background: #409eff;
  color: #fff;
}
.step-item.is-completed .step-number {
  background: #67c23a;
  color: #fff;
}
.step-check {
  font-size: 16px;
}
.step-info {
  flex: 1;
  min-width: 0;
}
.step-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.step-item.is-active .step-title {
  color: #409eff;
}
.step-icon {
  margin-right: 4px;
}
.step-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.step-item.is-active .step-desc {
  color: #666;
}

/* 步骤内容 */
.step-content {
  min-height: 200px;
}
.step-panel {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 操作按钮 */
.step-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}
.btn-prev,
.btn-next {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-prev {
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
}
.btn-prev:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}
.btn-next {
  background: #409eff;
  color: #fff;
  border: none;
}
.btn-next:hover:not(:disabled) {
  background: #66b1ff;
}
.btn-prev:disabled,
.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  color: #999;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: auto;
}
.btn-reset:hover:not(:disabled) {
  color: #666;
  border-color: #ccc;
}
.btn-reset:disabled {
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

/* 错误汇总 */
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

/* 表单字段样式 */
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

/* 响应式 */
@media (max-width: 640px) {
  .step-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 6px 4px;
  }
  .step-info {
    display: none;
  }
  .step-actions {
    flex-wrap: wrap;
  }
  .btn-reset {
    margin-left: 0;
  }
}
</style>
