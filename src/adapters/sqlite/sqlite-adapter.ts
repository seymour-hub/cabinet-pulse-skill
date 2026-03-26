/**
 * SQLite 存储适配器
 * 实现 Cabinet Pulse Skill 的数据持久化层
 * 实现 IEnhancedStorageAdapter 接口
 */

import { Database, Statement } from 'better-sqlite3';
import { 
  AgentAsset, AgentConfig, AgentConfigUpdate,
  StorageResult, BulkResult, AssetQueryOptions, AssetSearchResult,
  StorageAdapterConfig, StorageAdapterStatus,
  AssetType, StorageType, AccessLevel
} from '../../types';
import { TABLES } from './schema';
import { MigrationManager } from './migrations';

/**
 * SQLite 存储适配器配置
 */
export interface SQLiteAdapterConfig extends StorageAdapterConfig {
  databasePath: string;
  readonly?: boolean;
  timeout?: number;
  verbose?: boolean;
  journalMode?: 'WAL' | 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'OFF';
  synchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
  foreignKeys?: boolean;
  busyTimeout?: number;
}

/**
 * SQLite 存储适配器
 */
export class SQLiteAdapter {
  private db: Database | null = null;
  private config: SQLiteAdapterConfig;
  private migrationManager: MigrationManager | null = null;
  private preparedStatements: Map<string, Statement> = new Map();
  private status: StorageAdapterStatus = {
    connected: false,
    ready: false,
    version: '1.0.0',
    health: {
      healthy: false,
      message: 'Not connected',
    },
    metrics: {
      totalConnections: 0,
      activeConnections: 0,
      queryCount: 0,
      errorCount: 0,
      averageQueryTime: 0,
    },
  };
  
  constructor(config: StorageAdapterConfig) {
    // 将通用配置转换为SQLite特定配置
    const databasePath = this.extractDatabasePath(config.connectionString);
    const defaults = {
      readonly: false,
      timeout: 5000,
      verbose: false,
      journalMode: 'WAL' as const,
      synchronous: 'NORMAL' as const,
      foreignKeys: true,
      busyTimeout: 5000,
    };
    
    this.config = {
      ...config,
      databasePath: databasePath,
      // SQLite特定配置默认值
      ...defaults,
    } as SQLiteAdapterConfig;
  }
  
  /**
   * 从连接字符串提取数据库路径
   */
  private extractDatabasePath(connectionString: string): string {
    // SQLite连接字符串格式处理
    // 1. sqlite:///path/to/database.db -> /path/to/database.db
    // 2. sqlite://:memory: -> :memory: (内存数据库)
    // 3. sqlite:path/to/db -> path/to/db
    // 4. 直接路径 -> 原样返回
    
    // 移除sqlite://前缀
    if (connectionString.startsWith('sqlite://')) {
      const pathPart = connectionString.substring('sqlite://'.length);
      // 如果以/开头，是文件路径，否则可能是特殊标识符如:memory:
      return pathPart;
    }
    
    // 移除sqlite:前缀
    if (connectionString.startsWith('sqlite:')) {
      return connectionString.substring('sqlite:'.length);
    }
    
    return connectionString;
  }
  
  /**
   * 初始化适配器
   */
  async initialize(config: StorageAdapterConfig): Promise<StorageResult<void>> {
    try {
      const databasePath = this.extractDatabasePath(config.connectionString);
      const defaults = {
        readonly: false,
        timeout: 5000,
        verbose: false,
        journalMode: 'WAL' as const,
        synchronous: 'NORMAL' as const,
        foreignKeys: true,
        busyTimeout: 5000,
      };
      
      this.config = {
        ...config,
        databasePath: databasePath,
        // SQLite特定配置默认值
        ...defaults,
      } as SQLiteAdapterConfig;
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 连接到数据库
   */
  async connect(): Promise<StorageResult<boolean>> {
    try {
      console.log(`Connecting to SQLite database: ${this.config.databasePath}`);
      console.log(`Config:`, JSON.stringify({
        databasePath: this.config.databasePath,
        readonly: this.config.readonly,
        timeout: this.config.timeout,
      }, null, 2));
      
      // 使用require加载better-sqlite3（Jest环境中动态import可能有问题）
      let Database;
      try {
        // 尝试CommonJS require
        const sqlite3 = require('better-sqlite3');
        Database = sqlite3.default || sqlite3;
        console.log('better-sqlite3 module loaded via require');
      } catch (requireError) {
        console.error('Failed to require better-sqlite3:', requireError);
        // 回退到动态import
        try {
          const sqlite3 = await import('better-sqlite3');
          Database = (sqlite3 as any).default || sqlite3;
          console.log('better-sqlite3 module loaded via dynamic import');
        } catch (importError) {
          console.error('Both require and import failed:', importError);
          throw new Error(`better-sqlite3 module load failed: ${importError}`);
        }
      }
      
      // 打开数据库连接
      console.log('Creating Database instance...');
      this.db = new Database(
        this.config.databasePath,
        {
          readonly: this.config.readonly,
          timeout: this.config.timeout,
          verbose: this.config.verbose ? console.log : undefined,
        }
      ) as Database;
      console.log('Database instance created');
      
      // 配置数据库参数
      this.db.pragma(`journal_mode = ${this.config.journalMode}`);
      this.db.pragma(`synchronous = ${this.config.synchronous}`);
      this.db.pragma(`foreign_keys = ${this.config.foreignKeys ? 'ON' : 'OFF'}`);
      this.db.pragma(`busy_timeout = ${this.config.busyTimeout}`);
      
      // 初始化迁移管理器
      this.migrationManager = new MigrationManager(this.db);
      
      // 运行迁移
      const migrationSuccess = this.migrationManager.migrateToLatest();
      if (!migrationSuccess) {
        console.error('Database migration failed');
        return {
          success: false,
          error: 'Database migration failed',
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 准备常用语句
      this.prepareStatements();
      
      console.log(`SQLite adapter connected to: ${this.config.databasePath}`);
      console.log(`Database version: ${this.migrationManager.getCurrentVersion()}`);
      
      // 更新状态
      this.status = {
        connected: true,
        ready: true,
        version: '1.0.0',
        health: {
          healthy: true,
          message: 'Connected and ready',
          details: {
            databasePath: this.config.databasePath,
            version: this.migrationManager.getCurrentVersion(),
          },
        },
        metrics: {
          totalConnections: 1,
          activeConnections: 1,
          queryCount: 0,
          errorCount: 0,
          averageQueryTime: 0,
        },
      };
      
      return {
        success: true,
        data: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      console.error('Failed to connect to SQLite database:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('Error code:', (error as any).code || 'UNKNOWN');
      this.db = null;
      
      // 更新状态
      this.status.health = {
        healthy: false,
        message: error instanceof Error ? error.message : String(error),
      };
      this.status.metrics.errorCount++;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
          errorDetails: {
            message: error instanceof Error ? error.message : String(error),
            code: (error as any).code || 'UNKNOWN',
            databasePath: this.config.databasePath,
          },
        },
      };
    }
  }
  
  /**
   * 断开数据库连接
   */
  async disconnect(): Promise<StorageResult<void>> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.migrationManager = null;
      this.preparedStatements.clear();
      
      // 更新状态
      this.status.connected = false;
      this.status.ready = false;
      this.status.health = {
        healthy: false,
        message: 'Disconnected',
      };
      
      console.log('SQLite adapter disconnected');
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
    
    return {
      success: true,
      metadata: {
        operationTime: Date.now(),
      },
    };
  }
  
  /**
   * 获取适配器状态
   */
  getStatus(): StorageAdapterStatus {
    // 更新健康状态
    if (this.migrationManager) {
      const health = this.migrationManager.checkHealth();
      this.status.health = {
        healthy: health.healthy,
        message: health.healthy ? 'Healthy' : health.errors.join(', '),
        details: health,
      };
    }
    
    return this.status;
  }
  
  /**
   * 验证适配器配置
   */
  async validate(): Promise<StorageResult<boolean>> {
    try {
      // 检查数据库文件是否存在或可创建
      const fs = await import('fs');
      const path = await import('path');
      
      const dir = path.dirname(this.config.databasePath);
      try {
        await fs.promises.access(dir, fs.constants.W_OK);
      } catch (error) {
        // 尝试创建目录
        await fs.promises.mkdir(dir, { recursive: true });
      }
      
      // 测试数据库连接
      if (this.db) {
        const testResult = this.db.prepare('SELECT 1 as test').get() as any;
        if (!testResult || testResult.test !== 1) {
          throw new Error('Database test query failed');
        }
      }
      
      return {
        success: true,
        data: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.db !== null;
  }
  
  /**
   * 获取数据库健康状态
   */
  getHealthStatus() {
    if (!this.migrationManager) {
      return { healthy: false, error: 'Not connected' };
    }
    return this.migrationManager.checkHealth();
  }
  
  /**
   * 准备常用SQL语句
   */
  private prepareStatements(): void {
    if (!this.db) return;
    
    // Agent配置相关语句
    this.preparedStatements.set('insert_agent_config', this.db.prepare(`
      INSERT OR REPLACE INTO ${TABLES.AGENT_CONFIGS} (
        agent_id, display_name, description, expertise_domains, asset_types,
        restricted_to_types, partition, storage_quota, retention_days,
        context_size_limit, compression_enabled, summary_enabled, encryption_enabled,
        dependencies, notification_settings, schedule_enabled, schedule_time,
        schedule_timezone, created_at, updated_at, version, created_by, last_modified_by,
        is_active, last_heartbeat, last_archive_time, last_error
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `));
    
    this.preparedStatements.set('select_agent_config', this.db.prepare(`
      SELECT * FROM ${TABLES.AGENT_CONFIGS} WHERE agent_id = ?
    `));
    
    this.preparedStatements.set('select_all_agent_configs', this.db.prepare(`
      SELECT * FROM ${TABLES.AGENT_CONFIGS} ORDER BY display_name
    `));
    
    this.preparedStatements.set('update_agent_config', this.db.prepare(`
      UPDATE ${TABLES.AGENT_CONFIGS} SET
        display_name = ?, description = ?, expertise_domains = ?, asset_types = ?,
        restricted_to_types = ?, partition = ?, storage_quota = ?, retention_days = ?,
        context_size_limit = ?, compression_enabled = ?, summary_enabled = ?,
        encryption_enabled = ?, dependencies = ?, notification_settings = ?,
        schedule_enabled = ?, schedule_time = ?, schedule_timezone = ?,
        updated_at = ?, version = ?, last_modified_by = ?,
        is_active = ?, last_heartbeat = ?, last_archive_time = ?, last_error = ?
      WHERE agent_id = ?
    `));
    
    this.preparedStatements.set('delete_agent_config', this.db.prepare(`
      DELETE FROM ${TABLES.AGENT_CONFIGS} WHERE agent_id = ?
    `));
    
    // Agent资产相关语句
    this.preparedStatements.set('insert_agent_asset', this.db.prepare(`
      INSERT OR REPLACE INTO ${TABLES.AGENT_ASSETS} (
        id, agent_id, asset_type, partition, title, content, summary,
        keywords, source_context, source_timestamp, confidence, version,
        previous_asset_id, change_log, created_at, updated_at,
        storage_backend, storage_id, access_level, allowed_agents,
        is_archived, archived_at, archive_location
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `));
    
    this.preparedStatements.set('select_agent_asset', this.db.prepare(`
      SELECT * FROM ${TABLES.AGENT_ASSETS} WHERE id = ?
    `));
    
    this.preparedStatements.set('select_agent_assets_by_agent', this.db.prepare(`
      SELECT * FROM ${TABLES.AGENT_ASSETS} 
      WHERE agent_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `));
    
    this.preparedStatements.set('update_agent_asset', this.db.prepare(`
      UPDATE ${TABLES.AGENT_ASSETS} SET
        title = ?, content = ?, summary = ?, keywords = ?, source_context = ?,
        source_timestamp = ?, confidence = ?, version = ?, previous_asset_id = ?,
        change_log = ?, updated_at = ?, storage_backend = ?, storage_id = ?,
        access_level = ?, allowed_agents = ?, is_archived = ?, archived_at = ?,
        archive_location = ?
      WHERE id = ?
    `));
    
    this.preparedStatements.set('delete_agent_asset', this.db.prepare(`
      DELETE FROM ${TABLES.AGENT_ASSETS} WHERE id = ?
    `));
    
    // 执行日志相关语句
    this.preparedStatements.set('insert_execution_log', this.db.prepare(`
      INSERT INTO ${TABLES.EXECUTION_LOGS} (
        id, operation_type, agent_id, asset_id, status, start_time, end_time,
        duration_ms, input_data, output_data, error_message, error_stack,
        retry_count, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `));
    
    // 系统指标相关语句
    this.preparedStatements.set('insert_system_metric', this.db.prepare(`
      INSERT INTO ${TABLES.SYSTEM_METRICS} (
        id, metric_type, agent_id, timestamp, value, unit, tags, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `));
    
    // 日报相关语句
    this.preparedStatements.set('insert_daily_report', this.db.prepare(`
      INSERT OR REPLACE INTO ${TABLES.DAILY_REPORTS} (
        id, report_date, agent_id, report_type, title, content, summary,
        metrics, recommendations, generated_at, generated_by, delivered_to,
        delivery_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `));
    
    console.log(`Prepared ${this.preparedStatements.size} SQL statements`);
  }
  
  /**
   * 执行事务
   */
  async transaction<T>(operation: () => T): Promise<T> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    
    this.db.exec('BEGIN TRANSACTION');
    
    try {
      const result = operation();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * Agent配置操作
   */
  
  async createAgentConfig(config: AgentConfig): Promise<StorageResult<AgentConfig>> {
    try {
      const stmt = this.preparedStatements.get('insert_agent_config');
      if (!stmt) throw new Error('Statement not prepared');
      
      stmt.run(
        config.agentId,
        config.displayName,
        config.description,
        JSON.stringify(config.expertiseDomains),
        JSON.stringify(config.assetTypes),
        config.restrictedToTypes ? 1 : 0,
        config.partition,
        config.storageQuota ? JSON.stringify(config.storageQuota) : null,
        config.retentionDays,
        config.contextSizeLimit,
        config.compressionEnabled ? 1 : 0,
        config.summaryEnabled ? 1 : 0,
        config.encryptionEnabled ? 1 : 0,
        JSON.stringify(config.dependencies),
        JSON.stringify(config.notificationSettings),
        config.scheduleEnabled ? 1 : 0,
        config.scheduleTime,
        config.scheduleTimezone,
        config.createdAt,
        config.updatedAt,
        config.version,
        config.createdBy,
        config.lastModifiedBy,
        config.isActive ? 1 : 0,
        config.lastHeartbeat,
        config.lastArchiveTime,
        config.lastError
      );
      
      return {
        success: true,
        data: config,
        metadata: {
          operationTime: Date.now(),
          affectedRows: 1,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('createAgentConfig SQLite Error Details:', {
        message: errMsg,
        stack: error instanceof Error ? error.stack : 'No stack',
        code: (error as any)?.code,
        errno: (error as any)?.errno,
        sqlState: (error as any)?.sqlState
      });
      console.error('Config data being inserted:', {
        agentId: config.agentId,
        displayName: config.displayName,
        expertiseDomains: config.expertiseDomains,
        assetTypes: config.assetTypes
      });
      return {
        success: false,
        error: errMsg,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  async getAgentConfig(agentId: string): Promise<StorageResult<AgentConfig>> {
    try {
      const stmt = this.preparedStatements.get('select_agent_config');
      if (!stmt) throw new Error('Statement not prepared');
      
      const row = stmt.get(agentId) as any;
      if (!row) {
        return {
          success: false,
          error: `Agent config not found: ${agentId}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 解析JSON字段
      const config: AgentConfig = {
        agentId: row.agent_id,
        displayName: row.display_name,
        description: row.description,
        expertiseDomains: JSON.parse(row.expertise_domains),
        assetTypes: JSON.parse(row.asset_types),
        restrictedToTypes: row.restricted_to_types === 1,
        partition: row.partition,
        storageQuota: row.storage_quota ? JSON.parse(row.storage_quota) : undefined,
        retentionDays: row.retention_days,
        contextSizeLimit: row.context_size_limit,
        compressionEnabled: row.compression_enabled === 1,
        summaryEnabled: row.summary_enabled === 1,
        encryptionEnabled: row.encryption_enabled === 1,
        dependencies: JSON.parse(row.dependencies),
        notificationSettings: JSON.parse(row.notification_settings),
        scheduleEnabled: row.schedule_enabled === 1,
        scheduleTime: row.schedule_time,
        scheduleTimezone: row.schedule_timezone,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version,
        createdBy: row.created_by,
        lastModifiedBy: row.last_modified_by,
        isActive: row.is_active === 1,
        lastHeartbeat: row.last_heartbeat,
        lastArchiveTime: row.last_archive_time,
        lastError: row.last_error,
      };
      
      return {
        success: true,
        data: config,
        metadata: {
          operationTime: Date.now(),
          queryTime: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  async getAllAgentConfigs(): Promise<StorageResult<AgentConfig[]>> {
    try {
      const stmt = this.preparedStatements.get('select_all_agent_configs');
      if (!stmt) throw new Error('Statement not prepared');
      
      const rows = stmt.all() as any[];
      const configs: AgentConfig[] = rows.map(row => ({
        agentId: row.agent_id,
        displayName: row.display_name,
        description: row.description,
        expertiseDomains: JSON.parse(row.expertise_domains),
        assetTypes: JSON.parse(row.asset_types),
        restrictedToTypes: row.restricted_to_types === 1,
        partition: row.partition,
        storageQuota: row.storage_quota ? JSON.parse(row.storage_quota) : undefined,
        retentionDays: row.retention_days,
        contextSizeLimit: row.context_size_limit,
        compressionEnabled: row.compression_enabled === 1,
        summaryEnabled: row.summary_enabled === 1,
        encryptionEnabled: row.encryption_enabled === 1,
        dependencies: JSON.parse(row.dependencies),
        notificationSettings: JSON.parse(row.notification_settings),
        scheduleEnabled: row.schedule_enabled === 1,
        scheduleTime: row.schedule_time,
        scheduleTimezone: row.schedule_timezone,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        version: row.version,
        createdBy: row.created_by,
        lastModifiedBy: row.last_modified_by,
        isActive: row.is_active === 1,
        lastHeartbeat: row.last_heartbeat,
        lastArchiveTime: row.last_archive_time,
        lastError: row.last_error,
      }));
      
      return {
        success: true,
        data: configs,
        metadata: {
          operationTime: Date.now(),
          queryTime: Date.now(),
          totalCount: configs.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  async updateAgentConfig(agentId: string, update: AgentConfigUpdate): Promise<StorageResult<AgentConfig>> {
    try {
      // 先获取现有配置
      const existingResult = await this.getAgentConfig(agentId);
      if (!existingResult.success || !existingResult.data) {
        return existingResult;
      }
      
      const existing = existingResult.data;
      
      // 应用更新
      const updated: AgentConfig = {
        ...existing,
        ...update,
        updatedAt: Date.now(),
        lastModifiedBy: 'system',
      };
      
      const stmt = this.preparedStatements.get('update_agent_config');
      if (!stmt) throw new Error('Statement not prepared');
      
      stmt.run(
        updated.displayName,
        updated.description,
        JSON.stringify(updated.expertiseDomains),
        JSON.stringify(updated.assetTypes),
        updated.restrictedToTypes ? 1 : 0,
        updated.partition,
        updated.storageQuota ? JSON.stringify(updated.storageQuota) : null,
        updated.retentionDays,
        updated.contextSizeLimit,
        updated.compressionEnabled ? 1 : 0,
        updated.summaryEnabled ? 1 : 0,
        updated.encryptionEnabled ? 1 : 0,
        JSON.stringify(updated.dependencies),
        JSON.stringify(updated.notificationSettings),
        updated.scheduleEnabled ? 1 : 0,
        updated.scheduleTime,
        updated.scheduleTimezone,
        updated.updatedAt,
        updated.version,
        updated.lastModifiedBy,
        updated.isActive ? 1 : 0,
        updated.lastHeartbeat,
        updated.lastArchiveTime,
        updated.lastError,
        agentId
      );
      
      return {
        success: true,
        data: updated,
        metadata: {
          operationTime: Date.now(),
          affectedRows: 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  async deleteAgentConfig(agentId: string): Promise<StorageResult<void>> {
    try {
      const stmt = this.preparedStatements.get('delete_agent_config');
      if (!stmt) throw new Error('Statement not prepared');
      
      const result = stmt.run(agentId);
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
          affectedRows: result.changes,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * Agent资产操作
   */
  
  async createAgentAsset(asset: AgentAsset): Promise<StorageResult<AgentAsset>> {
    try {
      const stmt = this.preparedStatements.get('insert_agent_asset');
      if (!stmt) throw new Error('Statement not prepared');
      
      stmt.run(
        asset.id,
        asset.agentId,
        asset.assetType,
        asset.partition,
        asset.title,
        asset.content,
        asset.summary,
        JSON.stringify(asset.keywords),
        asset.sourceContext,
        asset.sourceTimestamp,
        asset.confidence,
        asset.version,
        asset.previousAssetId,
        asset.changeLog ? JSON.stringify(asset.changeLog) : null,
        asset.createdAt,
        asset.updatedAt,
        asset.storageBackend,
        asset.storageId,
        asset.accessLevel,
        asset.allowedAgents ? JSON.stringify(asset.allowedAgents) : null,
        0, // is_archived
        null, // archived_at
        null // archive_location
      );
      
      return {
        success: true,
        data: asset,
        metadata: {
          operationTime: Date.now(),
          affectedRows: 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  async getAgentAsset(assetId: string): Promise<StorageResult<AgentAsset>> {
    try {
      const stmt = this.preparedStatements.get('select_agent_asset');
      if (!stmt) throw new Error('Statement not prepared');
      
      const row = stmt.get(assetId) as any;
      if (!row) {
        return {
          success: false,
          error: `Agent asset not found: ${assetId}`,
          metadata: {
            operationTime: Date.now(),
          },
        };
      }
      
      // 解析JSON字段
      const asset: AgentAsset = {
        id: row.id,
        agentId: row.agent_id,
        assetType: row.asset_type as AssetType,
        partition: row.partition,
        title: row.title,
        content: row.content,
        summary: row.summary,
        keywords: JSON.parse(row.keywords),
        sourceContext: row.source_context,
        sourceTimestamp: row.source_timestamp,
        confidence: row.confidence,
        version: row.version,
        previousAssetId: row.previous_asset_id,
        changeLog: row.change_log ? JSON.parse(row.change_log) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        storageBackend: row.storage_backend as StorageType,
        storageId: row.storage_id,
        accessLevel: row.access_level as AccessLevel,
        allowedAgents: row.allowed_agents ? JSON.parse(row.allowed_agents) : undefined,
      };
      
      return {
        success: true,
        data: asset,
        metadata: {
          operationTime: Date.now(),
          queryTime: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  async getAgentAssetsByAgent(agentId: string, limit: number = 100, offset: number = 0): Promise<StorageResult<AgentAsset[]>> {
    try {
      const stmt = this.preparedStatements.get('select_agent_assets_by_agent');
      if (!stmt) throw new Error('Statement not prepared');
      
      const rows = stmt.all(agentId, limit, offset) as any[];
      const assets: AgentAsset[] = rows.map(row => ({
        id: row.id,
        agentId: row.agent_id,
        assetType: row.asset_type as AssetType,
        partition: row.partition,
        title: row.title,
        content: row.content,
        summary: row.summary,
        keywords: JSON.parse(row.keywords),
        sourceContext: row.source_context,
        sourceTimestamp: row.source_timestamp,
        confidence: row.confidence,
        version: row.version,
        previousAssetId: row.previous_asset_id,
        changeLog: row.change_log ? JSON.parse(row.change_log) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        storageBackend: row.storage_backend as StorageType,
        storageId: row.storage_id,
        accessLevel: row.access_level as AccessLevel,
        allowedAgents: row.allowed_agents ? JSON.parse(row.allowed_agents) : undefined,
      }));
      
      return {
        success: true,
        data: assets,
        metadata: {
          operationTime: Date.now(),
          queryTime: Date.now(),
          totalCount: assets.length,
          limit,
          offset,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 搜索Agent资产
   */
  async searchAgentAssets(query: AssetQueryOptions): Promise<StorageResult<AssetSearchResult>> {
    try {
      const db = this.db;
      if (!db) {
        return {
          success: false,
          error: 'Database not connected',
          metadata: { operationTime: Date.now() },
        };
      }
      
      // 构建基础查询
      let sql = `SELECT * FROM ${TABLES.AGENT_ASSETS} WHERE 1=1`;
      const params: any[] = [];
      
      if (query.agentId) {
        sql += ` AND agent_id = ?`;
        params.push(query.agentId);
      }
      
      if (query.assetType) {
        sql += ` AND asset_type = ?`;
        params.push(query.assetType);
      }
      
      if (query.partition) {
        sql += ` AND partition = ?`;
        params.push(query.partition);
      }
      
      if (query.keywords && query.keywords.length > 0) {
        // 简单实现：检查关键词是否在JSON数组中
        sql += ` AND keywords LIKE ?`;
        params.push(`%${query.keywords[0]}%`);
      }
      
      if (query.startTime) {
        sql += ` AND created_at >= ?`;
        params.push(query.startTime);
      }
      
      if (query.endTime) {
        sql += ` AND created_at <= ?`;
        params.push(query.endTime);
      }
      
      // 排序
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      sql += ` ORDER BY ${this.mapSortField(sortBy)} ${sortOrder.toUpperCase()}`;
      
      // 分页
      const limit = query.limit || 100;
      const offset = query.offset || 0;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      // 执行查询
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as any[];
      
      // 转换结果
      const assets: AgentAsset[] = rows.map(row => ({
        id: row.id,
        agentId: row.agent_id,
        assetType: row.asset_type as AssetType,
        partition: row.partition,
        title: row.title,
        content: row.content,
        summary: row.summary,
        keywords: JSON.parse(row.keywords),
        sourceContext: row.source_context,
        sourceTimestamp: row.source_timestamp,
        confidence: row.confidence,
        version: row.version,
        previousAssetId: row.previous_asset_id,
        changeLog: row.change_log ? JSON.parse(row.change_log) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        storageBackend: row.storage_backend as StorageType,
        storageId: row.storage_id,
        accessLevel: row.access_level as AccessLevel,
        allowedAgents: row.allowed_agents ? JSON.parse(row.allowed_agents) : undefined,
      }));
      
      // 获取总数
      const countSql = sql.replace(/SELECT \* FROM/, 'SELECT COUNT(*) as total FROM').split('ORDER BY')[0]?.split('LIMIT')[0] || sql.replace(/SELECT \* FROM/, 'SELECT COUNT(*) as total FROM');
      const countStmt = db.prepare(countSql);
      
      // 计算countSql需要的参数数量（排除LIMIT和OFFSET参数）
      let countParamCount = params.length;
      if (sql.includes('LIMIT ?')) {
        countParamCount -= 2; // 排除limit和offset参数
      }
      const countParams = params.filter((p): p is string | number => p !== undefined).slice(0, Math.max(0, countParamCount));
      const countResult = countStmt.get(...countParams) as { total: number };
      const totalCount = countResult.total;
      
      return {
        success: true,
        data: {
          assets,
          totalCount,
          queryTime: Date.now(),
        },
        metadata: {
          operationTime: Date.now(),
          queryTime: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 映射排序字段到数据库列名
   */
  private mapSortField(field: string): string {
    const mapping: Record<string, string> = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'title': 'title',
    };
    return mapping[field] || field;
  }
  
  /**
   * 批量操作
   */
  async bulkCreateAgentAssets(assets: AgentAsset[]): Promise<BulkResult> {
    const results: BulkResult = {
      total: assets.length,
      successful: 0,
      failed: 0,
      errors: [],
    };
    
    const startTime = Date.now();
    
    for (const asset of assets) {
      try {
        await this.createAgentAsset(asset);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          itemId: asset.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    results.metadata = {
      totalTime,
      averageTimePerItem: totalTime / assets.length,
    };
    
    return results;
  }
  
  /**
   * 数据归档操作
   */
  async archiveOldAssets(retentionDays: number = 30): Promise<StorageResult<number>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      
      const stmt = this.db.prepare(`
        UPDATE ${TABLES.AGENT_ASSETS} 
        SET is_archived = 1, archived_at = ?, archive_location = 'cold_storage'
        WHERE created_at < ? AND is_archived = 0
      `);
      
      const result = stmt.run(Date.now(), cutoffTime);
      
      return {
        success: true,
        data: result.changes,
        metadata: {
          operationTime: Date.now(),
          affectedRows: result.changes,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 数据清理操作
   */
  async cleanupArchivedAssets(olderThanDays: number = 90): Promise<StorageResult<number>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      
      const stmt = this.db.prepare(`
        DELETE FROM ${TABLES.AGENT_ASSETS} 
        WHERE is_archived = 1 AND archived_at < ?
      `);
      
      const result = stmt.run(cutoffTime);
      
      return {
        success: true,
        data: result.changes,
        metadata: {
          operationTime: Date.now(),
          affectedRows: result.changes,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 数据库维护操作
   */
  async runMaintenance(): Promise<StorageResult<void>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      // 运行VACUUM命令来整理数据库文件
      this.db.exec('VACUUM');
      
      // 重新构建索引
      this.db.exec('REINDEX');
      
      // 更新统计信息
      this.db.exec('ANALYZE');
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  /**
   * 备份数据库
   */
  async backup(backupPath: string): Promise<StorageResult<void>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      // 使用SQLite的备份API
      const backup = this.db.backup(backupPath);
      
      return new Promise((resolve, reject) => {
        // @ts-ignore - better-sqlite3 backup API types
        backup.step(-1, (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            // @ts-ignore - better-sqlite3 backup API types
            backup.finish();
            resolve({
              success: true,
              metadata: {
                operationTime: Date.now(),
              },
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  // 存根方法 - 暂时未实现
  async updateAgentAsset(_assetId: string, _asset: Partial<AgentAsset>): Promise<StorageResult<AgentAsset>> {
    throw new Error('Method not implemented');
  }
  
  async deleteAgentAsset(_assetId: string): Promise<StorageResult<void>> {
    throw new Error('Method not implemented');
  }
  
  async bulkUpdateAgentAssets(_updates: Array<{ assetId: string; asset: Partial<AgentAsset> }>): Promise<BulkResult> {
    throw new Error('Method not implemented');
  }
  
  async bulkDeleteAgentAssets(_assetIds: string[]): Promise<BulkResult> {
    throw new Error('Method not implemented');
  }
}