// ==================== 基础筛选器类型定义 ====================
export interface FilterField {
    key: string;
    type:
      | 'input'
      | 'text'
      | 'number'
      | 'select'
      | 'date'
      | 'date-range'
      | 'switch'
      | 'boolean'
      | 'button-group';
    label?: string;
    placeholder?: string;
    inputType?: string;
    options?: Array<{ label: string; value: any }>;
    startPlaceholder?: string;
    endPlaceholder?: string;
    defaultValue?: any;
    hidden?: boolean | ((data: Record<string, any>) => boolean);
    aliases?: string[]; // 字段别名（如 "金额" → "价格"）
  }
  
  export interface FilterSchema {
    showSelected: Boolean;
    fields: FilterField[];
    searchFn: (params: Record<string, any>) => Promise<any[]>;
    layout?: 'inline' | 'vertical';
    initialData?: Record<string, any>;
    autoSearch?: boolean;
  }
  
  // ==================== 动态条件筛选器类型定义 ====================
  export interface FilterCondition {
    id: string;
    field: string;
    operator: string;
    value: any;
    valueStart?: string;
    valueEnd?: string;
    logic?: 'AND' | 'OR';
  }
  
  export interface DynamicFilterSchema {
    fields: FilterField[];
    searchFn: (conditions: FilterCondition[]) => Promise<any[]>;
  }
  
  // ==================== 分组筛选器类型定义 ====================
  export interface GroupFilterCondition {
    id: string;
    field: string;
    operator: string;
    value: any;
    valueStart?: string;
    valueEnd?: string;
  }
  
  export interface FilterGroup {
    id: string;
    logic: 'AND' | 'OR';
    conditions: GroupFilterCondition[];
  }
  
  export interface GroupFilterSchema {
    fields: FilterField[];
    searchFn: (groups: FilterGroup[]) => Promise<any[]>;
  }
  
  // ==================== 保存筛选器类型定义 ====================
  export interface SavedFilterData {
    id: string;
    name: string;
    conditions: FilterCondition[];
    conditionCount: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface SavedFilterSchema {
    fields: DynamicFilterSchema['fields'];
    searchFn: DynamicFilterSchema['searchFn'];
    storageKey?: string;
  }
  
  // ==================== 智能筛选器类型定义 ====================
  export interface ParsedCondition {
    field: string;
    fieldLabel: string | undefined;
    operator: string;
    operatorLabel: string;
    value: any;
    displayValue: string;
  }
  
  export interface SmartFilterSchema {
    fields: FilterField[];
    searchFn: (conditions: ParsedCondition[]) => Promise<any[]>;
    /** AI 解析函数（支持 OpenAI / 自定义 API） */
    aiParseFn?: (
      text: string,
      fields: FilterField[]
    ) => Promise<{
      conditions: ParsedCondition[];
      confidence: number;
      explain?: string;
    }>;
    examples?: string[];
    placeholder?: string;
  }
  
  /**
   * 通义千问 API 配置（阿里云百炼 MaaS 平台）
   */
  export interface TongyiConfig {
    /** API Key（从阿里云百炼控制台获取） */
    apiKey: string;
    /** Workspace ID（工作空间 ID） */
    workspaceId: string;
    /** 地域，默认 cn-beijing */
    region?: string;
    /** 模型名称，默认 qwen-plus */
    model?: string;
    /** 温度参数 0-1，默认 0.1 */
    temperature?: number;
  }
  