# 🧩 高级动态表单

> 字段之间相互依赖，根据用户选择动态显示/隐藏/禁用，实现复杂业务逻辑

<script setup>
import DynamicForm from '../../.vitepress/components/DynamicForm/DynamicForm.vue'
import { advancedSchema, performanceSchema  } from '../../.vitepress/components/DynamicForm/preset'

</script>

## 示例：复杂联动

<DynamicForm :schema="advancedSchema" />

## 性能测试：100+ 字段

<DynamicForm :schema="performanceSchema" />

### 适用场景

动态字段表单适用于**字段之间存在依赖关系**的场景：

| 场景              | 联动逻辑                                                                  | 说明                     |
| ----------------- | ------------------------------------------------------------------------- | ------------------------ |
| 🛒 **商品发布**   | 选择「实物商品」→ 显示 SKU、配送方式；选择「虚拟商品」→ 隐藏物流信息      | 根据商品类型动态切换表单 |
| 👤 **会员注册**   | 选择「VIP 用户」→ 显示 VIP 等级、专享价格；选择「普通用户」→ 隐藏付费字段 | 根据用户类型展示不同字段 |
| 🏠 **租房信息**   | 选择「整租」→ 显示户型、面积；选择「合租」→ 显示房间号、室友信息          | 根据出租方式切换字段     |
| 📦 **物流配置**   | 开启「冷链运输」→ 显示温度要求、保温时长；关闭 → 隐藏相关字段             | 开关控制子选项显示       |
| 🎫 **活动报名**   | 选择「团队报名」→ 显示团队名称、成员列表；选择「个人报名」→ 隐藏团队字段  | 报名类型决定表单结构     |
| 💰 **优惠券配置** | 选择「满减券」→ 显示满额条件；选择「折扣券」→ 显示折扣比例                | 优惠类型决定配置项       |

### 核心能力

| 特性         | 说明                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| **条件显示** | 字段根据其他字段的值动态显示/隐藏（`hidden: (data) => data.type !== 'physical'`） |
| **条件禁用** | 字段根据其他字段的值动态启用/禁用（`disabled: (data) => !data.isVip`）            |
| **动态校验** | 校验规则根据字段可见性自动启用/禁用（隐藏时跳过校验）                             |
| **实时响应** | 字段变化立即触发联动，无需额外操作                                                |
| **类型安全** | 完整的 TypeScript 类型推导                                                        |

## 使用方式

### 1. 定义 Schema

```typescript
const schema: FormSchema = {
  title: '我的表单',
  fields: [
    {
      key: 'name',
      type: 'input',
      label: '姓名',
      required: true,
      rules: [
        { required: true, message: '请输入姓名' },
        { min: 2, max: 10, message: '长度 2-10 个字符' }
      ]
    },
    {
      key: 'type',
      type: 'select',
      label: '类型',
      options: [
        { label: '选项一', value: '1' },
        { label: '选项二', value: '2' }
      ]
    }
  ]
}

```

### 2. 使用组件

```vue
<template>
<DynamicForm :schema="schema" @submit="handleSubmit" />
</template>

<script setup>
import DynamicForm from './DynamicForm.vue'

const schema = { /* ... */ }

const handleSubmit = (data) => {
  console.log('提交数据：', data)
}
</script>

```

### 3. 字段联动示例

```typescript
{
  key: 'vipPrice',
  type: 'number',
  label: 'VIP 价格',
  hidden: (data) => !data.isVip, // 动态隐藏
  rules: [
    {
      validator: (value, data) => {
        if (!data.isVip) return true // 隐藏时跳过校验
        return value > 0 || '请输入有效价格'
      }
    }
  ]
}
```

## 设计亮点

| 亮点           | 说明                                            | 实现方式                                           |
| -------------- | ----------------------------------------------- | -------------------------------------------------- |
| **响应式联动** | 字段变化即时触发联动，无需额外操作              | `watch` + `computed` 响应式系统                    |
| **条件逻辑**   | 支持显示/隐藏、启用/禁用、必填/选填多种联动类型 | `hidden` / `disabled` / `required` 函数配置        |
| **动态校验**   | 隐藏字段自动跳过校验，避免无效错误提示          | 校验时检查字段可见性                               |
| **灵活配置**   | 联动逻辑写在 Schema 中，无需修改组件代码        | 纯函数配置（`(data) => data.type === 'physical'`） |
| **类型安全**   | 完整的 TypeScript 类型推导，IDE 智能提示        | 泛型 + 类型定义                                    |

## 设计思路

### 为什么需要动态表单？

在实际业务中，表单需求经常变化：

- 新增字段、修改校验规则
- 字段之间产生复杂的联动关系
- 需要快速搭建运营后台

传统方式需要频繁修改 Vue 模板 + 逻辑代码，维护成本高。

**动态表单通过配置驱动，将变化集中在 Schema 层面，实现快速迭代。**
