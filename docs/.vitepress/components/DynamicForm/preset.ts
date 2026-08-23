// docs/.vitepress/components/DynamicForm/preset.ts
import type {
  FormSchema,
  TableSchema,
  SearchSchema,
  CardSchema,
  TreeSchema,
} from './types';

/**
 * 用户注册表单 - 基础示例
 */
export const registerSchema: FormSchema = {
  title: '📝 用户注册',
  description: '请填写以下信息完成注册',
  submitText: '注册',
  resetText: '清空',

  fields: [
    {
      key: 'username',
      type: 'input',
      label: '用户名',
      placeholder: '请输入用户名',
      required: true,
      rules: [
        { required: true, message: '请输入用户名' },
        { min: 3, max: 20, message: '用户名长度 3-20 个字符' },
        {
          pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
          message: '用户名只能包含字母、数字、下划线或中文',
        },
      ],
    },
    {
      key: 'email',
      type: 'input',
      label: '邮箱',
      placeholder: '请输入邮箱地址',
      inputType: 'email',
      required: true,
      rules: [
        { required: true, message: '请输入邮箱' },
        {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: '请输入有效的邮箱地址',
        },
      ],
    },
    {
      key: 'password',
      type: 'input',
      label: '密码',
      placeholder: '请设置密码',
      inputType: 'password',
      required: true,
      rules: [
        { required: true, message: '请设置密码' },
        { min: 6, max: 20, message: '密码长度 6-20 个字符' },
      ],
    },
    {
      key: 'role',
      type: 'select',
      label: '用户类型',
      placeholder: '请选择',
      defaultValue: 'user',
      options: [
        { label: '普通用户', value: 'user' },
        { label: 'VIP 用户', value: 'vip' },
        { label: '管理员', value: 'admin' },
      ],
    },
  ],

  onSubmit: (data) => {
    return new Promise((resolve) => {
      console.log('📤 正在提交数据...', data);
      // 模拟网络延迟
      setTimeout(() => {
        // 模拟业务校验（如用户名是否已存在）
        if (data.username === 'admin') {
          reject(new Error('用户名 admin 已被占用'));
          return;
        }
        console.log('✅ 注册成功：', data);
        alert('🎉 提交成功！请查看控制台输出。');
        resolve(data);
      }, 1500);
    });
  },
};

/**
 * 复杂联动表单 - 展示抽象能力
 */
export const advancedSchema: FormSchema = {
  title: '🧩 复杂联动表单',
  description: '展示字段联动、条件显示、动态校验等高级能力',
  submitText: '提交',
  resetText: '重置',

  fields: [
    {
      key: 'name',
      type: 'input',
      label: '姓名',
      placeholder: '请输入姓名',
      required: true,
      rules: [{ required: true, message: '请输入姓名' }],
    },
    {
      key: 'productType',
      type: 'select',
      label: '产品类型',
      placeholder: '请选择产品类型',
      required: true,
      options: [
        { label: '实物商品', value: 'physical' },
        { label: '虚拟商品', value: 'virtual' },
        { label: '服务类', value: 'service' },
      ],
      rules: [{ required: true, message: '请选择产品类型' }],
    },
    {
      key: 'sku',
      type: 'input',
      label: 'SKU 编号',
      placeholder: '仅实物商品需要填写',
      help: '选中的产品类型可输入',
      required: true,
      hidden: (data) => data.productType !== 'physical',
      rules: [
        {
          required: true,
          message: '请输入 SKU 编号',
        },
        {
          validator: (value, data) => {
            if (data.productType !== 'physical') return true;
            return (
              /^[A-Z0-9-]+$/.test(value) || 'SKU 只能包含大写字母、数字和连字符'
            );
          },
        },
      ],
    },
    {
      key: 'deliveryType',
      type: 'select',
      label: '配送方式',
      placeholder: '请选择',
      hidden: (data) => data.productType !== 'physical',
      options: [
        { label: '快递配送', value: 'express' },
        { label: '同城配送', value: 'local' },
        { label: '自提', value: 'pickup' },
      ],
    },
    {
      key: 'isVip',
      type: 'switch',
      label: 'VIP 专享',
      defaultValue: false,
      help: '开启后显示 VIP 专享价格',
    },
    {
      key: 'vipPrice',
      type: 'number',
      label: 'VIP 专享价',
      placeholder: '请输入 VIP 价格',
      min: 0,
      step: 0.01,
      hidden: (data) => !data.isVip,
      rules: [
        {
          validator: (value, data) => {
            if (!data.isVip) return true;
            return (
              (value !== undefined && value !== null && value !== '') ||
              '请输入 VIP 专享价'
            );
          },
        },
        {
          validator: (value, data) => {
            if (!data.isVip) return true;
            return (
              (typeof value === 'number' && value >= 0) || '价格不能为负数'
            );
          },
        },
      ],
    },
    {
      key: 'tags',
      type: 'checkbox',
      label: '标签',
      defaultValue: [],
      options: [
        { label: '热门', value: 'hot' },
        { label: '新品', value: 'new' },
        { label: '推荐', value: 'recommend' },
      ],
    },
    {
      key: 'remark',
      type: 'textarea',
      label: '备注',
      placeholder: '请输入备注信息',
      rows: 3,
      maxlength: 200,
    },
  ],

  onSubmit: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📦 提交数据：', data);
        alert('提交成功！请查看控制台输出。');
        resolve();
      }, 800);
    });
  },
};

/**
 * 性能测试 - 大量字段
 */
export const performanceSchema: FormSchema = {
  title: '⚡ 性能测试（100+ 字段）',
  description: '渲染 100 个字段，测试表单渲染性能',
  submitText: '提交',
  resetText: '重置',

  fields: (() => {
    const fields: any[] = [];
    for (let i = 1; i <= 100; i++) {
      fields.push({
        key: `field_${i}`,
        type: i % 3 === 0 ? 'select' : 'input',
        label: `字段 ${i}`,
        placeholder: `请输入内容 ${i}`,
        options:
          i % 3 === 0
            ? [
                { label: '选项 A', value: 'a' },
                { label: '选项 B', value: 'b' },
                { label: '选项 C', value: 'c' },
              ]
            : undefined,
      });
    }
    return fields;
  })(),
};

/**
 * 动态列表示例 - 可增删的地址列表
 */
export const dynamicListSchema: FormSchema = {
  title: '📋 动态列表',
  description: '支持动态新增/删除表单项，适合需要收集多组数据的场景',
  submitText: '提交',
  resetText: '重置',

  fields: [
    {
      key: 'name',
      type: 'input',
      label: '姓名',
      placeholder: '请输入姓名',
      required: true,
      rules: [{ required: true, message: '请输入姓名' }],
    },
    {
      key: 'addresses',
      type: 'dynamic-list', // 关键：标记为动态列表
      label: '收货地址',
      help: '可添加多个地址，至少保留一个',
      // required: true,
      dynamicConfig: {
        enabled: true,
        minItems: 1,
        maxItems: 5,
        addText: '＋ 添加地址',
        removeText: '删除此地址',
        initialItems: 1,
        // 每个地址条目的字段模板
        itemSchema: [
          {
            key: 'province',
            type: 'select',
            label: '省份',
            required: true,
            placeholder: '请选择省份',
            options: [
              { label: '北京市', value: 'beijing' },
              { label: '上海市', value: 'shanghai' },
              { label: '广东省', value: 'guangdong' },
              { label: '浙江省', value: 'zhejiang' },
              { label: '江苏省', value: 'jiangsu' },
            ],
            rules: [{ required: true, message: '请选择省份' }],
          },
          {
            key: 'city',
            type: 'input',
            label: '城市',
            required: true,
            placeholder: '请输入城市名称',
            rules: [{ required: true, message: '请输入城市' }],
          },
          {
            key: 'address',
            type: 'textarea',
            label: '详细地址',
            placeholder: '请输入详细地址',
            required: true,
            rows: 2,
            rules: [{ required: true, message: '请输入详细地址' }],
          },
          {
            key: 'isDefault',
            type: 'switch',
            label: '设为默认地址',
            defaultValue: false,
          },
        ],
      },
    },
    {
      key: 'remark',
      type: 'textarea',
      label: '备注',
      placeholder: '可选的备注信息',
      rows: 2,
    },
  ],

  onSubmit: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📦 提交数据（含动态列表）：', data);
        alert('提交成功！请查看控制台输出。');
        resolve();
      }, 800);
    });
  },

  onReset: () => {
    console.log('🔄 已重置动态列表表单');
  },
};

/**
 * 主从表单示例 - 订单创建（主表单 + 订单明细动态列表）
 * 这是企业后台最核心的业务模式
 */
export const masterDetailSchema: FormSchema = {
  title: '📦 创建订单',
  description: '主表单信息 + 订单明细（可增删）',
  submitText: '提交订单',
  resetText: '重置',

  fields: [
    // ============ 主表单字段 ============
    {
      key: 'orderNo',
      type: 'input',
      label: '订单编号',
      placeholder: '自动生成',
      disabled: true,
      defaultValue: `ORD-${Date.now().toString().slice(-6)}`,
      help: '系统自动生成',
    },
    {
      key: 'customerName',
      type: 'input',
      label: '客户名称',
      placeholder: '请输入客户名称',
      required: true,
      rules: [{ required: true, message: '请输入客户名称' }],
    },
    {
      key: 'customerPhone',
      type: 'input',
      label: '联系电话',
      placeholder: '请输入联系电话',
      inputType: 'tel',
      rules: [
        {
          pattern: /^1[3-9]\d{9}$/,
          message: '请输入正确的手机号',
        },
      ],
    },
    {
      key: 'customerAddress',
      type: 'input',
      label: '收货地址',
      placeholder: '请输入收货地址',
    },
    {
      key: 'orderDate',
      type: 'input',
      label: '下单日期',
      disabled: true,
      defaultValue: new Date().toLocaleDateString('zh-CN'),
    },
    {
      key: 'remark',
      type: 'textarea',
      label: '备注',
      placeholder: '可选备注信息',
      rows: 2,
    },

    // ============ 嵌套动态列表（订单明细） ============
    {
      key: 'items',
      type: 'dynamic-list',
      label: '订单明细',
      help: '可添加多个商品，至少保留一项',
      required: true,
      dynamicConfig: {
        enabled: true,
        minItems: 1,
        maxItems: 10,
        addText: '＋ 添加商品',
        removeText: '删除',
        initialItems: 1,
        itemSchema: [
          {
            key: 'productName',
            type: 'input',
            label: '商品名称',
            placeholder: '请输入商品名称',
            required: true,
            rules: [{ required: true, message: '请输入商品名称' }],
          },
          {
            key: 'price',
            type: 'number',
            label: '单价',
            placeholder: '0.00',
            min: 0,
            step: 0.01,
            required: true,
            rules: [
              { required: true, message: '请输入单价' },
              {
                validator: (value: any) => {
                  return (
                    (typeof value === 'number' && value > 0) || '单价必须大于 0'
                  );
                },
              },
            ],
          },
          {
            key: 'quantity',
            type: 'number',
            label: '数量',
            placeholder: '1',
            min: 1,
            step: 1,
            required: true,
            defaultValue: 1,
            rules: [
              { required: true, message: '请输入数量' },
              {
                validator: (value: any) => {
                  return (
                    (typeof value === 'number' && value >= 1) || '数量至少为 1'
                  );
                },
              },
            ],
          },
          {
            key: 'amount',
            type: 'input',
            label: '小计',
            disabled: true,
            help: '单价 × 数量 自动计算',
            // 联动计算：监听 price 和 quantity 变化自动计算小计
            watch: [
              {
                field: 'price',
                handler: (val: number, data: Record<string, any>) => {
                  if (val !== undefined && data.quantity !== undefined) {
                    data.amount = Number((val * data.quantity).toFixed(2));
                  } else {
                    data.amount = 0;
                  }
                },
              },
              {
                field: 'quantity',
                handler: (val: number, data: Record<string, any>) => {
                  if (val !== undefined && data.price !== undefined) {
                    data.amount = Number((data.price * val).toFixed(2));
                  } else {
                    data.amount = 0;
                  }
                },
              },
            ],
          },
        ],
      },
    },

    // ============ 汇总字段（自动计算总金额） ============
    {
      key: 'totalAmount',
      type: 'input',
      label: '订单总金额',
      disabled: true,
      placeholder: '0.00',
      help: '自动计算所有明细小计之和',
    },
  ],

  onSubmit: (data: Record<string, any>) => {
    console.log('📦 订单提交数据：', data);
    return new Promise((resolve) => {
      setTimeout(() => {
        const total = data.totalAmount || 0;
        alert(
          `✅ 订单提交成功！\n订单编号：${data.orderNo}\n客户：${
            data.customerName
          }\n总金额：¥${total.toFixed ? total.toFixed(2) : total}`
        );
        resolve(data);
      }, 1000);
    });
  },

  onReset: () => {
    console.log('🔄 已重置订单表单');
  },
};

/**
 * 分步表单示例 - 商品发布向导
 * 三步完成商品信息填写
 */
export const stepFormSchema: FormSchema = {
  title: '📋 商品发布向导',
  description: '分三步完成商品信息填写，每步独立校验',
  submitText: '发布商品',
  resetText: '重新填写',

  // 步骤配置
  steps: [
    {
      key: 'step1',
      title: '基本信息',
      icon: '📝',
      description: '商品名称、分类、品牌',
    },
    {
      key: 'step2',
      title: '规格参数',
      icon: '⚙️',
      description: '价格、库存、规格',
    },
    {
      key: 'step3',
      title: '图片与发布',
      icon: '🚀',
      description: '上传图片、设置发布',
    },
  ],

  fields: [
    // ============ Step 1: 基本信息 ============
    {
      key: 'name',
      type: 'input',
      label: '商品名称',
      placeholder: '请输入商品名称',
      required: true,
      step: 'step1',
      rules: [
        { required: true, message: '请输入商品名称' },
        { min: 2, max: 50, message: '商品名称 2-50 个字符' },
      ],
    },
    {
      key: 'category',
      type: 'select',
      label: '商品分类',
      placeholder: '请选择分类',
      required: true,
      step: 'step1',
      options: [
        { label: '📱 电子产品', value: 'elec' },
        { label: '👔 服装服饰', value: 'cloth' },
        { label: '🍜 食品饮料', value: 'food' },
        { label: '📚 图书文具', value: 'book' },
      ],
      rules: [{ required: true, message: '请选择商品分类' }],
    },
    {
      key: 'brand',
      type: 'input',
      label: '品牌',
      placeholder: '请输入品牌名称',
      step: 'step1',
    },

    // ============ Step 2: 规格参数 ============
    {
      key: 'price',
      type: 'number',
      label: '价格',
      placeholder: '0.00',
      min: 0,
      step: 0.01,
      required: true,
      step: 'step2',
      rules: [
        { required: true, message: '请输入价格' },
        { validator: (v) => v > 0 || '价格必须大于 0' },
      ],
    },
    {
      key: 'stock',
      type: 'number',
      label: '库存',
      placeholder: '0',
      min: 0,
      step: 1,
      required: true,
      step: 'step2',
      rules: [
        { required: true, message: '请输入库存' },
        { validator: (v) => v >= 0 || '库存不能为负数' },
      ],
    },
    // 动态列表：规格参数
    {
      key: 'specs',
      type: 'dynamic-list',
      label: '规格参数',
      step: 'step2',
      help: '可添加多个规格（如颜色、尺寸等）',
      dynamicConfig: {
        enabled: true,
        minItems: 0,
        maxItems: 10,
        addText: '＋ 添加规格',
        removeText: '删除',
        initialItems: 0,
        itemSchema: [
          {
            key: 'specName',
            type: 'input',
            label: '规格名称',
            placeholder: '如：颜色',
            required: true,
            rules: [{ required: true, message: '请输入规格名称' }],
          },
          {
            key: 'specValue',
            type: 'input',
            label: '规格值',
            placeholder: '如：红色、大号',
            required: true,
            rules: [{ required: true, message: '请输入规格值' }],
          },
        ],
      },
    },

    // ============ Step 3: 图片与发布 ============
    {
      key: 'images',
      type: 'input',
      label: '商品图片',
      placeholder: '请输入图片 URL（演示）',
      step: 'step3',
      help: '支持 jpg/png 格式，多个 URL 用逗号分隔',
    },
    {
      key: 'isPublished',
      type: 'switch',
      label: '立即发布',
      defaultValue: true,
      step: 'step3',
      help: '开启后商品将立即上架',
    },
    {
      key: 'publishDate',
      type: 'input',
      label: '发布时间',
      disabled: true,
      step: 'step3',
      defaultValue: new Date().toLocaleString('zh-CN'),
    },
  ],

  onSubmit: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('🚀 商品发布数据：', data);
        alert(
          `✅ 商品发布成功！\n\n商品名称：${data.name}\n分类：${
            data.category
          }\n价格：¥${data.price}\n库存：${data.stock}\n规格数：${
            data.specs?.length || 0
          } 项\n状态：${data.isPublished ? '已发布' : '草稿'}`
        );
        resolve(data);
      }, 1200);
    });
  },

  onReset: () => {
    console.log('🔄 已重置商品发布表单');
  },
};

/**
 * 表格编辑表单 - 商品库存管理
 */
export const tableEditSchema: TableSchema = {
  columns: [
    {
      key: 'name',
      label: '商品名称',
      type: 'input',
      required: true,
      placeholder: '请输入商品名称',
      rules: [
        { required: true, message: '商品名称不能为空' },
        { min: 2, max: 20, message: '商品名称 2-20 个字符' },
      ],
    },
    {
      key: 'category',
      label: '分类',
      type: 'select',
      required: true,
      placeholder: '请选择分类',
      options: [
        { label: '电子产品', value: 'elec' },
        { label: '服装服饰', value: 'cloth' },
        { label: '食品饮料', value: 'food' },
        { label: '图书文具', value: 'book' },
      ],
      rules: [{ required: true, message: '请选择分类' }],
    },
    {
      key: 'price',
      label: '单价',
      type: 'number',
      required: true,
      placeholder: '0.00',
      rules: [
        { required: true, message: '请输入单价' },
        { validator: (v: any) => v > 0 || '单价必须大于 0' },
      ],
    },
    {
      key: 'stock',
      label: '库存',
      type: 'number',
      required: true,
      placeholder: '0',
      rules: [
        { required: true, message: '请输入库存' },
        { validator: (v: any) => v >= 0 || '库存不能为负数' },
      ],
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      required: true,
      options: [
        { label: '上架', value: 'active' },
        { label: '下架', value: 'inactive' },
        { label: '待审核', value: 'pending' },
      ],
      rules: [{ required: true, message: '请选择状态' }],
    },
  ],
  addText: '＋ 添加商品',
  submitText: '📦 保存所有商品',
  resetText: '🔄 重置',

  // 初始数据（示例）
  data: [
    {
      name: 'iPhone 15',
      category: 'elec',
      price: 5999,
      stock: 100,
      status: 'active',
    },
    {
      name: 'MacBook Pro',
      category: 'elec',
      price: 12999,
      stock: 50,
      status: 'active',
    },
    {
      name: 'AirPods Pro',
      category: 'elec',
      price: 1899,
      stock: 200,
      status: 'active',
    },
  ],

  onSave: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📦 保存商品数据：', data);
        alert(`✅ 成功保存 ${data.length} 件商品数据！`);
        resolve();
      }, 800);
    });
  },

  onReset: () => {
    console.log('🔄 已重置表格数据');
  },
};
/**
 * 搜索表单 - 用户管理
 */
export const searchSchema: SearchSchema = {
  // 搜索字段
  fields: [
    {
      key: 'keyword',
      type: 'input',
      label: '关键词',
      placeholder: '用户名 / 手机号 / 邮箱',
      autoSearch: false,
    },
    {
      key: 'status',
      type: 'select',
      label: '状态',
      placeholder: '全部状态',
      autoSearch: false,
      options: [
        { label: '激活', value: 'active' },
        { label: '禁用', value: 'inactive' },
        { label: '待审核', value: 'pending' },
      ],
    },
    {
      key: 'role',
      type: 'select',
      label: '角色',
      placeholder: '全部角色',
      autoSearch: false,
      options: [
        { label: '管理员', value: 'admin' },
        { label: '普通用户', value: 'user' },
        { label: 'VIP 用户', value: 'vip' },
      ],
    },
    {
      key: 'dateRange',
      type: 'date-range',
      label: '注册时间',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      autoSearch: false,
      more: true, // 在"更多"中显示
    },
  ],

  // 结果列
  resultColumns: [
    { key: 'id', label: 'ID' },
    { key: 'username', label: '用户名' },
    { key: 'email', label: '邮箱' },
    {
      key: 'role',
      label: '角色',
      render: (val: string) =>
        val === 'admin'
          ? '👑 管理员'
          : val === 'vip'
          ? '⭐ VIP'
          : '👤 普通用户',
    },
    { key: 'status', label: '状态', type: 'status' },
    { key: 'createdAt', label: '注册时间' },
  ],

  // 状态映射
  statusMap: {
    active: '激活',
    inactive: '禁用',
    pending: '待审核',
  },

  // 每页条数
  pageSize: 5,
  pageSizeOptions: [5, 10, 20, 50],

  // 显示"展开更多"按钮
  showToggle: true,

  // 搜索函数（模拟后端 API）
  searchFn: async (params: Record<string, any>) => {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 600));

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

    // 日期范围过滤（模拟）
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

    return filtered;
  },
};

/**
 * 卡片表单示例 - 个人设置
 */
export const cardSchema: CardSchema = {
  title: '👤 个人设置',
  description: '分模块管理个人信息',
  submitText: '保存设置',
  resetText: '重置',

  sections: [
    // ============ 卡片一：基本信息 ============
    {
      title: '基本信息',
      icon: '📝',
      required: true,
      fields: [
        {
          key: 'avatar',
          type: 'input',
          label: '头像 URL',
          placeholder: '请输入头像图片链接',
          help: '支持 jpg/png 格式',
        },
        {
          key: 'nickname',
          type: 'input',
          label: '昵称',
          placeholder: '请输入昵称',
          required: true,
          rules: [
            { required: true, message: '请输入昵称' },
            { min: 2, max: 12, message: '昵称 2-12 个字符' },
          ],
        },
        {
          key: 'bio',
          type: 'textarea',
          label: '个人简介',
          placeholder: '一句话介绍自己',
          rows: 2,
          maxlength: 100,
          help: '不超过 100 个字符',
        },
        {
          key: 'gender',
          type: 'select',
          label: '性别',
          placeholder: '请选择',
          options: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' },
            { label: '保密', value: 'secret' },
          ],
        },
      ],
    },

    // ============ 卡片二：联系方式 ============
    {
      title: '联系方式',
      icon: '📞',
      required: true,
      fields: [
        {
          key: 'email',
          type: 'input',
          label: '邮箱',
          placeholder: '请输入邮箱地址',
          required: true,
          inputType: 'email',
          rules: [
            { required: true, message: '请输入邮箱' },
            {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: '请输入有效的邮箱地址',
            },
          ],
        },
        {
          key: 'phone',
          type: 'input',
          label: '手机号',
          placeholder: '请输入手机号',
          inputType: 'tel',
          rules: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }],
        },
        {
          key: 'wechat',
          type: 'input',
          label: '微信号',
          placeholder: '请输入微信号',
        },
      ],
    },

    // ============ 卡片三：偏好设置 ============
    {
      title: '偏好设置',
      icon: '⚙️',
      badge: '可选',
      fields: [
        {
          key: 'theme',
          type: 'select',
          label: '主题色',
          placeholder: '请选择主题',
          options: [
            { label: '🌞 浅色', value: 'light' },
            { label: '🌙 深色', value: 'dark' },
            { label: '💜 紫色', value: 'purple' },
          ],
        },
        {
          key: 'language',
          type: 'select',
          label: '语言',
          placeholder: '请选择语言',
          options: [
            { label: '简体中文', value: 'zh-CN' },
            { label: 'English', value: 'en-US' },
            { label: '日本語', value: 'ja-JP' },
          ],
        },
        {
          key: 'notifications',
          type: 'switch',
          label: '开启通知',
          defaultValue: true,
          help: '开启后接收系统消息推送',
        },
        {
          key: 'autoSave',
          type: 'switch',
          label: '自动保存',
          defaultValue: true,
          help: '编辑内容自动保存到草稿箱',
        },
      ],
    },

    // ============ 卡片四：安全设置 ============
    {
      title: '安全设置',
      icon: '🔒',
      badge: '重要',
      required: true,
      fields: [
        {
          key: 'oldPassword',
          type: 'input',
          label: '当前密码',
          placeholder: '请输入当前密码',
          inputType: 'password',
          required: true,
          rules: [{ required: true, message: '请输入当前密码' }],
        },
        {
          key: 'newPassword',
          type: 'input',
          label: '新密码',
          placeholder: '请设置新密码',
          inputType: 'password',
          rules: [{ min: 6, max: 20, message: '密码长度 6-20 个字符' }],
        },
        {
          key: 'confirmPassword',
          type: 'input',
          label: '确认新密码',
          placeholder: '请再次输入新密码',
          inputType: 'password',
          rules: [
            {
              validator: (value: any, data: Record<string, any>) => {
                if (!value && !data.newPassword) return true;
                if (value !== data.newPassword) return '两次输入的密码不一致';
                return true;
              },
            },
          ],
        },
      ],
    },
  ],

  onSubmit: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('💾 保存个人设置：', data);
        alert('✅ 个人设置保存成功！');
        resolve(data);
      }, 1000);
    });
  },

  onReset: () => {
    console.log('🔄 已重置个人设置');
  },
};

/**
 * 树形表单示例 - 商品分类管理
 */
export const treeSchema: TreeSchema = {
  title: '📂 商品分类管理',
  description: '支持多级分类的增删改、排序和展开/收起',
  submitText: '保存分类',
  resetText: '重置',

  fields: [
    {
      key: 'name',
      type: 'input',
      label: '分类名称',
      placeholder: '请输入分类名称',
      required: true,
      rules: [
        { required: true, message: '请输入分类名称' },
        { min: 2, max: 20, message: '分类名称 2-20 个字符' },
      ],
    },
    {
      key: 'sort',
      type: 'number',
      label: '排序',
      placeholder: '0',
      min: 0,
      defaultValue: 0,
    },
    {
      key: 'status',
      type: 'select',
      label: '状态',
      defaultValue: 'active',
      options: [
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'disabled' },
      ],
    },
  ],

  data: [
    {
      id: '1',
      data: { name: '电子产品', sort: 1, status: 'active' },
      expanded: true,
      children: [
        {
          id: '1-1',
          data: { name: '手机', sort: 1, status: 'active' },
          expanded: true,
          children: [
            {
              id: '1-1-1',
              data: { name: '智能手机', sort: 1, status: 'active' },
            },
            {
              id: '1-1-2',
              data: { name: '功能机', sort: 2, status: 'disabled' },
            },
          ],
        },
        {
          id: '1-2',
          data: { name: '电脑', sort: 2, status: 'active' },
          children: [
            {
              id: '1-2-1',
              data: { name: '笔记本', sort: 1, status: 'active' },
            },
            {
              id: '1-2-2',
              data: { name: '台式机', sort: 2, status: 'active' },
            },
          ],
        },
      ],
    },
    {
      id: '2',
      data: { name: '服装服饰', sort: 2, status: 'active' },
      expanded: true,
      children: [
        { id: '2-1', data: { name: '男装', sort: 1, status: 'active' } },
        { id: '2-2', data: { name: '女装', sort: 2, status: 'active' } },
        { id: '2-3', data: { name: '童装', sort: 3, status: 'disabled' } },
      ],
    },
    {
      id: '3',
      data: { name: '食品饮料', sort: 3, status: 'active' },
    },
  ],

  onSubmit: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📂 保存分类数据：', data);
        alert('✅ 分类保存成功！');
        resolve(data);
      }, 800);
    });
  },

  onReset: () => {
    console.log('🔄 已重置分类数据');
  },
};
