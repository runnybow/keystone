# 🧩 保存筛选器

> 支持保存、加载、重命名、删除筛选方案，数据持久化到 localStorage

<script setup>
import SavedFilter from '../../.vitepress/components/Filter/SavedFilter.vue'
import { savedFilterSchema } from '../../.vitepress/components/Filter/preset'
</script>

## 示例：用户管理

<SavedFilter :schema="savedFilterSchema" />

## 使用方式

```vue
<template>
  <SavedFilter
    :schema="savedFilterSchema"
    @search="onSearch"
    @reset="onReset"
    @save="onSave"
    @load="onLoad"
    @delete="onDelete"
  />
</template>

<script setup>
import { SavedFilter } from '@/components/DynamicForm'
import { savedFilterSchema } from '@/components/DynamicForm/preset'

function onSearch(conditions, results) {
  console.log('搜索结果：', results)
}

function onReset() {
  console.log('已重置')
}

function onSave(filter) {
  console.log('保存方案：', filter.name)
}

function onLoad(conditions) {
  console.log('加载方案，条件数：', conditions.length)
}

function onDelete(filterId) {
  console.log('删除方案：', filterId)
}
</script>
```

## 适用场景

保存筛选器适用于**需要重复使用相同筛选条件**的场景：

| 场景            | 说明               | 典型用途                             |
| --------------- | ------------------ | ------------------------------------ |
| 📊 **数据报表** | 固定维度的数据查询 | 日报、周报、月报的固定筛选条件       |
| 👤 **用户管理** | 用户分群筛选       | VIP 用户、活跃用户、待审核用户       |
| 📦 **订单管理** | 订单状态查询       | 待支付订单、高优先级订单、已发货订单 |
| 📈 **数据分析** | 自定义分析维度     | 多维度组合分析                       |
| 🔐 **权限管理** | 特定角色/权限查询  | 管理员列表、特定权限用户             |
| 🏷️ **内容管理** | 内容分类筛选       | 已发布、待审核、草稿文章             |
| 📋 **任务管理** | 任务状态筛选       | 进行中、已完成、高优先级任务         |
| 💰 **财务管理** | 账目筛选           | 待审批、已付款、逾期账单             |

## 设计亮点

| 亮点               | 说明                                    | 实现方式                               |
| ------------------ | --------------------------------------- | -------------------------------------- |
| **整合动态筛选器** | 复用动态筛选器的条件构建能力            | 将 `DynamicFilter` 作为子组件整合      |
| **本地持久化**     | 数据保存在 localStorage，刷新页面不丢失 | `localStorage.setItem()` / `getItem()` |
| **方案管理**       | 完整的 CRUD 操作（增删改查）            | 保存/加载/重命名/删除                  |
| **状态同步**       | 加载方案时自动同步到动态筛选器          | 通过 `ref` 调用子组件方法              |
| **用户体验**       | 清晰的视觉反馈，加载状态标识            | 激活状态高亮、加载标识                 |
| **配置驱动**       | 字段配置完全由 Schema 定义              | 与动态筛选器共享配置                   |
