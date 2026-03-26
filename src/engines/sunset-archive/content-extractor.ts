/**
 * 内容提取器
 * 负责从Agent上下文中提取重要信息：对话、决策、知识、任务等
 */

import { 
  ContentExtractionResult, 
  TaskInfo, 
  MemoryDetectionResult 
} from './interfaces';

/**
 * 内容提取器配置
 */
export interface ContentExtractorConfig {
  /** 是否提取重要对话 */
  extractConversations: boolean;
  /** 是否提取决策 */
  extractDecisions: boolean;
  /** 是否提取持久性知识 */
  extractPersistentKnowledge: boolean;
  /** 是否提取任务信息 */
  extractTasks: boolean;
  /** 最小句子长度（字符数） */
  minSentenceLength: number;
  /** 最大提取句子数量 */
  maxExtractedSentences: number;
  /** 重要性阈值（0-100） */
  importanceThreshold: number;
  /** 对话关键词 */
  conversationKeywords: string[];
  /** 决策关键词 */
  decisionKeywords: string[];
  /** 知识关键词 */
  knowledgeKeywords: string[];
  /** 任务关键词 */
  taskKeywords: string[];
}

/**
 * 基础内容提取器
 */
export class BasicContentExtractor {
  private config: ContentExtractorConfig;
  private logger: Console;
  
  constructor(config?: Partial<ContentExtractorConfig>, logger?: Console) {
    this.config = {
      extractConversations: true,
      extractDecisions: true,
      extractPersistentKnowledge: true,
      extractTasks: true,
      minSentenceLength: 20,
      maxExtractedSentences: 50,
      importanceThreshold: 60,
      conversationKeywords: [
        '讨论', '交流', '对话', '会议', '沟通', '商议', '商讨',
        '说', '提到', '指出', '强调', '说明', '解释', '回答'
      ],
      decisionKeywords: [
        '决定', '决策', '选择', '确定', '同意', '批准', '确认',
        '采纳', '通过', '否决', '拒绝', '放弃', '取消', '变更'
      ],
      knowledgeKeywords: [
        '学习', '了解', '发现', '明白', '掌握', '知道', '认识',
        '经验', '教训', '技巧', '方法', '策略', '原则', '规律'
      ],
      taskKeywords: [
        '任务', '工作', '事项', '计划', '安排', '完成', '执行',
        '进行', '开展', '实施', '处理', '解决', '准备', '启动'
      ],
      ...config,
    };
    this.logger = logger || console;
  }
  
  /**
   * 从上下文中提取重要内容
   */
  async extractImportantContent(
    context: string,
    detectionResult: MemoryDetectionResult
  ): Promise<ContentExtractionResult> {
    const startTime = Date.now();
    
    try {
      // 防御性检查：确保keyEvents存在
      const keyEvents = detectionResult.keyEvents || [];
      const keyEventCount = keyEvents.length;
      const memoryTypes = detectionResult.memoryTypes || [];
      const importanceScore = detectionResult.importanceScore || 50;
      
      this.logger.debug(`提取重要内容，上下文大小: ${context.length}字符，检测到${keyEventCount}个关键事件`);
      
      // 分割上下文为句子
      const sentences = this.splitIntoSentences(context);
      this.logger.debug(`分割为${sentences.length}个句子`);
      
      // 提取不同类型的内容
      const importantConversations = this.config.extractConversations 
        ? this.extractConversations(sentences)
        : [];
      
      const decisions = this.config.extractDecisions
        ? this.extractDecisions(sentences)
        : [];
      
      const persistentKnowledge = this.config.extractPersistentKnowledge
        ? this.extractPersistentKnowledge(sentences)
        : [];
      
      const tasks = this.config.extractTasks
        ? this.extractTasks(sentences)
        : [];
      
      // 计算提取质量评分
      const extractionQuality = this.calculateExtractionQuality(
        sentences.length,
        importantConversations.length,
        decisions.length,
        persistentKnowledge.length,
        tasks.length,
        importanceScore
      );
      
      // 构建元数据
      const metadata = {
        extractionTime: Date.now(),
        originalContextSize: context.length,
        sentenceCount: sentences.length,
        detectionResultSummary: {
          memoryTypes,
          importanceScore,
          keyEventCount,
        },
        configUsed: {
          extractConversations: this.config.extractConversations,
          extractDecisions: this.config.extractDecisions,
          extractPersistentKnowledge: this.config.extractPersistentKnowledge,
          extractTasks: this.config.extractTasks,
        },
      };
      
      const result: ContentExtractionResult = {
        importantConversations,
        decisions,
        persistentKnowledge,
        tasks,
        metadata,
        extractionQuality,
      };
      
      this.logger.debug(`内容提取完成，耗时: ${Date.now() - startTime}ms，提取质量: ${extractionQuality}/100`);
      
      return result;
    } catch (error) {
      this.logger.error('内容提取失败:', error);
      
      // 返回空结果
      return {
        importantConversations: [],
        decisions: [],
        persistentKnowledge: [],
        tasks: [],
        metadata: {
          extractionTime: Date.now(),
          originalContextSize: context.length,
          sentenceCount: 0,
          error: error instanceof Error ? error.message : String(error),
          extractionFailed: true,
        },
        extractionQuality: 0,
      };
    }
  }
  
  /**
   * 将文本分割为句子
   */
  private splitIntoSentences(text: string): string[] {
    // 使用中文标点分割句子
    const sentenceRegex = /[^。！？.!?]+[。！？.!?]/g;
    const matches = text.match(sentenceRegex) || [];
    
    // 清理和过滤句子
    return matches
      .map(s => s.trim())
      .filter(s => s.length >= this.config.minSentenceLength)
      .slice(0, this.config.maxExtractedSentences);
  }
  
  /**
   * 提取重要对话
   */
  private extractConversations(sentences: string[]): string[] {
    const conversations: string[] = [];
    
    for (const sentence of sentences) {
      // 检查是否包含对话关键词
      const hasConversationKeyword = this.config.conversationKeywords.some(
        keyword => sentence.includes(keyword)
      );
      
      // 检查是否包含引号或对话标记
      const hasQuotes = sentence.includes('"') || sentence.includes('"') || 
                       sentence.includes('说：') || sentence.includes('表示：');
      
      // 检查是否包含人称代词（可能表示对话）
      const hasPersonPronouns = /我|你|他|她|我们|你们|他们|她们/.test(sentence);
      
      if ((hasConversationKeyword || hasQuotes) && hasPersonPronouns) {
        conversations.push(sentence);
        
        if (conversations.length >= this.config.maxExtractedSentences / 4) {
          break;
        }
      }
    }
    
    return conversations.slice(0, 10); // 最多返回10个对话
  }
  
  /**
   * 提取决策
   */
  private extractDecisions(sentences: string[]): string[] {
    const decisions: string[] = [];
    
    for (const sentence of sentences) {
      // 检查是否包含决策关键词
      const hasDecisionKeyword = this.config.decisionKeywords.some(
        keyword => sentence.includes(keyword)
      );
      
      // 检查是否包含肯定性词语
      const hasAffirmativeWords = /确定|肯定|必须|需要|应该|应当|要求/.test(sentence);
      
      // 检查是否包含结果导向词语
      const hasResultOrientedWords = /结果|效果|影响|意义|价值|作用/.test(sentence);
      
      if (hasDecisionKeyword && (hasAffirmativeWords || hasResultOrientedWords)) {
        decisions.push(sentence);
        
        if (decisions.length >= this.config.maxExtractedSentences / 4) {
          break;
        }
      }
    }
    
    return decisions.slice(0, 10); // 最多返回10个决策
  }
  
  /**
   * 提取持久性知识
   */
  private extractPersistentKnowledge(sentences: string[]): string[] {
    const knowledge: string[] = [];
    
    for (const sentence of sentences) {
      // 检查是否包含知识关键词
      const hasKnowledgeKeyword = this.config.knowledgeKeywords.some(
        keyword => sentence.includes(keyword)
      );
      
      // 检查是否包含通用性或原则性内容
      const hasGenerality = /通常|一般|普遍|基本|原则|规律|方法|技巧|经验/.test(sentence);
      
      // 检查是否包含学习或发现内容
      const hasLearningWords = /学习到|了解到|发现|明白|掌握|知道/.test(sentence);
      
      if ((hasKnowledgeKeyword || hasLearningWords) && hasGenerality) {
        knowledge.push(sentence);
        
        if (knowledge.length >= this.config.maxExtractedSentences / 4) {
          break;
        }
      }
    }
    
    return knowledge.slice(0, 10); // 最多返回10个知识条目
  }
  
  /**
   * 提取任务信息
   */
  private extractTasks(sentences: string[]): TaskInfo[] {
    const tasks: TaskInfo[] = [];
    const now = Date.now();
    
    for (const sentence of sentences) {
      // 检查是否包含任务关键词
      const hasTaskKeyword = this.config.taskKeywords.some(
        keyword => sentence.includes(keyword)
      );
      
      if (!hasTaskKeyword) {
        continue;
      }
      
      // 确定任务状态
      let status: TaskInfo['status'] = 'pending';
      if (sentence.includes('完成') || sentence.includes('结束') || sentence.includes('实现')) {
        status = 'completed';
      } else if (sentence.includes('进行') || sentence.includes('执行') || sentence.includes('处理')) {
        status = 'in_progress';
      } else if (sentence.includes('失败') || sentence.includes('错误') || sentence.includes('问题')) {
        status = 'failed';
      }
      
      // 估计重要性
      let importance = 50;
      if (sentence.includes('重要') || sentence.includes('关键') || sentence.includes('紧急')) {
        importance += 30;
      }
      if (sentence.includes('简单') || sentence.includes('次要') || sentence.includes('普通')) {
        importance -= 20;
      }
      
      // 提取参与者
      const participants: string[] = [];
      const participantPatterns = [/我/g, /我们/g, /团队/g, /小组/g, /部门/g];
      for (const pattern of participantPatterns) {
        if (pattern.test(sentence)) {
          participants.push(pattern.source.replace(/\\/g, '').replace('/g', ''));
        }
      }
      
      const task: TaskInfo = {
        description: sentence,
        status,
        importance: Math.max(0, Math.min(100, importance)),
        startTime: now,
      };
      
      // 只有在有参与者时才添加participants字段
      if (participants.length > 0) {
        task.participants = participants;
      }
      
      tasks.push(task);
      
      if (tasks.length >= this.config.maxExtractedSentences / 4) {
        break;
      }
    }
    
    return tasks.slice(0, 10); // 最多返回10个任务
  }
  
  /**
   * 计算提取质量评分
   */
  private calculateExtractionQuality(
    totalSentences: number,
    conversationCount: number,
    decisionCount: number,
    knowledgeCount: number,
    taskCount: number,
    originalImportanceScore: number
  ): number {
    let quality = 50; // 基础分
    
    // 基于提取覆盖率评分
    const totalExtracted = conversationCount + decisionCount + knowledgeCount + taskCount;
    if (totalSentences > 0) {
      const coverageRatio = totalExtracted / Math.min(totalSentences, this.config.maxExtractedSentences);
      quality += Math.min(coverageRatio * 30, 30); // 最多加30分
    }
    
    // 基于提取多样性评分
    const extractionTypes = [
      conversationCount > 0,
      decisionCount > 0,
      knowledgeCount > 0,
      taskCount > 0,
    ].filter(Boolean).length;
    
    quality += extractionTypes * 5; // 每种类型加5分
    
    // 基于原始重要性评分调整
    quality = quality * (originalImportanceScore / 100);
    
    return Math.min(100, Math.max(0, quality));
  }
  
  /**
   * 获取配置
   */
  getConfig(): ContentExtractorConfig {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ContentExtractorConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.logger.debug('内容提取器配置已更新');
  }
}