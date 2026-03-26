/**
 * Cabinet Pulse 类型定义
 * 所有数据模型和接口的中央导出点
 */

// Agent资产相关类型
export * from './agent-asset';

// Agent配置相关类型
export * from './agent-config';

// 执行日志相关类型
export * from './execution-log';

// 系统指标相关类型
export * from './system-metrics';

// 日报相关类型
export * from './daily-report';

// 存储适配器接口
export * from './storage-adapter';

/**
 * 通用类型定义
 */

/**
 * 存储操作结果
 */
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    operationTime: number;
    affectedRows?: number;
    queryTime?: number;
    totalCount?: number;
    limit?: number;
    offset?: number;
    [key: string]: any; // 允许扩展字段
  };
}

/**
 * 批量操作结果
 */
export interface BulkResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
  metadata?: {
    totalTime: number;
    averageTimePerItem: number;
  };
}

/**
 * 搜索查询
 */
export interface SearchQuery {
  text?: string;                 // 全文搜索文本
  filters?: Record<string, any>; // 过滤条件
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
  facets?: string[];             // 分面字段
}

/**
 * 搜索结果
 */
export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: Record<string, Array<{
    value: string;
    count: number;
  }>>;
  queryTime: number;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * 时间范围
 */
export interface TimeRange {
  start: number;                 // 开始时间戳
  end: number;                   // 结束时间戳
  granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

/**
 * 分页选项
 */
export interface PaginationOptions {
  page: number;                  // 页码（从1开始）
  pageSize: number;              // 每页数量
  total?: number;                // 总数（可选）
}

/**
 * 排序选项
 */
export interface SortOptions {
  field: string;                 // 排序字段
  order: 'asc' | 'desc';        // 排序顺序
}

/**
 * 查询选项
 */
export interface QueryOptions {
  filters?: Record<string, any>; // 过滤条件
  pagination?: PaginationOptions; // 分页选项
  sort?: SortOptions[];          // 排序选项
  fields?: string[];             // 返回字段
  includeTotal?: boolean;        // 是否包含总数
}

/**
 * 通用响应包装器
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: number;
    requestId: string;
    processingTime: number;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}