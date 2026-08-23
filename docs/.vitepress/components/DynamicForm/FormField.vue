<!-- docs/.vitepress/components/DynamicForm/FormField.vue -->
<template>
  <div
    class="form-field form-field-horizontal"
    :class="{ 'is-hidden': isHidden }"
    v-show="!isHidden"
    :data-field-key="field.key"
  >
    <div class="field-row">
      <label v-if="field.label" class="form-label" :for="field.key">
        <span v-if="field.required" class="form-required">*</span>
        {{ field.label }}
      </label>

      <div class="form-control">
        <!-- Input -->
        <input
          v-if="field.type === 'input'"
          :id="field.key"
          v-model="localValue"
          :type="field.inputType || 'text'"
          :placeholder="field.placeholder"
          :maxlength="field.maxlength"
          :disabled="isDisabled"
          class="form-input"
          @blur="onBlur"
        />

        <!-- Textarea -->
        <textarea
          v-else-if="field.type === 'textarea'"
          :id="field.key"
          v-model="localValue"
          :placeholder="field.placeholder"
          :rows="field.rows || 3"
          :disabled="isDisabled"
          class="form-textarea"
          @blur="onBlur"
        />

        <!-- Number -->
        <input
          v-else-if="field.type === 'number'"
          :id="field.key"
          v-model.number="localValue"
          type="number"
          :min="field.min"
          :max="field.max"
          :step="field.step || 1"
          :placeholder="field.placeholder"
          :disabled="isDisabled"
          class="form-input"
          @blur="onBlur"
        />

        <!-- Select -->
        <select
          v-else-if="field.type === 'select'"
          :id="field.key"
          v-model="localValue"
          :disabled="isDisabled"
          class="form-select"
          @change="onBlur"
        >
          <option v-if="field.placeholder" value="">
            {{ field.placeholder }}
          </option>
          <option
            v-for="opt in normalizedOptions"
            :key="opt.value"
            :value="opt.value"
            :disabled="opt.disabled"
          >
            {{ opt.label }}
          </option>
        </select>

        <!-- Radio -->
        <div v-else-if="field.type === 'radio'" class="form-radio-group">
          <label
            v-for="opt in normalizedOptions"
            :key="opt.value"
            class="form-radio-label"
          >
            <input
              v-model="localValue"
              type="radio"
              :value="opt.value"
              :disabled="isDisabled || opt.disabled"
              @change="onBlur"
            />
            {{ opt.label }}
          </label>
        </div>

        <!-- Checkbox -->
        <div v-else-if="field.type === 'checkbox'" class="form-checkbox-group">
          <label
            v-for="opt in normalizedOptions"
            :key="opt.value"
            class="form-checkbox-label"
          >
            <input
              v-model="checkboxValue"
              type="checkbox"
              :value="opt.value"
              :disabled="isDisabled || opt.disabled"
              @change="onBlur"
            />
            {{ opt.label }}
          </label>
        </div>

        <!-- Switch -->
        <div v-else-if="field.type === 'switch'" class="form-switch">
          <button
            type="button"
            class="form-switch-btn"
            :class="{ 'is-active': localValue }"
            :disabled="isDisabled"
            @click="toggleSwitch"
          >
            <span class="form-switch-slider"></span>
          </button>
          <span class="form-switch-label">{{ localValue ? '开' : '关' }}</span>
        </div>

        <!-- Custom -->
        <component
          v-else-if="field.type === 'custom' && field.component"
          :is="field.component"
          v-model="localValue"
          v-bind="field.componentProps || {}"
          :disabled="isDisabled"
          @update:model-value="onBlur"
        />

        <!-- Help text -->
        <span v-if="field.help && !errorMessage" class="form-help">{{
          field.help
        }}</span>

        <!-- Error -->
        <span v-if="errorMessage" class="form-error">{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import type { FieldConfig } from './types';

const props = defineProps<{
  field: FieldConfig;
  modelValue: any;
  formData: Record<string, any>;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'blur', key: string): void;
  (e: 'change', key: string, value: any): void;
}>();

// 本地值
const localValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val);
    emit('change', props.field.key, val);
  },
});

// 校验错误
const errorMessage = ref('');

// 是否隐藏
const isHidden = computed(() => {
  if (typeof props.field.hidden === 'function') {
    return props.field.hidden(props.formData);
  }
  return props.field.hidden || false;
});

// 是否禁用
const isDisabled = computed(() => {
  if (typeof props.field.disabled === 'function') {
    return props.field.disabled(props.formData) || props.disabled;
  }
  return props.field.disabled || props.disabled || false;
});

// 规范化选项
const normalizedOptions = computed(() => {
  const opts = props.field.options || [];
  return opts.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { label: String(opt), value: opt };
    }
    return opt;
  });
});

// Checkbox 多选值
const checkboxValue = computed({
  get: () => {
    const val = localValue.value;
    return Array.isArray(val) ? val : [];
  },
  set: (val) => {
    localValue.value = val;
  },
});

// Switch 切换
function toggleSwitch() {
  if (isDisabled.value) return;
  localValue.value = !localValue.value;
  onBlur();
}

// 失焦触发校验
function onBlur() {
  emit('blur', props.field.key);
  validate();
}

// 校验
function validate(): boolean {
  const rules = props.field.rules || [];
  const value = localValue.value;

  for (const rule of rules) {
    // required
    if (rule.required) {
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        errorMessage.value = rule.message || '此字段为必填项';
        return false;
      }
    }

    // pattern
    if (rule.pattern && value && !rule.pattern.test(String(value))) {
      errorMessage.value = rule.message || '格式不正确';
      return false;
    }

    // min
    if (
      rule.min !== undefined &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      if (typeof value === 'string' && value.length < rule.min) {
        errorMessage.value = rule.message || `最少 ${rule.min} 个字符`;
        return false;
      }
      if (typeof value === 'number' && value < rule.min) {
        errorMessage.value = rule.message || `最小值为 ${rule.min}`;
        return false;
      }
    }

    // max
    if (
      rule.max !== undefined &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      if (typeof value === 'string' && value.length > rule.max) {
        errorMessage.value = rule.message || `最多 ${rule.max} 个字符`;
        return false;
      }
      if (typeof value === 'number' && value > rule.max) {
        errorMessage.value = rule.message || `最大值为 ${rule.max}`;
        return false;
      }
    }

    // custom validator
    if (rule.validator) {
      const result = rule.validator(value, props.formData);
      if (result === false) {
        errorMessage.value = rule.message || '校验失败';
        return false;
      }
      if (typeof result === 'string') {
        errorMessage.value = result;
        return false;
      }
    }
  }

  errorMessage.value = '';
  return true;
}

// 暴露校验方法给父组件
defineExpose({ validate });
</script>

<style scoped>
.form-field {
  margin-bottom: 20px;
}
/* 水平布局 */
.form-field.form-field-horizontal .field-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.form-field.form-field-horizontal .form-label {
  flex-shrink: 0;
  width: 100px;
  text-align: right;
  padding-top: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.6;
}

/* 控件占满剩余宽度 */
.form-field.form-field-horizontal .form-control {
  flex: 1;
  min-width: 0;
}

/* 特殊：switch 居中对齐 */
.form-field.form-field-horizontal .form-switch {
  padding-top: 4px;
}

/* 特殊：radio / checkbox 组 */
.form-field.form-field-horizontal .form-radio-group,
.form-field.form-field-horizontal .form-checkbox-group {
  padding-top: 4px;
}

/* 输入框占满宽度 */
.form-field.form-field-horizontal .form-input,
.form-field.form-field-horizontal .form-textarea,
.form-field.form-field-horizontal .form-select {
  width: 100%;
}

/* 响应式：小屏幕转垂直 */
@media (max-width: 640px) {
  .form-field.form-field-horizontal .field-row {
    flex-direction: column;
    gap: 6px;
  }

  .form-field.form-field-horizontal .form-label {
    width: auto;
    text-align: left;
    padding-top: 0;
  }
}
.form-field.is-hidden {
  display: none;
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
.form-control {
  position: relative;
}
.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s, box-shadow 0.3s;
  background: #fff;
  color: #333;
  box-sizing: border-box;
}
.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}
.form-input:disabled,
.form-textarea:disabled,
.form-select:disabled {
  background: #f5f7fa;
  cursor: not-allowed;
  color: #999;
}
.form-textarea {
  resize: vertical;
}
.form-radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 4px;
}
.form-radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}
.form-radio-label input[type='radio'] {
  width: 16px;
  height: 16px;
  accent-color: #409eff;
  cursor: pointer;
}
.form-checkbox-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 4px;
}
.form-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}
.form-checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: #409eff;
  cursor: pointer;
}
.form-switch {
  display: flex;
  align-items: center;
  gap: 12px;
}
.form-switch-btn {
  position: relative;
  width: 44px;
  height: 24px;
  border: none;
  border-radius: 12px;
  background: #d9d9d9;
  cursor: pointer;
  transition: background 0.3s;
  padding: 0;
}
.form-switch-btn.is-active {
  background: #409eff;
}
.form-switch-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-switch-slider {
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
.form-switch-btn.is-active .form-switch-slider {
  transform: translateX(20px);
}
.form-switch-label {
  font-size: 14px;
  color: #666;
}
.form-help {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
.form-error {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
}
</style>
