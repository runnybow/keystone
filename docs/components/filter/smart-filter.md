# 🧩 智能筛选器

> 支持自然语言输入 + AI 解析，将人类语言转换为结构化筛选条件

<script setup>
import SmartFilter from '../../.vitepress/components/Filter/SmartFilter.vue'
import { smartFilterSchema } from '../../.vitepress/components/Filter/preset'
</script>

## 示例：用户管理

<SmartFilter :schema="smartFilterSchema" />

## 适用场景

| 场景            | 说明             | 典型用途                      |
| --------------- | ---------------- | ----------------------------- |
| 👤 **用户管理** | 自然语言查询用户 | "状态为激活的 VIP 用户"       |
| 📊 **数据分析** | 快速数据筛选     | "年龄大于 25 的活跃用户"      |
| 📦 **订单管理** | 业务规则查询     | "金额大于 100 的已支付订单"   |
| 🏷️ **内容管理** | 内容筛选         | "已发布的文章"                |
| 📈 **BI 报表**  | 快速过滤数据     | "本月销售额大于 10000 的订单" |

## 核心功能

| 功能             | 说明                                  |
| ---------------- | ------------------------------------- |
| **自然语言输入** | 输入人类语言描述筛选需求              |
| **AI 智能解析**  | 自动识别字段、操作符和值              |
| **字段别名**     | 支持字段的多种称呼（如"金额"→"价格"） |
| **多 AI 方案**   | 支持 OpenAI / 通义千问 / 本地解析     |
| **实时反馈**     | 解析结果实时展示，用户确认后应用      |
| **示例引导**     | 提供示例帮助用户快速上手              |
| **本地降级**     | AI 服务不可用时自动降级到本地解析     |

## AI 解析方案

| 方案         | 说明                 | 配置方式                                                |
| ------------ | -------------------- | ------------------------------------------------------- |
| **通义千问** | 阿里云百炼 MaaS 平台 | 配置 `VITE_TONGYI_API_KEY` + `VITE_TONGYI_WORKSPACE_ID` |
| **OpenAI**   | OpenAI API           | 配置 `VITE_OPENAI_API_KEY`                              |
| **本地解析** | 无需 API，零成本     | 默认方案                                                |

## 使用方式

```vue
<template>
  <SmartFilter
    :schema="filterSchema"
    @search="onSearch"
    @reset="onReset"
    @parse="onParse"
    @apply="onApply"
    @ai-error="onAIError"
  />
</template>

<script setup>
import SmartFilter from '../../.vitepress/components/Filter/SmartFilter.vue'

const filterSchema = {
  fields: [
    { key: 'username', label: '用户名', type: 'text', aliases: ['姓名', '用户'] },
    { key: 'age', label: '年龄', type: 'number' },
    { key: 'status', label: '状态', type: 'select', options: [...] }
  ],
  aiParseFn: async (text, fields) => {
    // AI 解析函数
  },
  searchFn: async (conditions) => {
    // 执行搜索
  }
}

function onSearch(conditions, results) {
  console.log('搜索结果：', results)
}

function onReset() {
  console.log('已重置')
}

function onParse(conditions) {
  console.log('AI 解析结果：', conditions)
}

function onApply(conditions) {
  console.log('应用筛选条件：', conditions)
}

function onAIError(error) {
  console.error('AI 解析失败：', error)
}
</script>
```
