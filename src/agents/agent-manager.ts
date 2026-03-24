/**
 * Agent管理器
 * 负责管理多个Agent的上下文、资产和记忆
 */

import { 
  AgentConfig, AgentAsset,
  AssetQueryOptions, AssetSearchResult, StorageResult,
  StorageAdapterConfig
} from '../types';
import { SQLiteSimplifiedAdapter } from '../adapters/sqlite/sqlite-simplified-adapter';

/**
 * Agent管理器配置
 */
export interface AgentManagerConfig {
  /** 存储适配器配置 */
  storage: StorageAdapterConfig;
  /** 默认Agent配置 */
  defaultAgentConfig?: Partial<AgentConfig>;
  /** 上下文大小限制（字符数） */
  contextSizeLimit?: number;
  /** 是否启用自动压缩 */
  autoCompression?: boolean;
  /** 是否启用自动归档 */
  autoArchive?: boolean;
  /** 归档保留天数 */
  archiveRetentionDays?: number;
  /** 日志级别 */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Agent状态
 */
export interface AgentStatus {
  agentId: string;
  displayName: string;
  isActive: boolean;
  lastHeartbeat: number;
  lastError?: string;
  contextSize: number;
  assetCount: number;
  lastArchiveTime?: number;
  metrics: {
    totalQueries: number;
    totalAssets: number;
    lastQueryTime: number;
    averageQueryTime: number;
  };
}

/**
 * 上下文操作选项
 */
export interface ContextOptions {
  compress?: boolean;
  summarize?: boolean;
  includeMetadata?: boolean;
  maxTokens?: number;
}

/**
 * Agent管理器
 */
export class AgentManager {
  private config: AgentManagerConfig;
  private storageAdapter: any = null;
  private agents: Map<string, AgentConfig> = new Map();
  private logger: Console = console;
  private initialized: boolean = false;

  constructor(config: AgentManagerConfig) {
    this.config = {
      contextSizeLimit: 8192,
      autoCompression: true,
      autoArchive: true,
      archiveRetentionDays: 30,
      logLevel: 'info',
      defaultAgentConfig: {
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {
          onSuccess: false,
          onFailure: true,
          onWarning: true,
          dailyReport: false,
          channels: [],
        },
        scheduleEnabled: false,
        version: '1.0.0',
        createdBy: 'system',
        lastModifiedBy: 'system',
        isActive: true,
      },
      ...config,
    };
    
    // 配置日志级别
    this.setupLogger();
  }

  /**
   * 设置日志级别
   */
  private setupLogger(): void {
    if (this.config.logLevel === 'debug') {
      this.logger = console;
    } else if (this.config.logLevel === 'info') {
      this.logger = {
        ...console,
        debug: () => {},
      } as Console;
    } else if (this.config.logLevel === 'warn') {
      this.logger = {
        ...console,
        debug: () => {},
        info: () => {},
      } as Console;
    } else if (this.config.logLevel === 'error') {
      this.logger = {
        ...console,
        debug: () => {},
        info: () => {},
        warn: () => {},
      } as Console;
    }
  }

  /**
   * 初始化Agent管理器
   */
  async initialize(): Promise<StorageResult<void>> {
    try {
      this.logger.info('Initializing Agent Manager...');
      
      // 初始化存储适配器
      const adapterResult = await this.initializeStorageAdapter();
      if (!adapterResult.success) {
        throw new Error(`Failed to initialize storage adapter: ${adapterResult.error}`);
      }
      
      // 加载现有Agent配置
      const loadResult = await this.loadAgentConfigs();
      if (!loadResult.success) {
        this.logger.warn(`Failed to load agent configs: ${loadResult.error}`);
      } else {
        this.logger.info(`Loaded ${this.agents.size} agent configurations`);
      }
      
      this.initialized = true;
      this.logger.info('Agent Manager initialized successfully');
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to initialize Agent Manager:', errMsg);
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
   * 初始化存储适配器
   */
  private async initializeStorageAdapter(): Promise<StorageResult<void>> {
    try {
      // 使用简化SQLite适配器
      this.storageAdapter = new SQLiteSimplifiedAdapter(this.config.storage);
      
      // 连接到数据库
      const connectResult = await this.storageAdapter.connect();
      if (!connectResult.success) {
        throw new Error(`Failed to connect to storage: ${connectResult.error}`);
      }
      
      // 验证适配器
      const validateResult = await this.storageAdapter.validate();
      if (!validateResult.success) {
        throw new Error(`Storage adapter validation failed: ${validateResult.error}`);
      }
      
      this.logger.info('Storage adapter initialized successfully');
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to initialize storage adapter:', errMsg);
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
   * 加载Agent配置
   */
  private async loadAgentConfigs(): Promise<StorageResult<void>> {
    try {
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      const result = await this.storageAdapter.getAllAgentConfigs();
      if (!result.success || !result.data) {
        return result;
      }
      
      for (const config of result.data) {
        this.agents.set(config.agentId, config);
      }
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
          totalCount: this.agents.size,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
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
   * 创建新Agent
   */
  async createAgent(config: Partial<AgentConfig>): Promise<StorageResult<AgentConfig>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      // 验证Agent ID
      if (!config.agentId || config.agentId.trim() === '') {
        throw new Error('Agent ID is required');
      }
      
      // 检查Agent是否已存在
      if (this.agents.has(config.agentId)) {
        throw new Error(`Agent with ID "${config.agentId}" already exists`);
      }
      
      // 构建完整配置
      const now = Date.now();
      const configBase = {
        agentId: config.agentId,
        displayName: config.displayName || config.agentId,
        description: config.description || `Agent ${config.agentId}`,
        expertiseDomains: config.expertiseDomains || [],
        assetTypes: config.assetTypes || [],
        restrictedToTypes: config.restrictedToTypes || false,
        partition: config.partition || 'default',
        retentionDays: config.retentionDays || this.config.defaultAgentConfig!.retentionDays!,
        contextSizeLimit: config.contextSizeLimit || this.config.defaultAgentConfig!.contextSizeLimit!,
        compressionEnabled: config.compressionEnabled ?? this.config.defaultAgentConfig!.compressionEnabled!,
        summaryEnabled: config.summaryEnabled ?? this.config.defaultAgentConfig!.summaryEnabled!,
        encryptionEnabled: config.encryptionEnabled ?? this.config.defaultAgentConfig!.encryptionEnabled!,
        dependencies: config.dependencies || this.config.defaultAgentConfig!.dependencies!,
        notificationSettings: config.notificationSettings || this.config.defaultAgentConfig!.notificationSettings!,
        scheduleEnabled: config.scheduleEnabled ?? this.config.defaultAgentConfig!.scheduleEnabled!,
        scheduleTime: config.scheduleTime || '',
        scheduleTimezone: config.scheduleTimezone || '',
        createdAt: now,
        updatedAt: now,
        version: config.version || this.config.defaultAgentConfig!.version!,
        createdBy: config.createdBy || this.config.defaultAgentConfig!.createdBy!,
        lastModifiedBy: config.lastModifiedBy || this.config.defaultAgentConfig!.lastModifiedBy!,
        isActive: config.isActive ?? this.config.defaultAgentConfig!.isActive!,
        lastHeartbeat: now,
        lastError: '',
      };
      
      // 条件添加可选属性
      const fullConfig: AgentConfig = {
        ...configBase,
        ...(config.storageQuota && { storageQuota: config.storageQuota }),
      };
      
      // 保存到存储
      const saveResult = await this.storageAdapter.createAgentConfig(fullConfig);
      if (!saveResult.success) {
        return saveResult;
      }
      
      // 添加到内存缓存
      this.agents.set(config.agentId, fullConfig);
      
      this.logger.info(`Agent created: ${config.agentId} (${fullConfig.displayName})`);
      
      return {
        success: true,
        data: fullConfig,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to create agent:', errMsg);
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
   * 获取Agent配置
   */
  async getAgent(agentId: string): Promise<StorageResult<AgentConfig>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      // 从内存缓存获取
      const cachedConfig = this.agents.get(agentId);
      if (cachedConfig) {
        return {
          success: true,
          data: cachedConfig,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 从存储获取
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      const result = await this.storageAdapter.getAgentConfig(agentId);
      if (result.success && result.data) {
        this.agents.set(agentId, result.data);
      }
      
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
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
   * 更新Agent配置
   */
  async updateAgent(agentId: string, update: Partial<AgentConfig>): Promise<StorageResult<AgentConfig>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      // 获取现有配置
      const existingResult = await this.getAgent(agentId);
      if (!existingResult.success || !existingResult.data) {
        return existingResult;
      }
      
      // 准备更新数据
      const updateData = {
        ...update,
        updatedAt: Date.now(),
        lastModifiedBy: 'system',
      };
      
      // 调用存储适配器更新
      const result = await this.storageAdapter.updateAgentConfig(agentId, updateData);
      if (result.success && result.data) {
        // 更新内存缓存
        this.agents.set(agentId, result.data);
        this.logger.info(`Agent updated: ${agentId}`);
      }
      
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update agent ${agentId}:`, errMsg);
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
   * 删除Agent
   */
  async deleteAgent(agentId: string): Promise<StorageResult<void>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      const result = await this.storageAdapter.deleteAgentConfig(agentId);
      if (result.success) {
        // 从内存缓存移除
        this.agents.delete(agentId);
        this.logger.info(`Agent deleted: ${agentId}`);
      }
      
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete agent ${agentId}:`, errMsg);
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
   * 获取所有Agent
   */
  async getAllAgents(): Promise<StorageResult<AgentConfig[]>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      return await this.storageAdapter.getAllAgentConfigs();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
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
   * 添加Agent资产
   */
  async addAsset(agentId: string, asset: Omit<AgentAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<StorageResult<AgentAsset>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      // 验证Agent存在
      const agentResult = await this.getAgent(agentId);
      if (!agentResult.success) {
        return {
          success: false,
          error: agentResult.error || `Agent ${agentId} not found`,
          metadata: agentResult.metadata || { operationTime: Date.now() },
        };
      }
      
      const now = Date.now();
      const fullAsset: AgentAsset = {
        ...asset,
        id: `${agentId}-${now}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };
      
      const result = await this.storageAdapter.createAgentAsset(fullAsset);
      if (result.success) {
        this.logger.info(`Asset added to agent ${agentId}: ${fullAsset.id} (${fullAsset.title})`);
      }
      
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to add asset to agent ${agentId}:`, errMsg);
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
   * 获取Agent资产
   */
  async getAssets(agentId: string, options?: { limit?: number; offset?: number }): Promise<StorageResult<AgentAsset[]>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;
      
      return await this.storageAdapter.getAgentAssetsByAgent(agentId, limit, offset);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
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
   * 搜索Agent资产
   */
  async searchAssets(query: AssetQueryOptions): Promise<StorageResult<AssetSearchResult>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      return await this.storageAdapter.searchAgentAssets(query);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
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
   * 获取Agent状态
   */
  async getAgentStatus(agentId: string): Promise<StorageResult<AgentStatus>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      // 获取Agent配置
      const agentResult = await this.getAgent(agentId);
      if (!agentResult.success || !agentResult.data) {
        return {
          success: false,
          error: `Agent not found: ${agentId}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      const config = agentResult.data;
      
      // 获取资产统计
      const assetsResult = await this.getAssets(agentId, { limit: 1 });
      const assetCount = assetsResult.success && assetsResult.data ? assetsResult.data.length : 0;
      
      // 构建状态信息
      const statusBase = {
        agentId: config.agentId,
        displayName: config.displayName,
        isActive: config.isActive,
        lastHeartbeat: config.lastHeartbeat || Date.now(),
        lastError: config.lastError || '',
        contextSize: 0, // 待实现：计算实际上下文大小
        assetCount,
        metrics: {
          totalQueries: 0, // 待实现：从执行日志获取
          totalAssets: assetCount,
          lastQueryTime: Date.now(), // 待实现
          averageQueryTime: 0, // 待实现
        },
      };
      
      // 条件添加可选属性
      const status: AgentStatus = {
        ...statusBase,
        ...(config.lastArchiveTime !== undefined && { lastArchiveTime: config.lastArchiveTime }),
      };
      
      return {
        success: true,
        data: status,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
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
   * 归档旧资产
   */
  async archiveOldAssets(): Promise<StorageResult<number>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      const retentionDays = this.config.archiveRetentionDays || 30;
      const result = await this.storageAdapter.archiveOldAssets(retentionDays);
      
      if (result.success) {
        this.logger.info(`Archived ${result.data} old assets (older than ${retentionDays} days)`);
      }
      
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to archive old assets:', errMsg);
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
   * 运行数据库维护
   */
  async runMaintenance(): Promise<StorageResult<void>> {
    try {
      if (!this.initialized) {
        throw new Error('Agent Manager not initialized');
      }
      
      if (!this.storageAdapter) {
        throw new Error('Storage adapter not initialized');
      }
      
      this.logger.info('Running database maintenance...');
      const result = await this.storageAdapter.runMaintenance();
      
      if (result.success) {
        this.logger.info('Database maintenance completed successfully');
      }
      
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to run database maintenance:', errMsg);
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
   * 关闭Agent管理器
   */
  async shutdown(): Promise<StorageResult<void>> {
    try {
      if (!this.initialized) {
        return {
          success: true,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      if (this.storageAdapter) {
        await this.storageAdapter.disconnect();
      }
      
      this.agents.clear();
      this.initialized = false;
      this.storageAdapter = null;
      
      this.logger.info('Agent Manager shutdown successfully');
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to shutdown Agent Manager:', errMsg);
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
   * 获取管理器状态
   */
  getStatus(): { initialized: boolean; agentCount: number; storageConnected: boolean } {
    return {
      initialized: this.initialized,
      agentCount: this.agents.size,
      storageConnected: this.storageAdapter?.isConnected() || false,
    };
  }
}