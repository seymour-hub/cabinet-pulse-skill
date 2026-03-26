/**
 * 重启管理器
 * 负责控制OpenClaw服务重启，包括优雅停止、状态验证、重启执行和错误恢复
 */

import { StorageResult } from '../../types';

/**
 * 重启管理器配置
 */
export interface RestartManagerConfig {
  /** 优雅停止超时时间（毫秒） */
  gracefulStopTimeout: number;
  /** 强制停止超时时间（毫秒） */
  forceStopTimeout: number;
  /** 重启等待时间（毫秒） */
  restartWaitTime: number;
  /** 健康检查间隔（毫秒） */
  healthCheckInterval: number;
  /** 最大健康检查次数 */
  maxHealthChecks: number;
  /** 是否启用强制停止 */
  forceStopEnabled: boolean;
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** OpenClaw服务路径 */
  servicePath: string;
  /** OpenClaw配置路径 */
  configPath: string;
}

/**
 * 服务状态
 */
export interface ServiceStatus {
  /** 服务是否运行 */
  isRunning: boolean;
  /** 进程ID */
  pid?: number;
  /** 启动时间 */
  startTime?: number;
  /** 内存使用量（MB） */
  memoryUsage?: number;
  /** CPU使用率（百分比） */
  cpuUsage?: number;
  /** 最后错误 */
  lastError?: string;
  /** 健康状态 */
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  /** 健康检查详情 */
  healthDetails: string[];
}

/**
 * 重启结果
 */
export interface RestartResult {
  /** 重启是否成功 */
  success: boolean;
  /** 重启步骤 */
  steps: RestartStep[];
  /** 错误列表 */
  errors: string[];
  /** 警告列表 */
  warnings: string[];
  /** 总执行时间（毫秒） */
  duration: number;
  /** 重启开始时间 */
  startTime: number;
  /** 重启结束时间 */
  endTime: number;
  /** 服务状态变化 */
  statusChange: {
    before: ServiceStatus;
    after: ServiceStatus;
  };
}

/**
 * 重启步骤
 */
export interface RestartStep {
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
 * 重启管理器实现
 */
export class RestartManager {
  private config: RestartManagerConfig;
  private logger: Console;
  
  private restartHistory: RestartResult[] = [];
  private maxHistorySize: number = 20;
  
  constructor(config?: Partial<RestartManagerConfig>, logger?: Console) {
    this.config = {
      gracefulStopTimeout: 30000, // 30秒
      forceStopTimeout: 10000, // 10秒
      restartWaitTime: 5000, // 5秒
      healthCheckInterval: 1000, // 1秒
      maxHealthChecks: 30, // 30次检查，总共30秒
      forceStopEnabled: true,
      logLevel: 'info',
      servicePath: '/usr/local/bin/openclaw',
      configPath: '/root/.openclaw/openclaw.json',
      ...config,
    };
    
    this.logger = logger || console;
  }
  
  /**
   * 执行服务重启
   */
  async restartService(): Promise<StorageResult<RestartResult>> {
    const startTime = Date.now();
    
    try {
      this.logger.info('开始执行OpenClaw服务重启');
      
      // 创建重启步骤列表
      const steps: RestartStep[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // 步骤1: 获取服务当前状态
      steps.push({
        name: 'get_initial_status',
        description: '获取服务当前状态',
        status: 'running',
        startTime: Date.now(),
      });
      
      const initialStatus = await this.getServiceStatus();
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].endTime = Date.now();
      steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
      
      if (!initialStatus.isRunning) {
        warnings.push('服务当前未运行，将直接启动服务');
      }
      
      // 如果服务正在运行，执行优雅停止
      if (initialStatus.isRunning) {
        // 步骤2: 优雅停止服务
        steps.push({
          name: 'graceful_stop',
          description: '执行优雅停止',
          status: 'running',
          startTime: Date.now(),
          dependencies: ['get_initial_status'],
        });
        
        const gracefulStopResult = await this.gracefulStopService();
        if (!gracefulStopResult.success) {
          steps[steps.length - 1].status = 'failed';
          steps[steps.length - 1].error = gracefulStopResult.error;
          steps[steps.length - 1].endTime = Date.now();
          steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
          
          errors.push(`优雅停止失败: ${gracefulStopResult.error}`);
          
          // 如果启用强制停止，尝试强制停止
          if (this.config.forceStopEnabled) {
            steps.push({
              name: 'force_stop',
              description: '执行强制停止（优雅停止失败后）',
              status: 'running',
              startTime: Date.now(),
              dependencies: ['graceful_stop'],
            });
            
            const forceStopResult = await this.forceStopService();
            if (!forceStopResult.success) {
              steps[steps.length - 1].status = 'failed';
              steps[steps.length - 1].error = forceStopResult.error;
              steps[steps.length - 1].endTime = Date.now();
              steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
              
              errors.push(`强制停止失败: ${forceStopResult.error}`);
              
              // 停止失败，中止重启
              return this.createRestartResult({
                success: false,
                steps,
                errors,
                warnings,
                duration: Date.now() - startTime,
                startTime,
                endTime: Date.now(),
                beforeStatus: initialStatus,
                afterStatus: initialStatus,
              });
            } else {
              steps[steps.length - 1].status = 'completed';
              steps[steps.length - 1].endTime = Date.now();
              steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
              
              warnings.push('优雅停止失败，使用强制停止成功');
            }
          }
        } else {
          steps[steps.length - 1].status = 'completed';
          steps[steps.length - 1].endTime = Date.now();
          steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
        }
        
        // 步骤3: 验证服务已停止
        steps.push({
          name: 'verify_stopped',
          description: '验证服务已完全停止',
          status: 'running',
          startTime: Date.now(),
          dependencies: ['graceful_stop', 'force_stop'].filter(name => 
            steps.some(s => s.name === name && s.status === 'completed')
          ),
        });
        
        const verifyStopResult = await this.verifyServiceStopped();
        if (!verifyStopResult.success) {
          steps[steps.length - 1].status = 'failed';
          steps[steps.length - 1].error = verifyStopResult.error;
          steps[steps.length - 1].endTime = Date.now();
          steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
          
          errors.push(`停止验证失败: ${verifyStopResult.error}`);
          
          // 可以尝试强制停止或中止
          warnings.push('服务停止验证失败，继续尝试启动新服务');
        } else {
          steps[steps.length - 1].status = 'completed';
          steps[steps.length - 1].endTime = Date.now();
          steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
        }
        
        // 等待一段时间，确保系统资源释放
        steps.push({
          name: 'wait_before_restart',
          description: '等待系统资源释放',
          status: 'running',
          startTime: Date.now(),
          dependencies: ['verify_stopped'],
        });
        
        await this.wait(this.config.restartWaitTime);
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].endTime = Date.now();
        steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
      }
      
      // 步骤4: 启动服务
      steps.push({
        name: 'start_service',
        description: '启动OpenClaw服务',
        status: 'running',
        startTime: Date.now(),
        dependencies: initialStatus.isRunning ? ['wait_before_restart'] : ['get_initial_status'],
      });
      
      const startResult = await this.startService();
      if (!startResult.success) {
        steps[steps.length - 1].status = 'failed';
        steps[steps.length - 1].error = startResult.error;
        steps[steps.length - 1].endTime = Date.now();
        steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
        
        errors.push(`服务启动失败: ${startResult.error}`);
        
        // 启动失败，尝试恢复
        return this.createRestartResult({
          success: false,
          steps,
          errors,
          warnings,
          duration: Date.now() - startTime,
          startTime,
          endTime: Date.now(),
          beforeStatus: initialStatus,
          afterStatus: initialStatus,
        });
      } else {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].endTime = Date.now();
        steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
      }
      
      // 步骤5: 验证服务已启动
      steps.push({
        name: 'verify_started',
        description: '验证服务已正常启动',
        status: 'running',
        startTime: Date.now(),
        dependencies: ['start_service'],
      });
      
      const verifyStartResult = await this.verifyServiceStarted();
      if (!verifyStartResult.success) {
        steps[steps.length - 1].status = 'failed';
        steps[steps.length - 1].error = verifyStartResult.error;
        steps[steps.length - 1].endTime = Date.now();
        steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
        
        errors.push(`启动验证失败: ${verifyStartResult.error}`);
        
        // 可以尝试额外的恢复措施
        warnings.push('服务启动验证失败，但进程可能已启动');
      } else {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].endTime = Date.now();
        steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
      }
      
      // 步骤6: 执行健康检查
      steps.push({
        name: 'health_check',
        description: '执行服务健康检查',
        status: 'running',
        startTime: Date.now(),
        dependencies: ['verify_started'],
      });
      
      const healthCheckResult = await this.performHealthCheck();
      if (!healthCheckResult.success) {
        steps[steps.length - 1].status = 'failed';
        steps[steps.length - 1].error = healthCheckResult.error;
        steps[steps.length - 1].endTime = Date.now();
        steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
        
        errors.push(`健康检查失败: ${healthCheckResult.error}`);
        warnings.push('服务可能未完全就绪，但已启动');
      } else {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].endTime = Date.now();
        steps[steps.length - 1].executionTime = Date.now() - steps[steps.length - 1].startTime!;
      }
      
      // 获取最终服务状态
      const finalStatus = await this.getServiceStatus();
      
      const overallSuccess = errors.length === 0;
      const duration = Date.now() - startTime;
      const endTime = Date.now();
      
      const result = this.createRestartResult({
        success: overallSuccess,
        steps,
        errors,
        warnings,
        duration,
        startTime,
        endTime,
        beforeStatus: initialStatus,
        afterStatus: finalStatus,
      });
      
      // 保存到历史
      this.restartHistory.push(result);
      if (this.restartHistory.length > this.maxHistorySize) {
        this.restartHistory = this.restartHistory.slice(-this.maxHistorySize);
      }
      
      this.logger.info(`服务重启完成，成功: ${overallSuccess}，耗时: ${duration}ms`);
      
      return {
        success: true,
        data: result,
        metadata: {
          operationTime: Date.now(),
          duration,
          success: overallSuccess,
          stepsCompleted: steps.filter(s => s.status === 'completed').length,
          totalSteps: steps.length,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('执行服务重启失败:', errMsg);
      
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
   * 仅停止服务（不重启）
   */
  async stopService(): Promise<StorageResult<boolean>> {
    try {
      this.logger.info('停止OpenClaw服务');
      
      // 获取当前状态
      const status = await this.getServiceStatus();
      if (!status.isRunning) {
        this.logger.info('服务已停止，无需操作');
        return {
          success: true,
          data: true,
          metadata: {
            operationTime: Date.now(),
            alreadyStopped: true,
          },
        };
      }
      
      // 尝试优雅停止
      const gracefulResult = await this.gracefulStopService();
      if (gracefulResult.success) {
        // 验证停止
        const verifyResult = await this.verifyServiceStopped();
        if (verifyResult.success) {
          this.logger.info('服务优雅停止成功');
          return {
            success: true,
            data: true,
            metadata: {
              operationTime: Date.now(),
              stopMethod: 'graceful',
            },
          };
        }
      }
      
      // 如果优雅停止失败，尝试强制停止
      if (this.config.forceStopEnabled) {
        const forceResult = await this.forceStopService();
        if (forceResult.success) {
          this.logger.info('服务强制停止成功');
          return {
            success: true,
            data: true,
            metadata: {
              operationTime: Date.now(),
              stopMethod: 'force',
            },
          };
        }
      }
      
      return {
        success: false,
        error: '停止服务失败',
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('停止服务失败:', errMsg);
      
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
   * 仅启动服务（如果不运行）
   */
  async startServiceOnly(): Promise<StorageResult<boolean>> {
    try {
      this.logger.info('启动OpenClaw服务');
      
      // 获取当前状态
      const status = await this.getServiceStatus();
      if (status.isRunning) {
        this.logger.info('服务已在运行，无需启动');
        return {
          success: true,
          data: true,
          metadata: {
            operationTime: Date.now(),
            alreadyRunning: true,
          },
        };
      }
      
      // 启动服务
      const startResult = await this.startService();
      if (!startResult.success) {
        return {
          success: false,
          error: startResult.error,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 验证启动
      const verifyResult = await this.verifyServiceStarted();
      if (!verifyResult.success) {
        return {
          success: false,
          error: verifyResult.error,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 健康检查
      const healthResult = await this.performHealthCheck();
      if (!healthResult.success) {
        this.logger.warn('服务启动但健康检查失败');
        // 仍然认为启动成功，但服务可能不完全健康
      }
      
      this.logger.info('服务启动成功');
      return {
        success: true,
        data: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('启动服务失败:', errMsg);
      
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
   * 获取服务状态
   */
  async getServiceStatus(): Promise<ServiceStatus> {
    try {
      // 简化实现：检查OpenClaw进程是否存在
      // 实际实现应该调用OpenClaw API或检查服务状态
      const isRunning = await this.checkServiceRunning();
      
      if (!isRunning) {
        return {
          isRunning: false,
          health: 'unhealthy',
          healthDetails: ['服务未运行'],
        };
      }
      
      // 获取进程信息
      const pid = await this.getServicePid();
      const startTime = await this.getServiceStartTime();
      const memoryUsage = await this.getServiceMemoryUsage();
      const cpuUsage = await this.getServiceCpuUsage();
      
      // 执行基本健康检查
      const healthCheck = await this.performBasicHealthCheck();
      
      return {
        isRunning: true,
        pid,
        startTime,
        memoryUsage,
        cpuUsage,
        health: healthCheck.healthy ? 'healthy' : 'degraded',
        healthDetails: healthCheck.details,
      };
    } catch (error) {
      this.logger.warn('获取服务状态失败:', error);
      return {
        isRunning: false,
        health: 'unknown',
        healthDetails: ['状态检查失败'],
        lastError: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 获取重启历史
   */
  getRestartHistory(): RestartResult[] {
    return [...this.restartHistory];
  }
  
  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RestartManagerConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    
    this.logger.info('重启管理器配置已更新');
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): RestartManagerConfig {
    return { ...this.config };
  }
  
  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.restartHistory = [];
    this.logger.info('已清除重启管理器历史记录');
  }
  
  // ============ 私有方法 ============
  
  /**
   * 创建重启结果
   */
  private createRestartResult(data: {
    success: boolean;
    steps: RestartStep[];
    errors: string[];
    warnings: string[];
    duration: number;
    startTime: number;
    endTime: number;
    beforeStatus: ServiceStatus;
    afterStatus: ServiceStatus;
  }): RestartResult {
    return {
      success: data.success,
      steps: data.steps,
      errors: data.errors,
      warnings: data.warnings,
      duration: data.duration,
      startTime: data.startTime,
      endTime: data.endTime,
      statusChange: {
        before: data.beforeStatus,
        after: data.afterStatus,
      },
    };
  }
  
  /**
   * 检查服务是否运行
   */
  private async checkServiceRunning(): Promise<boolean> {
    try {
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
      this.logger.warn('检查服务运行状态失败:', error);
      return false;
    }
  }
  
  /**
   * 获取服务进程ID
   */
  private async getServicePid(): Promise<number | undefined> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        const result = await execAsync('pgrep -f openclaw | head -1');
        const pid = parseInt(result.stdout.trim());
        return isNaN(pid) ? undefined : pid;
      } catch {
        return undefined;
      }
    } catch (error) {
      this.logger.warn('获取服务PID失败:', error);
      return undefined;
    }
  }
  
  /**
   * 获取服务启动时间
   */
  private async getServiceStartTime(): Promise<number | undefined> {
    try {
      const pid = await this.getServicePid();
      if (!pid) return undefined;
      
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        const result = await execAsync(`ps -o lstart= -p ${pid}`);
        if (result.stdout.trim()) {
          // 解析启动时间字符串（简化实现）
          // 实际应该解析 "Mon Mar 25 14:30:00 2026" 格式
          return Date.now() - 3600000; // 假设1小时前启动
        }
      } catch {
        // 忽略错误
      }
      
      return undefined;
    } catch (error) {
      this.logger.warn('获取服务启动时间失败:', error);
      return undefined;
    }
  }
  
  /**
   * 获取服务内存使用量
   */
  private async getServiceMemoryUsage(): Promise<number | undefined> {
    try {
      const pid = await this.getServicePid();
      if (!pid) return undefined;
      
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        const result = await execAsync(`ps -o rss= -p ${pid}`);
        const rss = parseInt(result.stdout.trim()); // RSS in KB
        return isNaN(rss) ? undefined : Math.floor(rss / 1024); // Convert to MB
      } catch {
        return undefined;
      }
    } catch (error) {
      this.logger.warn('获取服务内存使用量失败:', error);
      return undefined;
    }
  }
  
  /**
   * 获取服务CPU使用率
   */
  private async getServiceCpuUsage(): Promise<number | undefined> {
    try {
      const pid = await this.getServicePid();
      if (!pid) return undefined;
      
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        const result = await execAsync(`ps -o %cpu= -p ${pid}`);
        const cpu = parseFloat(result.stdout.trim());
        return isNaN(cpu) ? undefined : cpu;
      } catch {
        return undefined;
      }
    } catch (error) {
      this.logger.warn('获取服务CPU使用率失败:', error);
      return undefined;
    }
  }
  
  /**
   * 执行基本健康检查
   */
  private async performBasicHealthCheck(): Promise<{ healthy: boolean; details: string[] }> {
    const details: string[] = [];
    let healthy = true;
    
    try {
      // 检查进程是否存在
      const isRunning = await this.checkServiceRunning();
      if (!isRunning) {
        details.push('服务进程不存在');
        healthy = false;
        return { healthy, details };
      }
      
      // 检查内存使用（如果可用）
      const memoryUsage = await this.getServiceMemoryUsage();
      if (memoryUsage && memoryUsage > 2048) { // 超过2GB
        details.push(`内存使用较高: ${memoryUsage}MB`);
        // 不标记为不健康，只是警告
      }
      
      // 检查CPU使用（如果可用）
      const cpuUsage = await this.getServiceCpuUsage();
      if (cpuUsage && cpuUsage > 80) { // 超过80%
        details.push(`CPU使用较高: ${cpuUsage}%`);
        // 不标记为不健康，只是警告
      }
      
      // 简化实现：假设服务健康
      if (details.length === 0) {
        details.push('服务运行正常');
      }
      
      return { healthy, details };
    } catch (error) {
      details.push(`健康检查异常: ${error}`);
      return { healthy: false, details };
    }
  }
  
  /**
   * 优雅停止服务
   */
  private async gracefulStopService(): Promise<StorageResult<void>> {
    try {
      this.logger.info('执行优雅停止服务');
      
      // 简化实现：发送SIGTERM信号
      // 实际实现应该调用OpenClaw的停止API
      const pid = await this.getServicePid();
      if (!pid) {
        return {
          success: false,
          error: '无法获取服务PID',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        // 发送SIGTERM信号
        await execAsync(`kill -TERM ${pid}`);
        
        // 等待进程结束
        const startWait = Date.now();
        while (Date.now() - startWait < this.config.gracefulStopTimeout) {
          const isRunning = await this.checkServiceRunning();
          if (!isRunning) {
            this.logger.info('服务优雅停止成功');
            return {
              success: true,
              metadata: {
                operationTime: Date.now(),
                stopMethod: 'graceful',
                waitTime: Date.now() - startWait,
              },
            };
          }
          await this.wait(500); // 等待500ms
        }
        
        // 超时
        return {
          success: false,
          error: `优雅停止超时（${this.config.gracefulStopTimeout}ms）`,
          metadata: {
            operationTime: Date.now(),
            timeout: true,
          },
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: `优雅停止失败: ${errMsg}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `优雅停止异常: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 强制停止服务
   */
  private async forceStopService(): Promise<StorageResult<void>> {
    try {
      this.logger.warn('执行强制停止服务');
      
      // 简化实现：发送SIGKILL信号
      const pid = await this.getServicePid();
      if (!pid) {
        return {
          success: false,
          error: '无法获取服务PID',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        // 发送SIGKILL信号
        await execAsync(`kill -KILL ${pid}`);
        
        // 等待进程结束
        const startWait = Date.now();
        while (Date.now() - startWait < this.config.forceStopTimeout) {
          const isRunning = await this.checkServiceRunning();
          if (!isRunning) {
            this.logger.warn('服务强制停止成功');
            return {
              success: true,
              metadata: {
                operationTime: Date.now(),
                stopMethod: 'force',
                waitTime: Date.now() - startWait,
              },
            };
          }
          await this.wait(500); // 等待500ms
        }
        
        // 超时
        return {
          success: false,
          error: `强制停止超时（${this.config.forceStopTimeout}ms）`,
          metadata: {
            operationTime: Date.now(),
            timeout: true,
          },
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: `强制停止失败: ${errMsg}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `强制停止异常: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 验证服务已停止
   */
  private async verifyServiceStopped(): Promise<StorageResult<void>> {
    try {
      this.logger.debug('验证服务已停止');
      
      // 执行多次检查，确保服务完全停止
      const maxChecks = 5;
      const checkInterval = 1000; // 1秒
      
      for (let i = 0; i < maxChecks; i++) {
        const isRunning = await this.checkServiceRunning();
        if (!isRunning) {
          this.logger.info('服务已确认停止');
          return {
            success: true,
            metadata: {
              operationTime: Date.now(),
              checksPerformed: i + 1,
            },
          };
        }
        
        await this.wait(checkInterval);
      }
      
      // 如果多次检查后服务仍在运行
      return {
        success: false,
        error: '服务停止验证失败，多次检查后服务仍在运行',
        metadata: {
          operationTime: Date.now(),
          maxChecks,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `停止验证异常: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 验证服务已启动
   */
  private async verifyServiceStarted(): Promise<StorageResult<void>> {
    try {
      this.logger.debug('验证服务已启动');
      
      // 执行多次健康检查，确保服务正常启动
      const maxChecks = this.config.maxHealthChecks;
      const checkInterval = this.config.healthCheckInterval;
      
      for (let i = 0; i < maxChecks; i++) {
        const isRunning = await this.checkServiceRunning();
        if (isRunning) {
          // 执行基本健康检查
          const healthCheck = await this.performBasicHealthCheck();
          if (healthCheck.healthy) {
            this.logger.info('服务已确认启动并健康运行');
            return {
              success: true,
              metadata: {
                operationTime: Date.now(),
                checksPerformed: i + 1,
                healthStatus: 'healthy',
              },
            };
          } else {
            this.logger.warn('服务进程存在但健康检查不通过');
          }
        }
        
        await this.wait(checkInterval);
      }
      
      // 如果多次检查后服务仍未健康运行
      return {
        success: false,
        error: '服务启动验证失败，多次检查后服务仍未健康运行',
        metadata: {
          operationTime: Date.now(),
          maxChecks,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `启动验证异常: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 启动服务
   */
  private async startService(): Promise<StorageResult<void>> {
    try {
      this.logger.info('启动OpenClaw服务');
      
      // 简化实现：通过systemd启动服务
      // 实际实现应该调用OpenClaw启动API或systemd命令
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        // 使用systemd启动服务
        await execAsync('systemctl start openclaw-gateway');
        
        this.logger.info('服务启动命令已执行');
        return {
          success: true,
          metadata: {
            operationTime: Date.now(),
            startMethod: 'systemd',
          },
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        
        // 尝试备用启动方法
        try {
          this.logger.warn('systemd启动失败，尝试直接启动');
          // 直接运行openclaw命令
          await execAsync(`${this.config.servicePath} gateway start --daemon`);
          
          return {
            success: true,
            metadata: {
              operationTime: Date.now(),
              startMethod: 'direct',
              fallbackUsed: true,
            },
          };
        } catch (fallbackError) {
          const fallbackErrMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          return {
            success: false,
            error: `服务启动失败: ${errMsg}, 备用方法也失败: ${fallbackErrMsg}`,
            metadata: {
              operationTime: Date.now(),
            },
          };
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `启动服务异常: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<StorageResult<void>> {
    try {
      this.logger.debug('执行服务健康检查');
      
      // 检查进程是否存在
      const isRunning = await this.checkServiceRunning();
      if (!isRunning) {
        return {
          success: false,
          error: '服务进程不存在',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 获取服务状态
      const status = await this.getServiceStatus();
      
      if (status.health === 'healthy') {
        return {
          success: true,
          metadata: {
            operationTime: Date.now(),
            healthStatus: 'healthy',
            memoryUsage: status.memoryUsage,
            cpuUsage: status.cpuUsage,
          },
        };
      } else {
        return {
          success: false,
          error: `服务不健康: ${status.healthDetails.join(', ')}`,
          metadata: {
            operationTime: Date.now(),
            healthStatus: status.health,
            healthDetails: status.healthDetails,
          },
        };
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `健康检查异常: ${errMsg}`,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 等待指定时间
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
