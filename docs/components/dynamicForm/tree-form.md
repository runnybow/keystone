# 🧩 树形表单

> 多级树形结构数据录入，支持增删改、排序、展开/收起

<script setup>
import TreeForm from '../../.vitepress/components/DynamicForm/TreeForm.vue'
import { treeSchema } from '../../.vitepress/components/DynamicForm/preset'
</script>

## 示例：商品分类管理

<TreeForm :schema="treeSchema" />

## 适用场景

树形表单适用于**层级数据管理**的场景：

| 场景            | 层级结构                       | 说明             |
| --------------- | ------------------------------ | ---------------- |
| 📂 **商品分类** | 一级分类 → 二级分类 → 三级分类 | 电商后台分类管理 |
| 🏢 **组织架构** | 公司 → 部门 → 小组 → 成员      | 企业组织管理     |
| 🔐 **权限管理** | 系统 → 模块 → 菜单 → 操作      | RBAC 权限配置    |
| 📊 **目录管理** | 章 → 节 → 小节                 | 文档/课程目录    |
| 🏷️ **标签体系** | 一级标签 → 二级标签 → 三级标签 | 内容分类         |
| 🌐 **地区管理** | 国家 → 省 → 市 → 区            | 行政区划管理     |

## 核心能力

| 特性          | 说明                               |
| ------------- | ---------------------------------- |
| **无限层级**  | 支持任意深度的树形结构             |
| **增删改**    | 每个节点支持添加子节点、编辑、删除 |
| **节点排序**  | 支持上移/下移调整同级节点顺序      |
| **展开/收起** | 点击箭头展开或收起子节点           |
| **批量操作**  | 一键展开全部 / 收起全部            |
| **完整校验**  | 所有节点的必填字段递归校验         |

## 配置示例

```typescript
const treeSchema: TreeSchema = {
  title: '📂 商品分类管理',
  fields: [
    { key: 'name', type: 'input', label: '分类名称', required: true },
    { key: 'sort', type: 'number', label: '排序', defaultValue: 0 },
    { key: 'status', type: 'select', label: '状态', options: [...] }
  ],
  data: [
    {
      id: '1',
      data: { name: '电子产品', sort: 1 },
      expanded: true,
      children: [
        { id: '1-1', data: { name: '手机', sort: 1 } },
        { id: '1-2', data: { name: '电脑', sort: 2 } }
      ]
    }
  ]
}
```
