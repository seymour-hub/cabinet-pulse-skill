/**
 * 物理清场主调度器
 * 集成系统监控器、安全验证器、清理执行器、重启管理器
 * 实现IPurgeScheduler接口，协调完整的物理清场流程
 */

import { StorageResult } from '../../types';
import { SystemMonitor } from './system-monitor';
import { SafetyValidator } from './safety-validator';
import { CleanupExecutor } from './cleanup-executor';
import { RestartManager } from './restart-manager';
import {
  IPurgeScheduler,
  PurgeSchedulerConfig,
  OpenClawStatus,
  PerformanceIssue,
  TokenAccumulationReport,
  MemoryUsageReport,
  VerificationResult,
  BackupVerification,
  RiskAssessment,
  SafetyReport,
  PurgeResult,
  CleanupVerification,
  CleanupReport,
  PurgeOptions,
} from './interfaces';

/**
 * 物理清场主调度器实现
 */
export class PurgeScheduler implements IPurgeScheduler {
  private config: PurgeSchedulerConfig;
  private logger: Console;
  
  private systemMonitor: SystemMonitor;
  private safetyValidator: SafetyValidator;
  private cleanupExecutor: CleanupExecutor;
  private restartManager: RestartManager;
  
  private isInitialized: boolean = false;
  private totalPurges: number = 0;
  private successfulPurges: number = 0;
  private lastPurgeTime?: number;
  private monitoringActive: boolean = false;
  private nextScheduledPurge?: number;
  
  constructor(config?: Partial<PurgeSchedulerConfig>, logger?: Console) {
    this.config = {
      name: 'physical-purge-scheduler',
      version: '1.0.0',
      enabled: true,
      monitoringInterval: 300000, // 5分钟
      memoryThreshold: 2048, // 2GB
      tokenThreshold: 10000, // 10k tokens
      autoPurgeEnabled: false,
      confirmationTimeout: 30000, // 30秒
      backupEnabled: true,
      backupPath: '/tmp/openclaw-backups',
      logLevel: 'info',
      ...config,
    };
    
    this.logger = logger || console;
    
    // 初始化组件（延迟初始化，在initialize方法中完成）
    this.systemMonitor = new SystemMonitor({ logLevel: this.config.logLevel }, this.logger);
    this.safetyValidator = new SafetyValidator({ logLevel: this.config.logLevel }, this.logger);
    this.cleanupExecutor = new CleanupExecutor({ logLevel: this.config.logLevel }, this.logger);
    this.restartManager = new RestartManager({ logLevel: this.config.logLevel }, this.logger);
  }
  
  /**
   * 初始化调度器
   */
  async initialize(config?: PurgeSchedulerConfig): Promise<StorageResult<void>> {
    try {
      this.logger.info('初始化物理清场调度器');
      
      // 更新配置
      if (config) {
        this.config = {
          ...this.config,
          ...config,
        };
      }
      
      // 初始化组件
      const monitorResult = await this.systemMonitor.initialize();
      if (!monitorResult.success) {
        return {
          success: false,
          error: `系统监控器初始化失败: ${monitorResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      const validatorResult = await this.safetyValidator.initialize();
      if (!validatorResult.success) {
        return {
          success: false,
          error: `安全验证器初始化失败: ${validatorResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 清理执行器和重启管理器不需要显式初始化
      
      this.isInitialized = true;
      this.logger.info('物理清场调度器初始化完成');
      
      // 如果启用自动监控，启动监控
      if (this.config.enabled && this.config.autoPurgeEnabled) {
        this.startMonitoring();
      }
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
          initialized: true,
          monitoringStarted: this.monitoringActive,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('初始化物理清场调度器失败:', errMsg);
      
      return {
        success: false,
        error: `初始化失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 监控OpenClaw服务状态
   */
  async monitorOpenClawStatus(): Promise<StorageResult<OpenClawStatus>> {
    try {
      this.logger.debug('监控OpenClaw服务状态');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用系统监控器获取状态
      const statusResult = await this.systemMonitor.monitorOpenClawStatus();
      if (!statusResult.success) {
        return {
          success: false,
          error: `获取服务状态失败: ${statusResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: statusResult.data!,
        metadata: {
          operationTime: Date.now(),
          monitoringActive: this.monitoringActive,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('监控OpenClaw服务状态失败:', errMsg);
      
      return {
        success: false,
        error: `监控失败: ${errMsg}`,
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
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用系统监控器检测性能问题
      const issuesResult = await this.systemMonitor.detectPerformanceIssues();
      if (!issuesResult.success) {
        return {
          success: false,
          error: `检测性能问题失败: ${issuesResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: issuesResult.data!,
        metadata: {
          operationTime: Date.now(),
          issueCount: issuesResult.data!.length,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('检测性能问题失败:', errMsg);
      
      return {
        success: false,
        error: `检测失败: ${errMsg}`,
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
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用系统监控器监控Token淤积
      const tokenResult = await this.systemMonitor.monitorTokenAccumulation();
      if (!tokenResult.success) {
        return {
          success: false,
          error: `监控Token淤积失败: ${tokenResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: tokenResult.data!,
        metadata: {
          operationTime: Date.now(),
          exceedsThreshold: tokenResult.data!.exceedsThreshold,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('监控Token淤积失败:', errMsg);
      
      return {
        success: false,
        error: `监控失败: ${errMsg}`,
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
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用系统监控器监控内存使用
      const memoryResult = await this.systemMonitor.monitorMemoryUsage();
      if (!memoryResult.success) {
        return {
          success: false,
          error: `监控内存使用失败: ${memoryResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: memoryResult.data!,
        metadata: {
          operationTime: Date.now(),
          exceedsThreshold: memoryResult.data!.exceedsThreshold,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('监控内存使用失败:', errMsg);
      
      return {
        success: false,
        error: `监控失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 验证所有记忆已归档
   */
  async verifyAllMemoriesArchived(): Promise<StorageResult<VerificationResult>> {
    try {
      this.logger.debug('验证所有记忆已归档');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用安全验证器验证记忆归档
      const verificationResult = await this.safetyValidator.verifyAllMemoriesArchived();
      if (!verificationResult.success) {
        return {
          success: false,
          error: `验证记忆归档失败: ${verificationResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: verificationResult.data!,
        metadata: {
          operationTime: Date.now(),
          allArchived: verificationResult.data!.allArchived,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('验证所有记忆已归档失败:', errMsg);
      
      return {
        success: false,
        error: `验证失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 验证备份完整性
   */
  async verifyBackupIntegrity(): Promise<StorageResult<BackupVerification>> {
    try {
      this.logger.debug('验证备份完整性');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用安全验证器验证备份完整性
      const backupResult = await this.safetyValidator.verifyBackupIntegrity();
      if (!backupResult.success) {
        return {
          success: false,
          error: `验证备份完整性失败: ${backupResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: backupResult.data!,
        metadata: {
          operationTime: Date.now(),
          backupExists: backupResult.data!.backupExists,
          backupIntegrity: backupResult.data!.backupIntegrity,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('验证备份完整性失败:', errMsg);
      
      return {
        success: false,
        error: `验证失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 检查清理风险
   */
  async assessPurgeRisks(): Promise<StorageResult<RiskAssessment>> {
    try {
      this.logger.debug('检查清理风险');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用安全验证器检查清理风险
      const riskResult = await this.safetyValidator.assessPurgeRisks();
      if (!riskResult.success) {
        return {
          success: false,
          error: `检查清理风险失败: ${riskResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: riskResult.data!,
        metadata: {
          operationTime: Date.now(),
          riskLevel: riskResult.data!.riskLevel,
          canProceed: riskResult.data!.canProceedWithPurge,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('检查清理风险失败:', errMsg);
      
      return {
        success: false,
        error: `检查失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 生成安全报告
   */
  async generateSafetyReport(): Promise<StorageResult<SafetyReport>> {
    try {
      this.logger.debug('生成安全报告');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用安全验证器生成安全报告
      const safetyResult = await this.safetyValidator.generateSafetyReport();
      if (!safetyResult.success) {
        return {
          success: false,
          error: `生成安全报告失败: ${safetyResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: safetyResult.data!,
        metadata: {
          operationTime: Date.now(),
          overallSafety: safetyResult.data!.overallSafety,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('生成安全报告失败:', errMsg);
      
      return {
        success: false,
        error: `生成失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 执行标准清理流程
   */
  async executeStandardPurge(): Promise<StorageResult<PurgeResult>> {
    try {
      this.logger.info('执行标准清理流程');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 执行安全验证
      const safetyReport = await this.generateSafetyReport();
      if (!safetyReport.success) {
        return {
          success: false,
          error: `安全验证失败: ${safetyReport.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 检查是否可以继续清理
      if (safetyReport.data!.recommendedAction !== 'proceed') {
        return {
          success: false,
          error: `不建议执行清理: ${safetyReport.data!.recommendedAction}`,
          metadata: {
            operationTime: Date.now(),
            recommendedAction: safetyReport.data!.recommendedAction,
          },
        };
      }
      
      // 执行清理
      const cleanupResult = await this.cleanupExecutor.executeStandardPurge();
      if (!cleanupResult.success) {
        return {
          success: false,
          error: `清理执行失败: ${cleanupResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 更新统计
      this.totalPurges++;
      if (cleanupResult.data!.success) {
        this.successfulPurges++;
      }
      this.lastPurgeTime = Date.now();
      
      return {
        success: true,
        data: cleanupResult.data!,
        metadata: {
          operationTime: Date.now(),
          purgeNumber: this.totalPurges,
          purgeSuccess: cleanupResult.data!.success,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('执行标准清理流程失败:', errMsg);
      
      return {
        success: false,
        error: `执行失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 执行自定义清理
   */
  async executeCustomPurge(options: PurgeOptions): Promise<StorageResult<PurgeResult>> {
    try {
      this.logger.info('执行自定义清理流程');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 执行清理
      const cleanupResult = await this.cleanupExecutor.executeCustomPurge(options);
      if (!cleanupResult.success) {
        return {
          success: false,
          error: `自定义清理执行失败: ${cleanupResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 更新统计
      this.totalPurges++;
      if (cleanupResult.data!.success) {
        this.successfulPurges++;
      }
      this.lastPurgeTime = Date.now();
      
      return {
        success: true,
        data: cleanupResult.data!,
        metadata: {
          operationTime: Date.now(),
          purgeNumber: this.totalPurges,
          purgeSuccess: cleanupResult.data!.success,
          purgeType: options.purgeType,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('执行自定义清理流程失败:', errMsg);
      
      return {
        success: false,
        error: `执行失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 验证清理结果
   */
  async verifyCleanup(): Promise<StorageResult<CleanupVerification>> {
    try {
      this.logger.debug('验证清理结果');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用清理执行器验证清理结果
      const verificationResult = await this.cleanupExecutor.verifyCleanup();
      if (!verificationResult.success) {
        return {
          success: false,
          error: `验证清理结果失败: ${verificationResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: verificationResult.data!,
        metadata: {
          operationTime: Date.now(),
          verificationPassed: verificationResult.data!.verificationPassed,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('验证清理结果失败:', errMsg);
      
      return {
        success: false,
        error: `验证失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 生成清理报告
   */
  async generateCleanupReport(): Promise<StorageResult<CleanupReport>> {
    try {
      this.logger.debug('生成清理报告');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用清理执行器生成清理报告
      const reportResult = await this.cleanupExecutor.generateCleanupReport();
      if (!reportResult.success) {
        return {
          success: false,
          error: `生成清理报告失败: ${reportResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: reportResult.data!,
        metadata: {
          operationTime: Date.now(),
          reportId: reportResult.data!.reportId,
          purgeTime: reportResult.data!.purgeTime,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('生成清理报告失败:', errMsg);
      
      return {
        success: false,
        error: `生成失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 重启OpenClaw服务
   */
  async restartOpenClawService(): Promise<StorageResult<boolean>> {
    try {
      this.logger.info('重启OpenClaw服务');
      
      if (!this.isInitialized) {
        return {
          success: false,
          error: '调度器未初始化',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 使用重启管理器重启服务
      const restartResult = await this.restartManager.restartService();
      if (!restartResult.success) {
        return {
          success: false,
          error: `重启服务失败: ${restartResult.error}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      return {
        success: true,
        data: restartResult.data!.success,
        metadata: {
          operationTime: Date.now(),
          restartSuccess: restartResult.data!.success,
          duration: restartResult.data!.duration,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('重启OpenClaw服务失败:', errMsg);
      
      return {
        success: false,
        error: `重启失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
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
  } {
    return {
      initialized: this.isInitialized,
      totalPurges: this.totalPurges,
      successfulPurges: this.successfulPurges,
      lastPurgeTime: this.lastPurgeTime,
      monitoringActive: this.monitoringActive,
      nextScheduledPurge: this.nextScheduledPurge,
    };
  }
  
  /**
   * 启用/禁用自动清理
   */
  async setAutoPurgeEnabled(enabled: boolean): Promise<StorageResult<void>> {
    try {
      this.config.autoPurgeEnabled = enabled;
      
      if (enabled && this.isInitialized) {
        this.startMonitoring();
      } else if (!enabled) {
        this.stopMonitoring();
      }
      
      this.logger.info(`自动清理已${enabled ? '启用' : '禁用'}`);
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
          autoPurgeEnabled: enabled,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('设置自动清理状态失败:', errMsg);
      
      return {
        success: false,
        error: `设置失败: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 开始监控
   */
  private startMonitoring(): void {
    if (this.monitoringActive) {
      this.logger.debug('监控已在运行中');
      return;
    }
    
    this.monitoringActive = true;
    this.logger.info('开始自动监控');
    
    // 简化实现：定期检查并调度清理
    // 实际实现应该使用定时器或调度器
    this.scheduleNextPurge();
  }
  
  /**
   * 停止监控
   */
  private stopMonitoring(): void {
    if (!this.monitoringActive) {
      this.logger.debug('监控已停止');
      return;
    }
    
    this.monitoringActive = false;
    this.nextScheduledPurge = undefined;
    this.logger.info('停止自动监控');
  }
  
  /**
   * 调度下一次清理
   */
  private scheduleNextPurge(): void {
    if (!this.monitoringActive || !this.config.autoPurgeEnabled) {
      return;
    }
    
    // 设置下一次清理时间（例如，24小时后）
    const nextPurgeDelay = 24 * 60 * 60 * 1000; // 24小时
    this.nextScheduledPurge = Date.now() + nextPurgeDelay;
    
    this.logger.info(`下一次清理已调度: ${new Date(this.nextScheduledPurge).toLocaleString()}`);
    
    // 简化实现：不实际执行定时清理
    // 实际实现应该使用setTimeout或cron调度器
  }
  
  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<PurgeSchedulerConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    
    this.logger.info('物理清场调度器配置已更新');
    
    // 如果配置变更影响监控状态，重新调整
    if (this.config.autoPurgeEnabled && !this.monitoringActive) {
      this.startMonitoring();
    } else if (!this.config.autoPurgeEnabled && this.monitoringActive) {
      this.stopMonitoring();
    }
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): PurgeSchedulerConfig {
    return { ...this.config };
  }
  
  /**
   * 重置统计
   */
  resetStatistics(): void {
    this.totalPurges = 0;
    this.successfulPurges = 0;
    this.lastPurgeTime = undefined;
    this.logger.info('已重置物理清场调度器统计');
  }
}