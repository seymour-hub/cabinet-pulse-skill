/**
 * SystemMetrics - 系统指标实体
 * 收集和记录系统健康状态、性能指标和资源使用情况
 */
import { AssetType } from './agent-asset';
/**
 * 上下文压缩指标
 */
export interface ContextReductionMetrics {
    before: number;
    after: number;
    reductionRate: number;
    reductionBytes: number;
    compressionTime: number;
}
/**
 * Agent指标
 */
export interface AgentMetrics {
    agentId: string;
    status: 'healthy' | 'warning' | 'error' | 'offline';
    lastHeartbeat: number;
    responseTime: number;
    contextSize: number;
    memoryUsage: number;
    cpuUsage: number;
    archiveStats: {
        totalArchives: number;
        successfulArchives: number;
        lastArchiveTime: number;
        averageArchiveTime: number;
    };
    errorStats: {
        totalErrors: number;
        lastErrorTime?: number;
        lastErrorMessage?: string;
        recoveryRate: number;
    };
}
/**
 * 存储状态指标
 */
export interface StorageStatusMetrics {
    totalAssets: number;
    totalSizeBytes: number;
    byType: Record<AssetType, {
        count: number;
        sizeBytes: number;
    }>;
    byAgent: Record<string, {
        count: number;
        sizeBytes: number;
    }>;
    growthRate: {
        daily: number;
        weekly: number;
        monthly: number;
    };
    backupStatus: {
        lastBackupTime?: number;
        backupSizeBytes?: number;
        backupStatus: 'success' | 'failed' | 'pending' | 'never';
        retentionDays: number;
    };
}
/**
 * 性能指标
 */
export interface PerformanceMetrics {
    archiveDuration: number;
    restoreDuration: number;
    reportGenerationDuration: number;
    successRate: number;
    errorRate: number;
    throughput: {
        assetsPerMinute: number;
        bytesPerSecond: number;
        concurrentExecutions: number;
    };
    latency: {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
    };
}
/**
 * 资源使用指标
 */
export interface ResourceUsageMetrics {
    memory: {
        total: number;
        used: number;
        free: number;
        usagePercentage: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        usagePercentage: number;
    };
    cpu: {
        usagePercentage: number;
        loadAverage: number[];
        cores: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        connections: number;
    };
}
/**
 * 系统指标接口
 */
export interface SystemMetrics {
    timestamp: number;
    collectionInterval: number;
    resourceUsage: ResourceUsageMetrics;
    contextReduction: ContextReductionMetrics;
    agentStatus: Record<string, AgentMetrics>;
    storageStatus: StorageStatusMetrics;
    performance: PerformanceMetrics;
    systemHealth: {
        overallScore: number;
        components: {
            storage: number;
            agents: number;
            scheduler: number;
            network: number;
        };
        issues: string[];
        recommendations: string[];
    };
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
    startTime: number;
    endTime: number;
    granularity: 'minute' | 'hour' | 'day' | 'week';
    agentIds?: string[];
    metricTypes?: string[];
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
//# sourceMappingURL=system-metrics.d.ts.map