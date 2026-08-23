<!-- docs/.vitepress/components/DynamicForm/Pagination.vue -->
<template>
  <div class="pagination">
    <div class="pagination-info">
      <span
        >共 <strong>{{ total }}</strong> 条</span
      >

      <!-- 每页条数切换 -->
      <div class="page-size-selector">
        <span class="page-size-label">每页</span>
        <select
          v-model="localPageSize"
          class="page-size-select"
          :disabled="loading"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
        <span class="page-size-label">条</span>
      </div>
    </div>

    <div class="pagination-controls">
      <!-- 上一页 -->
      <button
        class="page-btn page-btn-prev"
        :disabled="current <= 1 || loading"
        @click="prev"
        title="上一页"
      >
        ◀
      </button>

      <!-- 页码列表 -->
      <template v-for="page in pageList" :key="page">
        <button
          v-if="page === '...'"
          class="page-btn page-btn-ellipsis"
          disabled
        >
          …
        </button>
        <button
          v-else
          class="page-btn page-btn-number"
          :class="{ 'is-active': page === current }"
          :disabled="loading"
          @click="goTo(page)"
        >
          {{ page }}
        </button>
      </template>

      <!-- 下一页 -->
      <button
        class="page-btn page-btn-next"
        :disabled="current >= totalPages || loading"
        @click="next"
        title="下一页"
      >
        ▶
      </button>

      <!-- 跳转到指定页 -->
      <div class="page-jump">
        <span class="jump-label">跳至</span>
        <input
          ref="jumpInputRef"
          v-model="jumpPage"
          type="number"
          class="jump-input"
          :disabled="loading"
          min="1"
          :max="totalPages"
          @keyup.enter="handleJump"
        />
        <span class="jump-label">页</span>
        <button class="jump-btn" @click="handleJump" :disabled="loading">
          GO
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

// ==================== Props ====================
const props = defineProps<{
  /** 当前页码（从 1 开始） */
  current: number;
  /** 总条数 */
  total: number;
  /** 每页条数 */
  pageSize: number;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  /** 最大显示页码数（默认 7） */
  maxVisible?: number;
  /** 加载状态 */
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:current', page: number): void;
  (e: 'update:pageSize', size: number): void;
  (e: 'change', page: number): void;
  (e: 'pageSizeChange', size: number): void;
}>();

// ==================== Refs ====================
const jumpInputRef = ref<HTMLInputElement | null>(null);
const jumpPage = ref<number | string>('');

// ==================== 计算属性 ====================
const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize) || 1;
});

const maxVisible = computed(() => props.maxVisible || 7);
const pageSizeOptions = computed(
  () => props.pageSizeOptions || [10, 20, 50, 100]
);

// 本地每页条数（双向绑定）
const localPageSize = computed({
  get: () => props.pageSize,
  set: (val: number) => {
    emit('update:pageSize', val);
    emit('pageSizeChange', val);
  },
});

// 生成页码列表（带省略号）
const pageList = computed(() => {
  const total = totalPages.value;
  const current = props.current;
  const maxVisible = props.maxVisible || 7;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const list: (number | string)[] = [];
  const half = Math.floor(maxVisible / 2);

  list.push(1);

  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  if (start > 2) {
    list.push('...');
  }

  for (let i = start; i <= end; i++) {
    if (i > 1 && i < total) {
      list.push(i);
    }
  }

  if (end < total - 1) {
    list.push('...');
  }

  if (total > 1) {
    list.push(total);
  }

  return list;
});

// ==================== 方法 ====================
function goTo(page: number) {
  if (page === props.current || page < 1 || page > totalPages.value) return;
  if (props.loading) return;
  emit('update:current', page);
  emit('change', page);
  jumpPage.value = '';
}

function prev() {
  if (props.current > 1) {
    goTo(props.current - 1);
  }
}

function next() {
  if (props.current < totalPages.value) {
    goTo(props.current + 1);
  }
}

// 跳转到指定页
function handleJump() {
  const page = Number(jumpPage.value);
  if (isNaN(page) || page < 1 || page > totalPages.value) {
    // 输入无效，清空并提示
    jumpPage.value = '';
    return;
  }
  goTo(page);
}

// 重置跳转输入框（外部调用）
function resetJumpInput() {
  jumpPage.value = '';
}

// 暴露方法
defineExpose({
  resetJumpInput,
});

// ==================== 监听 ====================
// 当前页变化时，重置跳转输入框
watch(
  () => props.current,
  () => {
    jumpPage.value = '';
  }
);
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
}

/* ==================== 左侧信息 ==================== */
.pagination-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

.pagination-info strong {
  color: #333;
}

/* 每页条数切换 */
.page-size-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 4px;
}

.page-size-label {
  font-size: 13px;
  color: #666;
}

.page-size-select {
  padding: 3px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
  color: #333;
  cursor: pointer;
  transition: border-color 0.3s;
  height: 28px;
  outline: none;
}

.page-size-select:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.page-size-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== 右侧控制 ==================== */
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.page-btn:hover:not(:disabled):not(.is-active) {
  color: #409eff;
  border-color: #409eff;
  z-index: 1;
}

.page-btn:active:not(:disabled):not(.is-active) {
  transform: scale(0.95);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn-number.is-active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.page-btn-number.is-active:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.page-btn-ellipsis {
  border: none;
  background: transparent;
  cursor: default;
  color: #999;
  min-width: 28px;
}

.page-btn-prev,
.page-btn-next {
  padding: 0 12px;
  font-size: 12px;
}

/* 跳转到指定页 */
.page-jump {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid #e8ecf1;
}

.jump-label {
  font-size: 13px;
  color: #666;
}

.jump-input {
  width: 48px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
  transition: border-color 0.3s;
  outline: none;
}

.jump-input:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.jump-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 去掉 number 输入框的上下箭头 */
.jump-input::-webkit-outer-spin-button,
.jump-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.jump-input[type='number'] {
  -moz-appearance: textfield;
}

.jump-btn {
  padding: 0 12px;
  height: 28px;
  border: 1px solid #409eff;
  border-radius: 4px;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.3s;
}

.jump-btn:hover:not(:disabled) {
  background: #66b1ff;
  border-color: #66b1ff;
}

.jump-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .pagination-info {
    justify-content: center;
    font-size: 12px;
  }

  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .page-btn {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
    padding: 0 6px;
  }

  .page-btn-prev,
  .page-btn-next {
    padding: 0 10px;
  }

  .page-jump {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    margin-top: 4px;
  }

  .jump-input {
    width: 40px;
    height: 26px;
    font-size: 12px;
  }

  .jump-btn {
    height: 26px;
    font-size: 11px;
    padding: 0 10px;
  }

  .page-size-selector {
    margin-left: 0;
  }

  .page-size-select {
    height: 26px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .pagination-info {
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-size-selector {
    flex-wrap: wrap;
  }
}
</style>
