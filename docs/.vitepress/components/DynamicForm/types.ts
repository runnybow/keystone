// docs/.vitepress/components/DynamicForm/types.ts

/**
 * 字段校验规则
 */
export interface ValidationRule {
  required?: boolean;
  message?: string;
  pattern?: RegExp;
  min?: number;
  max?: number;
  validator?: (value: any, formData: Record<string, any>) => boolean | string;
}

/**
 * 字段配置
 */
export interface FieldConfig {
  key: string;
  type:
    | 'input'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'switch'
    | 'textarea'
    | 'number'
    | 'date'
    | 'custom'
    | 'dynamic-list';
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  help?: string;
  hidden?: boolean | ((formData: Record<string, any>) => boolean);
  disabled?: boolean | ((formData: Record<string, any>) => boolean);
  // 新增：动态列表配置
  dynamicConfig?: DynamicListConfig;

  // input 特有
  inputType?: 'text' | 'password' | 'email' | 'tel' | 'url';
  maxlength?: number;

  // select / radio 特有
  options?: Array<{ label: string; value: any; disabled?: boolean }>;
  optionKey?: string; // 如果 options 是对象数组，指定 value 字段名
  optionLabel?: string; // 如果 options 是对象数组，指定 label 字段名

  // textarea 特有
  rows?: number;

  // number 特有
  min?: number;
  max?: number;
  step?: string;

  // 自定义组件
  component?: any;
  componentProps?: Record<string, any>;

  // 校验
  rules?: ValidationRule[];

  // 联动：依赖其他字段变化
  watch?: Array<{
    field: string;
    handler: (value: any, formData: Record<string, any>) => void;
  }>;

  // 自定义渲染
  render?: (
    formData: Record<string, any>,
    update: (key: string, value: any) => void
  ) => any;
}

/**
 * 表单配置 Schema
 */
export interface FormSchema {
  fields: FieldConfig[];
  title?: string;
  description?: string;
  submitText?: string;
  resetText?: string;
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;
  onReset?: () => void;
  /** 分步配置（如果存在，启用分步模式） */
  steps?: StepConfig[];

  /** 当前步骤（外部控制） */
  currentStep?: number;
}

/**
 * 表单状态
 */
export interface FormState {
  data: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  submitting: boolean;
}

/**
 * 动态列表配置
 */
export interface DynamicListConfig {
  /** 是否启用动态列表 */
  enabled: boolean;
  /** 最小条目数 */
  minItems?: number;
  /** 最大条目数 */
  maxItems?: number;
  /** 添加按钮文本 */
  addText?: string;
  /** 删除按钮文本 */
  removeText?: string;
  /** 字段模板（新增一行时的默认配置） */
  itemSchema: FieldConfig[];
  /** 初始条目数（默认 1） */
  initialItems?: number;
}

/**
 * 分步配置
 */
export interface StepConfig {
  key: string;
  title: string;
  icon?: string;
  description?: string;
  /** 该步骤包含的字段 key 列表（可选，用于自动分配） */
  fields?: string[];
}

// ==================== 可编辑表格表单 ====================
export interface ColumnConfig {
  key: string;
  label: string;
  type: 'input' | 'number' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  rules?: Array<{
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    validator?: (value: any, row: Record<string, any>) => boolean | string;
    message?: string;
  }>;
}

export interface TableSchema {
  columns: ColumnConfig[];
  data?: Record<string, any>[];
  addText?: string;
  submitText?: string;
  resetText?: string;
  onSave?: (data: Record<string, any>[]) => void | Promise<void>;
  onReset?: () => void;
}

// ==================== 搜索表单 ====================
export interface SearchField {
  key: string;
  type: 'input' | 'text' | 'select' | 'date-range' | 'switch';
  label: string;
  placeholder?: string;
  inputType?: string;
  options?: Array<{ label: string; value: any }>;
  startPlaceholder?: string;
  endPlaceholder?: string;
  defaultValue?: any;
  autoSearch?: boolean; // 是否自动触发搜索
  hidden?: boolean | ((data: Record<string, any>) => boolean);
  more?: boolean; // 是否在"更多"中显示
}

export interface ResultColumn {
  key: string;
  label: string;
  type?: 'text' | 'status' | 'date' | 'number';
  render?: (value: any, row: Record<string, any>) => string;
}

export interface SearchSchema {
  fields: SearchField[];
  resultColumns: ResultColumn[];
  searchFn: (params: Record<string, any>) => Promise<any[]>;
  pageSize?: number;
  pageSizeOptions?: number[];
  showToggle?: boolean;
  initialData?: Record<string, any>;
  statusMap?: Record<string, string>;
}

// ==================== 卡片表单 ====================
/**
 * 卡片分组配置
 */
export interface CardSection {
  /** 卡片标题 */
  title: string;
  /** 卡片图标（可选） */
  icon?: string;
  /** 是否必填（显示标记） */
  required?: boolean;
  /** 徽章文本（可选） */
  badge?: string;
  /** 卡片内的字段列表 */
  fields: FieldConfig[];
  /** 是否默认折叠（可选） */
  defaultCollapsed?: boolean;
}

/**
 * 卡片表单 Schema
 */
export interface CardSchema {
  /** 表单标题 */
  title?: string;
  /** 表单描述 */
  description?: string;
  /** 卡片分组列表 */
  sections: CardSection[];
  /** 提交按钮文本 */
  submitText?: string;
  /** 重置按钮文本 */
  resetText?: string;
  /** 提交回调 */
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;
  /** 重置回调 */
  onReset?: () => void;
}

// ==================== 树形表单 ====================
/**
 * 树形节点数据
 */
export interface TreeNodeData {
  id: string;
  data: Record<string, any>;
  children?: TreeNodeData[];
  expanded?: boolean;
}

/**
 * 树形表单 Schema
 */
export interface TreeSchema {
  /** 表单标题 */
  title?: string;
  /** 表单描述 */
  description?: string;
  /** 节点字段配置 */
  fields: FieldConfig[];
  /** 初始数据 */
  data?: TreeNodeData[];
  /** 提交按钮文本 */
  submitText?: string;
  /** 重置按钮文本 */
  resetText?: string;
  /** 提交回调 */
  onSubmit?: (data: TreeNodeData[]) => void | Promise<void>;
  /** 重置回调 */
  onReset?: () => void;
}
