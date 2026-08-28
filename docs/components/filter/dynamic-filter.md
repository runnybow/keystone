# 🧩 动态筛选器

> 用户可动态添加/删除条件行，自由选择字段、操作符和值

<script setup>
import DynamicFilter from '../../.vitepress/components/Filter/DynamicFilter.vue'
import { dynamicFilterSchema } from '../../.vitepress/components/Filter/preset'
</script>

## 示例：高级用户管理

<DynamicFilter :schema="dynamicFilterSchema" />

## 使用方式

```vue
<template>
  <div>
    <!-- 动态条件筛选器 -->
    <DynamicFilter
      ref="filterRef"
      :schema="dynamicFilterSchema"
      @search="onSearch"
      @reset="onReset"
    />

    <!-- 外部展示筛选结果 -->
    <div v-if="results.length > 0">
      <div v-for="item in results" :key="item.id">
        {{ item.username }} - {{ item.email }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { DynamicFilter } from '@/components/DynamicForm'
  import { dynamicFilterSchema } from '@/components/DynamicForm/preset'

  const filterRef = ref()
  const results = ref([])

  function onSearch(conditions, data) {
    results.value = data
    console.log('筛选条件：', conditions)
    console.log('筛选结果：', data)
  }

  function onReset() {
    results.value = []
  }
</script>
```

## 适用场景

| 场景                | 说明               |
| ------------------- | ------------------ |
| 📊 **数据报表**     | 用户自定义维度筛选 |
| 👤 **高级用户管理** | 多条件组合查询     |
| 📦 **订单分析**     | 多维度订单筛选     |
| 📈 **数据分析**     | 自定义指标筛选     |

## 支持的字段类型

| 类型         | 说明     | 支持的操作符                   |
| ------------ | -------- | ------------------------------ |
| `text`       | 文本     | 等于、包含、以...开头、为空... |
| `number`     | 数字     | 等于、大于、小于、区间...      |
| `select`     | 下拉选择 | 等于、包含                     |
| `date`       | 日期     | 等于、大于、区间...            |
| `date-range` | 日期范围 | 区间                           |
| `boolean`    | 布尔     | 等于                           |

## 操作符说明

| 操作符               | 说明            | 适用类型   |
| -------------------- | --------------- | ---------- |
| `eq`                 | 等于            | 全部       |
| `ne`                 | 不等于          | 全部       |
| `contains`           | 包含            | 文本       |
| `startsWith`         | 以...开头       | 文本       |
| `endsWith`           | 以...结尾       | 文本       |
| `gt` / `gte`         | 大于 / 大于等于 | 数字、日期 |
| `lt` / `lte`         | 小于 / 小于等于 | 数字、日期 |
| `between`            | 区间            | 数字、日期 |
| `empty` / `notEmpty` | 为空 / 不为空   | 全部       |

## 设计亮点

| 亮点         | 说明                               |
| ------------ | ---------------------------------- |
| **动态增删** | 用户可自由添加/删除条件行          |
| **字段感知** | 选择字段后自动切换操作符和输入类型 |
| **逻辑连接** | 支持 AND / OR 逻辑组合             |
| **实时反馈** | 条件变化即可触发搜索               |
| **配置驱动** | 字段、操作符、类型完全由配置定义   |

```

```
