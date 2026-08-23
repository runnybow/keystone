import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '我的前端作品集',
  description: '7年经验·组件工程化',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '组件', link: '/components/dynamicForm/basic-form' },
    ],
    sidebar: {
      '/components/': [
        // {
        //   text: '通用组件',
        //   items: [{ text: 'Button 按钮', link: '/components/button' }],
        // },
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
