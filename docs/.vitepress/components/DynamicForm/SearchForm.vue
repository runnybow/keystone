<!-- docs/.vitepress/components/DynamicForm/SearchForm.vue -->
<template>
  <div class="search-form">
    <!-- 搜索字段 -->
    <SearchFields
      ref="searchFieldsRef"
      :fields="schema.fields"
      v-model="searchData"
      :show-toggle="showToggle"
      @change="onFieldChange"
      @search="handleSearch"
    />

    <!-- ============ 搜索按钮区域 ============ -->
    <div class="search-actions">
      <button class="btn-search" @click="handleSearch" :disabled="loading">
        <span v-if="loading" class="search-spinner"></span>
        {{ loading ? '搜索中...' : '🔍 搜索' }}
      </button>
      <button class="btn-reset" @click="handleReset" :disabled="loading">
        ↻ 重置
      </button>
      <!-- <span v-if="resultCount !== null" class="result-count">
        共 {{ resultCount }} 条结果
      </span> -->
    </div>

    <!-- ============ 搜索结果 ============ -->
    <div v-if="results.length > 0" class="search-results">
      <div class="results-header">
        <span>📊 搜索结果</span>
        <span class="results-count">{{ results.length }} 条</span>
      </div>
      <div class="results-table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th v-for="col in resultColumns" :key="col.key" class="result-th">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in paginatedResults"
              :key="idx"
              class="result-row"
            >
              <td v-for="col in resultColumns" :key="col.key" class="result-td">
                <span
                  v-if="col.render"
                  v-html="col.render(row[col.key], row)"
                ></span>
                <span v-else-if="col.type === 'status'">
                  <span class="status-badge" :class="`status-${row[col.key]}`">
                    {{ getStatusLabel(row[col.key]) }}
                  </span>
                </span>
                <span v-else>{{ row[col.key] ?? '-' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="results.length > 0" class="search-pagination">
        <Pagination
          :current="currentPage"
          :total="results.length"
          :page-size="pageSize"
          :page-size-options="pageSizeOptions"
          :loading="loading"
          @update:pageSize="onPageSizeChange"
          @change="onPageChange"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="searched" class="search-empty">
      <span class="empty-icon">🔍</span>
      <span>没有找到匹配的结果</span>
      <span class="empty-hint">请调整搜索条件后重试</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue';
import SearchFields from './SearchFields.vue';
import Pagination from './Pagination.vue';
import type { SearchSchema } from './types';

// ==================== Props ====================
const props = defineProps<{
  schema: SearchSchema;
  /** 是否在初始化时自动搜索（默认 true） */
  initialSearch?: boolean;
}>();

const emit = defineEmits<{
  (e: 'search', data: Record<string, any>): void;
  (e: 'reset'): void;
  (e: 'result', data: any[]): void;
}>();

// ==================== Refs ====================
const searchFieldsRef = ref<InstanceType<typeof SearchFields> | null>(null);

// ==================== 状态管理 ====================
const searchData = reactive<Record<string, any>>({});
const results = ref<any[]>([]);
const loading = ref(false);
const searched = ref(false);
const resultCount = ref<number | null>(null);
const isInitialized = ref(false);

// ==================== 计算属性 ====================
const resultColumns = computed(() => props.schema.resultColumns || []);
const showToggle = computed(() => props.schema.showToggle !== false);

// 分页结果
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return results.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(results.value.length / pageSize.value) || 1;
});

// ==================== 分页状态 ====================
const currentPage = ref(1);
const pageSize = ref(props.schema.pageSize || 10);
const pageSizeOptions = ref(props.schema.pageSizeOptions || [10, 20, 50, 100]);
// ==================== 分页方法 ====================
function onPageChange(page: number) {
  currentPage.value = page;
  // 滚动到表格顶部
  nextTick(() => {
    const table = document.querySelector('.search-results');
    if (table) {
      table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
function onPageSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1; // 切换每页条数时重置到第一页
  // 重新渲染当前页数据
}

// ==================== 方法 ====================
function initSearchData() {
  props.schema.fields.forEach((field) => {
    if (field.type === 'date-range') {
      searchData[`${field.key}_start`] = '';
      searchData[`${field.key}_end`] = '';
    } else if (field.defaultValue !== undefined) {
      searchData[field.key] = field.defaultValue;
    } else {
      searchData[field.key] = '';
    }
  });
  if (props.schema.initialData) {
    Object.assign(searchData, props.schema.initialData);
  }
}

function getSearchParams(): Record<string, any> {
  const params: Record<string, any> = {};
  props.schema.fields.forEach((field) => {
    if (field.type === 'date-range') {
      const start = searchData[`${field.key}_start`];
      const end = searchData[`${field.key}_end`];
      if (start) params[`${field.key}_start`] = start;
      if (end) params[`${field.key}_end`] = end;
    } else {
      const value = searchData[field.key];
      if (value !== '' && value !== undefined && value !== null) {
        params[field.key] = value;
      }
    }
  });
  return params;
}

// 搜索（带防抖）
let searchTimer: ReturnType<typeof setTimeout> | null = null;

async function handleSearch() {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }

  loading.value = true;
  currentPage.value = 1;

  try {
    const params = getSearchParams();
    const data = await props.schema.searchFn(params);
    results.value = data;
    searched.value = true;
    resultCount.value = data.length;
    emit('search', params);
    emit('result', data);
    console.log('🔍 搜索结果：', data.length, '条');
  } catch (error) {
    console.error('❌ 搜索失败：', error);
    results.value = [];
  } finally {
    loading.value = false;
  }
}

// 防抖搜索（用于自动搜索）
function debouncedSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    handleSearch();
  }, 300);
}

// 重置
function handleReset() {
  // 清空所有搜索条件
  props.schema.fields.forEach((field) => {
    if (field.type === 'date-range') {
      searchData[`${field.key}_start`] = '';
      searchData[`${field.key}_end`] = '';
    } else if (field.defaultValue !== undefined) {
      searchData[field.key] = field.defaultValue;
    } else {
      searchData[field.key] = '';
    }
  });

  // 重置更多状态
  if (searchFieldsRef.value) {
    searchFieldsRef.value.resetMore();
  }

  emit('reset');
  console.log('🔄 已重置搜索条件');

  // 重置后自动搜索全部数据
  handleSearch();
}

function onFieldChange(key: string, value: any) {
  // 自动搜索
  const field = props.schema.fields.find((f) => f.key === key);
  if (field?.autoSearch !== false) {
    debouncedSearch();
  }
}

function getStatusLabel(value: any): string {
  if (props.schema.statusMap) {
    return props.schema.statusMap[value] || value || '-';
  }
  return value || '-';
}

// 暴露方法
defineExpose({
  search: handleSearch,
  reset: handleReset,
  getData: () => ({ ...searchData }),
  getResults: () => results.value,
});

// ==================== 生命周期 ====================
initSearchData();

// 初始化后自动搜索（显示全部数据）
onMounted(() => {
  isInitialized.value = true;
  // 延迟一点执行，确保组件完全渲染
  nextTick(() => {
    const shouldSearch = props.initialSearch !== false;
    if (shouldSearch) {
      handleSearch();
    }
  });
});

// 自动搜索监听
watch(
  searchData,
  () => {
    if (!isInitialized.value) return;
    const hasAutoSearch = props.schema.fields.some(
      (f) => f.autoSearch !== false
    );
    if (hasAutoSearch && !loading.value) {
      debouncedSearch();
    }
  },
  { deep: true }
);
</script>

<style scoped>
/* 样式保持不变 */
.search-form {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8ecf1;
  padding: 20px 24px;
  max-width: 100%;
}

.search-actions {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.btn-search {
  padding: 7px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
}
.btn-search:hover:not(:disabled) {
  background: #66b1ff;
}
.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset {
  padding: 7px 16px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  height: 34px;
  line-height: 19px;
}
.btn-reset:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}
.btn-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-count {
  margin-left: auto;
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
}

.search-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
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

.search-results {
  margin-top: 16px;
  border-top: 1px solid #f0f2f5;
  padding-top: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.results-count {
  font-size: 13px;
  font-weight: 400;
  color: #999;
}

.results-table-wrapper {
  overflow-x: auto;
}
.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.results-table thead {
  background: #f5f7fa;
}
.result-th {
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8ecf1;
  white-space: nowrap;
}
.result-td {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f2f5;
  color: #333;
}
.result-row:hover {
  background: #fafbfc;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-active {
  background: #e1f3e1;
  color: #67c23a;
}
.status-inactive {
  background: #fef0f0;
  color: #f56c6c;
}
.status-pending {
  background: #fdf6ec;
  color: #e6a23c;
}
.status-draft {
  background: #f0f2f5;
  color: #999;
}
.status-archived {
  background: #f0f2f5;
  color: #666;
}

.search-empty {
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
.empty-hint {
  font-size: 13px;
  color: #bfbfbf;
}

@media (max-width: 768px) {
  .search-form {
    padding: 16px;
  }
  .search-actions {
    flex-wrap: wrap;
  }
  .result-count {
    margin-left: 0;
    width: 100%;
    text-align: center;
  }
}
/* 分页容器 */
.search-pagination {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}
</style>
