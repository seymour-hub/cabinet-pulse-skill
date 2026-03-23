/**
 * SystemMetrics - 系统指标实体
 * 收集和记录系统健康状态、性能指标和资源使用情况
 */

import { AssetType } from './agent-asset';

/**
 * 上下文压缩指标
 */
export interface ContextReductionMetrics {
  before: number;                // 清理前上下文大小（tokens）
  after: number;                 // 清理后上下文大小（tokens）
  reductionRate: number;         // 压缩率（百分比）
  reductionBytes: number;        // 减少的字节数
  compressionTime: number;       // 压缩耗时（毫秒）
}

/**
 * Agent指标
 */
export interface AgentMetrics {
  agentId: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  lastHeartbeat: number;         // 最后心跳时间戳
  responseTime: number;          // 平均响应时间（毫秒）
  contextSize: number;           // 当前上下文大小（tokens）
  memoryUsage: number;           // 内存使用率（百分比）
  cpuUsage: number;              // CPU使用率（百分比）
  archiveStats: {
    totalArchives: number;       // 总归档次数
    successfulArchives: number;  // 成功归档次数
    lastArchiveTime: number;     // 最后归档时间
    averageArchiveTime: number;  // 平均归档时间（毫秒）
  };
  errorStats: {
    totalErrors: number;         // 总错误数
    lastErrorTime?: number;      // 最后错误时间
    lastErrorMessage?: string;   // 最后错误消息
    recoveryRate: number;        // 恢复率（百分比）
  };
}

/**
 * 存储状态指标
 */
export interface StorageStatusMetrics {
  totalAssets: number;           // 总资产数
  totalSizeBytes: number;        // 总大小（字节）
  byType: Record<AssetType, {    // 按类型统计
    count: number;
    sizeBytes: number;
  }>;
  byAgent: Record<string, {      // 按Agent统计
    count: number;
    sizeBytes: number;
  }>;
  growthRate: {
    daily: number;               // 日增长率（百分比）
    weekly: number;              // 周增长率（百分比）
    monthly: number;             // 月增长率（百分比）
  };
  backupStatus: {
    lastBackupTime?: number;     // 最后备份时间
    backupSizeBytes?: number;    // 备份大小
    backupStatus: 'success' | 'failed' | 'pending' | 'never';
    retentionDays: number;       // 保留天数
  };
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  archiveDuration: number;       // 归档平均耗时（毫秒）
  restoreDuration: number;       // 恢复平均耗时（毫秒）
  reportGenerationDuration: number; // 报告生成平均耗时（毫秒）
  successRate: number;           // 成功率（百分比）
  errorRate: number;             // 错误率（百分比）
  throughput: {
    assetsPerMinute: number;     // 每分钟处理资产数
    bytesPerSecond: number;      // 每秒处理字节数
    concurrentExecutions: number; // 并发执行数
  };
  latency: {
    p50: number;                 // 50分位延迟
    p90: number;                 // 90分位延迟
    p95: number;                 // 95分位延迟
    p99: number;                 // 99分位延迟
  };
}

/**
 * 资源使用指标
 */
export interface ResourceUsageMetrics {
  memory: {
    total: number;               // 总内存（字节）
    used: number;                // 已使用内存（字节）
    free: number;                // 空闲内存（字节）
    usagePercentage: number;     // 使用率（百分比）
  };
  disk: {
    total: number;               // 总磁盘空间（字节）
    used: number;                // 已使用磁盘空间（字节）
    free: number;                // 空闲磁盘空间（字节）
    usagePercentage: number;     // 使用率（百分比）
  };
  cpu: {
    usagePercentage: number;     // CPU使用率（百分比）
    loadAverage: number[];       // 负载平均值（1,5,15分钟）
    cores: number;               // CPU核心数
  };
  network: {
    bytesIn: number;             // 接收字节数
    bytesOut: number;            // 发送字节数
    connections: number;         // 当前连接数
  };
}

/**
 * 系统指标接口
 */
export interface SystemMetrics {
  // 时间标识
  timestamp: number;             // 采集时间戳
  collectionInterval: number;    // 采集间隔（秒）
  
  // 资源使用
  resourceUsage: ResourceUsageMetrics;
  
  // 上下文压缩
  contextReduction: ContextReductionMetrics;
  
  // Agent状态
  agentStatus: Record<string, AgentMetrics>;
  
  // 存储状态
  storageStatus: StorageStatusMetrics;
  
  // 性能指标
  performance: PerformanceMetrics;
  
  // 系统健康
  systemHealth: {
    overallScore: number;        // 总体健康评分（0-100）
    components: {
      storage: number;           // 存储健康评分
      agents: number;            // Agent健康评分
      scheduler: number;         // 调度器健康评分
      network: number;           // 网络健康评分
    };
    issues: string[];            // 发现的问题
    recommendations: string[];   // 改进建议
  };
  
  // 趋势分析
  trends: {
    contextGrowth: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'declining' | 'stable';
    errorTrend: 'increasing' | 'decreasing' | 'stable';
    storageGrowthTrend: 'accelerating' | 'decelerating' | 'stable';
  };
}

/**
 * 指标查询选项
 */
export interface MetricsQueryOptions {
  startTime: number;            // 开始时间戳
  endTime: number;              // 结束时间戳
  granularity: 'minute' | 'hour' | 'day' | 'week'; // 粒度
  agentIds?: string[];          // 按Agent筛选
  metricTypes?: string[];       // 按指标类型筛选
}

/**
 * 指标分析结果
 */
export interface MetricsAnalysis {
  timeRange: {
    start: number;
    end: number;
  };
  summary: {
    averageHealthScore: number;
    peakMemoryUsage: number;
    peakCpuUsage: number;
    totalAssetsProcessed: number;
    totalErrors: number;
  };
  anomalies: {
    timestamp: number;
    metric: string;
    value: number;
    expectedRange: [number, number];
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }[];
}