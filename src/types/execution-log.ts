/**
 * ExecutionLog - 执行日志实体
 * 记录工作流执行过程、性能指标和错误信息
 */

/**
 * 执行类型枚举
 */
export enum ExecutionType {
  ARCHIVE = 'archive',          // 归档执行
  RESTORE = 'restore',          // 恢复执行
  REPORT = 'report',            // 报告生成
  CLEANUP = 'cleanup',          // 清理执行
  VALIDATION = 'validation',    // 验证执行
  MIGRATION = 'migration',      // 迁移执行
}

/**
 * 执行状态枚举
 */
export enum ExecutionStatus {
  PENDING = 'pending',          // 待执行
  RUNNING = 'running',          // 执行中
  COMPLETED = 'completed',      // 已完成
  FAILED = 'failed',            // 失败
  CANCELLED = 'cancelled',      // 已取消
  TIMEOUT = 'timeout',          // 超时
}

/**
 * 触发方式枚举
 */
export enum TriggerType {
  SCHEDULE = 'schedule',        // 定时触发
  MANUAL = 'manual',            // 手动触发
  EVENT = 'event',              // 事件触发
  API = 'api',                  // API触发
  TEST = 'test',                // 测试触发
}

/**
 * 内存指标
 */
export interface MemoryMetrics {
  heapUsed: number;             // 堆使用量（字节）
  heapTotal: number;            // 堆总量（字节）
  external: number;             // 外部内存使用量（字节）
  arrayBuffers: number;         // ArrayBuffer使用量（字节）
  rss: number;                  // 常驻内存大小（字节）
}

/**
 * 失败资产信息
 */
export interface FailedAsset {
  assetId: string;              // 资产ID
  agentId: string;              // Agent ID
  error: string;                // 错误信息
  retryCount: number;           // 重试次数
  timestamp: number;            // 失败时间戳
}

/**
 * 警告信息
 */
export interface Warning {
  code: string;                 // 警告代码
  message: string;              // 警告消息
  severity: 'low' | 'medium' | 'high'; // 严重程度
  timestamp: number;            // 警告时间戳
  context?: Record<string, any>; // 上下文信息
}

/**
 * 执行错误
 */
export interface ExecutionError {
  code: string;                 // 错误代码
  message: string;              // 错误消息
  stack?: string;               // 错误堆栈
  details?: Record<string, any>; // 错误详情
  recoverable: boolean;         // 是否可恢复
}

/**
 * 执行日志接口
 */
export interface ExecutionLog {
  // 核心标识
  id: string;                    // 执行ID
  executionType: ExecutionType;  // 执行类型
  status: ExecutionStatus;       // 执行状态
  timestamp: number;             // 执行时间戳
  
  // 执行详情
  triggeredBy: TriggerType;      // 触发方式
  agentIds: string[];            // 涉及的Agent列表
  assetCount: number;            // 处理的资产数量
  
  // 性能指标
  startTime: number;             // 开始时间
  endTime?: number;              // 结束时间
  durationMs?: number;           // 持续时间
  memoryUsage?: MemoryMetrics;   // 内存使用情况
  
  // 结果数据
  successfulAssets: string[];    // 成功的资产ID列表
  failedAssets: FailedAsset[];   // 失败的资产信息
  warnings: Warning[];           // 警告信息
  
  // 错误处理
  error?: ExecutionError;        // 错误信息（如果有）
  retryCount: number;            // 重试次数
  fallbackUsed: boolean;         // 是否使用了fallback
  
  // 系统信息
  gatewayId: string;             // 网关ID
  skillVersion: string;          // 技能版本
  environment: string;           // 环境（dev/test/prod）
  
  // 元数据
  tags: string[];                // 标签
  metadata?: Record<string, any>; // 额外元数据
}

/**
 * 执行统计信息
 */
export interface ExecutionStats {
  totalExecutions: number;       // 总执行次数
  successfulExecutions: number;  // 成功执行次数
  failedExecutions: number;      // 失败执行次数
  averageDuration: number;       // 平均执行时间（毫秒）
  successRate: number;           // 成功率（百分比）
  
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
    trend: 'up' | 'down' | 'stable'; // 趋势
  };
}

/**
 * 执行查询选项
 */
export interface ExecutionQueryOptions {
  executionType?: ExecutionType; // 按执行类型筛选
  status?: ExecutionStatus;      // 按状态筛选
  agentId?: string;              // 按Agent筛选
  startTime?: number;           // 开始时间
  endTime?: number;             // 结束时间
  triggeredBy?: TriggerType;    // 按触发方式筛选
  limit?: number;               // 返回数量限制
  offset?: number;              // 偏移量
  sortBy?: 'timestamp' | 'durationMs' | 'assetCount'; // 排序字段
  sortOrder?: 'asc' | 'desc';   // 排序顺序
}

/**
 * 执行分析结果
 */
export interface ExecutionAnalysis {
  executionId: string;
  performanceScore: number;      // 性能评分（0-100）
  efficiencyScore: number;       // 效率评分（0-100）
  reliabilityScore: number;      // 可靠性评分（0-100）
  issues: {
    performance: string[];       // 性能问题
    reliability: string[];       // 可靠性问题
    efficiency: string[];        // 效率问题
  };
  recommendations: string[];     // 改进建议
}