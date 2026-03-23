/**
 * AgentConfig - Agent配置实体
 * 定义Agent的专长配置、存储配额、权限设置等
 */

import { AssetType } from './agent-asset';

/**
 * 存储配额配置
 */
export interface StorageQuota {
  maxAssets: number;            // 最大资产数
  maxSizeBytes: number;         // 最大存储大小（字节）
  warningThreshold: number;     // 警告阈值（百分比，0-100）
}

/**
 * 通知设置
 */
export interface NotificationSettings {
  onSuccess: boolean;           // 成功时通知
  onFailure: boolean;           // 失败时通知
  onWarning: boolean;           // 警告时通知
  dailyReport: boolean;         // 每日报告
  channels: NotificationChannel[]; // 通知渠道
}

/**
 * 通知渠道
 */
export interface NotificationChannel {
  type: 'feishu' | 'email' | 'webhook';
  target: string;               // 目标地址/ID
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Agent配置接口
 */
export interface AgentConfig {
  // 核心标识
  agentId: string;              // Agent ID
  displayName: string;          // 显示名称
  description: string;          // 角色描述
  
  // 专长配置
  expertiseDomains: string[];   // 专长领域
  assetTypes: AssetType[];      // 允许处理的资产类型
  restrictedToTypes: boolean;   // 是否限制只处理指定类型
  
  // 存储配置
  partition: string;            // 专属分区
  storageQuota?: StorageQuota;  // 存储配额
  retentionDays: number;        // 保留天数（默认30天）
  
  // 性能配置
  contextSizeLimit: number;     // 上下文大小限制（tokens）
  compressionEnabled: boolean;  // 是否启用压缩
  summaryEnabled: boolean;      // 是否生成摘要
  encryptionEnabled: boolean;   // 是否启用加密
  
  // 集成配置
  dependencies: string[];       // 依赖的技能列表
  notificationSettings: NotificationSettings; // 通知设置
  
  // 调度配置
  scheduleEnabled: boolean;     // 是否启用自动调度
  scheduleTime: string;         // 调度时间（HH:MM格式）
  scheduleTimezone: string;     // 时区
  
  // 元数据
  createdAt: number;
  updatedAt: number;
  version: string;
  createdBy: string;            // 创建者
  lastModifiedBy: string;       // 最后修改者
  
  // 状态信息
  isActive: boolean;            // 是否活跃
  lastHeartbeat?: number;       // 最后心跳时间
  lastArchiveTime?: number;     // 最后归档时间
  lastError?: string;           // 最后错误信息
}

/**
 * Agent状态枚举
 */
export enum AgentStatus {
  ACTIVE = 'active',            // 活跃状态
  INACTIVE = 'inactive',        // 非活跃状态
  ERROR = 'error',              // 错误状态
  MAINTENANCE = 'maintenance',  // 维护状态
}

/**
 * Agent健康检查结果
 */
export interface AgentHealthCheck {
  agentId: string;
  status: AgentStatus;
  timestamp: number;
  metrics: {
    responseTime: number;       // 响应时间（毫秒）
    memoryUsage: number;        // 内存使用率（百分比）
    cpuUsage: number;           // CPU使用率（百分比）
    contextSize: number;        // 当前上下文大小（tokens）
  };
  issues: string[];             // 发现的问题
  recommendations: string[];    // 改进建议
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
    totalArchives: number;      // 总归档次数
    successfulArchives: number; // 成功归档次数
    failedArchives: number;     // 失败归档次数
    averageArchiveTime: number; // 平均归档时间（毫秒）
    totalAssetsArchived: number; // 总归档资产数
  };
  memoryStats: {
    averageContextSize: number; // 平均上下文大小
    maxContextSize: number;     // 最大上下文大小
    compressionRate: number;    // 压缩率（百分比）
  };
  errorStats: {
    totalErrors: number;        // 总错误数
    errorTypes: Record<string, number>; // 错误类型统计
    recoveryRate: number;       // 恢复率（百分比）
  };
}

/**
 * Agent配置查询选项
 */
export interface AgentConfigQueryOptions {
  agentIds?: string[];          // 按Agent ID筛选
  isActive?: boolean;           // 按活跃状态筛选
  expertiseDomain?: string;     // 按专长领域筛选
  assetType?: AssetType;        // 按资产类型筛选
  limit?: number;              // 返回数量限制
  offset?: number;             // 偏移量
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