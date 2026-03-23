/**
 * ExecutionLog - 执行日志实体
 * 记录工作流执行过程、性能指标和错误信息
 */
/**
 * 执行类型枚举
 */
export declare enum ExecutionType {
    ARCHIVE = "archive",// 归档执行
    RESTORE = "restore",// 恢复执行
    REPORT = "report",// 报告生成
    CLEANUP = "cleanup",// 清理执行
    VALIDATION = "validation",// 验证执行
    MIGRATION = "migration"
}
/**
 * 执行状态枚举
 */
export declare enum ExecutionStatus {
    PENDING = "pending",// 待执行
    RUNNING = "running",// 执行中
    COMPLETED = "completed",// 已完成
    FAILED = "failed",// 失败
    CANCELLED = "cancelled",// 已取消
    TIMEOUT = "timeout"
}
/**
 * 触发方式枚举
 */
export declare enum TriggerType {
    SCHEDULE = "schedule",// 定时触发
    MANUAL = "manual",// 手动触发
    EVENT = "event",// 事件触发
    API = "api",// API触发
    TEST = "test"
}
/**
 * 内存指标
 */
export interface MemoryMetrics {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    rss: number;
}
/**
 * 失败资产信息
 */
export interface FailedAsset {
    assetId: string;
    agentId: string;
    error: string;
    retryCount: number;
    timestamp: number;
}
/**
 * 警告信息
 */
export interface Warning {
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
    context?: Record<string, any>;
}
/**
 * 执行错误
 */
export interface ExecutionError {
    code: string;
    message: string;
    stack?: string;
    details?: Record<string, any>;
    recoverable: boolean;
}
/**
 * 执行日志接口
 */
export interface ExecutionLog {
    id: string;
    executionType: ExecutionType;
    status: ExecutionStatus;
    timestamp: number;
    triggeredBy: TriggerType;
    agentIds: string[];
    assetCount: number;
    startTime: number;
    endTime?: number;
    durationMs?: number;
    memoryUsage?: MemoryMetrics;
    successfulAssets: string[];
    failedAssets: FailedAsset[];
    warnings: Warning[];
    error?: ExecutionError;
    retryCount: number;
    fallbackUsed: boolean;
    gatewayId: string;
    skillVersion: string;
    environment: string;
    tags: string[];
    metadata?: Record<string, any>;
}
/**
 * 执行统计信息
 */
export interface ExecutionStats {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    successRate: number;
    byType: Record<ExecutionType, {
        count: number;
        successRate: number;
        avgDuration: number;
    }>;
    byAgent: Record<string, {
        executions: number;
        successRate: number;
        avgDuration: number;
    }>;
    recentTrend: {
        last24h: number;
        last7d: number;
        last30d: number;
        trend: 'up' | 'down' | 'stable';
    };
}
/**
 * 执行查询选项
 */
export interface ExecutionQueryOptions {
    executionType?: ExecutionType;
    status?: ExecutionStatus;
    agentId?: string;
    startTime?: number;
    endTime?: number;
    triggeredBy?: TriggerType;
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'durationMs' | 'assetCount';
    sortOrder?: 'asc' | 'desc';
}
/**
 * 执行分析结果
 */
export interface ExecutionAnalysis {
    executionId: string;
    performanceScore: number;
    efficiencyScore: number;
    reliabilityScore: number;
    issues: {
        performance: string[];
        reliability: string[];
        efficiency: string[];
    };
    recommendations: string[];
}
//# sourceMappingURL=execution-log.d.ts.map