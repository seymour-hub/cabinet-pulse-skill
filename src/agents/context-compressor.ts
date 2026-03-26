/**
 * 上下文压缩器
 * 负责分析Agent上下文，提取重要信息，创建压缩版本
 */

import { AgentAsset, AssetType, StorageType, AccessLevel } from '../types';

/**
 * 上下文分析结果
 */
export interface ContextAnalysis {
  /** 原始上下文大小（字符数） */
  originalSize: number;
  /** 压缩后大小（字符数） */
  compressedSize: number;
  /** 压缩率 (0-1) */
  compressionRatio: number;
  /** 提取的关键主题 */
  keyTopics: string[];
  /** 重要决策点 */
  keyDecisions: string[];
  /** 识别的任务 */
  tasks: TaskInfo[];
  /** 重要性评分 (0-100) */
  importanceScore: number;
  /** 建议的资产类型 */
  suggestedAssetType: AssetType;
}

/**
 * 任务信息
 */
export interface TaskInfo {
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  importance: number; // 0-100
  participants?: string[];
  timestamp?: number;
}

/**
 * 压缩策略配置
 */
export interface CompressionStrategy {
  /** 最小压缩率 (0-1) */
  minCompressionRatio: number;
  /** 最大上下文大小（触发压缩的字符数） */
  maxContextSize: number;
  /** 是否启用AI增强压缩 */
  enableAIEnhancement: boolean;
  /** 是否保留原始上下文引用 */
  keepOriginalReference: boolean;
  /** 重要性阈值 (0-100) */
  importanceThreshold: number;
}

/**
 * 压缩结果
 */
export interface CompressionResult {
  /** 是否成功 */
  success: boolean;
  /** 生成的资产（如果成功） */
  asset?: AgentAsset;
  /** 分析结果 */
  analysis?: ContextAnalysis;
  /** 错误信息（如果失败） */
  error?: string;
  /** 元数据 */
  metadata?: {
    processingTime: number;
    strategyUsed: string;
    originalContextHash: string;
  };
}

/**
 * 上下文压缩器接口
 */
export interface IContextCompressor {
  /**
   * 分析上下文
   * @param context 原始上下文文本
   * @param agentId Agent ID
   * @param metadata 上下文元数据
   */
  analyzeContext(
    context: string,
    agentId: string,
    metadata?: Record<string, any>
  ): Promise<ContextAnalysis>;
  
  /**
   * 压缩上下文
   * @param context 原始上下文文本
   * @param agentId Agent ID
   * @param strategy 压缩策略
   */
  compressContext(
    context: string,
    agentId: string,
    strategy?: Partial<CompressionStrategy>
  ): Promise<CompressionResult>;
  
  /**
   * 批量压缩多个上下文
   */
  compressContexts(
    contexts: Array<{ context: string; agentId: string; metadata?: Record<string, any> }>,
    strategy?: Partial<CompressionStrategy>
  ): Promise<CompressionResult[]>;
}

/**
 * 基础上下文压缩器
 * 实现简单的基于规则的内容提取
 */
export class BasicContextCompressor implements IContextCompressor {
  private defaultStrategy: CompressionStrategy = {
    minCompressionRatio: 0.3, // 至少压缩70%
    maxContextSize: 10000, // 超过10000字符触发压缩
    enableAIEnhancement: false,
    keepOriginalReference: true,
    importanceThreshold: 60, // 重要性60分以上保留
  };
  
  private logger: Console;
  
  constructor(strategy?: Partial<CompressionStrategy>, logger?: Console) {
    if (strategy) {
      this.defaultStrategy = { ...this.defaultStrategy, ...strategy };
    }
    this.logger = logger || console;
  }
  
  async analyzeContext(
    context: string,
    agentId: string,
    _metadata?: Record<string, any> // 暂时未使用，保留接口一致性
  ): Promise<ContextAnalysis> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`分析上下文，Agent: ${agentId}, 大小: ${context.length}字符`);
      
      // 基础分析
      const originalSize = context.length;
      
      // 提取关键主题（简单实现：提取高频名词）
      const keyTopics = this.extractKeyTopics(context);
      
      // 识别决策点（查找决策相关关键词）
      const keyDecisions = this.extractDecisions(context);
      
      // 识别任务
      const tasks = this.extractTasks(context);
      
      // 计算重要性评分
      const importanceScore = this.calculateImportanceScore(
        context,
        keyTopics,
        keyDecisions,
        tasks
      );
      
      // 建议资产类型
      const suggestedAssetType = this.suggestAssetType(keyTopics, tasks);
      
      // 估计压缩后大小
      const estimatedCompressedSize = this.estimateCompressedSize(context, keyTopics, keyDecisions);
      const compressionRatio = originalSize > 0 ? estimatedCompressedSize / originalSize : 1;
      
      const analysis: ContextAnalysis = {
        originalSize,
        compressedSize: estimatedCompressedSize,
        compressionRatio,
        keyTopics,
        keyDecisions,
        tasks,
        importanceScore,
        suggestedAssetType,
      };
      
      this.logger.debug(`上下文分析完成，耗时: ${Date.now() - startTime}ms`);
      
      return analysis;
    } catch (error) {
      this.logger.error('上下文分析失败:', error);
      throw error;
    }
  }
  
  async compressContext(
    context: string,
    agentId: string,
    strategy?: Partial<CompressionStrategy>
  ): Promise<CompressionResult> {
    const startTime = Date.now();
    const finalStrategy = strategy ? { ...this.defaultStrategy, ...strategy } : this.defaultStrategy;
    
    try {
      this.logger.info(`开始压缩上下文，Agent: ${agentId}, 大小: ${context.length}字符`);
      
      // 检查是否需要压缩
      if (context.length < finalStrategy.maxContextSize) {
        this.logger.debug(`上下文大小未超过阈值，跳过压缩`);
        return {
          success: true,
          analysis: {
            originalSize: context.length,
            compressedSize: context.length,
            compressionRatio: 1,
            keyTopics: [],
            keyDecisions: [],
            tasks: [],
            importanceScore: 0,
            suggestedAssetType: AssetType.LESSONS_LEARNED,
          },
          metadata: {
            processingTime: Date.now() - startTime,
            strategyUsed: 'skip',
            originalContextHash: this.hashString(context),
          },
        };
      }
      
      // 分析上下文
      const analysis = await this.analyzeContext(context, agentId);
      
      // 检查重要性阈值
      if (analysis.importanceScore < finalStrategy.importanceThreshold) {
        this.logger.debug(`上下文重要性评分低于阈值，跳过压缩`);
        return {
          success: true,
          analysis,
          metadata: {
            processingTime: Date.now() - startTime,
            strategyUsed: 'skip_low_importance',
            originalContextHash: this.hashString(context),
          },
        };
      }
      
      // 创建压缩内容
      const compressedContent = this.createCompressedContent(context, analysis);
      
      // 检查压缩率
      const actualCompressionRatio = compressedContent.length / context.length;
      if (actualCompressionRatio > finalStrategy.minCompressionRatio) {
        this.logger.warn(`压缩率未达到目标，实际: ${actualCompressionRatio.toFixed(2)}，目标: ${finalStrategy.minCompressionRatio}`);
        // 继续处理，但记录警告
      }
      
      // 创建Agent资产
      const asset: AgentAsset = {
        id: `asset_${Date.now()}_${this.hashString(context).substring(0, 8)}`,
        agentId,
        assetType: analysis.suggestedAssetType,
        partition: this.determinePartition(agentId, analysis.keyTopics),
        title: this.generateTitle(analysis.keyTopics, analysis.keyDecisions),
        content: compressedContent,
        summary: this.generateSummary(analysis),
        keywords: analysis.keyTopics,
        sourceContext: finalStrategy.keepOriginalReference ? context.substring(0, 500) + '...' : '',
        sourceTimestamp: Date.now(),
        confidence: analysis.importanceScore / 100,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        storageBackend: StorageType.LOCAL_FILE, // 默认值，实际使用时会覆盖
        storageId: '',
        accessLevel: AccessLevel.PRIVATE,
      };
      
      this.logger.info(`上下文压缩成功，原始大小: ${context.length}，压缩后: ${compressedContent.length}，压缩率: ${actualCompressionRatio.toFixed(2)}`);
      
      return {
        success: true,
        asset,
        analysis,
        metadata: {
          processingTime: Date.now() - startTime,
          strategyUsed: 'basic_compression',
          originalContextHash: this.hashString(context),
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`上下文压缩失败: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
        metadata: {
          processingTime: Date.now() - startTime,
          strategyUsed: 'failed',
          originalContextHash: this.hashString(context),
        },
      };
    }
  }
  
  async compressContexts(
    contexts: Array<{ context: string; agentId: string; metadata?: Record<string, any> }>,
    strategy?: Partial<CompressionStrategy>
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    for (const item of contexts) {
      const result = await this.compressContext(item.context, item.agentId, strategy);
      results.push(result);
    }
    
    return results;
  }
  
  // ========== 私有工具方法 ==========
  
  private extractKeyTopics(context: string): string[] {
    // 简单实现：提取大写字母开头的名词短语
    // TODO: 实现更智能的主题提取
    const topics: string[] = [];
    
    // 查找常见技术术语
    const techKeywords = ['API', '数据库', '服务器', '网络', '安全', '性能', '架构', '设计', '实现', '部署'];
    for (const keyword of techKeywords) {
      if (context.includes(keyword)) {
        topics.push(keyword);
      }
    }
    
    // 查找项目相关术语
    const projectPatterns = [/项目\s*[\w\u4e00-\u9fa5]+/, /任务\s*[\w\u4e00-\u9fa5]+/, /需求\s*[\w\u4e00-\u9fa5]+/];
    for (const pattern of projectPatterns) {
      const matches = context.match(pattern);
      if (matches) {
        topics.push(...matches);
      }
    }
    
    // 去重并限制数量
    return Array.from(new Set(topics)).slice(0, 10);
  }
  
  private extractDecisions(context: string): string[] {
    const decisions: string[] = [];
    const decisionKeywords = ['决定', '决策', '选择', '确定', '同意', '批准', '拒绝', '采纳', '建议', '推荐'];
    
    // 查找包含决策关键词的句子
    const sentences = context.split(/[。！？.!?]/);
    for (const sentence of sentences) {
      for (const keyword of decisionKeywords) {
        if (sentence.includes(keyword)) {
          decisions.push(sentence.trim());
          break;
        }
      }
    }
    
    return decisions.slice(0, 5); // 最多返回5个决策
  }
  
  private extractTasks(context: string): TaskInfo[] {
    const tasks: TaskInfo[] = [];
    const taskKeywords = ['完成', '进行中', '待办', '任务', '事项', '工作', '计划', '安排'];
    
    // 简单实现：查找包含任务关键词的句子
    const sentences = context.split(/[。！？.!?]/);
    for (const sentence of sentences) {
      for (const keyword of taskKeywords) {
        if (sentence.includes(keyword)) {
          tasks.push({
            description: sentence.trim(),
            status: this.determineTaskStatus(sentence),
            importance: this.estimateTaskImportance(sentence),
          });
          break;
        }
      }
    }
    
    return tasks.slice(0, 10); // 最多返回10个任务
  }
  
  private determineTaskStatus(sentence: string): TaskInfo['status'] {
    if (sentence.includes('完成') || sentence.includes('已结束') || sentence.includes('已完成')) {
      return 'completed';
    }
    if (sentence.includes('进行中') || sentence.includes('正在') || sentence.includes('当前')) {
      return 'in_progress';
    }
    if (sentence.includes('失败') || sentence.includes('错误') || sentence.includes('问题')) {
      return 'failed';
    }
    return 'pending';
  }
  
  private estimateTaskImportance(sentence: string): number {
    let importance = 50; // 默认中等重要性
    
    // 根据关键词调整重要性
    if (sentence.includes('重要') || sentence.includes('关键') || sentence.includes('紧急')) {
      importance += 30;
    }
    if (sentence.includes('优先') || sentence.includes('必须') || sentence.includes('必要')) {
      importance += 20;
    }
    if (sentence.includes('简单') || sentence.includes('次要') || sentence.includes('可选')) {
      importance -= 20;
    }
    
    return Math.max(0, Math.min(100, importance));
  }
  
  private calculateImportanceScore(
    context: string,
    keyTopics: string[],
    keyDecisions: string[],
    tasks: TaskInfo[]
  ): number {
    let score = 0;
    
    // 基于主题数量
    score += Math.min(keyTopics.length * 5, 30);
    
    // 基于决策数量
    score += Math.min(keyDecisions.length * 10, 30);
    
    // 基于任务数量和重要性
    const taskImportanceSum = tasks.reduce((sum, task) => sum + task.importance, 0);
    score += Math.min(taskImportanceSum / 10, 30);
    
    // 基于上下文长度（适度考虑）
    if (context.length > 5000) {
      score += 10;
    }
    
    return Math.min(100, score);
  }
  
  private suggestAssetType(keyTopics: string[], tasks: TaskInfo[]): AssetType {
    // 简单实现：根据关键词判断资产类型
    const technicalKeywords = ['API', '数据库', '服务器', '网络', '安全', '性能', '架构', '代码'];
    const strategicKeywords = ['战略', '规划', '市场', '竞争', '风险', '机会', '分析'];
    const decisionKeywords = ['决定', '决策', '选择', '结论'];
    
    const allText = [...keyTopics, ...tasks.map(t => t.description)].join(' ');
    
    for (const keyword of technicalKeywords) {
      if (allText.includes(keyword)) {
        return AssetType.TECHNICAL_SPECS;
      }
    }
    
    for (const keyword of strategicKeywords) {
      if (allText.includes(keyword)) {
        return AssetType.STRATEGIC_PLAN;
      }
    }
    
    for (const keyword of decisionKeywords) {
      if (allText.includes(keyword)) {
        return AssetType.KEY_DECISIONS;
      }
    }
    
    // 默认类型
    return AssetType.LESSONS_LEARNED;
  }
  
  private estimateCompressedSize(_context: string, keyTopics: string[], keyDecisions: string[]): number {
    // 简单估计：保留重要部分，丢弃细节
    const baseSize = 500; // 基础元数据大小
    const topicSize = keyTopics.length * 50;
    const decisionSize = keyDecisions.reduce((sum, d) => sum + d.length, 0);
    
    return baseSize + topicSize + decisionSize;
  }
  
  private createCompressedContent(_context: string, analysis: ContextAnalysis): string {
    // 创建结构化压缩内容
    const compressed = {
      metadata: {
        originalSize: analysis.originalSize,
        compressedAt: new Date().toISOString(),
        compressionRatio: analysis.compressionRatio,
        importanceScore: analysis.importanceScore,
      },
      keyTopics: analysis.keyTopics,
      keyDecisions: analysis.keyDecisions,
      tasks: analysis.tasks,
      summary: `从${analysis.originalSize}字符上下文中提取的关键信息，包含${analysis.keyTopics.length}个主题和${analysis.keyDecisions.length}个决策点。`,
    };
    
    return JSON.stringify(compressed, null, 2);
  }
  
  private determinePartition(_agentId: string, keyTopics: string[]): string {
    // 简单分区逻辑
    const technicalTopics = ['API', '数据库', '服务器', '网络', '安全', '性能', '架构'];
    const strategicTopics = ['战略', '规划', '市场', '竞争', '风险', '机会'];
    
    for (const topic of keyTopics) {
      for (const techTopic of technicalTopics) {
        if (topic.includes(techTopic)) {
          return '技术分区';
        }
      }
      for (const stratTopic of strategicTopics) {
        if (topic.includes(stratTopic)) {
          return '战略分区';
        }
      }
    }
    
    return '通用分区';
  }
  
  private generateTitle(keyTopics: string[], keyDecisions: string[]): string {
    if (keyTopics.length > 0 && keyTopics[0]) {
      return `${keyTopics[0]}相关分析与决策`;
    }
    if (keyDecisions.length > 0 && keyDecisions[0]) {
      return `关键决策记录: ${keyDecisions[0].substring(0, 30)}...`;
    }
    return `上下文压缩资产_${new Date().toISOString().split('T')[0]}`;
  }
  
  private generateSummary(analysis: ContextAnalysis): string {
    return `重要性评分: ${analysis.importanceScore}/100，包含${analysis.keyTopics.length}个主题，${analysis.keyDecisions.length}个决策，${analysis.tasks.length}个任务。压缩率: ${(analysis.compressionRatio * 100).toFixed(1)}%`;
  }
  
  private hashString(str: string): string {
    // 简单哈希函数，用于生成唯一标识
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }
}