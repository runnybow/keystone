# 🧩 表格编辑表单

> 表格展示 + 行内编辑 + 批量操作，数据管理页面的核心模式

<script setup>
import EditableTable from '../../.vitepress/components/DynamicForm/EditableTable.vue'
import { tableEditSchema } from '../../.vitepress/components/DynamicForm/preset'
</script>

## 示例：商品库存管理

<EditableTable :schema="tableEditSchema" />

## 适用场景

表格编辑表单适用于**批量数据录入和管理**的场景：

| 场景              | 表格内容                     | 说明               |
| ----------------- | ---------------------------- | ------------------ |
| 📦 **商品管理**   | 名称、分类、价格、库存、状态 | 电商后台商品列表   |
| 👤 **用户管理**   | 姓名、邮箱、角色、状态       | 后台用户管理       |
| 📄 **数据录入**   | 多行数据批量录入             | Excel 风格数据导入 |
| 🏷️ **配置管理**   | 配置项、值、描述             | 系统配置表         |
| 📊 **报表数据**   | 多维度指标数据               | 数据报表编辑       |
| 🎫 **优惠券管理** | 券名、折扣、类型、有效期     | 营销工具配置       |

## 核心能力

| 特性           | 说明                                     |
| -------------- | ---------------------------------------- |
| **行内编辑**   | 点击「编辑」行切换为可编辑状态，原地修改 |
| **实时校验**   | 输入即校验，错误单元格实时高亮显示       |
| **批量操作**   | 多选行 → 批量删除，提高操作效率          |
| **导出 CSV**   | 一键导出表格数据为 CSV 文件              |
| **行状态管理** | 编辑/保存/取消，完整交互闭环             |
| **自动保存**   | 行编辑时自动校验，通过后保存             |

## 配置示例

```typescript
const tableSchema: TableSchema = {
  columns: [
    { key: 'name', label: '商品名称', type: 'input', required: true },
    { key: 'category', label: '分类', type: 'select', options: [...] },
    { key: 'price', label: '单价', type: 'number', required: true },
    { key: 'stock', label: '库存', type: 'number', required: true }
  ],
  data: [
    { name: 'iPhone 15', category: 'elec', price: 5999, stock: 100 },
    { name: 'MacBook Pro', category: 'elec', price: 12999, stock: 50 }
  ],
  onSave: (data) => { /* 保存逻辑 */ }
}
```
