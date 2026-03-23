/**
 * Cabinet Pulse 类型定义
 * 所有数据模型和接口的中央导出点
 */
export * from './agent-asset';
export * from './agent-config';
export * from './execution-log';
export * from './system-metrics';
export * from './daily-report';
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
    text?: string;
    filters?: Record<string, any>;
    sort?: {
        field: string;
        order: 'asc' | 'desc';
    };
    pagination?: {
        page: number;
        pageSize: number;
    };
    facets?: string[];
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
    start: number;
    end: number;
    granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';
}
/**
 * 分页选项
 */
export interface PaginationOptions {
    page: number;
    pageSize: number;
    total?: number;
}
/**
 * 排序选项
 */
export interface SortOptions {
    field: string;
    order: 'asc' | 'desc';
}
/**
 * 查询选项
 */
export interface QueryOptions {
    filters?: Record<string, any>;
    pagination?: PaginationOptions;
    sort?: SortOptions[];
    fields?: string[];
    includeTotal?: boolean;
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
//# sourceMappingURL=index.d.ts.map