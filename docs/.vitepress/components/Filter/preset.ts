// docs/.vitepress/components/DynamicForm/preset.ts

import type {
    FilterSchema,
    DynamicFilterSchema,
    GroupFilterSchema,
    SavedFilterSchema,
    SmartFilterSchema,
    FilterField,
    ParsedCondition,
    TongyiConfig,
  } from './types.ts';
  /**
   * 基础筛选器 - 用户管理
   */
  export const basicFilterSchema: FilterSchema = {
    layout: 'inline',
    autoSearch: false,
    showSelected: true,
    fields: [
      {
        key: 'keyword',
        type: 'input',
        label: '关键词',
        placeholder: '用户名 / 手机号 / 邮箱',
      },
      {
        key: 'status',
        type: 'select',
        label: '状态',
        placeholder: '全部状态',
        options: [
          { label: '激活', value: 'active' },
          { label: '禁用', value: 'inactive' },
          { label: '待审核', value: 'pending' },
        ],
      },
      {
        key: 'role',
        type: 'button-group',
        label: '角色',
        options: [
          { label: '全部', value: '' },
          { label: '管理员', value: 'admin' },
          { label: 'VIP', value: 'vip' },
          { label: '普通', value: 'user' },
        ],
        defaultValue: '',
      },
      {
        key: 'dateRange',
        type: 'date-range',
        label: '注册时间',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
      },
      {
        key: 'isActive',
        type: 'switch',
        label: '仅显示激活用户',
        defaultValue: false,
      },
    ],
  
    searchFn: async (params: Record<string, any>) => {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));
  
      // 模拟数据
      const mockData = [
        {
          id: 1,
          username: '张三',
          email: 'zhangsan@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-15',
        },
        {
          id: 2,
          username: '李四',
          email: 'lisi@example.com',
          role: 'user',
          status: 'active',
          createdAt: '2024-02-20',
        },
        {
          id: 3,
          username: '王五',
          email: 'wangwu@example.com',
          role: 'vip',
          status: 'pending',
          createdAt: '2024-03-10',
        },
        {
          id: 4,
          username: '赵六',
          email: 'zhaoliu@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-04-05',
        },
        {
          id: 5,
          username: '孙七',
          email: 'sunqi@example.com',
          role: 'vip',
          status: 'active',
          createdAt: '2024-05-12',
        },
        {
          id: 6,
          username: '周八',
          email: 'zhouba@example.com',
          role: 'user',
          status: 'pending',
          createdAt: '2024-06-18',
        },
        {
          id: 7,
          username: '吴九',
          email: 'wujiu@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-07-22',
        },
        {
          id: 8,
          username: '郑十',
          email: 'zhengshi@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-08-30',
        },
      ];
  
      // 过滤
      let filtered = [...mockData];
  
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.username.includes(kw) ||
            item.email.includes(kw) ||
            String(item.id).includes(kw)
        );
      }
  
      if (params.status) {
        filtered = filtered.filter((item) => item.status === params.status);
      }
  
      if (params.role) {
        filtered = filtered.filter((item) => item.role === params.role);
      }
  
      if (params.dateRange_start) {
        filtered = filtered.filter(
          (item) => item.createdAt >= params.dateRange_start
        );
      }
  
      if (params.dateRange_end) {
        filtered = filtered.filter(
          (item) => item.createdAt <= params.dateRange_end
        );
      }
  
      if (params.isActive) {
        filtered = filtered.filter((item) => item.status === 'active');
      }
  
      return filtered;
    },
  };
  
  /**
   * 动态条件筛选器 - 高级用户管理
   */
  export const dynamicFilterSchema: DynamicFilterSchema = {
    fields: [
      {
        key: 'username',
        label: '用户名',
        type: 'text',
      },
      {
        key: 'email',
        label: '邮箱',
        type: 'text',
      },
      {
        key: 'age',
        label: '年龄',
        type: 'number',
      },
      {
        key: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: '激活', value: 'active' },
          { label: '禁用', value: 'inactive' },
          { label: '待审核', value: 'pending' },
        ],
      },
      {
        key: 'role',
        label: '角色',
        type: 'select',
        options: [
          { label: '管理员', value: 'admin' },
          { label: 'VIP 用户', value: 'vip' },
          { label: '普通用户', value: 'user' },
        ],
      },
      {
        key: 'createdAt',
        label: '注册时间',
        type: 'date',
      },
      {
        key: 'isActive',
        label: '是否激活',
        type: 'boolean',
      },
    ],
  
    searchFn: async (conditions) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
  
      const mockData = [
        {
          id: 1,
          username: '张三',
          email: 'zhangsan@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-15',
          age: 28,
        },
        {
          id: 2,
          username: '李四',
          email: 'lisi@example.com',
          role: 'user',
          status: 'active',
          createdAt: '2024-02-20',
          age: 32,
        },
        {
          id: 3,
          username: '王五',
          email: 'wangwu@example.com',
          role: 'vip',
          status: 'pending',
          createdAt: '2024-03-10',
          age: 24,
        },
        {
          id: 4,
          username: '赵六',
          email: 'zhaoliu@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-04-05',
          age: 35,
        },
        {
          id: 5,
          username: '孙七',
          email: 'sunqi@example.com',
          role: 'vip',
          status: 'active',
          createdAt: '2024-05-12',
          age: 29,
        },
        {
          id: 6,
          username: '周八',
          email: 'zhouba@example.com',
          role: 'user',
          status: 'pending',
          createdAt: '2024-06-18',
          age: 22,
        },
        {
          id: 7,
          username: '吴九',
          email: 'wujiu@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-07-22',
          age: 41,
        },
        {
          id: 8,
          username: '郑十',
          email: 'zhengshi@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-08-30',
          age: 26,
        },
      ];
  
      let filtered = [...mockData];
  
      for (const cond of conditions) {
        if (!cond.field || !cond.operator) continue;
  
        const field = cond.field;
        const op = cond.operator;
        const value = cond.value;
        const valueStart = cond.valueStart;
        const valueEnd = cond.valueEnd;
  
        filtered = filtered.filter((item) => {
          const val = item[field as keyof typeof item];
          const strVal = String(val).toLowerCase();
          const strValue = String(value).toLowerCase();
  
          switch (op) {
            case 'eq':
              return val === value;
            case 'ne':
              return val !== value;
            case 'contains':
              return strVal.includes(strValue);
            case 'notContains':
              return !strVal.includes(strValue);
            case 'startsWith':
              return strVal.startsWith(strValue);
            case 'endsWith':
              return strVal.endsWith(strValue);
            case 'gt':
              return Number(val) > Number(value);
            case 'gte':
              return Number(val) >= Number(value);
            case 'lt':
              return Number(val) < Number(value);
            case 'lte':
              return Number(val) <= Number(value);
            case 'between':
              return valueStart && valueEnd
                ? val >= valueStart && val <= valueEnd
                : true;
            case 'empty':
              return val === '' || val === null || val === undefined;
            case 'notEmpty':
              return val !== '' && val !== null && val !== undefined;
            default:
              return true;
          }
        });
      }
  
      return filtered;
    },
  };
  
  // ==================== 操作符定义 ====================
  export const OPERATORS: Record<
    string,
    Array<{ value: string; label: string }>
  > = {
    text: [
      { value: 'eq', label: '等于' },
      { value: 'ne', label: '不等于' },
      { value: 'contains', label: '包含' },
      { value: 'notContains', label: '不包含' },
      { value: 'startsWith', label: '以...开头' },
      { value: 'endsWith', label: '以...结尾' },
      { value: 'empty', label: '为空' },
      { value: 'notEmpty', label: '不为空' },
    ],
    number: [
      { value: 'eq', label: '等于' },
      { value: 'ne', label: '不等于' },
      { value: 'gt', label: '大于' },
      { value: 'gte', label: '大于等于' },
      { value: 'lt', label: '小于' },
      { value: 'lte', label: '小于等于' },
      { value: 'between', label: '区间' },
    ],
    select: [
      { value: 'eq', label: '等于' },
      { value: 'ne', label: '不等于' },
      { value: 'in', label: '包含' },
      { value: 'notIn', label: '不包含' },
    ],
    date: [
      { value: 'eq', label: '等于' },
      { value: 'gt', label: '大于' },
      { value: 'gte', label: '大于等于' },
      { value: 'lt', label: '小于' },
      { value: 'lte', label: '小于等于' },
      { value: 'between', label: '区间' },
    ],
    'date-range': [{ value: 'between', label: '区间' }],
    boolean: [{ value: 'eq', label: '等于' }],
  };
  
  /**
   * 分组筛选器 - 复杂订单查询
   */
  export const groupFilterSchema: GroupFilterSchema = {
    fields: [
      {
        key: 'orderNo',
        label: '订单号',
        type: 'text',
      },
      {
        key: 'customerName',
        label: '客户名称',
        type: 'text',
      },
      {
        key: 'amount',
        label: '金额',
        type: 'number',
      },
      {
        key: 'status',
        label: '订单状态',
        type: 'select',
        options: [
          { label: '待支付', value: 'pending' },
          { label: '已支付', value: 'paid' },
          { label: '已发货', value: 'shipped' },
          { label: '已完成', value: 'completed' },
          { label: '已取消', value: 'cancelled' },
        ],
      },
      {
        key: 'priority',
        label: '优先级',
        type: 'select',
        options: [
          { label: '高', value: 'high' },
          { label: '中', value: 'medium' },
          { label: '低', value: 'low' },
        ],
      },
      {
        key: 'createdAt',
        label: '创建时间',
        type: 'date',
      },
      {
        key: 'isUrgent',
        label: '是否加急',
        type: 'boolean',
      },
    ],
  
    searchFn: async (groups) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
  
      const mockData = [
        {
          id: 1,
          orderNo: 'ORD-001',
          customerName: '张三',
          amount: 299.0,
          status: 'paid',
          priority: 'high',
          createdAt: '2024-01-15',
          isUrgent: true,
        },
        {
          id: 2,
          orderNo: 'ORD-002',
          customerName: '李四',
          amount: 1599.0,
          status: 'pending',
          priority: 'medium',
          createdAt: '2024-02-20',
          isUrgent: false,
        },
        {
          id: 3,
          orderNo: 'ORD-003',
          customerName: '王五',
          amount: 89.0,
          status: 'shipped',
          priority: 'low',
          createdAt: '2024-03-10',
          isUrgent: false,
        },
        {
          id: 4,
          orderNo: 'ORD-004',
          customerName: '赵六',
          amount: 459.0,
          status: 'completed',
          priority: 'high',
          createdAt: '2024-04-05',
          isUrgent: true,
        },
        {
          id: 5,
          orderNo: 'ORD-005',
          customerName: '孙七',
          amount: 799.0,
          status: 'paid',
          priority: 'medium',
          createdAt: '2024-05-12',
          isUrgent: false,
        },
        {
          id: 6,
          orderNo: 'ORD-006',
          customerName: '周八',
          amount: 1200.0,
          status: 'pending',
          priority: 'low',
          createdAt: '2024-06-18',
          isUrgent: false,
        },
        {
          id: 7,
          orderNo: 'ORD-007',
          customerName: '吴九',
          amount: 350.0,
          status: 'shipped',
          priority: 'high',
          createdAt: '2024-07-22',
          isUrgent: true,
        },
        {
          id: 8,
          orderNo: 'ORD-008',
          customerName: '郑十',
          amount: 680.0,
          status: 'cancelled',
          priority: 'low',
          createdAt: '2024-08-30',
          isUrgent: false,
        },
      ];
  
      // 如果没有条件，返回全部数据
      const hasValidCondition = groups.some((group) =>
        group.conditions.some((c) => c.field && c.operator)
      );
  
      if (!hasValidCondition) {
        return mockData;
      }
  
      let filtered = [...mockData];
  
      // 遍历每个组
      for (const group of groups) {
        const validConditions = group.conditions.filter(
          (c) => c.field && c.operator
        );
        if (validConditions.length === 0) continue;
  
        // 检查组内条件
        let groupMatched = false;
  
        if (group.logic === 'AND') {
          // AND：所有条件都满足
          groupMatched = filtered.some((item) => {
            return validConditions.every((cond) => evaluateCondition(item, cond));
          });
          if (groupMatched) {
            // 保留满足所有条件的项
            filtered = filtered.filter((item) =>
              validConditions.every((cond) => evaluateCondition(item, cond))
            );
          }
        } else {
          // OR：任一条件满足
          const matchedItems = filtered.filter((item) =>
            validConditions.some((cond) => evaluateCondition(item, cond))
          );
          filtered = matchedItems;
        }
      }
  
      return filtered;
    },
  };
  
  // 条件评估辅助函数
  function evaluateCondition(item: any, cond: any): boolean {
    const val = item[cond.field];
    const strVal = String(val).toLowerCase();
    const strValue = String(cond.value).toLowerCase();
  
    switch (cond.operator) {
      case 'eq':
        return val === cond.value;
      case 'ne':
        return val !== cond.value;
      case 'contains':
        return strVal.includes(strValue);
      case 'notContains':
        return !strVal.includes(strValue);
      case 'startsWith':
        return strVal.startsWith(strValue);
      case 'endsWith':
        return strVal.endsWith(strValue);
      case 'gt':
        return Number(val) > Number(cond.value);
      case 'gte':
        return Number(val) >= Number(cond.value);
      case 'lt':
        return Number(val) < Number(cond.value);
      case 'lte':
        return Number(val) <= Number(cond.value);
      case 'between':
        return cond.valueStart && cond.valueEnd
          ? val >= cond.valueStart && val <= cond.valueEnd
          : true;
      case 'empty':
        return val === '' || val === null || val === undefined;
      case 'notEmpty':
        return val !== '' && val !== null && val !== undefined;
      default:
        return true;
    }
  }
  
  /**
   * 保存筛选器 - 用户管理
   */
  export const savedFilterSchema: SavedFilterSchema = {
    fields: [
      {
        key: 'username',
        label: '用户名',
        type: 'text',
      },
      {
        key: 'email',
        label: '邮箱',
        type: 'text',
      },
      {
        key: 'age',
        label: '年龄',
        type: 'number',
      },
      {
        key: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: '激活', value: 'active' },
          { label: '禁用', value: 'inactive' },
          { label: '待审核', value: 'pending' },
        ],
      },
      {
        key: 'role',
        label: '角色',
        type: 'select',
        options: [
          { label: '管理员', value: 'admin' },
          { label: 'VIP 用户', value: 'vip' },
          { label: '普通用户', value: 'user' },
        ],
      },
      {
        key: 'createdAt',
        label: '注册时间',
        type: 'date',
      },
      {
        key: 'isActive',
        label: '是否激活',
        type: 'boolean',
      },
    ],
  
    storageKey: 'my_saved_filters',
  
    searchFn: async (conditions) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
  
      const mockData = [
        {
          id: 1,
          username: '张三',
          email: 'zhangsan@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-15',
          age: 28,
        },
        {
          id: 2,
          username: '李四',
          email: 'lisi@example.com',
          role: 'user',
          status: 'active',
          createdAt: '2024-02-20',
          age: 32,
        },
        {
          id: 3,
          username: '王五',
          email: 'wangwu@example.com',
          role: 'vip',
          status: 'pending',
          createdAt: '2024-03-10',
          age: 24,
        },
        {
          id: 4,
          username: '赵六',
          email: 'zhaoliu@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-04-05',
          age: 35,
        },
        {
          id: 5,
          username: '孙七',
          email: 'sunqi@example.com',
          role: 'vip',
          status: 'active',
          createdAt: '2024-05-12',
          age: 29,
        },
        {
          id: 6,
          username: '周八',
          email: 'zhouba@example.com',
          role: 'user',
          status: 'pending',
          createdAt: '2024-06-18',
          age: 22,
        },
        {
          id: 7,
          username: '吴九',
          email: 'wujiu@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-07-22',
          age: 41,
        },
        {
          id: 8,
          username: '郑十',
          email: 'zhengshi@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-08-30',
          age: 26,
        },
      ];
  
      let filtered = [...mockData];
  
      for (const cond of conditions) {
        if (!cond.field || !cond.operator) continue;
  
        const field = cond.field;
        const op = cond.operator;
        const value = cond.value;
        const valueStart = cond.valueStart;
        const valueEnd = cond.valueEnd;
  
        filtered = filtered.filter((item) => {
          const val = item[field as keyof typeof item];
          const strVal = String(val).toLowerCase();
          const strValue = String(value).toLowerCase();
  
          switch (op) {
            case 'eq':
              return val === value;
            case 'ne':
              return val !== value;
            case 'contains':
              return strVal.includes(strValue);
            case 'notContains':
              return !strVal.includes(strValue);
            case 'startsWith':
              return strVal.startsWith(strValue);
            case 'endsWith':
              return strVal.endsWith(strValue);
            case 'gt':
              return Number(val) > Number(value);
            case 'gte':
              return Number(val) >= Number(value);
            case 'lt':
              return Number(val) < Number(value);
            case 'lte':
              return Number(val) <= Number(value);
            case 'between':
              return valueStart && valueEnd
                ? val >= valueStart && val <= valueEnd
                : true;
            case 'empty':
              return val === '' || val === null || val === undefined;
            case 'notEmpty':
              return val !== '' && val !== null && val !== undefined;
            default:
              return true;
          }
        });
      }
  
      return filtered;
    },
  };
  
  /**
   * AI 智能筛选器配置
   */
  export const smartFilterSchema: SmartFilterSchema = {
    fields: [
      {
        key: 'username',
        label: '用户名',
        type: 'text',
        aliases: ['姓名', '用户', '名字'],
      },
      {
        key: 'email',
        label: '邮箱',
        type: 'text',
        aliases: ['邮件', '电子邮箱'],
      },
      {
        key: 'age',
        label: '年龄',
        type: 'number',
        aliases: ['岁数', '年纪'],
      },
      {
        key: 'status',
        label: '状态',
        type: 'select',
        aliases: ['账号状态'],
        options: [
          { label: '激活', value: 'active' },
          { label: '禁用', value: 'inactive' },
          { label: '待审核', value: 'pending' },
        ],
      },
      {
        key: 'role',
        label: '角色',
        type: 'select',
        aliases: ['身份', '权限'],
        options: [
          { label: '管理员', value: 'admin' },
          { label: 'VIP 用户', value: 'vip' },
          { label: '普通用户', value: 'user' },
        ],
      },
      {
        key: 'createdAt',
        label: '注册时间',
        type: 'date',
        aliases: ['注册日期', '创建时间'],
      },
      {
        key: 'isActive',
        label: '是否激活',
        type: 'boolean',
        aliases: ['激活状态', '已激活'],
      },
    ],
  
    examples: [
      '状态为激活的用户',
      '年龄大于25',
      'VIP用户',
      '注册时间大于2024-01-01',
      '激活状态的VIP用户',
      '用户名包含admin',
      '未激活的普通用户',
    ],
  
    placeholder: '输入自然语言，AI 将自动解析成筛选条件...',
  
    /**
     * AI 解析函数
     *
     * 这里演示如何接入 AI API（如 OpenAI / 国内大模型）
     * 实际使用时可以替换为真实的 API 调用
     */
    aiParseFn: async (text: string, fields: FilterField[]) => {
      const apiKey = 'sk-995f8e399acd433aab0e73b6afaee496';
      const workspaceId = 'ws-u8z960mqb5xpfxij';
  
      if (apiKey && workspaceId) {
        try {
          return await parseWithDomesticLLM(text, fields, {
            apiKey,
            workspaceId,
            region: 'cn-beijing',
            model: 'qwen-plus',
            temperature: 0.1,
          });
        } catch (error) {
          console.warn('通义千问调用失败，降级到本地解析：', error);
          return parseWithLocal(text, fields);
        }
      }
  
      // 未配置，使用本地解析
      console.warn(
        '未配置 VITE_TONGYI_API_KEY 或 VITE_TONGYI_WORKSPACE_ID，使用本地解析'
      );
      return parseWithLocal(text, fields);
    },
  
    searchFn: async (conditions) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
  
      const mockData = [
        {
          id: 1,
          username: '张三',
          email: 'zhangsan@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-15',
          age: 28,
          isActive: true,
        },
        {
          id: 2,
          username: '李四',
          email: 'lisi@example.com',
          role: 'user',
          status: 'active',
          createdAt: '2024-02-20',
          age: 32,
          isActive: true,
        },
        {
          id: 3,
          username: '王五',
          email: 'wangwu@example.com',
          role: 'vip',
          status: 'pending',
          createdAt: '2024-03-10',
          age: 24,
          isActive: false,
        },
        {
          id: 4,
          username: '赵六',
          email: 'zhaoliu@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-04-05',
          age: 35,
          isActive: false,
        },
        {
          id: 5,
          username: '孙七',
          email: 'sunqi@example.com',
          role: 'vip',
          status: 'active',
          createdAt: '2024-05-12',
          age: 29,
          isActive: true,
        },
        {
          id: 6,
          username: '周八',
          email: 'zhouba@example.com',
          role: 'user',
          status: 'pending',
          createdAt: '2024-06-18',
          age: 22,
          isActive: false,
        },
        {
          id: 7,
          username: '吴九',
          email: 'wujiu@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-07-22',
          age: 41,
          isActive: true,
        },
        {
          id: 8,
          username: '郑十',
          email: 'zhengshi@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-08-30',
          age: 26,
          isActive: false,
        },
      ];
  
      let filtered = [...mockData];
  
      for (const cond of conditions) {
        const field = cond.field;
        const op = cond.operator;
        const value = cond.value;
  
        filtered = filtered.filter((item) => {
          const val = item[field as keyof typeof item];
          const strVal = String(val).toLowerCase();
          const strValue = String(value).toLowerCase();
  
          switch (op) {
            case 'eq':
              return val === value;
            case 'ne':
              return val !== value;
            case 'contains':
              return strVal.includes(strValue);
            case 'startsWith':
              return strVal.startsWith(strValue);
            case 'endsWith':
              return strVal.endsWith(strValue);
            case 'gt':
              return Number(val) > Number(value);
            case 'gte':
              return Number(val) >= Number(value);
            case 'lt':
              return Number(val) < Number(value);
            case 'lte':
              return Number(val) <= Number(value);
            default:
              return true;
          }
        });
      }
  
      return filtered;
    },
  };
  /**
   * 构建 AI 系统提示词
   */
  function buildSystemPrompt(fields: FilterField[]): string {
    const fieldDesc = fields
      .map((f) => {
        const aliases =
          f.aliases && f.aliases.length > 0
            ? `（别名：${f.aliases.join('、')}）`
            : '';
        let optionsDesc = '';
        if (f.type === 'select' && f.options) {
          optionsDesc = `，可选值：${f.options.map((o) => o.label).join('、')}`;
        }
        if (f.type === 'boolean') {
          optionsDesc = '，可选值：是/否、真/假、激活/禁用';
        }
        if (f.type === 'date') {
          optionsDesc = '，格式：YYYY-MM-DD';
        }
        return `- ${f.label}${aliases}：类型 ${f.type}${optionsDesc}`;
      })
      .join('\n');
  
    return `
  你是一个智能筛选条件解析助手。用户会用自然语言描述筛选需求，你需要将其转换为结构化的筛选条件。
  
  可用字段：
  ${fieldDesc}
  
  支持的比较操作符：
  - 文本类型：等于、不等于、包含、以...开头、以...结尾
  - 数字类型：等于、不等于、大于、大于等于、小于、小于等于
  - 日期类型：等于、大于、大于等于、小于、小于等于
  - 枚举类型：等于、不等于
  - 布尔类型：等于
  
  输出格式要求：
  请以 JSON 格式返回解析结果，格式如下：
  {
    "conditions": [
      { 
        "field": "字段key", 
        "operator": "操作符", 
        "value": "解析出的值" 
      }
    ],
    "confidence": 85,
    "explain": "用中文简要说明你的解析逻辑"
  }
  
  注意事项：
  1. 操作符映射：大于→gt，大于等于→gte，小于→lt，小于等于→lte，等于→eq，不等于→ne，包含→contains
  2. 布尔类型：是/已/激活/开启 → true，否/未/禁用/关闭 → false
  3. 日期格式：YYYY-MM-DD
  4. 如果无法确定操作符，默认使用 contains（文本）或 eq（其他类型）
  `;
  }
  /**
   * 获取操作符的显示标签
   */
  function getOperatorLabel(operator: string): string {
    const map: Record<string, string> = {
      eq: '等于',
      ne: '不等于',
      gt: '大于',
      gte: '大于等于',
      lt: '小于',
      lte: '小于等于',
      contains: '包含',
      startsWith: '以...开头',
      endsWith: '以...结尾',
    };
    return map[operator] || operator;
  }
  
  /**
   * 解析 AI 响应
   */
  function parseAIResponse(
    data: any,
    fields: FilterField[]
  ): { conditions: ParsedCondition[]; confidence: number; explain: string } {
    try {
      let content = '';
  
      if (data.choices && data.choices[0]) {
        const choice = data.choices[0];
        if (choice.message && choice.message.content) {
          content = choice.message.content;
        } else if (choice.text) {
          content = choice.text;
        }
      } else if (data.content) {
        content = data.content;
      } else if (typeof data === 'string') {
        content = data;
      }
  
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);
  
      const conditions: ParsedCondition[] = [];
      const rawConditions = parsed.conditions || parsed.Conditions || [];
  
      for (const c of rawConditions) {
        const fieldKey = c.field || c.Field || c.key || c.Key;
        const field = fields.find((f) => f.label === fieldKey);
        if (!field) continue;
  
        const operator = c.operator || c.Operator || c.op || 'eq';
        const value =
          c.value !== undefined ? c.value : c.Value !== undefined ? c.Value : '';
  
        let parsedValue = value;
        let displayValue = String(value);
  
        if (field.type === 'boolean') {
          if (
            value === true ||
            value === 'true' ||
            value === '是' ||
            value === '已' ||
            value === '激活' ||
            value === '开启'
          ) {
            parsedValue = true;
            displayValue = '是';
          } else if (
            value === false ||
            value === 'false' ||
            value === '否' ||
            value === '未' ||
            value === '禁用' ||
            value === '关闭'
          ) {
            parsedValue = false;
            displayValue = '否';
          } else if (typeof value === 'string') {
            const lower = value.toLowerCase();
            if (['是', '已', '激活', '开启', 'true'].includes(lower)) {
              parsedValue = true;
              displayValue = '是';
            } else if (['否', '未', '禁用', '关闭', 'false'].includes(lower)) {
              parsedValue = false;
              displayValue = '否';
            }
          }
        } else if (field.type === 'number') {
          const num = Number(value);
          if (!isNaN(num)) {
            parsedValue = num;
            displayValue = String(num);
          }
        }
  
        conditions.push({
          field: field.key,
          fieldLabel: field.label,
          operator,
          operatorLabel: getOperatorLabel(operator),
          value: parsedValue,
          displayValue,
        });
      }
  
      const confidence = parsed.confidence || parsed.Confidence || 80;
      const explain =
        parsed.explain ||
        parsed.Explain ||
        parsed.说明 ||
        `解析到 ${conditions.length} 个筛选条件`;
  
      return { conditions, confidence, explain };
    } catch (error) {
      console.warn('解析 AI 响应失败：', error);
      return {
        conditions: [],
        confidence: 0,
        explain: '解析失败，请检查 AI 返回格式',
      };
    }
  }
  
  /**
   * 方案2：国内大模型解析（通用适配器）
   * 支持通义千问、文心一言、智谱 GLM 等
   */
  export async function parseWithDomesticLLM(
    text: string,
    fields: FilterField[],
    config: TongyiConfig
  ): Promise<{
    conditions: ParsedCondition[];
    confidence: number;
    explain: string;
  }> {
    const {
      apiKey,
      workspaceId,
      region = 'cn-beijing',
      model = 'qwen-plus',
      temperature = 0.1,
    } = config;
  
    if (!apiKey) {
      console.warn('未配置通义千问 API Key，使用本地解析');
      return parseWithLocal(text, fields);
    }
  
    if (!workspaceId) {
      console.warn('未配置 Workspace ID，使用本地解析');
      return parseWithLocal(text, fields);
    }
  
    try {
      const endpoint = `https://${workspaceId}.${region}.maas.aliyuncs.com/compatible-mode/v1/chat/completions`;
      // 通用请求格式（可根据具体平台调整）
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: buildSystemPrompt(fields) },
            { role: 'user', content: text },
          ],
          temperature,
        }),
      });
      if (!response.ok) {
        throw new Error(`大模型 API 请求失败：${response.status}`);
      }
  
      const data = await response.json();
      return parseAIResponse(data, fields);
    } catch (error) {
      console.warn('国内大模型调用失败：', error);
      // 降级到本地解析
      return parseWithLocal(text, fields);
    }
  }
  
  /**
   * 方案3：本地规则解析（无需 API，零成本）
   */
  export async function parseWithLocal(
    text: string,
    fields: FilterField[]
  ): Promise<{
    conditions: ParsedCondition[];
    confidence: number;
    explain: string;
  }> {
    // 模拟网络延迟（让体验更真实）
    await new Promise((resolve) => setTimeout(resolve, 300));
  
    const conditions: ParsedCondition[] = [];
  
    // 尝试匹配每个字段
    for (const field of fields) {
      const patterns = [field.label, field.key, ...(field.aliases || [])];
      let matchedPattern = '';
      let matchedIndex = -1;
  
      for (const pattern of patterns) {
        const idx = text.indexOf(pattern!);
        if (idx !== -1 && (matchedIndex === -1 || idx < matchedIndex)) {
          matchedIndex = idx;
          matchedPattern = pattern!;
        }
      }
  
      if (matchedIndex !== -1) {
        const afterField = text
          .substring(matchedIndex + matchedPattern.length)
          .trim();
  
        let operator = 'contains';
        let operatorLabel = '包含';
        let value = '';
        let displayValue = '';
  
        const opMap: Record<string, { value: string; label: string }> = {
          大于等于: { value: 'gte', label: '大于等于' },
          大于: { value: 'gt', label: '大于' },
          小于等于: { value: 'lte', label: '小于等于' },
          小于: { value: 'lt', label: '小于' },
          不等于: { value: 'ne', label: '不等于' },
          等于: { value: 'eq', label: '等于' },
          包含: { value: 'contains', label: '包含' },
          '以...开头': { value: 'startsWith', label: '以...开头' },
          '以...结尾': { value: 'endsWith', label: '以...结尾' },
        };
  
        let foundOp = false;
        for (const [key, op] of Object.entries(opMap)) {
          if (afterField.includes(key)) {
            operator = op.value;
            operatorLabel = op.label;
            const afterOp = afterField
              .substring(afterField.indexOf(key) + key.length)
              .trim();
            displayValue = afterOp.replace(/^[是为：: ]+/, '').trim();
            value = displayValue;
            foundOp = true;
            break;
          }
        }
  
        if (!foundOp) {
          displayValue = afterField.replace(/^[是为：: ]+/, '').trim();
          value = displayValue;
          operatorLabel = '等于';
        }
  
        if (value) {
          value = value.replace(/[，,。.、\s]+$/, '').trim();
          displayValue = value;
  
          if (field.type === 'number') {
            const num = Number(value);
            if (!isNaN(num)) {
              value = num as any;
              displayValue = String(num);
            }
          }
          if (field.type === 'boolean') {
            if (
              value.includes('是') ||
              value.includes('已') ||
              value.includes('激活')
            ) {
              value = true as any;
              displayValue = '是';
            } else if (
              value.includes('否') ||
              value.includes('未') ||
              value.includes('禁用')
            ) {
              value = false as any;
              displayValue = '否';
            }
          }
  
          conditions.push({
            field: field.key,
            fieldLabel: field.label,
            operator,
            operatorLabel,
            value,
            displayValue,
          });
        }
      }
    }
  
    // 如果没解析出条件，尝试简单分词
    if (conditions.length === 0) {
      const tokens = text.split(/[,，、\s]+/).filter((t) => t.trim());
      for (const token of tokens) {
        const field = fields.find(
          (f) =>
            f.label === token || f.key === token || f.aliases?.includes(token)
        );
        if (field) {
          conditions.push({
            field: field.key,
            fieldLabel: field.label,
            operator: 'contains',
            operatorLabel: '包含',
            value: token,
            displayValue: token,
          });
        }
      }
    }
  
    let confidence = 60;
    if (conditions.length > 0) {
      confidence = Math.min(60 + conditions.length * 10, 90);
      const allComplete = conditions.every(
        (c) => c.field && c.operator && c.value
      );
      if (allComplete) confidence = Math.min(confidence + 10, 90);
    }
  
    const explain =
      conditions.length > 0
        ? `识别到 ${conditions.length} 个筛选条件`
        : '未能识别有效的筛选条件';
  
    return { conditions, confidence, explain };
  }
  
  // ==================== 操作符定义 ====================
  export const SMARTOPERATORS = {
    text: [
      { value: 'contains', label: '包含' },
      { value: 'eq', label: '等于' },
      { value: 'startsWith', label: '以...开头' },
      { value: 'endsWith', label: '以...结尾' },
    ],
    number: [
      { value: 'eq', label: '等于' },
      { value: 'gt', label: '大于' },
      { value: 'gte', label: '大于等于' },
      { value: 'lt', label: '小于' },
      { value: 'lte', label: '小于等于' },
    ],
    select: [{ value: 'eq', label: '等于' }],
    date: [
      { value: 'eq', label: '等于' },
      { value: 'gt', label: '大于' },
      { value: 'gte', label: '大于等于' },
      { value: 'lt', label: '小于' },
      { value: 'lte', label: '小于等于' },
    ],
    boolean: [{ value: 'eq', label: '等于' }],
  };
  