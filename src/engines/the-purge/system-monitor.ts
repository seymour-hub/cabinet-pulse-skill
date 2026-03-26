/**
 * 系统监控器
 * 负责监控OpenClaw服务状态和性能指标
 */

import { AgentConfig, StorageResult } from '../../types';
import { 
  OpenClawStatus, 
  PerformanceIssue, 
  TokenAccumulationReport, 
  MemoryUsageReport,
  AgentStatus,
} from './interfaces';

/**
 * 系统监控器配置
 */
export interface SystemMonitorConfig {
  /** 监控间隔（毫秒） */
  monitoringInterval: number;
  /** 内存使用阈值（MB） */
  memoryThreshold: number;
  /** Token淤积阈值 */
  tokenThreshold: number;
  /** 响应时间阈值（毫秒） */
  responseTimeThreshold: number;
  /** 错误率阈值（0-1） */
  errorRateThreshold: number;
  /** 是否启用详细监控 */
  detailedMonitoring: boolean;
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 系统监控器实现
 */
export class SystemMonitor {
  private config: SystemMonitorConfig;
  private logger: Console;
  private monitoringActive: boolean = false;
  private monitoringIntervalId?: NodeJS.Timeout;
  
  private statusHistory: OpenClawStatus[] = [];
  private maxHistorySize: number = 100;
  
  constructor(config?: Partial<SystemMonitorConfig>, logger?: Console) {
    this.config = {
      monitoringInterval: 30000, // 30秒
      memoryThreshold: 1024, // 1GB
      tokenThreshold: 10000, // 10k tokens
      responseTimeThreshold: 5000, // 5秒
      errorRateThreshold: 0.1, // 10%
      detailedMonitoring: false,
      logLevel: 'info',
      ...config,
    };
    
    this.logger = logger || console;
  }
  
  /**
   * 初始化监控器
   */
  async initialize(): Promise<StorageResult<void>> {
    try {
      this.logger.debug('初始化系统监控器');
      // 简化实现：只需要设置初始化状态
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
          initialized: true,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('初始化系统监控器失败:', errMsg);
      
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
   * 启动监控
   */
  async startMonitoring(): Promise<StorageResult<void>> {
    try {
      if (this.monitoringActive) {
        return {
          success: false,
          error: '监控已在运行中',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      this.logger.info('启动系统监控器');
      this.monitoringActive = true;
      
      // 立即执行一次监控
      await this.performMonitoring();
      
      // 设置定时监控
      this.monitoringIntervalId = setInterval(async () => {
        try {
          await this.performMonitoring();
        } catch (error) {
          this.logger.error('定时监控执行失败:', error);
        }
      }, this.config.monitoringInterval);
      
      this.logger.info(`系统监控器已启动，监控间隔: ${this.config.monitoringInterval}ms`);
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
          monitoringInterval: this.config.monitoringInterval,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('启动监控失败:', errMsg);
      
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
   * 停止监控
   */
  async stopMonitoring(): Promise<StorageResult<void>> {
    try {
      if (!this.monitoringActive) {
        return {
          success: false,
          error: '监控未在运行中',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      this.logger.info('停止系统监控器');
      
      this.monitoringActive = false;
      
      if (this.monitoringIntervalId) {
        clearInterval(this.monitoringIntervalId);
        this.monitoringIntervalId = undefined;
      }
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('停止监控失败:', errMsg);
      
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
   * 执行监控
   */
  private async performMonitoring(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 监控OpenClaw服务状态
      const statusResult = await this.monitorOpenClawStatus();
      
      if (statusResult.success && statusResult.data) {
        this.statusHistory.push(statusResult.data);
        
        // 限制历史记录大小
        if (this.statusHistory.length > this.maxHistorySize) {
          this.statusHistory = this.statusHistory.slice(-this.maxHistorySize);
        }
        
        // 检测性能问题
        const issuesResult = await this.detectPerformanceIssues();
        
        if (issuesResult.success && issuesResult.data && issuesResult.data.length > 0) {
          this.logger.warn(`检测到 ${issuesResult.data.length} 个性能问题`);
          
          // 输出重要问题
          const criticalIssues = issuesResult.data.filter(issue => issue.severity >= 4);
          if (criticalIssues.length > 0) {
            this.logger.error(`发现 ${criticalIssues.length} 个关键性能问题`);
            criticalIssues.forEach(issue => {
              this.logger.error(`[${issue.type}] ${issue.description}`);
            });
          }
        }
      }
      
      const monitoringTime = Date.now() - startTime;
      if (this.config.detailedMonitoring) {
        this.logger.debug(`监控完成，耗时: ${monitoringTime}ms`);
      }
    } catch (error) {
      this.logger.error('监控执行异常:', error);
    }
  }
  
  /**
   * 监控OpenClaw服务状态
   */
  async monitorOpenClawStatus(): Promise<StorageResult<OpenClawStatus>> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('监控OpenClaw服务状态');
      
      // 简化实现：检查OpenClaw服务是否运行
      // 实际实现中应该调用OpenClaw的API或检查进程状态
      const isRunning = await this.checkOpenClawRunning();
      
      // 获取内存使用情况
      const memoryUsage = await this.getMemoryUsage();
      
      // 获取Agent状态（简化实现）
      const agentStatuses = await this.getAgentStatuses();
      
      // 计算统计信息
      const sessionCount = agentStatuses.filter(agent => agent.isActive).length;
      const totalContextSize = agentStatuses.reduce((sum, agent) => sum + agent.contextSize, 0);
      const avgContextSize = agentStatuses.length > 0 ? totalContextSize / agentStatuses.length : 0;
      
      // 计算响应时间和错误率（简化实现）
      const responseTime = await this.estimateResponseTime();
      const errorRate = await this.estimateErrorRate();
      
      const status: OpenClawStatus = {
        isRunning,
        uptime: isRunning ? await this.getUptime() : 0,
        memoryUsage: memoryUsage.total,
        responseTime,
        errorRate,
        sessionCount,
        agentStatuses,
      };
      
      const monitoringTime = Date.now() - startTime;
      
      return {
        success: true,
        data: status,
        metadata: {
          operationTime: Date.now(),
          monitoringTime,
          agentCount: agentStatuses.length,
          totalContextSize,
          averageContextSize: avgContextSize,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('监控OpenClaw服务状态失败:', errMsg);
      
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
   * 检测性能问题
   */
  async detectPerformanceIssues(): Promise<StorageResult<PerformanceIssue[]>> {
    try {
      this.logger.debug('检测性能问题');
      
      const issues: PerformanceIssue[] = [];
      const now = Date.now();
      
      // 获取当前状态
      const statusResult = await this.monitorOpenClawStatus();
      if (!statusResult.success || !statusResult.data) {
        return {
          success: false,
          error: '无法获取系统状态',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      const status = statusResult.data;
      
      // 检测高内存使用
      if (status.memoryUsage > this.config.memoryThreshold) {
        issues.push({
          type: 'high_memory',
          severity: this.calculateSeverity(status.memoryUsage / this.config.memoryThreshold),
          description: `内存使用过高: ${status.memoryUsage.toFixed(2)}MB > ${this.config.memoryThreshold}MB 阈值`,
          timestamp: now,
          suggestions: [
            '执行内存清理',
            '重启高内存使用的Agent',
            '考虑执行物理清场',
          ],
        });
      }
      
      // 检测慢响应
      if (status.responseTime > this.config.responseTimeThreshold) {
        issues.push({
          type: 'slow_response',
          severity: this.calculateSeverity(status.responseTime / this.config.responseTimeThreshold),
          description: `响应时间过长: ${status.responseTime.toFixed(0)}ms > ${this.config.responseTimeThreshold}ms 阈值`,
          timestamp: now,
          suggestions: [
            '检查网络连接',
            '优化查询性能',
            '考虑负载均衡',
          ],
        });
      }
      
      // 检测高错误率
      if (status.errorRate > this.config.errorRateThreshold) {
        issues.push({
          type: 'high_error_rate',
          severity: this.calculateSeverity(status.errorRate / this.config.errorRateThreshold),
          description: `错误率过高: ${(status.errorRate * 100).toFixed(1)}% > ${(this.config.errorRateThreshold * 100).toFixed(0)}% 阈值`,
          timestamp: now,
          suggestions: [
            '检查错误日志',
            '重启故障服务',
            '考虑系统维护',
          ],
        });
      }
      
      // 检测Token淤积
      const tokenReportResult = await this.monitorTokenAccumulation();
      if (tokenReportResult.success && tokenReportResult.data) {
        const tokenReport = tokenReportResult.data;
        if (tokenReport.exceedsThreshold) {
          issues.push({
            type: 'token_accumulation',
            severity: this.calculateSeverity(tokenReport.totalTokens / this.config.tokenThreshold),
            description: `Token淤积严重: ${tokenReport.totalTokens.toFixed(0)} tokens > ${this.config.tokenThreshold} 阈值`,
            agentId: tokenReport.maxTokensAgentId,
            timestamp: now,
            suggestions: [
              '清理上下文历史',
              '重启高Token使用的Agent',
              '执行物理清场',
            ],
          });
        }
      }
      
      // 为每个Agent检测问题
      for (const agent of status.agentStatuses) {
        // 检测长时间无响应的Agent
        const timeSinceHeartbeat = now - agent.lastHeartbeat;
        const heartbeatThreshold = 5 * 60 * 1000; // 5分钟
        if (timeSinceHeartbeat > heartbeatThreshold) {
          issues.push({
            type: 'high_error_rate',
            severity: 3,
            description: `Agent ${agent.agentId} 长时间无心跳: ${Math.floor(timeSinceHeartbeat / 1000 / 60)} 分钟`,
            agentId: agent.agentId,
            timestamp: now,
            suggestions: [
              `检查Agent ${agent.agentId} 状态`,
              '重启该Agent',
              '检查网络连接',
            ],
          });
        }
        
        // 检测Agent内存使用过高
        if (agent.memoryUsage > 100) { // 100MB阈值
          issues.push({
            type: 'high_memory',
            severity: this.calculateSeverity(agent.memoryUsage / 100),
            description: `Agent ${agent.agentId} 内存使用过高: ${agent.memoryUsage.toFixed(2)}MB`,
            agentId: agent.agentId,
            timestamp: now,
            suggestions: [
              `重启Agent ${agent.agentId}`,
              '检查Agent代码是否有内存泄漏',
              '考虑优化Agent配置',
            ],
          });
        }
        
        // 检测Agent错误
        if (agent.lastError) {
          issues.push({
            type: 'high_error_rate',
            severity: 4,
            description: `Agent ${agent.agentId} 发生错误: ${agent.lastError.substring(0, 100)}`,
            agentId: agent.agentId,
            timestamp: now,
            suggestions: [
              `查看Agent ${agent.agentId} 详细错误日志`,
              '重启该Agent',
              '考虑更新Agent配置',
            ],
          });
        }
      }
      
      return {
        success: true,
        data: issues,
        metadata: {
          operationTime: Date.now(),
          totalIssues: issues.length,
          criticalIssues: issues.filter(issue => issue.severity >= 4).length,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('检测性能问题失败:', errMsg);
      
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
   * 监控Token淤积
   */
  async monitorTokenAccumulation(): Promise<StorageResult<TokenAccumulationReport>> {
    try {
      this.logger.debug('监控Token淤积');
      
      // 获取Agent状态
      const agentStatuses = await this.getAgentStatuses();
      
      // 计算Token统计
      const totalTokens = agentStatuses.reduce((sum, agent) => sum + agent.contextSize, 0);
      const averageTokensPerAgent = agentStatuses.length > 0 ? totalTokens / agentStatuses.length : 0;
      
      // 找到使用最多Token的Agent
      let maxTokens = 0;
      let maxTokensAgentId = '';
      
      for (const agent of agentStatuses) {
        if (agent.contextSize > maxTokens) {
          maxTokens = agent.contextSize;
          maxTokensAgentId = agent.agentId;
        }
      }
      
      // 计算Token增长率（简化实现）
      const tokenGrowthRate = await this.estimateTokenGrowthRate();
      
      // 检查是否超过阈值
      const exceedsThreshold = totalTokens > this.config.tokenThreshold;
      
      const report: TokenAccumulationReport = {
        totalTokens,
        averageTokensPerAgent,
        maxTokens,
        maxTokensAgentId,
        tokenGrowthRate,
        recommendedPurgeThreshold: this.config.tokenThreshold,
        exceedsThreshold,
      };
      
      return {
        success: true,
        data: report,
        metadata: {
          operationTime: Date.now(),
          totalAgents: agentStatuses.length,
          threshold: this.config.tokenThreshold,
          thresholdExceeded: exceedsThreshold,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('监控Token淤积失败:', errMsg);
      
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
   * 监控内存使用
   */
  async monitorMemoryUsage(): Promise<StorageResult<MemoryUsageReport>> {
    try {
      this.logger.debug('监控内存使用');
      
      // 获取总内存使用
      const memoryUsage = await this.getMemoryUsage();
      
      // 计算内存使用率（简化实现）
      const systemMemory = memoryUsage.system || 0;
      const agentMemory = memoryUsage.agent || 0;
      const totalMemory = memoryUsage.total || 0;
      
      // 假设系统总内存为4GB（4096MB）
      const totalSystemMemory = 4096;
      const memoryUsageRate = totalMemory / totalSystemMemory;
      
      // 计算内存增长率（简化实现）
      const memoryGrowthRate = await this.estimateMemoryGrowthRate();
      
      // 检查是否超过阈值
      const exceedsThreshold = totalMemory > this.config.memoryThreshold;
      
      const report: MemoryUsageReport = {
        totalMemory,
        systemMemory,
        agentMemory,
        memoryUsageRate,
        memoryGrowthRate,
        exceedsThreshold,
      };
      
      return {
        success: true,
        data: report,
        metadata: {
          operationTime: Date.now(),
          totalSystemMemory,
          threshold: this.config.memoryThreshold,
          thresholdExceeded: exceedsThreshold,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('监控内存使用失败:', errMsg);
      
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
   * 获取历史状态记录
   */
  getStatusHistory(): OpenClawStatus[] {
    return [...this.statusHistory];
  }
  
  /**
   * 清除历史记录
   */
  clearStatusHistory(): void {
    this.statusHistory = [];
    this.logger.info('已清除状态历史记录');
  }
  
  /**
   * 获取监控状态
   */
  getMonitoringStatus() {
    return {
      monitoringActive: this.monitoringActive,
      monitoringInterval: this.config.monitoringInterval,
      historySize: this.statusHistory.length,
      maxHistorySize: this.maxHistorySize,
      config: this.config,
    };
  }
  
  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SystemMonitorConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    
    this.logger.info('系统监控器配置已更新');
    
    // 如果监控在运行，需要重启以应用新的间隔
    if (this.monitoringActive && newConfig.monitoringInterval) {
      this.logger.warn('监控间隔已更改，需要重启监控以生效');
    }
  }
  
  // ============ 简化实现方法 ============
  
  /**
   * 检查OpenClaw是否运行
   */
  private async checkOpenClawRunning(): Promise<boolean> {
    try {
      // 简化实现：检查openclaw进程是否存在
      // 实际实现应该调用OpenClaw API或检查服务状态
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        const result = await execAsync('pgrep -f openclaw');
        return result.stdout.trim().length > 0;
      } catch {
        // pgrep返回非零退出码表示进程不存在
        return false;
      }
    } catch (error) {
      this.logger.warn('检查OpenClaw运行状态失败:', error);
      // 失败时假设服务未运行
      return false;
    }
  }
  
  /**
   * 获取运行时间
   */
  private async getUptime(): Promise<number> {
    try {
      // 简化实现：假设系统启动后OpenClaw一直运行
      // 实际实现应该从OpenClaw API获取
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        // 尝试获取openclaw进程的启动时间
        const result = await execAsync('ps -o lstart= -p $(pgrep -f openclaw | head -1)');
        if (result.stdout.trim()) {
          // 解析启动时间并计算运行时长
          const startTimeStr = result.stdout.trim();
          // 简化实现：返回一个固定值
          return 3600000; // 1小时
        }
      } catch {
        // 忽略错误
      }
      
      // 默认返回1小时
      return 3600000;
    } catch (error) {
      this.logger.warn('获取运行时间失败:', error);
      return 3600000; // 1小时
    }
  }
  
  /**
   * 获取内存使用情况
   */
  private async getMemoryUsage(): Promise<{ total: number; system?: number; agent?: number }> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // 获取系统总内存使用
      const result = await execAsync('free -m | awk \'/Mem:/ {print $3}\'');
      const totalMemory = parseInt(result.stdout.trim()) || 512;
      
      // 简化实现：假设Agent内存使用占总内存的30%
      const agentMemory = Math.floor(totalMemory * 0.3);
      const systemMemory = totalMemory - agentMemory;
      
      return {
        total: totalMemory,
        system: systemMemory,
        agent: agentMemory,
      };
    } catch (error) {
      this.logger.warn('获取内存使用失败:', error);
      // 默认值
      return {
        total: 1024,
        system: 700,
        agent: 324,
      };
    }
  }
  
  /**
   * 获取Agent状态列表
   */
  private async getAgentStatuses(): Promise<AgentStatus[]> {
    try {
      // 简化实现：返回固定Agent状态
      // 实际实现应该从Agent管理器获取
      const agents: AgentStatus[] = [
        {
          agentId: 'main',
          isActive: true,
          lastHeartbeat: Date.now() - 30000, // 30秒前
          contextSize: 1200,
          memoryUsage: 150,
          lastError: undefined,
        },
        {
          agentId: 'chief-strategist',
          isActive: true,
          lastHeartbeat: Date.now() - 45000, // 45秒前
          contextSize: 800,
          memoryUsage: 120,
          lastError: undefined,
        },
        {
          agentId: 'infrastructure-expert',
          isActive: true,
          lastHeartbeat: Date.now() - 20000, // 20秒前
          contextSize: 1500,
          memoryUsage: 180,
          lastError: undefined,
        },
        {
          agentId: 'marketing-insight-expert',
          isActive: true,
          lastHeartbeat: Date.now() - 60000, // 1分钟前
          contextSize: 600,
          memoryUsage: 100,
          lastError: undefined,
        },
      ];
      
      return agents;
    } catch (error) {
      this.logger.warn('获取Agent状态失败:', error);
      return [];
    }
  }
  
  /**
   * 估算响应时间
   */
  private async estimateResponseTime(): Promise<number> {
    try {
      // 简化实现：基于历史记录估算
      if (this.statusHistory.length === 0) {
        return 100; // 默认100ms
      }
      
      // 取最近5个记录的平均值
      const recentHistory = this.statusHistory.slice(-5);
      const totalResponseTime = recentHistory.reduce((sum, status) => sum + status.responseTime, 0);
      return totalResponseTime / recentHistory.length;
    } catch (error) {
      this.logger.warn('估算响应时间失败:', error);
      return 100; // 默认100ms
    }
  }
  
  /**
   * 估算错误率
   */
  private async estimateErrorRate(): Promise<number> {
    try {
      // 简化实现：返回固定错误率
      // 实际实现应该从日志中统计
      return 0.02; // 2%错误率
    } catch (error) {
      this.logger.warn('估算错误率失败:', error);
      return 0.05; // 5%错误率
    }
  }
  
  /**
   * 估算Token增长率
   */
  private async estimateTokenGrowthRate(): Promise<number> {
    try {
      // 简化实现：基于历史记录估算
      if (this.statusHistory.length < 2) {
        return 10; // 默认10 tokens/小时
      }
      
      // 计算最近两次的Token增长
      const recentHistory = this.statusHistory.slice(-2);
      if (recentHistory.length < 2) {
        return 10;
      }
      
      const [first, second] = recentHistory;
      const firstTokens = first.agentStatuses.reduce((sum, agent) => sum + agent.contextSize, 0);
      const secondTokens = second.agentStatuses.reduce((sum, agent) => sum + agent.contextSize, 0);
      const timeDiff = Math.max(1, second.agentStatuses[0]?.lastHeartbeat - first.agentStatuses[0]?.lastHeartbeat) || 3600000;
      
      const tokenDiff = secondTokens - firstTokens;
      const tokensPerMs = tokenDiff / timeDiff;
      const tokensPerHour = tokensPerMs * 1000 * 60 * 60;
      
      return Math.max(0, tokensPerHour);
    } catch (error) {
      this.logger.warn('估算Token增长率失败:', error);
      return 10; // 10 tokens/小时
    }
  }
  
  /**
   * 估算内存增长率
   */
  private async estimateMemoryGrowthRate(): Promise<number> {
    try {
      // 简化实现：基于历史记录估算
      if (this.statusHistory.length < 2) {
        return 5; // 默认5MB/小时
      }
      
      // 计算最近两次的内存增长
      const recentHistory = this.statusHistory.slice(-2);
      if (recentHistory.length < 2) {
        return 5;
      }
      
      const [first, second] = recentHistory;
      const timeDiff = Math.max(1, 30000); // 假设监控间隔30秒
      const memoryDiff = second.memoryUsage - first.memoryUsage;
      const memoryPerMs = memoryDiff / timeDiff;
      const memoryPerHour = memoryPerMs * 1000 * 60 * 60;
      
      return Math.max(0, memoryPerHour);
    } catch (error) {
      this.logger.warn('估算内存增长率失败:', error);
      return 5; // 5MB/小时
    }
  }
  
  /**
   * 计算严重程度
   */
  private calculateSeverity(ratio: number): number {
    if (ratio < 1.2) return 1; // 轻微
    if (ratio < 1.5) return 2; // 中等
    if (ratio < 2.0) return 3; // 严重
    if (ratio < 3.0) return 4; // 危险
    return 5; // 紧急
  }
}