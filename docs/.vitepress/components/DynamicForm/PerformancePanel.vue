<!-- docs/.vitepress/components/DynamicForm/PerformancePanel.vue -->
<template>
  <div class="performance-panel">
    <div class="perf-header">
      <div class="perf-header-left">
        <span class="perf-title">⚡ 性能监控</span>
        <span class="perf-badge" :class="perfStatusClass">{{
          perfStatusText
        }}</span>
      </div>
      <div class="perf-header-right">
        <button
          class="perf-btn perf-btn-run"
          @click="runTest"
          :disabled="isRunning"
        >
          {{ isRunning ? '⏳ 测试中...' : '▶ 运行压力测试' }}
        </button>
        <button
          class="perf-btn perf-btn-reset"
          @click="resetData"
          :disabled="isRunning"
        >
          ↻ 重置
        </button>
        <label class="perf-toggle">
          <input type="checkbox" v-model="showOptimized" />
          <span>显示优化对比</span>
        </label>
      </div>
    </div>

    <!-- 性能指标 -->
    <div class="perf-metrics">
      <div class="perf-item" :class="{ 'perf-warn': metrics.renderTime > 100 }">
        <span class="perf-label">⏱ 渲染耗时</span>
        <span class="perf-value"
          >{{ metrics.renderTime }} <small>ms</small></span
        >
        <span class="perf-desc">数据变化到 DOM 更新完成</span>
      </div>
      <div class="perf-item" :class="{ 'perf-warn': metrics.domNodes > 2000 }">
        <span class="perf-label">📦 DOM 节点</span>
        <span class="perf-value">{{ metrics.domNodes }}</span>
        <span class="perf-desc">当前页面 DOM 节点总数</span>
      </div>
      <div class="perf-item" :class="{ 'perf-warn': metrics.memoryUsage > 50 }">
        <span class="perf-label">💾 内存占用</span>
        <span class="perf-value"
          >{{ metrics.memoryUsage }} <small>MB</small></span
        >
        <span class="perf-desc">JS 堆内存使用量</span>
      </div>
      <div class="perf-item perf-suggestion-item">
        <span class="perf-label">💡 优化建议</span>
        <span class="perf-suggestion">{{ metrics.suggestion }}</span>
      </div>
    </div>

    <!-- 优化对比 -->
    <div v-if="showOptimized" class="perf-compare">
      <div class="compare-header">
        <span>📊 优化前后对比</span>
      </div>
      <div class="compare-bars">
        <div class="compare-item">
          <span class="compare-label">渲染耗时</span>
          <div class="compare-bar-wrapper">
            <div
              class="compare-bar compare-bar-unoptimized"
              :style="{ width: compareData.renderTime.unoptimized + '%' }"
            >
              {{ compareData.renderTime.unoptimized }}ms
            </div>
            <div
              class="compare-bar compare-bar-optimized"
              :style="{ width: compareData.renderTime.optimized + '%' }"
            >
              {{ compareData.renderTime.optimized }}ms
            </div>
          </div>
          <span class="compare-diff"
            >优化 {{ compareData.renderTime.diff }}%</span
          >
        </div>
        <div class="compare-item">
          <span class="compare-label">DOM 节点</span>
          <div class="compare-bar-wrapper">
            <div
              class="compare-bar compare-bar-unoptimized"
              :style="{ width: compareData.domNodes.unoptimized + '%' }"
            >
              {{ compareData.domNodes.unoptimized }}
            </div>
            <div
              class="compare-bar compare-bar-optimized"
              :style="{ width: compareData.domNodes.optimized + '%' }"
            >
              {{ compareData.domNodes.optimized }}
            </div>
          </div>
          <span class="compare-diff"
            >减少 {{ compareData.domNodes.diff }}%</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';

// ==================== Props ====================
const props = defineProps<{
  /** 要测量的组件实例引用 */
  targetRef?: any;
  /** 组件名称（用于标识） */
  componentName?: string;
}>();

const emit = defineEmits<{
  (e: 'run-test'): void;
  (e: 'reset'): void;
}>();

// ==================== 状态 ====================
const isRunning = ref(false);
const showOptimized = ref(true);
const metrics = reactive({
  renderTime: 0,
  domNodes: 0,
  memoryUsage: 0,
  suggestion: '等待测试...',
});

const compareData = reactive({
  renderTime: { unoptimized: 0, optimized: 0, diff: 0 },
  domNodes: { unoptimized: 0, optimized: 0, diff: 0 },
});

// ==================== 计算属性 ====================
const perfStatusClass = computed(() => {
  if (metrics.renderTime === 0) return 'perf-idle';
  if (metrics.renderTime < 50 && metrics.domNodes < 500) return 'perf-good';
  if (metrics.renderTime < 100 && metrics.domNodes < 1000) return 'perf-ok';
  return 'perf-bad';
});

const perfStatusText = computed(() => {
  if (metrics.renderTime === 0) return '等待测试';
  if (metrics.renderTime < 50 && metrics.domNodes < 500) return '🟢 优秀';
  if (metrics.renderTime < 100 && metrics.domNodes < 1000) return '🟡 良好';
  return '🔴 需优化';
});

// ==================== 方法 ====================
// 测量性能
async function measurePerformance(): Promise<{
  renderTime: number;
  domNodes: number;
  memoryUsage: number;
}> {
  // 强制垃圾回收（仅 Chrome 支持）
  if (window.gc) {
    window.gc();
  }

  // 等待 DOM 更新
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 100));

  // 测量渲染时间
  const startTime = performance.now();

  // 触发重排（确保测量准确）
  const container = document.querySelector('.dynamic-form');
  if (container) {
    container.offsetHeight;
  }

  await nextTick();
  const endTime = performance.now();

  // 统计 DOM 节点
  const domNodes = document.querySelectorAll('*').length;

  // 统计内存占用
  let memoryUsage = 0;
  if (performance.memory) {
    memoryUsage = Math.round(
      (performance.memory.usedJSHeapSize || 0) / (1024 * 1024)
    );
  }

  return {
    renderTime: Math.round(endTime - startTime),
    domNodes,
    memoryUsage,
  };
}

// 生成优化建议
function generateSuggestion(
  renderTime: number,
  domNodes: number,
  memoryUsage: number
): string {
  const suggestions: string[] = [];

  if (renderTime > 100) {
    suggestions.push('⏱ 渲染耗时较长（>100ms），建议使用虚拟滚动或分片渲染');
  } else if (renderTime > 50) {
    suggestions.push(
      '⏱ 渲染耗时中等，可考虑使用 `v-once` 或 `shallowRef` 优化'
    );
  }

  if (domNodes > 2000) {
    suggestions.push('📦 DOM 节点过多（>2000），建议使用虚拟列表');
  } else if (domNodes > 1000) {
    suggestions.push('📦 DOM 节点较多，可考虑减少不必要的包装元素');
  }

  if (memoryUsage > 50) {
    suggestions.push(
      '💾 内存占用较高（>50MB），检查组件卸载时是否清理了监听器和定时器'
    );
  } else if (memoryUsage > 30) {
    suggestions.push('💾 内存占用中等，注意大数组和对象的引用释放');
  }

  if (suggestions.length === 0) {
    return '✅ 性能良好，暂无优化建议';
  }

  return suggestions.join('；');
}

// 运行性能测试
async function runTest() {
  if (isRunning.value) return;

  isRunning.value = true;

  // 首次测量（未优化）
  const result = await measurePerformance();

  metrics.renderTime = result.renderTime;
  metrics.domNodes = result.domNodes;
  metrics.memoryUsage = result.memoryUsage;
  metrics.suggestion = generateSuggestion(
    result.renderTime,
    result.domNodes,
    result.memoryUsage
  );

  // 🔥 模拟优化后数据（用于对比展示）
  // 实际项目中，这里应该测量优化后的组件
  const optimizedResult = await measurePerformance();

  // 计算优化对比数据（模拟优化效果）
  compareData.renderTime.unoptimized = Math.min(result.renderTime, 100);
  compareData.renderTime.optimized = Math.max(
    Math.round(result.renderTime * 0.4),
    5
  );
  compareData.renderTime.diff = Math.round(
    ((compareData.renderTime.unoptimized - compareData.renderTime.optimized) /
      compareData.renderTime.unoptimized) *
      100
  );

  compareData.domNodes.unoptimized = Math.min(result.domNodes, 100);
  compareData.domNodes.optimized = Math.max(
    Math.round(result.domNodes * 0.3),
    10
  );
  compareData.domNodes.diff = Math.round(
    ((compareData.domNodes.unoptimized - compareData.domNodes.optimized) /
      compareData.domNodes.unoptimized) *
      100
  );

  emit('run-test');
  isRunning.value = false;
}

// 重置数据
function resetData() {
  metrics.renderTime = 0;
  metrics.domNodes = 0;
  metrics.memoryUsage = 0;
  metrics.suggestion = '等待测试...';

  compareData.renderTime.unoptimized = 0;
  compareData.renderTime.optimized = 0;
  compareData.renderTime.diff = 0;
  compareData.domNodes.unoptimized = 0;
  compareData.domNodes.optimized = 0;
  compareData.domNodes.diff = 0;

  emit('reset');
}

// 暴露方法
defineExpose({
  measurePerformance,
  runTest,
  resetData,
});

// ==================== 生命周期 ====================
onMounted(() => {
  // 延迟执行，确保 DOM 完全渲染
  setTimeout(() => {
    runTest();
  }, 800);
});
</script>

<style scoped>
.performance-panel {
  background: #f8f9fb;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 16px 20px;
  margin: 16px 0;
}

/* ==================== 头部 ==================== */
.perf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.perf-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.perf-title {
  font-weight: 600;
  font-size: 15px;
  color: #1a1a2e;
}

.perf-badge {
  font-size: 12px;
  padding: 2px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.perf-idle {
  background: #f0f2f5;
  color: #999;
}
.perf-good {
  background: #e1f3e1;
  color: #67c23a;
}
.perf-ok {
  background: #fdf6ec;
  color: #e6a23c;
}
.perf-bad {
  background: #fef0f0;
  color: #f56c6c;
}

.perf-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.perf-btn {
  padding: 5px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.perf-btn-run {
  background: #409eff;
  color: #fff;
}
.perf-btn-run:hover:not(:disabled) {
  background: #66b1ff;
}
.perf-btn-run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.perf-btn-reset {
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
}
.perf-btn-reset:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}
.perf-btn-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.perf-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}
.perf-toggle input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: #409eff;
  cursor: pointer;
}

/* ==================== 指标 ==================== */
.perf-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.perf-item {
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #f0f2f5;
  transition: border-color 0.3s;
}

.perf-item.perf-warn {
  border-color: #fde2e2;
  background: #fefafa;
}

.perf-label {
  font-size: 12px;
  color: #999;
}

.perf-value {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.4;
}

.perf-value small {
  font-size: 13px;
  font-weight: 400;
  color: #999;
}

.perf-desc {
  font-size: 11px;
  color: #bfbfbf;
  margin-top: 2px;
}

.perf-warn .perf-value {
  color: #f56c6c;
}

.perf-suggestion-item {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .perf-suggestion-item {
    grid-column: span 1;
  }
}

.perf-suggestion {
  font-size: 13px;
  color: #409eff;
  line-height: 1.5;
  padding-top: 2px;
}

/* ==================== 优化对比 ==================== */
.perf-compare {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f0f2f5;
}

.compare-header {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.compare-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compare-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compare-label {
  font-size: 13px;
  color: #666;
  width: 80px;
  flex-shrink: 0;
}

.compare-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.compare-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  transition: width 0.6s ease;
  white-space: nowrap;
  padding: 0 6px;
}

.compare-bar-unoptimized {
  background: #f56c6c;
}

.compare-bar-optimized {
  background: #67c23a;
}

.compare-diff {
  font-size: 13px;
  font-weight: 600;
  color: #67c23a;
  width: 70px;
  flex-shrink: 0;
  text-align: right;
}

/* ==================== 响应式 ==================== */
@media (max-width: 640px) {
  .perf-header {
    flex-direction: column;
    align-items: stretch;
  }
  .perf-header-right {
    justify-content: flex-start;
  }
  .perf-metrics {
    grid-template-columns: 1fr 1fr;
  }
  .compare-item {
    flex-wrap: wrap;
  }
  .compare-label {
    width: 100%;
  }
  .compare-diff {
    width: auto;
    text-align: left;
  }
}
</style>
