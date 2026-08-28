# 🧩 分组筛选器

> 支持 AND/OR 逻辑分组，实现 `(A AND B) OR (C AND D)` 复杂查询

<script setup>
import GroupFilter from '../../.vitepress/components/Filter/GroupFilter.vue'
import { groupFilterSchema } from '../../.vitepress/components/Filter/preset'
</script>

## 示例：复杂订单查询

<GroupFilter :schema="groupFilterSchema" />
## 使用方式

```vue
<template>
  <GroupFilter
    :schema="filterSchema"
    @search="onSearch"
    @reset="onReset"
  />
</template>

<script setup>
import { GroupFilter } from '@/components/DynamicForm'

const filterSchema = {
  fields: [
    { key: 'orderNo', label: '订单号', type: 'text' },
    { key: 'amount', label: '金额', type: 'number' },
    { key: 'status', label: '状态', type: 'select', options: [...] }
  ],
  searchFn: async (groups) => {
    // 执行搜索逻辑
    return await api.search(groups)
  }
}

function onSearch(groups, results) {
  console.log('搜索条件：', groups)
  console.log('搜索结果：', results)
}

function onReset() {
  console.log('已重置')
}
</script>
```

## 适用场景

| 场景                | 说明             |
| ------------------- | ---------------- |
| 📊 **高级数据分析** | 多维度组合查询   |
| 📦 **订单管理**     | 复杂业务规则筛选 |
| 👤 **用户画像**     | 多条件用户分群   |
| 📈 **BI 报表**      | 自定义维度组合   |

### 逻辑说明

| 组逻辑       | 说明                   | 示例                                                                  |
| ------------ | ---------------------- | --------------------------------------------------------------------- |
| **AND 组**   | 组内所有条件都必须满足 | `金额 > 100 AND 状态 = 已支付`                                        |
| **OR 组**    | 组内任一条件满足即可   | `优先级 = 高 OR 是否加急 = true`                                      |
| **多组组合** | 组间按顺序执行         | `(金额 > 100 AND 状态 = 已支付) OR (优先级 = 高 AND 是否加急 = true)` |

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

| 亮点           | 说明                     |
| -------------- | ------------------------ |
| **分组逻辑**   | 支持 AND / OR 两种逻辑组 |
| **无限条件**   | 每组可添加任意数量条件   |
| **多组嵌套**   | 支持多个条件组组合       |
| **可视化分组** | 不同逻辑组不同颜色标识   |
| **实时反馈**   | 条件变化实时触发搜索     |
