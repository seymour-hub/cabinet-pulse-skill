/**
 * AgentConfig - Agent配置实体
 * 定义Agent的专长配置、存储配额、权限设置等
 */
import { AssetType } from './agent-asset';
/**
 * 存储配额配置
 */
export interface StorageQuota {
    maxAssets: number;
    maxSizeBytes: number;
    warningThreshold: number;
}
/**
 * 通知设置
 */
export interface NotificationSettings {
    onSuccess: boolean;
    onFailure: boolean;
    onWarning: boolean;
    dailyReport: boolean;
    channels: NotificationChannel[];
}
/**
 * 通知渠道
 */
export interface NotificationChannel {
    type: 'feishu' | 'email' | 'webhook';
    target: string;
    enabled: boolean;
    priority: 'low' | 'medium' | 'high';
}
/**
 * Agent配置接口
 */
export interface AgentConfig {
    agentId: string;
    displayName: string;
    description: string;
    expertiseDomains: string[];
    assetTypes: AssetType[];
    restrictedToTypes: boolean;
    partition: string;
    storageQuota?: StorageQuota;
    retentionDays: number;
    contextSizeLimit: number;
    compressionEnabled: boolean;
    summaryEnabled: boolean;
    encryptionEnabled: boolean;
    dependencies: string[];
    notificationSettings: NotificationSettings;
    scheduleEnabled: boolean;
    scheduleTime: string;
    scheduleTimezone: string;
    createdAt: number;
    updatedAt: number;
    version: string;
    createdBy: string;
    lastModifiedBy: string;
    isActive: boolean;
    lastHeartbeat?: number;
    lastArchiveTime?: number;
    lastError?: string;
}
/**
 * Agent状态枚举
 */
export declare enum AgentStatus {
    ACTIVE = "active",// 活跃状态
    INACTIVE = "inactive",// 非活跃状态
    ERROR = "error",// 错误状态
    MAINTENANCE = "maintenance"
}
/**
 * Agent健康检查结果
 */
export interface AgentHealthCheck {
    agentId: string;
    status: AgentStatus;
    timestamp: number;
    metrics: {
        responseTime: number;
        memoryUsage: number;
        cpuUsage: number;
        contextSize: number;
    };
    issues: string[];
    recommendations: string[];
}
/**
 * Agent性能指标
 */
export interface AgentPerformanceMetrics {
    agentId: string;
    timeRange: {
        start: number;
        end: number;
    };
    archiveStats: {
        totalArchives: number;
        successfulArchives: number;
        failedArchives: number;
        averageArchiveTime: number;
        totalAssetsArchived: number;
    };
    memoryStats: {
        averageContextSize: number;
        maxContextSize: number;
        compressionRate: number;
    };
    errorStats: {
        totalErrors: number;
        errorTypes: Record<string, number>;
        recoveryRate: number;
    };
}
/**
 * Agent配置查询选项
 */
export interface AgentConfigQueryOptions {
    agentIds?: string[];
    isActive?: boolean;
    expertiseDomain?: string;
    assetType?: AssetType;
    limit?: number;
    offset?: number;
}
/**
 * Agent配置更新请求
 */
export interface AgentConfigUpdate {
    displayName?: string;
    description?: string;
    expertiseDomains?: string[];
    assetTypes?: AssetType[];
    restrictedToTypes?: boolean;
    partition?: string;
    storageQuota?: StorageQuota;
    retentionDays?: number;
    contextSizeLimit?: number;
    compressionEnabled?: boolean;
    summaryEnabled?: boolean;
    encryptionEnabled?: boolean;
    dependencies?: string[];
    notificationSettings?: NotificationSettings;
    scheduleEnabled?: boolean;
    scheduleTime?: string;
    scheduleTimezone?: string;
    isActive?: boolean;
}
//# sourceMappingURL=agent-config.d.ts.map