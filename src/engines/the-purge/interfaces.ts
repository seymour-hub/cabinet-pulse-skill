/**
 * 物理清场调度器接口定义
 * 实现零负载系统重启和清理
 */

import { AgentAsset, AgentConfig, StorageResult } from '../../types';

/**
 * OpenClaw服务状态
 */
export interface OpenClawStatus {
  /** 服务是否运行 */
  isRunning: boolean;
  /** 运行时间（毫秒） */
  uptime: number;
  /** 内存使用量（MB） */
  memoryUsage: number;
  /** 平均响应时间（毫秒） */
  responseTime: number;
  /** 错误率（0-1） */
  errorRate: number;
  /** 活动会话数 */
  sessionCount: number;
  /** Agent状态列表 */
  agentStatuses: AgentStatus[];
}

/**
 * Agent状态
 */
export interface AgentStatus {
  /** Agent ID */
  agentId: string;
  /** 是否活跃 */
  isActive: boolean;
  /** 最后心跳时间 */
  lastHeartbeat: number;
  /** 上下文大小（tokens） */
  contextSize: number;
  /** 内存使用量（MB） */
  memoryUsage: number;
  /** 最后错误 */
  lastError?: string;
}

/**
 * 性能问题报告
 */
export interface PerformanceIssue {
  /** 问题类型 */
  type: 'high_memory' | 'slow_response' | 'high_error_rate' | 'token_accumulation';
  /** 严重程度（1-5） */
  severity: number;
  /** 问题描述 */
  description: string;
  /** 相关Agent ID */
  agentId?: string;
  /** 发生时间 */
  timestamp: number;
  /** 建议解决方案 */
  suggestions: string[];
}

/**
 * Token淤积报告
 */
export interface TokenAccumulationReport {
  /** 总Token数 */
  totalTokens: number;
  /** 平均Token数（每Agent） */
  averageTokensPerAgent: number;
  /** 最大Token数 */
  maxTokens: number;
  /** 最大Token数Agent ID */
  maxTokensAgentId: string;
  /** Token增长率（tokens/小时） */
  tokenGrowthRate: number;
  /** 建议清理阈值 */
  recommendedPurgeThreshold: number;
  /** 是否超过阈值 */
  exceedsThreshold: boolean;
}

/**
 * 内存使用报告
 */
export interface MemoryUsageReport {
  /** 总内存使用量（MB） */
  totalMemory: number;
  /** 系统内存使用量（MB） */
  systemMemory: number;
  /** Agent内存使用量（MB） */
  agentMemory: number;
  /** 内存使用率（0-1） */
  memoryUsageRate: number;
  /** 内存增长率（MB/小时） */
  memoryGrowthRate: number;
  /** 是否超过阈值 */
  exceedsThreshold: boolean;
}

/**
 * 验证结果
 */
export interface VerificationResult {
  /** 所有记忆是否已归档 */
  allArchived: boolean;
  /** 未归档的记忆列表 */
  missingArchives: string[];
  /** 归档完整性 */
  archiveIntegrity: boolean;
  /** 归档完整性问题 */
  integrityIssues: string[];
  /** 建议 */
  recommendations: string[];
  /** 验证时间 */
  timestamp: number;
}

/**
 * 备份验证
 */
export interface BackupVerification {
  /** 备份是否存在 */
  backupExists: boolean;
  /** 备份完整性 */
  backupIntegrity: boolean;
  /** 备份大小（字节） */
  backupSize: number;
  /** 备份时间 */
  backupTimestamp: number;
  /** 验证结果 */
  verificationResult: boolean;
  /** 验证详情 */
  verificationDetails: string[];
}

/**
 * 风险评估
 */
export interface RiskAssessment {
  /** 风险等级（low/medium/high/critical） */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** 风险评估 */
  riskAssessment: string;
  /** 识别出的风险 */
  identifiedRisks: Risk[];
  /** 缓解措施 */
  mitigationMeasures: string[];
  /** 是否可执行清理 */
  canProceedWithPurge: boolean;
  /** 需要的手动确认 */
  requiresManualConfirmation: string[];
}

/**
 * 风险项
 */
export interface Risk {
  /** 风险类型 */
  type: 'data_loss' | 'service_interruption' | 'performance_impact' | 'security_breach';
  /** 风险描述 */
  description: string;
  /** 概率（1-5） */
  probability: number;
  /** 影响（1-5） */
  impact: number;
  /** 总体风险分（1-25） */
  overallRisk: number;
  /** 缓解措施 */
  mitigation: string;
}

/**
 * 安全报告
 */
export interface SafetyReport {
  /** 报告ID */
  reportId: string;
  /** 生成时间 */
  timestamp: number;
  /** 总体安全状态 */
  overallSafety: 'safe' | 'warning' | 'danger' | 'critical';
  /** 验证结果 */
  verificationResults: VerificationResult;
  /** 备份状态 */
  backupStatus: BackupVerification;
  /** 风险评估 */
  riskAssessment: RiskAssessment;
  /** 建议操作 */
  recommendedAction: 'proceed' | 'wait' | 'abort' | 'manual_intervention';
  /** 详细建议 */
  detailedRecommendations: string[];
}

/**
 * 清理步骤
 */
export interface PurgeStep {
  /** 步骤名称 */
  name: string;
  /** 步骤描述 */
  description: string;
  /** 执行状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  /** 执行时间（毫秒） */
  executionTime?: number;
  /** 错误信息 */
  error?: string;
  /** 开始时间 */
  startTime?: number;
  /** 结束时间 */
  endTime?: number;
  /** 依赖步骤 */
  dependencies?: string[];
}

/**
 * 备份信息
 */
export interface BackupInfo {
  /** 备份ID */
  backupId: string;
  /** 备份类型 */
  backupType: 'full' | 'incremental' | 'differential';
  /** 备份目标 */
  backupTarget: 'database' | 'config' | 'logs' | 'assets';
  /** 备份大小（字节） */
  backupSize: number;
  /** 备份时间 */
  backupTimestamp: number;
  /** 备份路径 */
  backupPath: string;
  /** 验证状态 */
  verificationStatus: 'pending' | 'verified' | 'failed';
}

/**
 * 清理结果
 */
export interface PurgeResult {
  /** 清理是否成功 */
  success: boolean;
  /** 清理步骤 */
  steps: PurgeStep[];
  /** 备份列表 */
  backups: BackupInfo[];
  /** 错误列表 */
  errors: string[];
  /** 警告列表 */
  warnings: string[];
  /** 总执行时间（毫秒） */
  duration: number;
  /** 清理开始时间 */
  startTime: number;
  /** 清理结束时间 */
  endTime: number;
  /** 清理影响 */
  impact: {
    /** 清理的文件数 */
    filesPurged: number;
    /** 清理的会话数 */
    sessionsPurged: number;
    /** 清理的临时文件大小（字节） */
    temporaryDataPurged: number;
    /** 释放的内存（MB） */
    memoryFreed: number;
  };
}

/**
 * 清理验证
 */
export interface CleanupVerification {
  /** 验证是否通过 */
  verificationPassed: boolean;
  /** 验证详情 */
  verificationDetails: string[];
  /** 发现的问题 */
  issuesFound: string[];
  /** 建议修复 */
  suggestedFixes: string[];
  /** 验证时间 */
  timestamp: number;
}

/**
 * 清理报告
 */
export interface CleanupReport {
  /** 报告ID */
  reportId: string;
  /** 清理时间 */
  purgeTime: number;
  /** 清理结果 */
  purgeResult: PurgeResult;
  /** 清理验证 */
  cleanupVerification: CleanupVerification;
  /** 系统状态对比 */
  systemStateComparison: {
    before: OpenClawStatus;
    after: OpenClawStatus;
  };
  /** 性能改进 */
  performanceImprovements: {
    memoryReduction: number;
    tokenReduction: number;
    responseTimeImprovement: number;
  };
  /** 建议 */
  recommendations: string[];
}

/**
 * 物理清场调度器配置
 */
export interface PurgeSchedulerConfig {
  /** 调度器名称 */
  name: string;
  /** 版本 */
  version: string;
  /** 是否启用 */
  enabled: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval: number;
  /** 内存使用阈值（MB） */
  memoryThreshold: number;
  /** Token淤积阈值 */
  tokenThreshold: number;
  /** 自动清理启用 */
  autoPurgeEnabled: boolean;
  /** 清理确认超时（毫秒） */
  confirmationTimeout: number;
  /** 备份启用 */
  backupEnabled: boolean;
  /** 备份路径 */
  backupPath: string;
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 物理清场调度器接口
 */
export interface IPurgeScheduler {
  /**
   * 初始化调度器
   */
  initialize(config: PurgeSchedulerConfig): Promise<StorageResult<void>>;
  
  /**
   * 监控OpenClaw服务状态
   */
  monitorOpenClawStatus(): Promise<StorageResult<OpenClawStatus>>;
  
  /**
   * 检测性能问题
   */
  detectPerformanceIssues(): Promise<StorageResult<PerformanceIssue[]>>;
  
  /**
   * 监控Token淤积
   */
  monitorTokenAccumulation(): Promise<StorageResult<TokenAccumulationReport>>;
  
  /**
   * 监控内存使用
   */
  monitorMemoryUsage(): Promise<StorageResult<MemoryUsageReport>>;
  
  /**
   * 验证所有记忆已归档
   */
  verifyAllMemoriesArchived(): Promise<StorageResult<VerificationResult>>;
  
  /**
   * 验证备份完整性
   */
  verifyBackupIntegrity(): Promise<StorageResult<BackupVerification>>;
  
  /**
   * 检查清理风险
   */
  assessPurgeRisks(): Promise<StorageResult<RiskAssessment>>;
  
  /**
   * 生成安全报告
   */
  generateSafetyReport(): Promise<StorageResult<SafetyReport>>;
  
  /**
   * 执行标准清理流程
   */
  executeStandardPurge(): Promise<StorageResult<PurgeResult>>;
  
  /**
   * 执行自定义清理
   */
  executeCustomPurge(options: PurgeOptions): Promise<StorageResult<PurgeResult>>;
  
  /**
   * 验证清理结果
   */
  verifyCleanup(): Promise<StorageResult<CleanupVerification>>;
  
  /**
   * 生成清理报告
   */
  generateCleanupReport(): Promise<StorageResult<CleanupReport>>;
  
  /**
   * 重启OpenClaw服务
   */
  restartOpenClawService(): Promise<StorageResult<boolean>>;
  
  /**
   * 获取调度器状态
   */
  getStatus(): {
    initialized: boolean;
    totalPurges: number;
    successfulPurges: number;
    lastPurgeTime?: number;
    monitoringActive: boolean;
    nextScheduledPurge?: number;
  };
  
  /**
   * 启用/禁用自动清理
   */
  setAutoPurgeEnabled(enabled: boolean): Promise<StorageResult<void>>;
}

/**
 * 清理选项
 */
export interface PurgeOptions {
  /** 清理类型 */
  purgeType: 'standard' | 'aggressive' | 'conservative' | 'custom';
  /** 是否备份 */
  backup: boolean;
  /** 备份路径 */
  backupPath?: string;
  /** 要清理的项目 */
  targets: PurgeTarget[];
  /** 保留规则 */
  retentionRules: RetentionRule[];
  /** 确认模式 */
  confirmationMode: 'auto' | 'manual' | 'simulation';
}

/**
 * 清理目标
 */
export interface PurgeTarget {
  /** 目标类型 */
  type: 'temporary_files' | 'session_data' | 'cache' | 'logs' | 'old_backups';
  /** 目标路径 */
  path: string;
  /** 匹配模式 */
  pattern: string;
  /** 保留天数 */
  retentionDays?: number;
}

/**
 * 保留规则
 */
export interface RetentionRule {
  /** 规则类型 */
  type: 'file_age' | 'file_size' | 'file_type';
  /** 条件 */
  condition: string;
  /** 保留策略 */
  retention: 'keep' | 'delete' | 'archive';
  /** 优先级 */
  priority: number;
}