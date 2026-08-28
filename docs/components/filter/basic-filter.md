# 🧩 基础筛选器

> 固定字段 + 固定操作符，简单高效的查询方式

<script setup>
import BasicFilter from '../../.vitepress/components/Filter/BasicFilter.vue'
import { basicFilterSchema } from '../../.vitepress/components/Filter/preset'
</script>

## 示例：用户管理

<BasicFilter :schema="basicFilterSchema" />

## 使用方式

```vue
<template>
  <div>
    <!-- 基础筛选器 -->
    <BasicFilter
      ref="filterRef"
      :schema="basicFilterSchema"
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
import { BasicFilter } from '@/components/DynamicForm'
import { basicFilterSchema } from '@/components/DynamicForm/preset'

const filterRef = ref()
const results = ref([])

function onSearch(params, data) {
  results.value = data
  console.log('筛选参数：', params)
  console.log('筛选结果：', data)
}

function onReset() {
  results.value = []
}
</script>
```

## 适用场景

| 场景            | 筛选字段                     | 说明         |
| --------------- | ---------------------------- | ------------ |
| 👤 **用户管理** | 关键词、状态、角色、注册时间 | 后台用户列表 |
| 📦 **订单管理** | 订单号、状态、时间范围       | 电商订单     |
| 📄 **日志检索** | 操作人、操作类型、时间范围   | 系统审计     |
| 🏷️ **商品管理** | 名称、分类、价格区间、状态   | 商品列表     |

## 支持的字段类型

| 类型           | 说明     | 示例       |
| -------------- | -------- | ---------- |
| `input`        | 文本输入 | 关键词搜索 |
| `select`       | 下拉选择 | 状态、分类 |
| `date-range`   | 日期范围 | 注册时间   |
| `switch`       | 开关     | 仅显示激活 |
| `button-group` | 按钮组   | 角色切换   |
