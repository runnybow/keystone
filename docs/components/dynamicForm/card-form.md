# 🧩 卡片表单

> 将表单字段按功能分组，每组用卡片容器展示，视觉层次清晰

<script setup>
import CardForm from '../../.vitepress/components/DynamicForm/CardForm.vue'
import { cardSchema } from '../../.vitepress/components/DynamicForm/preset'
</script>

## 示例：个人设置

<CardForm :schema="cardSchema" :show-collapse-all="true" />

## 适用场景

卡片表单适用于**多模块、分组清晰**的配置页面：

| 场景            | 卡片分组                                  | 说明         |
| --------------- | ----------------------------------------- | ------------ |
| 👤 **个人设置** | 基本信息 / 联系方式 / 偏好设置 / 安全设置 | 用户个人中心 |
| 🏢 **企业信息** | 公司信息 / 法人信息 / 资质认证 / 联系方式 | 企业注册     |
| ⚙️ **系统配置** | 基础配置 / 邮件配置 / 安全配置 / 高级配置 | 后台系统设置 |
| 🎨 **主题定制** | 颜色 / 字体 / 布局 / 动画                 | 品牌定制     |
| 📦 **商品编辑** | 基本信息 / 规格参数 / 营销设置 / 物流设置 | 商品详情编辑 |
| 👨‍👩‍👧‍👦 **用户档案** | 个人资料 / 教育背景 / 工作经历 / 技能标签 | 简历管理     |

## 核心能力

| 特性           | 说明                             |
| -------------- | -------------------------------- |
| **卡片分组**   | 字段按功能分组，每组独立卡片展示 |
| **可折叠展开** | 点击卡片头部可折叠/展开内容      |
| **完成状态**   | 卡片显示「已完成/待填写」状态    |
| **批量操作**   | 一键展开/收起全部卡片            |
| **独立校验**   | 每张卡片内的字段独立校验         |
| **完整提交**   | 所有卡片统一提交，数据完整       |

## 配置示例

```typescript
const cardSchema: CardSchema = {
  title: '👤 个人设置',
  sections: [
    {
      title: '基本信息',
      icon: '📝',
      required: true,
      fields: [
        { key: 'nickname', type: 'input', label: '昵称', required: true },
        { key: 'bio', type: 'textarea', label: '个人简介' }
      ]
    },
    {
      title: '联系方式',
      icon: '📞',
      fields: [
        { key: 'email', type: 'input', label: '邮箱', required: true },
        { key: 'phone', type: 'input', label: '手机号' }
      ]
    }
  ]
}
```
