/**
 * 记忆检测器
 * 负责监控Agent上下文，检测需要归档的记忆
 */

import { AgentConfig } from '../../types';
import { 
  MemoryDetectionResult, 
  KeyEvent, 
  ArchiveStrategy 
} from './interfaces';

/**
 * 记忆检测器配置
 */
export interface MemoryDetectorConfig {
  /** 上下文大小阈值（字符数） */
  contextSizeThreshold: number;
  /** 重要性阈值 (0-100) */
  importanceThreshold: number;
  /** 是否检测决策事件 */
  detectDecisions: boolean;
  /** 是否检测任务完成 */
  detectTaskCompletions: boolean;
  /** 是否检测知识获取 */
  detectKnowledgeGains: boolean;
  /** 是否检测问题解决 */
  detectProblemSolutions: boolean;
  /** 关键词列表（用于检测重要内容） */
  keywords: string[];
}

/**
 * 基础记忆检测器
 */
export class BasicMemoryDetector {
  private config: MemoryDetectorConfig;
  private logger: Console;
  
  constructor(config?: Partial<MemoryDetectorConfig>, logger?: Console) {
    this.config = {
      contextSizeThreshold: 8000,
      importanceThreshold: 60,
      detectDecisions: true,
      detectTaskCompletions: true,
      detectKnowledgeGains: true,
      detectProblemSolutions: true,
      keywords: [
        '决定', '决策', '选择', '确定', '同意', '批准',
        '完成', '结束', '实现', '达成', '成功',
        '学习', '了解', '发现', '明白', '掌握',
        '解决', '修复', '处理', '优化', '改进',
        '重要', '关键', '紧急', '优先', '必须'
      ],
      ...config,
    };
    this.logger = logger || console;
  }
  
  /**
   * 检测记忆是否需要归档
   */
  async detect(
    agentId: string,
    context: string,
    agentConfig: AgentConfig
  ): Promise<MemoryDetectionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`检测记忆，Agent: ${agentId}, 上下文大小: ${context.length}字符`);
      
      // 1. 分析上下文大小
      const contextSize = context.length;
      const sizeThreshold = agentConfig.contextSizeLimit || this.config.contextSizeThreshold;
      const sizeExceeded = contextSize > sizeThreshold;
      
      // 2. 检测关键事件
      const keyEvents = this.detectKeyEvents(context);
      
      // 3. 计算重要性评分
      const importanceScore = this.calculateImportanceScore(context, keyEvents);
      
      // 4. 判断是否需要归档
      const shouldArchive = this.shouldArchiveMemory(
        sizeExceeded,
        importanceScore,
        keyEvents.length,
        agentConfig
      );
      
      // 5. 确定归档策略
      const archiveStrategy = this.determineArchiveStrategy(
        contextSize,
        importanceScore,
        keyEvents,
        agentConfig
      );
      
      // 6. 识别记忆类型
      const memoryTypes = this.identifyMemoryTypes(context, keyEvents);
      
      const result: MemoryDetectionResult = {
        shouldArchive,
        memoryTypes,
        contextSize,
        importanceScore,
        keyEvents,
        archiveStrategy,
      };
      
      this.logger.debug(`记忆检测完成，耗时: ${Date.now() - startTime}ms，是否需要归档: ${shouldArchive}`);
      
      return result;
    } catch (error) {
      this.logger.error('记忆检测失败:', error);
      // 返回默认结果（不归档）
      return {
        shouldArchive: false,
        memoryTypes: [],
        contextSize: context.length,
        importanceScore: 0,
        keyEvents: [],
        archiveStrategy: this.createDefaultArchiveStrategy(),
      };
    }
  }
  
  /**
   * 检测关键事件
   */
  private detectKeyEvents(context: string): KeyEvent[] {
    const events: KeyEvent[] = [];
    const sentences = context.split(/[。！？.!?]/);
    const now = Date.now();
    
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) return;
      
      // 检测决策事件
      if (this.config.detectDecisions) {
        const decisionKeywords = ['决定', '决策', '选择', '确定', '同意', '批准'];
        if (decisionKeywords.some(keyword => trimmedSentence.includes(keyword))) {
          events.push({
            type: 'decision',
            description: trimmedSentence,
            timestamp: now - (sentences.length - index) * 1000, // 模拟时间顺序
            importance: this.estimateEventImportance(trimmedSentence),
          });
        }
      }
      
      // 检测任务完成事件
      if (this.config.detectTaskCompletions) {
        const completionKeywords = ['完成', '结束', '实现', '达成', '成功'];
        if (completionKeywords.some(keyword => trimmedSentence.includes(keyword))) {
          events.push({
            type: 'task_completion',
            description: trimmedSentence,
            timestamp: now - (sentences.length - index) * 1000,
            importance: this.estimateEventImportance(trimmedSentence),
          });
        }
      }
      
      // 检测知识获取事件
      if (this.config.detectKnowledgeGains) {
        const knowledgeKeywords = ['学习', '了解', '发现', '明白', '掌握'];
        if (knowledgeKeywords.some(keyword => trimmedSentence.includes(keyword))) {
          events.push({
            type: 'knowledge_gain',
            description: trimmedSentence,
            timestamp: now - (sentences.length - index) * 1000,
            importance: this.estimateEventImportance(trimmedSentence),
          });
        }
      }
      
      // 检测问题解决事件
      if (this.config.detectProblemSolutions) {
        const solutionKeywords = ['解决', '修复', '处理', '优化', '改进'];
        if (solutionKeywords.some(keyword => trimmedSentence.includes(keyword))) {
          events.push({
            type: 'problem_solution',
            description: trimmedSentence,
            timestamp: now - (sentences.length - index) * 1000,
            importance: this.estimateEventImportance(trimmedSentence),
          });
        }
      }
    });
    
    // 按重要性排序，取前10个
    return events
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  }
  
  /**
   * 估计事件重要性
   */
  private estimateEventImportance(sentence: string): number {
    let importance = 50; // 基础重要性
    
    // 基于关键词调整
    const importanceKeywords = ['重要', '关键', '紧急', '优先', '必须', '核心'];
    const lowImportanceKeywords = ['简单', '次要', '可选', '普通', '一般'];
    
    importanceKeywords.forEach(keyword => {
      if (sentence.includes(keyword)) importance += 20;
    });
    
    lowImportanceKeywords.forEach(keyword => {
      if (sentence.includes(keyword)) importance -= 15;
    });
    
    // 基于句子长度（较长的句子通常包含更多信息）
    if (sentence.length > 100) importance += 10;
    if (sentence.length < 30) importance -= 10;
    
    return Math.max(0, Math.min(100, importance));
  }
  
  /**
   * 计算整体重要性评分
   */
  private calculateImportanceScore(context: string, keyEvents: KeyEvent[]): number {
    let score = 0;
    
    // 基于事件数量和重要性
    const eventImportanceSum = keyEvents.reduce((sum, event) => sum + event.importance, 0);
    score += Math.min(eventImportanceSum / 2, 50); // 最多贡献50分
    
    // 基于上下文大小
    if (context.length > 5000) score += 20;
    if (context.length > 10000) score += 10;
    
    // 基于关键词出现频率
    const keywordMatches = this.config.keywords.filter(keyword => 
      context.includes(keyword)
    ).length;
    score += Math.min(keywordMatches * 5, 20); // 最多贡献20分
    
    return Math.min(100, score);
  }
  
  /**
   * 判断是否需要归档记忆
   */
  private shouldArchiveMemory(
    sizeExceeded: boolean,
    importanceScore: number,
    eventCount: number,
    agentConfig: AgentConfig
  ): boolean {
    // 如果上下文大小超过阈值，且重要性足够
    if (sizeExceeded && importanceScore >= this.config.importanceThreshold) {
      return true;
    }
    
    // 如果有很多重要事件（即使上下文不大）
    if (eventCount >= 3 && importanceScore >= 70) {
      return true;
    }
    
    // 如果Agent配置强制归档
    if (agentConfig.compressionEnabled && importanceScore >= 80) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 确定归档策略
   */
  private determineArchiveStrategy(
    contextSize: number,
    importanceScore: number,
    keyEvents: KeyEvent[],
    agentConfig: AgentConfig
  ): ArchiveStrategy {
    const strategy: ArchiveStrategy = {
      name: 'standard',
      compressionLevel: 5,
      keepOriginalReference: true,
      suggestedAssetTypes: ['key_decisions', 'lessons_learned'],
      suggestedPartition: 'general',
      retentionDays: agentConfig.retentionDays || 30,
    };
    
    // 根据上下文大小调整压缩级别
    if (contextSize > 10000) {
      strategy.compressionLevel = 8;
      strategy.name = 'high_compression';
    } else if (contextSize > 5000) {
      strategy.compressionLevel = 6;
      strategy.name = 'medium_compression';
    }
    
    // 根据重要性调整
    if (importanceScore >= 80) {
      strategy.suggestedAssetTypes = ['key_decisions', 'best_practices', 'strategic_plan'];
      strategy.retentionDays = Math.max(strategy.retentionDays, 90); // 重要内容保留更久
    }
    
    // 根据事件类型调整
    const hasDecisions = keyEvents.some(e => e.type === 'decision');
    const hasKnowledge = keyEvents.some(e => e.type === 'knowledge_gain');
    
    if (hasDecisions) {
      strategy.suggestedAssetTypes.unshift('key_decisions');
    }
    if (hasKnowledge) {
      strategy.suggestedAssetTypes.unshift('lessons_learned');
    }
    
    // 确定分区
    if (agentConfig.partition) {
      strategy.suggestedPartition = agentConfig.partition;
    } else if (hasDecisions && importanceScore >= 70) {
      strategy.suggestedPartition = 'strategic';
    }
    
    return strategy;
  }
  
  /**
   * 识别记忆类型
   */
  private identifyMemoryTypes(context: string, keyEvents: KeyEvent[]): string[] {
    const types = new Set<string>();
    
    // 基于事件类型
    keyEvents.forEach(event => {
      types.add(event.type);
    });
    
    // 基于内容关键词
    const technicalKeywords = ['代码', 'API', '数据库', '服务器', '网络', '架构'];
    const strategicKeywords = ['战略', '规划', '市场', '竞争', '风险', '机会'];
    const operationalKeywords = ['任务', '工作', '执行', '操作', '流程', '步骤'];
    
    if (technicalKeywords.some(keyword => context.includes(keyword))) {
      types.add('technical');
    }
    if (strategicKeywords.some(keyword => context.includes(keyword))) {
      types.add('strategic');
    }
    if (operationalKeywords.some(keyword => context.includes(keyword))) {
      types.add('operational');
    }
    
    return Array.from(types);
  }
  
  /**
   * 创建默认归档策略
   */
  private createDefaultArchiveStrategy(): ArchiveStrategy {
    return {
      name: 'default',
      compressionLevel: 5,
      keepOriginalReference: true,
      suggestedAssetTypes: ['lessons_learned'],
      suggestedPartition: 'general',
      retentionDays: 30,
    };
  }
}