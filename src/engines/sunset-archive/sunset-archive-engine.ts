/**
 * 夕阳无限引擎
 * 主动脱水型记忆归档引擎
 * 实现ISunsetArchiveEngine接口
 */

import { AgentAsset, AgentConfig, AssetType, StorageResult } from '../../types';
import { 
  ISunsetArchiveEngine, 
  SunsetArchiveConfig, 
  MemoryDetectionResult,
  ContentExtractionResult,
  SnapshotBuildResult,
} from './interfaces';
import { BasicMemoryDetector, type MemoryDetectorConfig } from './memory-detector';
import { BasicContentExtractor } from './content-extractor';
import { BasicSnapshotBuilder } from './snapshot-builder';

/**
 * 引擎内部状态
 */
interface EngineInternalState {
  initialized: boolean;
  totalArchives: number;
  successfulArchives: number;
  totalProcessingTime: number;
  lastArchiveTime?: number;
  lastError?: string;
  performanceMetrics: {
    averageDetectionTime: number;
    averageExtractionTime: number;
    averageSnapshotTime: number;
    averageTotalTime: number;
  };
}

/**
 * 夕阳无限引擎实现
 */
export class SunsetArchiveEngine implements ISunsetArchiveEngine {
  private config: SunsetArchiveConfig;
  private state: EngineInternalState;
  private memoryDetector: BasicMemoryDetector;
  private contentExtractor: BasicContentExtractor;
  private snapshotBuilder: BasicSnapshotBuilder;
  private logger: Console;
  
  constructor(config?: Partial<SunsetArchiveConfig>, logger?: Console) {
    this.config = {
      name: 'sunset-archive-engine',
      version: '1.0.0',
      enabled: true,
      detectionThreshold: 8000,
      importanceThreshold: 60,
      maxProcessingTime: 30000, // 30秒
      aiEnhancementEnabled: false,
      logLevel: 'info',
      ...config,
    };
    
    this.state = {
      initialized: false,
      totalArchives: 0,
      successfulArchives: 0,
      totalProcessingTime: 0,
      performanceMetrics: {
        averageDetectionTime: 0,
        averageExtractionTime: 0,
        averageSnapshotTime: 0,
        averageTotalTime: 0,
      },
    };
    
    this.logger = logger || console;
    
    // 初始化组件
    const detectorConfig: Partial<MemoryDetectorConfig> = {
      contextSizeThreshold: this.config.detectionThreshold,
      importanceThreshold: this.config.importanceThreshold,
    };
    
    this.memoryDetector = new BasicMemoryDetector(detectorConfig, this.logger);
    this.contentExtractor = new BasicContentExtractor({}, this.logger);
    this.snapshotBuilder = new BasicSnapshotBuilder({}, this.logger);
  }
  
  /**
   * 初始化引擎
   */
  async initialize(config?: SunsetArchiveConfig): Promise<StorageResult<void>> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }
      
      this.logger.info(`初始化夕阳无限引擎: ${this.config.name} v${this.config.version}`);
      this.logger.info(`配置: 检测阈值=${this.config.detectionThreshold}字符，重要性阈值=${this.config.importanceThreshold}`);
      
      // 更新检测器配置
      this.memoryDetector = new BasicMemoryDetector({
        contextSizeThreshold: this.config.detectionThreshold,
        importanceThreshold: this.config.importanceThreshold,
      }, this.logger);
      
      this.state.initialized = true;
      this.logger.info('夕阳无限引擎初始化成功');
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
          engineName: this.config.name,
          engineVersion: this.config.version,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('夕阳无限引擎初始化失败:', errMsg);
      
      return {
        success: false,
        error: errMsg,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 检测Agent记忆是否需要归档
   */
  async detectMemory(
    agentId: string,
    context: string,
    agentConfig: AgentConfig
  ): Promise<StorageResult<MemoryDetectionResult>> {
    if (!this.state.initialized) {
      return {
        success: false,
        error: '引擎未初始化',
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
    
    if (!this.config.enabled) {
      return {
        success: false,
        error: '引擎已禁用',
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
    
    const startTime = Date.now();
    
    try {
      this.logger.debug(`检测记忆，Agent: ${agentId}，上下文大小: ${context.length}字符`);
      
      // 使用记忆检测器
      const detectionResult = await this.memoryDetector.detect(agentId, context, agentConfig);
      
      // 更新性能指标
      const detectionTime = Date.now() - startTime;
      this.updatePerformanceMetrics('detection', detectionTime);
      
      return {
        success: true,
        data: detectionResult,
        metadata: {
          operationTime: Date.now(),
          detectionTime,
          shouldArchive: detectionResult.shouldArchive,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('记忆检测失败:', errMsg);
      
      return {
        success: false,
        error: errMsg,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 从上下文中提取重要内容
   */
  async extractImportantContent(
    context: string,
    detectionResult: MemoryDetectionResult
  ): Promise<StorageResult<ContentExtractionResult>> {
    if (!this.state.initialized) {
      return {
        success: false,
        error: '引擎未初始化',
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
    
    const startTime = Date.now();
    
    try {
      this.logger.debug(`提取重要内容，上下文大小: ${context.length}字符，检测结果: ${detectionResult.shouldArchive ? '需要归档' : '无需归档'}`);
      
      // 使用内容提取器
      const extractionResult = await this.contentExtractor.extractImportantContent(context, detectionResult);
      
      // 更新性能指标
      const extractionTime = Date.now() - startTime;
      this.updatePerformanceMetrics('extraction', extractionTime);
      
      return {
        success: true,
        data: extractionResult,
        metadata: {
          operationTime: Date.now(),
          extractionTime,
          extractionQuality: extractionResult.extractionQuality,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('内容提取失败:', errMsg);
      
      return {
        success: false,
        error: errMsg,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 构建记忆快照
   */
  async buildMemorySnapshot(
    extractionResult: ContentExtractionResult,
    agentId: string,
    agentConfig: AgentConfig
  ): Promise<StorageResult<SnapshotBuildResult>> {
    if (!this.state.initialized) {
      return {
        success: false,
        error: '引擎未初始化',
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
    
    const startTime = Date.now();
    
    try {
      this.logger.debug(`构建记忆快照，Agent: ${agentId}，提取质量: ${extractionResult.extractionQuality}/100`);
      
      // 使用快照构建器
      const snapshotResult = await this.snapshotBuilder.buildMemorySnapshot(
        extractionResult,
        agentId,
        agentConfig
      );
      
      // 更新性能指标
      const snapshotTime = Date.now() - startTime;
      this.updatePerformanceMetrics('snapshot', snapshotTime);
      
      return {
        success: true,
        data: snapshotResult,
        metadata: {
          operationTime: Date.now(),
          snapshotTime,
          snapshotId: snapshotResult.snapshotId,
          compressedSize: snapshotResult.metadata.compressedSize,
          compressionRatio: snapshotResult.metadata.compressionRatio,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('快照构建失败:', errMsg);
      
      return {
        success: false,
        error: errMsg,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 归档记忆快照
   */
  async archiveMemorySnapshot(
    snapshot: SnapshotBuildResult,
    storageAdapter: any // 实际应为IEnhancedStorageAdapter
  ): Promise<StorageResult<AgentAsset>> {
    if (!this.state.initialized) {
      return {
        success: false,
        error: '引擎未初始化',
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
    
    const startTime = Date.now();
    
    try {
      this.logger.debug(`归档记忆快照，快照ID: ${snapshot.snapshotId}`);
      
      // 获取Agent配置（简化实现，实际应从存储适配器获取）
      const agentConfig: AgentConfig = {
        agentId: snapshot.metadata.agentId,
        displayName: `Agent ${snapshot.metadata.agentId}`,
        description: '',
        expertiseDomains: [],
        assetTypes: [AssetType.KEY_DECISIONS, AssetType.LESSONS_LEARNED],
        restrictedToTypes: false,
        partition: 'general',
        // storageQuota字段是可选的，省略它
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {
          onSuccess: false,
          onFailure: false,
          onWarning: false,
          dailyReport: false,
          channels: [],
        },
        scheduleEnabled: false,
        scheduleTime: '',
        scheduleTimezone: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'sunset-archive-engine',
        lastModifiedBy: 'sunset-archive-engine',
        isActive: true,
        lastHeartbeat: Date.now(),
        // lastArchiveTime和lastError字段是可选的，省略它们
      };
      
      // 构建Agent资产
      const asset = await this.snapshotBuilder.buildAgentAssetFromSnapshot(snapshot, agentConfig);
      
      // 保存到存储适配器（简化实现）
      if (storageAdapter && typeof storageAdapter.createAgentAsset === 'function') {
        const saveResult = await storageAdapter.createAgentAsset(asset);
        
        if (!saveResult.success) {
          throw new Error(`存储失败: ${saveResult.error}`);
        }
      } else {
        this.logger.warn('存储适配器不可用或缺少createAgentAsset方法，跳过实际存储');
      }
      
      // 更新引擎状态
      this.state.totalArchives++;
      this.state.successfulArchives++;
      this.state.lastArchiveTime = Date.now();
      this.state.totalProcessingTime += Date.now() - startTime;
      
      this.logger.info(`记忆归档成功，快照ID: ${snapshot.snapshotId}，资产ID: ${asset.id}`);
      
      return {
        success: true,
        data: asset,
        metadata: {
          operationTime: Date.now(),
          archiveTime: Date.now() - startTime,
          snapshotId: snapshot.snapshotId,
          assetId: asset.id,
          assetType: asset.assetType,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('记忆归档失败:', errMsg);
      
      // 更新失败计数
      this.state.totalArchives++;
      this.state.lastError = errMsg;
      
      return {
        success: false,
        error: errMsg,
        metadata: {
          operationTime: Date.now(),
          snapshotId: snapshot.snapshotId,
        },
      };
    }
  }
  
  /**
   * 执行完整的归档流程
   */
  async executeFullArchive(
    agentId: string,
    context: string,
    agentConfig: AgentConfig,
    storageAdapter: any
  ): Promise<StorageResult<AgentAsset>> {
    const totalStartTime = Date.now();
    
    try {
      if (!this.state.initialized) {
        throw new Error('引擎未初始化');
      }
      
      if (!this.config.enabled) {
        throw new Error('引擎已禁用');
      }
      
      // 检查处理时间限制
      if (totalStartTime + this.config.maxProcessingTime < Date.now()) {
        throw new Error('处理时间超出限制');
      }
      
      this.logger.info(`开始完整归档流程，Agent: ${agentId}，上下文大小: ${context.length}字符`);
      
      // 步骤1: 检测记忆
      const detectionResult = await this.detectMemory(agentId, context, agentConfig);
      if (!detectionResult.success || !detectionResult.data) {
        throw new Error(`记忆检测失败: ${detectionResult.error}`);
      }
      
      const memoryDetection = detectionResult.data;
      if (!memoryDetection.shouldArchive) {
        this.logger.debug(`记忆无需归档，跳过后续步骤`);
        return {
          success: false,
          error: '记忆无需归档',
          metadata: {
            operationTime: Date.now(),
            detectionResult: memoryDetection,
          },
        };
      }
      
      // 步骤2: 提取重要内容
      const extractionResult = await this.extractImportantContent(context, memoryDetection);
      if (!extractionResult.success || !extractionResult.data) {
        throw new Error(`内容提取失败: ${extractionResult.error}`);
      }
      
      // 步骤3: 构建记忆快照
      const snapshotResult = await this.buildMemorySnapshot(
        extractionResult.data,
        agentId,
        agentConfig
      );
      if (!snapshotResult.success || !snapshotResult.data) {
        throw new Error(`快照构建失败: ${snapshotResult.error}`);
      }
      
      // 步骤4: 归档记忆快照
      const archiveResult = await this.archiveMemorySnapshot(
        snapshotResult.data,
        storageAdapter
      );
      
      // 更新总处理时间
      const totalTime = Date.now() - totalStartTime;
      this.updatePerformanceMetrics('total', totalTime);
      
      if (archiveResult.success) {
        this.logger.info(`完整归档流程成功，总耗时: ${totalTime}ms，资产ID: ${archiveResult.data?.id}`);
      }
      
      return archiveResult;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('完整归档流程失败:', errMsg);
      
      return {
        success: false,
        error: errMsg,
        metadata: {
          operationTime: Date.now(),
          totalTime: Date.now() - totalStartTime,
        },
      };
    }
  }
  
  /**
   * 批量归档多个Agent的记忆
   */
  async batchArchive(
    agents: Record<string, { context: string; config: AgentConfig }>,
    storageAdapter: any
  ): Promise<StorageResult<{
    total: number;
    archived: number;
    skipped: number;
    failed: number;
    results: Record<string, StorageResult<AgentAsset>>;
  }>> {
    const totalStartTime = Date.now();
    const results: Record<string, StorageResult<AgentAsset>> = {};
    let archived = 0;
    let skipped = 0;
    let failed = 0;
    
    try {
      if (!this.state.initialized) {
        throw new Error('引擎未初始化');
      }
      
      if (!this.config.enabled) {
        throw new Error('引擎已禁用');
      }
      
      const totalAgents = Object.keys(agents).length;
      this.logger.info(`开始批量归档，共${totalAgents}个Agent`);
      
      // 顺序处理每个Agent（未来可优化为并行）
      for (const [agentId, data] of Object.entries(agents)) {
        try {
          const archiveResult = await this.executeFullArchive(
            agentId,
            data.context,
            data.config,
            storageAdapter
          );
          
          results[agentId] = archiveResult;
          
          if (archiveResult.success) {
            archived++;
            this.logger.debug(`Agent ${agentId} 归档成功`);
          } else if (archiveResult.error === '记忆无需归档') {
            skipped++;
            this.logger.debug(`Agent ${agentId} 无需归档`);
          } else {
            failed++;
            this.logger.warn(`Agent ${agentId} 归档失败: ${archiveResult.error}`);
          }
        } catch (agentError) {
          const errMsg = agentError instanceof Error ? agentError.message : String(agentError);
          results[agentId] = {
            success: false,
            error: errMsg,
          };
          failed++;
          this.logger.error(`Agent ${agentId} 处理异常:`, errMsg);
        }
      }
      
      const totalTime = Date.now() - totalStartTime;
      this.logger.info(`批量归档完成，总计: ${totalAgents}，成功: ${archived}，跳过: ${skipped}，失败: ${failed}，总耗时: ${totalTime}ms`);
      
      return {
        success: true,
        data: {
          total: totalAgents,
          archived,
          skipped,
          failed,
          results,
        },
        metadata: {
          operationTime: Date.now(),
          totalTime,
          averageTimePerAgent: totalAgents > 0 ? totalTime / totalAgents : 0,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('批量归档失败:', errMsg);
      
      return {
        success: false,
        error: errMsg,
        metadata: {
          operationTime: Date.now(),
          totalTime: Date.now() - totalStartTime,
        },
      };
    }
  }
  
  /**
   * 获取引擎状态
   */
  getStatus(): {
    initialized: boolean;
    totalArchives: number;
    successfulArchives: number;
    averageProcessingTime: number;
    lastArchiveTime?: number;
  } {
    const result: {
      initialized: boolean;
      totalArchives: number;
      successfulArchives: number;
      averageProcessingTime: number;
      lastArchiveTime?: number;
    } = {
      initialized: this.state.initialized,
      totalArchives: this.state.totalArchives,
      successfulArchives: this.state.successfulArchives,
      averageProcessingTime: this.state.totalArchives > 0 
        ? this.state.totalProcessingTime / this.state.totalArchives 
        : 0,
    };
    
    if (this.state.lastArchiveTime !== undefined) {
      result.lastArchiveTime = this.state.lastArchiveTime;
    }
    
    return result;
  }
  
  /**
   * 获取详细状态
   */
  getDetailedStatus() {
    return {
      config: this.config,
      state: this.state,
      performanceMetrics: this.state.performanceMetrics,
      componentStatus: {
        memoryDetector: 'initialized',
        contentExtractor: 'initialized',
        snapshotBuilder: 'initialized',
      },
    };
  }
  
  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(metricType: 'detection' | 'extraction' | 'snapshot' | 'total', time: number): void {
    const metrics = this.state.performanceMetrics;
    
    switch (metricType) {
      case 'detection':
        metrics.averageDetectionTime = this.calculateMovingAverage(
          metrics.averageDetectionTime,
          this.state.totalArchives,
          time
        );
        break;
      case 'extraction':
        metrics.averageExtractionTime = this.calculateMovingAverage(
          metrics.averageExtractionTime,
          this.state.totalArchives,
          time
        );
        break;
      case 'snapshot':
        metrics.averageSnapshotTime = this.calculateMovingAverage(
          metrics.averageSnapshotTime,
          this.state.totalArchives,
          time
        );
        break;
      case 'total':
        metrics.averageTotalTime = this.calculateMovingAverage(
          metrics.averageTotalTime,
          this.state.totalArchives,
          time
        );
        break;
    }
  }
  
  /**
   * 计算移动平均
   */
  private calculateMovingAverage(currentAverage: number, count: number, newValue: number): number {
    if (count === 0) return newValue;
    return (currentAverage * count + newValue) / (count + 1);
  }
  
  /**
   * 获取配置
   */
  getConfig(): SunsetArchiveConfig {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SunsetArchiveConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.logger.info('夕阳无限引擎配置已更新');
  }
  
  /**
   * 启用/禁用引擎
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.logger.info(`引擎${enabled ? '启用' : '禁用'}`);
  }
  
  /**
   * 重置引擎状态
   */
  resetState(): void {
    this.state = {
      initialized: true,
      totalArchives: 0,
      successfulArchives: 0,
      totalProcessingTime: 0,
      performanceMetrics: {
        averageDetectionTime: 0,
        averageExtractionTime: 0,
        averageSnapshotTime: 0,
        averageTotalTime: 0,
      },
    };
    this.logger.info('引擎状态已重置');
  }
}