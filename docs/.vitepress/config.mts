import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url'

// 🔥 打印路径，确认是否正确
console.log('@dynamicForm 路径:', resolve(__dirname, '.vitepress/components/DynamicForm'))
console.log('@filter 路径:', resolve(__dirname, '.vitepress/components/Filter'))

export default defineConfig({
  title: '我的前端作品集',
  description: '7年经验·组件工程化',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '表单', link: '/components/dynamicForm/' },
      { text: '筛选器', link: '/components/filter/' }
    ],
    sidebar: {
      '/components/': [
        {
          text: '表单类型',
          items: [
            {
              text: 'BasicForm 基础表单',
              link: '/components/dynamicForm/basic-form',
            },
            {
              text: 'AdvancedForm 动态字段表单',
              link: '/components/dynamicForm/advanced-form',
            },
            {
              text: 'DynamicList 动态列表',
              link: '/components/dynamicForm/dynamic-list',
            },
            {
              text: 'MasterSlaveForm 主从表单',
              link: '/components/dynamicForm/master-slave-form',
            },
            {
              text: 'StepForm 分步表单',
              link: '/components/dynamicForm/step-form',
            },
            {
              text: 'TableEditingForm 表格编辑表单',
              link: '/components/dynamicForm/table-editing-form',
            },
            {
              text: 'SearchForm 搜索表单',
              link: '/components/dynamicForm/search-form',
            },
            {
              text: 'CardForm 卡片表单',
              link: '/components/dynamicForm/card-form',
            },
            {
              text: 'TreeForm 树形表单',
              link: '/components/dynamicForm/tree-form',
            },
          ],
        },
        {
          text: '筛选器类型',
          items: [
            {
              text: 'BasicFilter 基础筛选器',
              link: '/components/filter/basic-filter',
            },
            {
              text: 'DynamicFilter 动态筛选器',
              link: '/components/filter/dynamic-filter',
            },
            {
              text: 'GroupFilter 分组筛选器',
              link: '/components/filter/group-filter',
            },
            {
              text: 'SavedFilter 保存筛选器',
              link: '/components/filter/saved-filter',
            },
            {
              text: 'SmartFilter 智能筛选器',
              link: '/components/filter/smart-filter',
            },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/runnybow' }],
  },
  // template: {
  //   compilerOptions: {
  //     isCustomElement: (tag) => tag.startsWith('My'),
  //   },
  // },
});
