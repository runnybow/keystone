<!-- docs/.vitepress/components/DynamicForm/AISmartFilter.vue -->
<template>
  <div class="ai-smart-filter">
    <!-- ============ 输入区域 ============ -->
    <div class="filter-input-area">
      <div class="input-wrapper" :class="{ 'is-focus': isFocused }">
        <span class="input-icon">🧠</span>
        <input
          ref="inputRef"
          v-model="inputText"
          type="text"
          class="smart-input"
          :placeholder="placeholder"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keyup.enter="handleParse"
          :disabled="loading"
        />
        <button
          class="btn-parse"
          @click="handleParse"
          :disabled="loading || !inputText.trim()"
        >
          <span v-if="loading" class="parse-spinner"></span>
          {{ loading ? 'AI 解析中...' : '🤖 AI 解析' }}
        </button>
      </div>

      <!-- 快捷示例 -->
      <div class="input-hint">
        <span>💡 试试：</span>
        <button
          v-for="example in examples"
          :key="example"
          class="example-btn"
          @click="setExample(example)"
        >
          {{ example }}
        </button>
      </div>
    </div>

    <!-- ============ AI 解析结果 ============ -->
    <div v-if="parseResult" class="parse-result" :class="parseResultClass">
      <div class="result-header">
        <div class="result-header-left">
          <span class="result-icon">{{
            parseResult.status === 'success' ? '✅' : '⚠️'
          }}</span>
          <span class="result-title">
            {{ parseResult.status === 'success' ? 'AI 解析成功' : '解析失败' }}
          </span>
          <span
            v-if="parseResult.status === 'success'"
            class="result-confidence"
          >
            置信度：{{ parseResult.confidence }}%
          </span>
        </div>
        <div class="result-actions">
          <button
            v-if="parseResult.status === 'success'"
            class="btn-apply"
            @click="applyConditions"
          >
            ✅ 应用筛选
          </button>
          <button class="btn-clear-result" @click="clearResult">清空</button>
        </div>
      </div>

      <!-- 解析成功 -->
      <div v-if="parseResult.status === 'success'" class="result-body">
        <div class="result-conditions">
          <div
            v-for="(cond, index) in parseResult.conditions"
            :key="index"
            class="result-condition"
          >
            <span class="cond-field">{{ cond.fieldLabel }}</span>
            <span class="cond-operator">{{ cond.operatorLabel }}</span>
            <span class="cond-value">{{ cond.displayValue }}</span>
          </div>
        </div>
        <div class="result-explain" v-if="parseResult.explain">
          <span class="explain-label">📖 解析说明：</span>
          <span>{{ parseResult.explain }}</span>
        </div>
      </div>

      <!-- 解析失败 -->
      <div v-else class="result-error">
        <span>{{ parseResult.message }}</span>
      </div>
    </div>

    <!-- ============ 已应用的筛选条件 ============ -->
    <div v-if="appliedConditions.length > 0" class="applied-filters">
      <div class="applied-header">
        <span class="applied-title"
          >📌 已应用筛选（{{ appliedConditions.length }} 个条件）</span
        >
        <button class="btn-clear-applied" @click="clearApplied">
          清空所有
        </button>
      </div>
      <div class="applied-tags">
        <span
          v-for="(cond, index) in appliedConditions"
          :key="index"
          class="applied-tag"
        >
          {{ cond.fieldLabel }} {{ cond.operatorLabel }} {{ cond.displayValue }}
          <span class="tag-remove" @click="removeApplied(index)">✕</span>
        </span>
      </div>
    </div>

    <!-- ============ 底部操作栏 ============ -->
    <div class="filter-actions">
      <button
        class="btn-search"
        @click="handleSearch"
        :disabled="searching || appliedConditions.length === 0"
      >
        <span v-if="searching" class="filter-spinner"></span>
        {{ searching ? '搜索中...' : '🔍 搜索' }}
      </button>
      <button
        class="btn-reset"
        @click="handleReset"
        :disabled="loading || searching"
      >
        ↻ 重置
      </button>

      <!-- AI 状态指示 -->
      <span class="ai-status" v-if="aiConfigured">
        <span
          class="status-dot"
          :class="{ 'is-connected': aiConfigured }"
        ></span>
        AI 已就绪
      </span>
      <span class="ai-status ai-warning" v-else> ⚠️ 请配置 AI API Key </span>
    </div>

    <!-- ============ 错误提示 ============ -->
    <div v-if="errorMessage" class="filter-error">⚠️ {{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { FilterField, ParsedCondition, SmartFilterSchema } from './types';
import { SMARTOPERATORS } from './preset';

// ==================== Props ====================
const props = defineProps<{
  schema: SmartFilterSchema;
}>();

const emit = defineEmits<{
  (e: 'search', conditions: ParsedCondition[], results: any[]): void;
  (e: 'reset'): void;
  (e: 'parse', conditions: ParsedCondition[]): void;
  (e: 'apply', conditions: ParsedCondition[]): void;
  (e: 'ai-error', error: string): void;
}>();

// ==================== 状态 ====================
const inputText = ref('');
const isFocused = ref(false);
const loading = ref(false);
const searching = ref(false);
const errorMessage = ref('');
const appliedConditions = ref<ParsedCondition[]>([]);
const parseResult = ref<{
  status: 'success' | 'error';
  conditions: ParsedCondition[];
  confidence: number;
  explain?: string;
  message?: string;
} | null>(null);

const inputRef = ref<HTMLInputElement | null>(null);

// ==================== 计算属性 ====================
const fields = computed(() => props.schema.fields);
const examples = computed(
  () =>
    props.schema.examples || [
      '状态为激活的用户',
      '年龄大于25',
      'VIP用户',
      '注册时间大于2024-01-01',
      '激活状态的VIP用户',
    ]
);
const placeholder = computed(
  () => props.schema.placeholder || '输入自然语言，AI 将自动解析...'
);
const aiConfigured = computed(() => !!props.schema.aiParseFn);

const parseResultClass = computed(() => ({
  'result-success': parseResult.value?.status === 'success',
  'result-error': parseResult.value?.status === 'error',
}));

// ==================== 核心方法 ====================

// 查找字段（支持别名）
function findField(keyword: string): FilterField | null {
  const lowerKeyword = keyword.toLowerCase();

  for (const field of fields.value) {
    if (field.label === keyword) return field;
    if (field.key === keyword) return field;
    if (field.aliases && field.aliases.includes(keyword)) return field;
    if (field.label!.includes(keyword)) return field;
    if (field.key.includes(keyword)) return field;
    if (field.aliases) {
      for (const alias of field.aliases) {
        if (alias.includes(keyword)) return field;
      }
    }
  }

  return null;
}

// 查找操作符
function findOperator(
  fieldType: string,
  keyword: string
): { value: string; label: string } | null {
  const ops = SMARTOPERATORS[fieldType as keyof typeof SMARTOPERATORS] || [];
  const lowerKeyword = keyword.toLowerCase();

  for (const op of ops) {
    if (op.label === keyword) return op;
    if (op.label.includes(keyword)) return op;
    if (op.value === keyword) return op;
  }

  return null;
}

// 设置示例
function setExample(text: string) {
  inputText.value = text;
  handleParse();
}

// ==================== AI 解析 ====================
async function handleParse() {
  const text = inputText.value.trim();
  if (!text) return;

  loading.value = true;
  parseResult.value = null;
  errorMessage.value = '';

  try {
    let conditions: ParsedCondition[] = [];
    let confidence = 80;
    let explain = '';

    // 如果配置了 AI 解析函数，使用 AI
    if (props.schema.aiParseFn) {
      try {
        const result = await props.schema.aiParseFn(text, fields.value);
        conditions = result.conditions;
        confidence = result.confidence || 85;
        explain = result.explain || '';
      } catch (aiError: any) {
        console.warn('AI 解析失败，使用本地解析：', aiError);
        // 降级到本地解析
        conditions = parseLocal(text);
        confidence = 60;
        explain = '使用本地规则解析（AI 服务不可用）';
      }
    } else {
      // 使用本地解析
      conditions = parseLocal(text);
      confidence = 70;
      explain = '使用本地规则解析';
    }

    if (conditions.length === 0) {
      parseResult.value = {
        status: 'error',
        conditions: [],
        confidence: 0,
        message: '无法识别有效的筛选条件，请尝试更明确的描述',
      };
      return;
    }

    parseResult.value = {
      status: 'success',
      conditions,
      confidence,
      explain,
    };

    emit('parse', conditions);
    console.log('🧠 AI 解析结果：', conditions);
  } catch (error: any) {
    parseResult.value = {
      status: 'error',
      conditions: [],
      confidence: 0,
      message: error.message || '解析失败，请重试',
    };
    emit('ai-error', error.message);
  } finally {
    loading.value = false;
  }
}

// ==================== 本地解析（降级方案） ====================
function parseLocal(text: string): ParsedCondition[] {
  const conditions: ParsedCondition[] = [];

  // 尝试匹配每个字段
  for (const field of fields.value) {
    const patterns = [field.label, field.key, ...(field.aliases || [])];

    for (const pattern of patterns) {
      const index = text.indexOf(pattern!);
      if (index === -1) continue;

      const afterField = text.substring(index + pattern!.length).trim();

      let operator = 'eq';
      let operatorLabel = '等于';
      let value = '';

      // 检查操作符
      const opKeywords = [
        '大于等于',
        '大于',
        '小于等于',
        '小于',
        '不等于',
        '等于',
        '包含',
        '以...开头',
        '以...结尾',
      ];
      let foundOp = false;

      for (const opKeyword of opKeywords) {
        if (afterField.includes(opKeyword)) {
          const op = findOperator(field.type, opKeyword);
          if (op) {
            operator = op.value;
            operatorLabel = op.label;
            const afterOp = afterField
              .substring(afterField.indexOf(opKeyword) + opKeyword.length)
              .trim();
            value = extractValue(afterOp, field.type);
            foundOp = true;
            break;
          }
        }
      }

      if (!foundOp) {
        value = extractValue(afterField, field.type);
        operatorLabel = '等于';
      }

      if (value) {
        conditions.push({
          field: field.key,
          fieldLabel: field.label,
          operator,
          operatorLabel,
          value: parseValue(value, field.type),
          displayValue: value,
        });
        break;
      }
    }
  }

  // 如果没解析出条件，尝试简单关键词匹配
  if (conditions.length === 0) {
    const tokens = text.split(/[,，、\s]+/).filter((t) => t.trim());
    for (const token of tokens) {
      const field = findField(token);
      if (field) {
        conditions.push({
          field: field.key,
          fieldLabel: field.label,
          operator: 'contains',
          operatorLabel: '包含',
          value: token,
          displayValue: token,
        });
      }
    }
  }

  return conditions;
}

// 提取值
function extractValue(text: string, fieldType: string): string {
  text = text.replace(/^[是为：: ]+/, '');

  // 引号内容
  const quoteMatch = text.match(/["'"](.+?)["']/);
  if (quoteMatch) return quoteMatch[1];

  // 日期
  const dateMatch = text.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/);
  if (dateMatch) return dateMatch[0];

  // 数字
  const numMatch = text.match(/\d+(\.\d+)?/);
  if (fieldType === 'number' && numMatch) return numMatch[0];

  // 布尔
  if (fieldType === 'boolean') {
    if (
      text.includes('是') ||
      text.includes('已') ||
      text.includes('激活') ||
      text.includes('开启')
    )
      return 'true';
    if (
      text.includes('否') ||
      text.includes('未') ||
      text.includes('禁用') ||
      text.includes('关闭')
    )
      return 'false';
  }

  // 第一个词
  const words = text.split(/[,，、\s]+/).filter((w) => w.trim());
  return words[0] || '';
}

// 解析值类型
function parseValue(value: string, fieldType: string): any {
  if (fieldType === 'number') {
    const num = Number(value);
    return isNaN(num) ? value : num;
  }
  if (fieldType === 'boolean') {
    if (
      value === 'true' ||
      value === '是' ||
      value === '已' ||
      value === '激活' ||
      value === '开启'
    )
      return true;
    if (
      value === 'false' ||
      value === '否' ||
      value === '未' ||
      value === '禁用' ||
      value === '关闭'
    )
      return false;
    return value;
  }
  return value;
}

// ==================== 应用条件 ====================
function applyConditions() {
  if (!parseResult.value || parseResult.value.status !== 'success') return;
  appliedConditions.value = [...parseResult.value.conditions];
  emit('apply', appliedConditions.value);
  parseResult.value = null;
  inputText.value = '';
  console.log('✅ 应用 AI 筛选条件：', appliedConditions.value);
}

// 清空解析结果
function clearResult() {
  parseResult.value = null;
}

// 移除单个条件
function removeApplied(index: number) {
  appliedConditions.value.splice(index, 1);
}

// 清空所有应用的条件
function clearApplied() {
  appliedConditions.value = [];
}

// ==================== 搜索与重置 ====================
async function handleSearch() {
  if (appliedConditions.value.length === 0) {
    errorMessage.value = '请先添加筛选条件';
    return;
  }

  searching.value = true;
  errorMessage.value = '';

  try {
    const data = await props.schema.searchFn(appliedConditions.value);
    emit('search', appliedConditions.value, data);
    console.log('🔍 AI 智能筛选结果：', data.length, '条');
  } catch (error: any) {
    console.error('❌ 筛选失败：', error);
    errorMessage.value = error.message || '筛选失败，请重试';
  } finally {
    searching.value = false;
  }
}

function handleReset() {
  inputText.value = '';
  parseResult.value = null;
  appliedConditions.value = [];
  errorMessage.value = '';
  emit('reset');
  console.log('🔄 已重置 AI 智能筛选');
}

// ==================== 暴露方法 ====================
defineExpose({
  search: handleSearch,
  reset: handleReset,
  getAppliedConditions: () => appliedConditions.value,
  getParsedConditions: () => parseResult.value?.conditions || [],
});
</script>

<style scoped>
.ai-smart-filter {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8ecf1;
  max-width: 100%;
  padding: 20px 24px;
}

/* ==================== 输入区域 ==================== */
.filter-input-area {
  margin-bottom: 16px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid #d9d9d9;
  border-radius: 10px;
  transition: all 0.3s;
  background: #fff;
  overflow: hidden;
}

.input-wrapper.is-focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
}

.input-icon {
  padding: 0 12px 0 16px;
  font-size: 20px;
  flex-shrink: 0;
}

.smart-input {
  flex: 1;
  padding: 12px 8px;
  border: none;
  outline: none;
  font-size: 15px;
  color: #333;
  background: transparent;
  min-width: 0;
}

.smart-input::placeholder {
  color: #bfbfbf;
}

.btn-parse {
  padding: 10px 20px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  min-height: 48px;
}

.btn-parse:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.btn-parse:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.parse-spinner {
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

.input-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 13px;
  color: #999;
}

.example-btn {
  padding: 2px 12px;
  background: #f5f7fa;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.example-btn:hover {
  background: #ede9fe;
  border-color: #7c3aed;
  color: #7c3aed;
}

/* ==================== 解析结果 ==================== */
.parse-result {
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.result-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.result-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.result-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-icon {
  font-size: 18px;
}

.result-title {
  font-weight: 600;
  font-size: 14px;
}

.result-success .result-title {
  color: #16a34a;
}
.result-error .result-title {
  color: #dc2626;
}

.result-confidence {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 1px 10px;
  border-radius: 10px;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.btn-apply {
  padding: 4px 16px;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-apply:hover {
  background: #15803d;
}

.btn-clear-result {
  padding: 4px 12px;
  background: transparent;
  color: #999;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-clear-result:hover {
  color: #dc2626;
  border-color: #fecaca;
}

.result-body {
  margin-top: 8px;
}

.result-conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.result-condition {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  font-size: 13px;
}

.cond-field {
  color: #7c3aed;
  font-weight: 500;
}

.cond-operator {
  color: #f59e0b;
}

.cond-value {
  color: #16a34a;
  font-weight: 500;
}

.result-explain {
  font-size: 13px;
  color: #6b7280;
  padding: 6px 12px;
  background: #f9fafb;
  border-radius: 4px;
}

.explain-label {
  font-weight: 500;
  color: #4b5563;
}

.result-error {
  color: #dc2626;
  font-size: 14px;
  padding: 4px 0;
}

/* ==================== 已应用筛选 ==================== */
.applied-filters {
  border: 1px solid #ede9fe;
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 12px;
  background: #faf5ff;
}

.applied-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.applied-title {
  font-weight: 500;
  font-size: 13px;
  color: #7c3aed;
}

.btn-clear-applied {
  padding: 2px 12px;
  background: transparent;
  color: #999;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-clear-applied:hover {
  color: #dc2626;
  border-color: #fecaca;
}

.applied-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.applied-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ede9fe;
  font-size: 12px;
  color: #333;
}

.tag-remove {
  cursor: pointer;
  color: #ccc;
  font-size: 12px;
  transition: color 0.3s;
}

.tag-remove:hover {
  color: #dc2626;
}

/* ==================== 底部操作 ==================== */
.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.btn-search {
  padding: 8px 24px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-search:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-reset {
  padding: 8px 20px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-reset:hover:not(:disabled) {
  color: #7c3aed;
  border-color: #7c3aed;
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

/* ==================== AI 状态指示 ==================== */
.ai-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  margin-left: auto;
}

.ai-status.ai-warning {
  color: #f59e0b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  display: inline-block;
}

.status-dot.is-connected {
  background: #16a34a;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* ==================== 错误提示 ==================== */
.filter-error {
  margin-top: 12px;
  padding: 8px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 14px;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .ai-smart-filter {
    padding: 16px;
  }

  .input-wrapper {
    flex-wrap: wrap;
  }

  .smart-input {
    flex: 1 1 100%;
    padding: 10px 12px;
    font-size: 14px;
  }

  .btn-parse {
    width: 100%;
    justify-content: center;
    min-height: 40px;
  }

  .input-hint {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .result-actions {
    justify-content: flex-start;
  }

  .result-condition {
    font-size: 12px;
    padding: 2px 10px;
  }

  .applied-header {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .filter-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-search,
  .btn-reset {
    width: 100%;
    justify-content: center;
  }

  .ai-status {
    margin-left: 0;
    justify-content: center;
  }
}
</style>
