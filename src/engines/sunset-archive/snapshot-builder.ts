/**
 * 快照构建器
 * 负责将提取的内容构建成结构化记忆快照
 */

import { AgentAsset, AgentConfig, AssetType, StorageType, AccessLevel } from '../../types';
import { 
  SnapshotBuildResult, 
  ContentExtractionResult,
  ArchiveStrategy
} from './interfaces';

/**
 * 快照构建器配置
 */
export interface SnapshotBuilderConfig {
  /** 是否包含原始上下文摘要 */
  includeContextSummary: boolean;
  /** 是否包含提取过程元数据 */
  includeExtractionMetadata: boolean;
  /** 是否包含重要性分析 */
  includeImportanceAnalysis: boolean;
  /** 默认资产类型 */
  defaultAssetType: AssetType;
  /** 快照格式版本 */
  snapshotFormatVersion: string;
  /** 压缩级别 (1-10) */
  compressionLevel: number;
  /** 是否生成可读摘要 */
  generateHumanReadableSummary: boolean;
}

/**
 * 基础快照构建器
 */
export class BasicSnapshotBuilder {
  private config: SnapshotBuilderConfig;
  private logger: Console;
  
  constructor(config?: Partial<SnapshotBuilderConfig>, logger?: Console) {
    this.config = {
      includeContextSummary: true,
      includeExtractionMetadata: true,
      includeImportanceAnalysis: true,
      defaultAssetType: AssetType.KEY_DECISIONS,
      snapshotFormatVersion: '1.0.0',
      compressionLevel: 5,
      generateHumanReadableSummary: true,
      ...config,
    };
    this.logger = logger || console;
  }
  
  /**
   * 构建记忆快照
   */
  async buildMemorySnapshot(
    extractionResult: ContentExtractionResult,
    agentId: string,
    agentConfig: AgentConfig,
    archiveStrategy?: ArchiveStrategy
  ): Promise<SnapshotBuildResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`构建记忆快照，Agent: ${agentId}，提取了${this.getExtractionStats(extractionResult)}`);
      
      // 生成快照ID
      const snapshotId = this.generateSnapshotId(agentId, extractionResult);
      
      // 构建快照内容
      const content = this.buildSnapshotContent(extractionResult, agentId, agentConfig, archiveStrategy);
      
      // 构建快照元数据
      const metadata = this.buildSnapshotMetadata(
        extractionResult, 
        agentId, 
        agentConfig, 
        archiveStrategy,
        content.length
      );
      
      // 确定资产类型（当前未使用，保留供未来扩展）
      // const assetType = this.determineAssetType(extractionResult, archiveStrategy);
      
      // 生成标题和摘要（当前未使用，保留供未来扩展）
      // const __title = this.generateSnapshotTitle(extractionResult, assetType);
      // const __summary = this.generateSnapshotSummary(extractionResult, metadata);
      
      const result: SnapshotBuildResult = {
        snapshotId,
        content,
        metadata,
      };
      
      this.logger.debug(`快照构建完成，耗时: ${Date.now() - startTime}ms，快照大小: ${content.length}字符`);
      
      return result;
    } catch (error) {
      this.logger.error('快照构建失败:', error);
      
      // 返回错误快照
      return {
        snapshotId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: JSON.stringify({
          error: '快照构建失败',
          errorMessage: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        }),
        metadata: {
          agentId,
          timestamp: Date.now(),
          originalContextSize: 0,
          compressedSize: 0,
          compressionRatio: 0,
          importanceScore: 0,
          keyTopics: ['error'],
          buildError: true,
        },
      };
    }
  }
  
  /**
   * 从快照构建Agent资产
   */
  async buildAgentAssetFromSnapshot(
    snapshot: SnapshotBuildResult,
    agentConfig: AgentConfig,
    archiveStrategy?: ArchiveStrategy
  ): Promise<AgentAsset> {
    const now = Date.now();
    
    // 确定分区
    const partition = this.determinePartition(agentConfig, archiveStrategy);
    
    // 确定资产类型
    const assetType = this.determineAssetTypeFromMetadata(snapshot.metadata);
    
    // 生成关键词
    const keywords = this.extractKeywords(snapshot.metadata.keyTopics);
    
    // 生成摘要
    const summary = this.generateAssetSummary(snapshot.metadata);
    
    // 构建资产
    const asset: AgentAsset = {
      id: snapshot.snapshotId,
      agentId: snapshot.metadata.agentId,
      assetType,
      partition,
      title: this.generateAssetTitle(snapshot.metadata),
      content: snapshot.content,
      summary,
      keywords,
      sourceContext: 'sunset_archive_engine',
      sourceTimestamp: snapshot.metadata.timestamp,
      confidence: this.calculateConfidence(snapshot.metadata),
      version: 1,
      changeLog: [],
      createdAt: now,
      updatedAt: now,
      storageBackend: StorageType.SQLITE,
      storageId: `snapshot_${snapshot.snapshotId}`,
      accessLevel: AccessLevel.PRIVATE,
      // allowedAgents字段是可选的，当需要时才设置
    };
    
    return asset;
  }
  
  /**
   * 生成快照ID
   */
  private generateSnapshotId(agentId: string, extractionResult: ContentExtractionResult): string {
    const timestamp = Date.now();
    const hash = this.hashString(`${agentId}-${timestamp}-${extractionResult.extractionQuality}`);
    return `snapshot_${timestamp}_${hash.substr(0, 8)}`;
  }
  
  /**
   * 构建快照内容
   */
  private buildSnapshotContent(
    extractionResult: ContentExtractionResult,
    agentId: string,
    agentConfig: AgentConfig,
    archiveStrategy?: ArchiveStrategy
  ): string {
    const snapshot: any = {
      metadata: {
        snapshotId: this.generateSnapshotId(agentId, extractionResult),
        agentId,
        agentDisplayName: agentConfig.displayName,
        timestamp: Date.now(),
        formatVersion: this.config.snapshotFormatVersion,
        extractionQuality: extractionResult.extractionQuality,
      },
    };
    
    // 添加快照数据
    if (extractionResult.importantConversations.length > 0) {
      snapshot.importantConversations = extractionResult.importantConversations;
    }
    
    if (extractionResult.decisions.length > 0) {
      snapshot.keyDecisions = extractionResult.decisions;
    }
    
    if (extractionResult.persistentKnowledge.length > 0) {
      snapshot.persistentKnowledge = extractionResult.persistentKnowledge;
    }
    
    if (extractionResult.tasks.length > 0) {
      snapshot.tasks = extractionResult.tasks;
    }
    
    // 添加提取元数据
    if (this.config.includeExtractionMetadata) {
      snapshot.extractionMetadata = extractionResult.metadata;
    }
    
    // 添加上下文摘要
    if (this.config.includeContextSummary && extractionResult.metadata.originalContextSize) {
      snapshot.contextSummary = {
        originalSize: extractionResult.metadata.originalContextSize,
        extractionTime: extractionResult.metadata.extractionTime,
        sentenceCount: extractionResult.metadata.sentenceCount,
      };
    }
    
    // 添加归档策略
    if (archiveStrategy) {
      snapshot.archiveStrategy = archiveStrategy;
    }
    
    // 添加重要性分析
    if (this.config.includeImportanceAnalysis && extractionResult.metadata.detectionResultSummary) {
      snapshot.importanceAnalysis = extractionResult.metadata.detectionResultSummary;
    }
    
    // 生成可读摘要
    if (this.config.generateHumanReadableSummary) {
      snapshot.humanReadableSummary = this.generateHumanReadableSummary(extractionResult, archiveStrategy);
    }
    
    return JSON.stringify(snapshot, null, 2);
  }
  
  /**
   * 构建快照元数据
   */
  private buildSnapshotMetadata(
    extractionResult: ContentExtractionResult,
    agentId: string,
    _agentConfig: AgentConfig,
    archiveStrategy?: ArchiveStrategy,
    contentSize?: number
  ): SnapshotBuildResult['metadata'] {
    const metadata: SnapshotBuildResult['metadata'] = {
      agentId,
      timestamp: Date.now(),
      originalContextSize: extractionResult.metadata.originalContextSize || 0,
      compressedSize: contentSize || 0,
      compressionRatio: contentSize && extractionResult.metadata.originalContextSize
        ? contentSize / extractionResult.metadata.originalContextSize
        : 0,
      importanceScore: extractionResult.metadata.detectionResultSummary?.importanceScore || 0,
      keyTopics: this.extractKeyTopics(extractionResult),
    };
    
    // 添加可选的元数据字段
    if (archiveStrategy) {
      metadata.archiveStrategyName = archiveStrategy.name;
      metadata.compressionLevel = archiveStrategy.compressionLevel;
    }
    
    if (extractionResult.metadata.extractionTime) {
      metadata.extractionTime = extractionResult.metadata.extractionTime;
    }
    
    if (extractionResult.extractionQuality) {
      metadata.extractionQuality = extractionResult.extractionQuality;
    }
    
    return metadata;
  }
  
  /*
   * 确定资产类型（当前未使用，保留供未来扩展）
   *
  private determineAssetType(
    extractionResult: ContentExtractionResult,
    archiveStrategy?: ArchiveStrategy
  ): AssetType {
    // 优先使用归档策略建议
    if (archiveStrategy?.suggestedAssetTypes && archiveStrategy.suggestedAssetTypes.length > 0) {
      return archiveStrategy.suggestedAssetTypes[0] as AssetType;
    }
    
    // 基于内容类型确定
    if (extractionResult.decisions.length > 0) {
      return AssetType.KEY_DECISIONS;
    }
    
    if (extractionResult.persistentKnowledge.length > 0) {
      return AssetType.LESSONS_LEARNED;
    }
    
    if (extractionResult.tasks.length > 0) {
      return AssetType.EXECUTION_LOG; // 使用EXECUTION_LOG作为任务日志
    }
    
    if (extractionResult.importantConversations.length > 0) {
      return AssetType.EXECUTION_LOG; // 使用EXECUTION_LOG作为对话日志
    }
    
    return this.config.defaultAssetType;
  }
  */
  
  /**
   * 从元数据确定资产类型
   */
  private determineAssetTypeFromMetadata(metadata: SnapshotBuildResult['metadata']): AssetType {
    if (metadata.keyTopics.includes('decision')) {
      return AssetType.KEY_DECISIONS;
    }
    
    if (metadata.keyTopics.includes('knowledge')) {
      return AssetType.LESSONS_LEARNED;
    }
    
    if (metadata.keyTopics.includes('task')) {
      return AssetType.EXECUTION_LOG; // 使用EXECUTION_LOG作为任务日志
    }
    
    return this.config.defaultAssetType;
  }
  
  /*
   * 生成快照标题（当前未使用，保留供未来扩展）
   *
  private generateSnapshotTitle(extractionResult: ContentExtractionResult, assetType: AssetType): string {
    const dateStr = new Date().toISOString().split('T')[0];
    
    if (extractionResult.decisions.length > 0) {
      const firstDecision = extractionResult.decisions[0];
      if (firstDecision) {
        const truncated = firstDecision.length > 30 ? firstDecision.substring(0, 30) + '...' : firstDecision;
        return `决策记录: ${truncated} (${dateStr})`;
      }
      return `决策记录 (${dateStr})`;
    }
    
    if (extractionResult.persistentKnowledge.length > 0) {
      return `知识总结: ${extractionResult.persistentKnowledge.length}条经验 (${dateStr})`;
    }
    
    if (extractionResult.tasks.length > 0) {
      const completedTasks = extractionResult.tasks.filter(t => t.status === 'completed').length;
      return `任务记录: ${extractionResult.tasks.length}个任务，${completedTasks}个完成 (${dateStr})`;
    }
    
    return `${assetType.replace('_', ' ')} 快照 (${dateStr})`;
  }
  */
  
  /**
   * 生成资产标题
   */
  private generateAssetTitle(metadata: SnapshotBuildResult['metadata']): string {
    const dateStr = new Date(metadata.timestamp).toISOString().split('T')[0];
    
    if (metadata.keyTopics.length > 0) {
      const mainTopic = metadata.keyTopics[0];
      return `${mainTopic}归档快照 (${dateStr})`;
    }
    
    return `记忆快照 (${dateStr})`;
  }
  
  /*
   * 生成快照摘要（当前未使用，保留供未来扩展）
   *
  private generateSnapshotSummary(
    extractionResult: ContentExtractionResult,
    metadata: SnapshotBuildResult['metadata']
  ): string {
    const parts: string[] = [];
    
    parts.push(`重要性评分: ${metadata.importanceScore}/100`);
    
    if (extractionResult.decisions.length > 0) {
      parts.push(`包含 ${extractionResult.decisions.length} 个重要决策`);
    }
    
    if (extractionResult.persistentKnowledge.length > 0) {
      parts.push(`包含 ${extractionResult.persistentKnowledge.length} 条持久知识`);
    }
    
    if (extractionResult.tasks.length > 0) {
      const completed = extractionResult.tasks.filter(t => t.status === 'completed').length;
      parts.push(`包含 ${extractionResult.tasks.length} 个任务（${completed} 个完成）`);
    }
    
    if (metadata.compressionRatio > 0) {
      const compressionPercent = (metadata.compressionRatio * 100).toFixed(1);
      parts.push(`压缩率: ${compressionPercent}%`);
    }
    
    return parts.join('，');
  }
  */
  
  /**
   * 生成资产摘要
   */
  private generateAssetSummary(metadata: SnapshotBuildResult['metadata']): string {
    const parts: string[] = [];
    
    parts.push(`归档时间: ${new Date(metadata.timestamp).toLocaleString('zh-CN')}`);
    parts.push(`重要性: ${metadata.importanceScore}/100`);
    
    if (metadata.keyTopics.length > 0) {
      parts.push(`主题: ${metadata.keyTopics.slice(0, 3).join('、')}`);
    }
    
    if (metadata.compressionRatio > 0) {
      const originalSizeKB = Math.round(metadata.originalContextSize / 1024);
      const compressedSizeKB = Math.round(metadata.compressedSize / 1024);
      parts.push(`大小: ${originalSizeKB}KB → ${compressedSizeKB}KB`);
    }
    
    return parts.join(' | ');
  }
  
  /**
   * 提取关键词
   */
  private extractKeywords(keyTopics: string[]): string[] {
    const keywords = new Set<string>();
    
    // 添加关键主题
    keyTopics.forEach(topic => keywords.add(topic));
    
    // 添加时间相关关键词
    const now = new Date();
    keywords.add(now.getFullYear().toString());
    keywords.add(`${now.getMonth() + 1}月`);
    
    return Array.from(keywords).slice(0, 10); // 最多10个关键词
  }
  
  /**
   * 提取关键主题
   */
  private extractKeyTopics(extractionResult: ContentExtractionResult): string[] {
    const topics = new Set<string>();
    
    // 基于内容类型添加主题
    if (extractionResult.decisions.length > 0) {
      topics.add('decision');
      topics.add('strategy');
    }
    
    if (extractionResult.persistentKnowledge.length > 0) {
      topics.add('knowledge');
      topics.add('learning');
    }
    
    if (extractionResult.tasks.length > 0) {
      topics.add('task');
      topics.add('execution');
    }
    
    if (extractionResult.importantConversations.length > 0) {
      topics.add('conversation');
      topics.add('communication');
    }
    
    // 基于提取质量添加主题
    if (extractionResult.extractionQuality >= 80) {
      topics.add('high_quality');
    } else if (extractionResult.extractionQuality >= 60) {
      topics.add('medium_quality');
    } else {
      topics.add('low_quality');
    }
    
    return Array.from(topics);
  }
  
  /**
   * 确定分区
   */
  private determinePartition(agentConfig: AgentConfig, archiveStrategy?: ArchiveStrategy): string {
    // 优先使用归档策略建议
    if (archiveStrategy?.suggestedPartition) {
      return archiveStrategy.suggestedPartition;
    }
    
    // 使用Agent配置的分区
    if (agentConfig.partition) {
      return agentConfig.partition;
    }
    
    // 默认分区
    return 'general';
  }
  
  /**
   * 计算置信度
   */
  private calculateConfidence(metadata: SnapshotBuildResult['metadata']): number {
    let confidence = 0.7; // 基础置信度
    
    // 基于重要性评分调整
    confidence += metadata.importanceScore / 500; // 最多加0.2
    
    // 基于压缩率调整（合理的压缩率表示质量较高）
    if (metadata.compressionRatio > 0 && metadata.compressionRatio < 1) {
      confidence += 0.1;
    }
    
    // 基于提取质量调整
    if (metadata.extractionQuality && metadata.extractionQuality >= 70) {
      confidence += 0.1;
    }
    
    return Math.min(0.95, Math.max(0.3, confidence));
  }
  
  /**
   * 生成可读摘要
   */
  private generateHumanReadableSummary(
    extractionResult: ContentExtractionResult,
    archiveStrategy?: ArchiveStrategy
  ): string {
    const lines: string[] = [];
    
    lines.push('# 记忆快照摘要');
    lines.push('');
    
    if (archiveStrategy) {
      lines.push(`## 归档策略: ${archiveStrategy.name}`);
      lines.push(`- 压缩级别: ${archiveStrategy.compressionLevel}/10`);
      lines.push(`- 保留原始引用: ${archiveStrategy.keepOriginalReference ? '是' : '否'}`);
      lines.push(`- 建议保留期限: ${archiveStrategy.retentionDays}天`);
      lines.push('');
    }
    
    if (extractionResult.decisions.length > 0) {
      lines.push('## 重要决策');
      extractionResult.decisions.slice(0, 3).forEach((decision, i) => {
        lines.push(`${i + 1}. ${decision}`);
      });
      lines.push('');
    }
    
    if (extractionResult.persistentKnowledge.length > 0) {
      lines.push('## 持久知识');
      extractionResult.persistentKnowledge.slice(0, 3).forEach((knowledge, i) => {
        lines.push(`${i + 1}. ${knowledge}`);
      });
      lines.push('');
    }
    
    if (extractionResult.tasks.length > 0) {
      lines.push('## 任务概览');
      const byStatus = {
        completed: extractionResult.tasks.filter(t => t.status === 'completed'),
        in_progress: extractionResult.tasks.filter(t => t.status === 'in_progress'),
        pending: extractionResult.tasks.filter(t => t.status === 'pending'),
        failed: extractionResult.tasks.filter(t => t.status === 'failed'),
      };
      
      lines.push(`- 已完成: ${byStatus.completed.length}个`);
      lines.push(`- 进行中: ${byStatus.in_progress.length}个`);
      lines.push(`- 待处理: ${byStatus.pending.length}个`);
      lines.push(`- 失败: ${byStatus.failed.length}个`);
      lines.push('');
    }
    
    lines.push(`## 质量评估`);
    lines.push(`- 提取质量: ${extractionResult.extractionQuality}/100`);
    lines.push(`- 生成时间: ${new Date().toLocaleString('zh-CN')}`);
    
    return lines.join('\n');
  }
  
  /**
   * 获取提取统计
   */
  private getExtractionStats(extractionResult: ContentExtractionResult): string {
    const stats = [];
    
    if (extractionResult.importantConversations.length > 0) {
      stats.push(`${extractionResult.importantConversations.length}个对话`);
    }
    
    if (extractionResult.decisions.length > 0) {
      stats.push(`${extractionResult.decisions.length}个决策`);
    }
    
    if (extractionResult.persistentKnowledge.length > 0) {
      stats.push(`${extractionResult.persistentKnowledge.length}个知识`);
    }
    
    if (extractionResult.tasks.length > 0) {
      stats.push(`${extractionResult.tasks.length}个任务`);
    }
    
    return stats.join('，');
  }
  
  /**
   * 简单字符串哈希
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * 获取配置
   */
  getConfig(): SnapshotBuilderConfig {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SnapshotBuilderConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.logger.debug('快照构建器配置已更新');
  }
}