/**
 * 夕阳无限引擎接口定义
 * 实现主动脱水型记忆归档
 */

import { AgentAsset, AgentConfig, StorageResult } from '../../types';

/**
 * 记忆检测结果
 */
export interface MemoryDetectionResult {
  /** 是否需要归档 */
  shouldArchive: boolean;
  /** 检测到的记忆类型 */
  memoryTypes: string[];
  /** 上下文大小（字符数） */
  contextSize: number;
  /** 重要性评分 (0-100) */
  importanceScore: number;
  /** 检测到的关键事件 */
  keyEvents: KeyEvent[];
  /** 建议的归档策略 */
  archiveStrategy: ArchiveStrategy;
}

/**
 * 关键事件
 */
export interface KeyEvent {
  type: 'decision' | 'task_completion' | 'knowledge_gain' | 'problem_solution';
  description: string;
  timestamp: number;
  importance: number; // 0-100
  participants?: string[];
  metadata?: Record<string, any>;
}

/**
 * 归档策略
 */
export interface ArchiveStrategy {
  /** 策略名称 */
  name: string;
  /** 压缩级别 (1-10) */
  compressionLevel: number;
  /** 是否保留原始上下文引用 */
  keepOriginalReference: boolean;
  /** 资产类型建议 */
  suggestedAssetTypes: string[];
  /** 分区建议 */
  suggestedPartition: string;
  /** 保留期限（天数） */
  retentionDays: number;
}

/**
 * 内容提取结果
 */
export interface ContentExtractionResult {
  /** 提取的重要对话 */
  importantConversations: string[];
  /** 提取的决策 */
  decisions: string[];
  /** 提取的持久性知识 */
  persistentKnowledge: string[];
  /** 提取的任务信息 */
  tasks: TaskInfo[];
  /** 提取的元数据 */
  metadata: Record<string, any>;
  /** 提取质量评分 (0-100) */
  extractionQuality: number;
}

/**
 * 任务信息
 */
export interface TaskInfo {
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  importance: number;
  startTime?: number;
  endTime?: number;
  participants?: string[];
}

/**
 * 快照构建结果
 */
export interface SnapshotBuildResult {
  /** 快照ID */
  snapshotId: string;
  /** 快照内容 */
  content: string;
  /** 快照元数据 */
  metadata: {
    agentId: string;
    timestamp: number;
    originalContextSize: number;
    compressedSize: number;
    compressionRatio: number;
    importanceScore: number;
    keyTopics: string[];
    [key: string]: any; // 允许扩展字段
  };
  /** 关联的资产（如果已创建） */
  asset?: AgentAsset;
}

/**
 * 夕阳无限引擎接口
 */
export interface ISunsetArchiveEngine {
  /**
   * 初始化引擎
   */
  initialize(config: SunsetArchiveConfig): Promise<StorageResult<void>>;
  
  /**
   * 检测Agent记忆是否需要归档
   * @param agentId Agent ID
   * @param context 上下文内容
   * @param agentConfig Agent配置
   */
  detectMemory(
    agentId: string,
    context: string,
    agentConfig: AgentConfig
  ): Promise<StorageResult<MemoryDetectionResult>>;
  
  /**
   * 从上下文中提取重要内容
   * @param context 上下文内容
   * @param detectionResult 检测结果
   */
  extractImportantContent(
    context: string,
    detectionResult: MemoryDetectionResult
  ): Promise<StorageResult<ContentExtractionResult>>;
  
  /**
   * 构建记忆快照
   * @param extractionResult 提取结果
   * @param agentId Agent ID
   * @param agentConfig Agent配置
   */
  buildMemorySnapshot(
    extractionResult: ContentExtractionResult,
    agentId: string,
    agentConfig: AgentConfig
  ): Promise<StorageResult<SnapshotBuildResult>>;
  
  /**
   * 归档记忆快照
   * @param snapshot 快照
   * @param storageAdapter 存储适配器
   */
  archiveMemorySnapshot(
    snapshot: SnapshotBuildResult,
    storageAdapter: any // 简化，实际应为IEnhancedStorageAdapter
  ): Promise<StorageResult<AgentAsset>>;
  
  /**
   * 执行完整的归档流程
   * @param agentId Agent ID
   * @param context 上下文内容
   * @param agentConfig Agent配置
   * @param storageAdapter 存储适配器
   */
  executeFullArchive(
    agentId: string,
    context: string,
    agentConfig: AgentConfig,
    storageAdapter: any
  ): Promise<StorageResult<AgentAsset>>;
  
  /**
   * 批量归档多个Agent的记忆
   * @param agents 多个Agent的上下文映射
   * @param storageAdapter 存储适配器
   */
  batchArchive(
    agents: Record<string, { context: string; config: AgentConfig }>,
    storageAdapter: any
  ): Promise<StorageResult<{
    total: number;
    archived: number;
    skipped: number;
    failed: number;
    results: Record<string, StorageResult<AgentAsset>>;
  }>>;
  
  /**
   * 获取引擎状态
   */
  getStatus(): {
    initialized: boolean;
    totalArchives: number;
    successfulArchives: number;
    averageProcessingTime: number;
    lastArchiveTime?: number;
  };
}

/**
 * 夕阳无限引擎配置
 */
export interface SunsetArchiveConfig {
  /** 引擎名称 */
  name: string;
  /** 版本 */
  version: string;
  /** 是否启用 */
  enabled: boolean;
  /** 检测阈值（字符数） */
  detectionThreshold: number;
  /** 重要性阈值 (0-100) */
  importanceThreshold: number;
  /** 最大处理时间（毫秒） */
  maxProcessingTime: number;
  /** 是否启用AI增强 */
  aiEnhancementEnabled: boolean;
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** 自定义检测器 */
  customDetectors?: Array<(context: string) => MemoryDetectionResult>;
  /** 自定义提取器 */
  customExtractors?: Array<(context: string) => ContentExtractionResult>;
}