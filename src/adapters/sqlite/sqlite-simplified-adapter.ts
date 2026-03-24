/**
 * SQLite简化存储适配器
 * 基础CRUD功能，绕过迁移系统，用于MVP验证
 */

import { Database } from 'better-sqlite3';
import { 
  AgentAsset, AgentConfig, AgentConfigUpdate,
  StorageResult, BulkResult, AssetQueryOptions, AssetSearchResult,
  StorageAdapterConfig, StorageAdapterStatus,
  AssetType, StorageType, AccessLevel
} from '../../types';

/**
 * SQLite简化存储适配器配置
 */
export interface SQLiteSimplifiedAdapterConfig extends StorageAdapterConfig {
  databasePath: string;
  readonly?: boolean;
  timeout?: number;
  verbose?: boolean;
}

/**
 * SQLite简化存储适配器
 */
export class SQLiteSimplifiedAdapter {
  private db: Database | null = null;
  private config: SQLiteSimplifiedAdapterConfig;
  private status: StorageAdapterStatus = {
    connected: false,
    ready: false,
    version: '1.0.0-simplified',
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
    
    this.config = {
      ...config,
      databasePath: databasePath,
      // 简化配置默认值
      readonly: false,
      timeout: 5000,
      verbose: false,
    } as SQLiteSimplifiedAdapterConfig;
  }
  
  /**
   * 从连接字符串提取数据库路径
   */
  private extractDatabasePath(connectionString: string): string {
    // SQLite连接字符串格式: sqlite:///path/to/database.db
    // 或直接是文件路径
    if (connectionString.startsWith('sqlite:///')) {
      return connectionString.replace('sqlite:///', '');
    }
    if (connectionString.startsWith('sqlite:')) {
      return connectionString.replace('sqlite:', '');
    }
    return connectionString;
  }
  
  /**
   * 初始化适配器
   */
  async initialize(config: StorageAdapterConfig): Promise<StorageResult<void>> {
    try {
      const databasePath = this.extractDatabasePath(config.connectionString);
      
      this.config = {
        ...config,
        databasePath: databasePath,
        readonly: false,
        timeout: 5000,
        verbose: false,
      } as SQLiteSimplifiedAdapterConfig;
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('initialize error:', errMsg);
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
   * 连接到数据库
   */
  async connect(): Promise<StorageResult<boolean>> {
    try {
      // 动态导入better-sqlite3
      const sqlite3 = await import('better-sqlite3');
      const Database = (sqlite3 as any).default || sqlite3;
      
      // 打开数据库连接
      this.db = new Database(
        this.config.databasePath,
        {
          readonly: this.config.readonly,
          timeout: this.config.timeout,
          verbose: this.config.verbose ? console.log : undefined,
        }
      ) as Database;
      
      // 配置数据库参数
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = OFF'); // 简化版关闭外键约束
      this.db.pragma('busy_timeout = 5000');
      
      // 创建简化表结构
      this.createSimplifiedTables();
      
      console.log(`SQLite simplified adapter connected to: ${this.config.databasePath}`);
      
      // 更新状态
      this.status = {
        connected: true,
        ready: true,
        version: '1.0.0-simplified',
        health: {
          healthy: true,
          message: 'Connected and ready (simplified)',
          details: {
            databasePath: this.config.databasePath,
            simplifiedMode: true,
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
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to connect to SQLite database:', errMsg);
      this.db = null;
      
      // 更新状态
      this.status.health = {
        healthy: false,
        message: errMsg,
      };
      this.status.metrics.errorCount++;
      
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
   * 创建简化表结构
   */
  private createSimplifiedTables(): void {
    if (!this.db) return;
    
    // 创建Agent配置表（简化版）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_configs (
        agent_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        description TEXT NOT NULL,
        expertise_domains TEXT NOT NULL,
        asset_types TEXT NOT NULL,
        restricted_to_types BOOLEAN NOT NULL DEFAULT FALSE,
        partition TEXT NOT NULL,
        storage_quota TEXT,
        retention_days INTEGER NOT NULL DEFAULT 30,
        context_size_limit INTEGER NOT NULL DEFAULT 8192,
        compression_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        summary_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        encryption_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        dependencies TEXT NOT NULL,
        notification_settings TEXT NOT NULL,
        schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        schedule_time TEXT,
        schedule_timezone TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        version TEXT NOT NULL DEFAULT '1.0.0',
        created_by TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_heartbeat INTEGER,
        last_archive_time INTEGER,
        last_error TEXT
      )
    `);
    
    // 创建Agent资产表（简化版）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_assets (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        partition TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        keywords TEXT NOT NULL,
        source_context TEXT NOT NULL,
        source_timestamp INTEGER NOT NULL,
        confidence REAL,
        version INTEGER NOT NULL DEFAULT 1,
        previous_asset_id TEXT,
        change_log TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        storage_backend TEXT NOT NULL,
        storage_id TEXT NOT NULL,
        access_level TEXT NOT NULL,
        allowed_agents TEXT,
        is_archived BOOLEAN DEFAULT FALSE,
        archived_at INTEGER,
        archive_location TEXT
      )
    `);
    
    // 创建基础索引
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_agent_configs_active ON agent_configs (is_active)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_agent_assets_agent_id ON agent_assets (agent_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_agent_assets_created_at ON agent_assets (created_at)');
    
    console.log('Simplified tables created successfully');
  }
  
  /**
   * 断开数据库连接
   */
  async disconnect(): Promise<StorageResult<void>> {
    if (this.db) {
      this.db.close();
      this.db = null;
      
      // 更新状态
      this.status.connected = false;
      this.status.ready = false;
      this.status.health = {
        healthy: false,
        message: 'Disconnected',
      };
      
      console.log('SQLite simplified adapter disconnected');
      
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
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.db !== null;
  }
  
  // ==================== Agent配置管理 ====================
  
  async createAgentConfig(config: AgentConfig): Promise<StorageResult<AgentConfig>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const stmt = this.db.prepare(`
        INSERT INTO agent_configs (
          agent_id, display_name, description, expertise_domains, asset_types,
          restricted_to_types, partition, storage_quota, retention_days,
          context_size_limit, compression_enabled, summary_enabled, encryption_enabled,
          dependencies, notification_settings, schedule_enabled, schedule_time,
          schedule_timezone, created_at, updated_at, version, created_by, last_modified_by,
          is_active, last_heartbeat, last_archive_time, last_error
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);
      
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
      console.error('createAgentConfig error:', errMsg);
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
      if (!this.db) throw new Error('Database not connected');
      
      const stmt = this.db.prepare('SELECT * FROM agent_configs WHERE agent_id = ?');
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
  
  async getAllAgentConfigs(): Promise<StorageResult<AgentConfig[]>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const stmt = this.db.prepare('SELECT * FROM agent_configs ORDER BY display_name');
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
  
  async updateAgentConfig(agentId: string, update: AgentConfigUpdate): Promise<StorageResult<AgentConfig>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
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
      
      const stmt = this.db.prepare(`
        UPDATE agent_configs SET
          display_name = ?, description = ?, expertise_domains = ?, asset_types = ?,
          restricted_to_types = ?, partition = ?, storage_quota = ?, retention_days = ?,
          context_size_limit = ?, compression_enabled = ?, summary_enabled = ?,
          encryption_enabled = ?, dependencies = ?, notification_settings = ?,
          schedule_enabled = ?, schedule_time = ?, schedule_timezone = ?,
          updated_at = ?, version = ?, last_modified_by = ?,
          is_active = ?, last_heartbeat = ?, last_archive_time = ?, last_error = ?
        WHERE agent_id = ?
      `);
      
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
  
  async deleteAgentConfig(agentId: string): Promise<StorageResult<void>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const stmt = this.db.prepare('DELETE FROM agent_configs WHERE agent_id = ?');
      const result = stmt.run(agentId);
      
      return {
        success: true,
        metadata: {
          operationTime: Date.now(),
          affectedRows: result.changes,
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
  
  // ==================== Agent资产管理 ====================
  
  async createAgentAsset(asset: AgentAsset): Promise<StorageResult<AgentAsset>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const stmt = this.db.prepare(`
        INSERT INTO agent_assets (
          id, agent_id, asset_type, partition, title, content, summary,
          keywords, source_context, source_timestamp, confidence, version,
          previous_asset_id, change_log, created_at, updated_at,
          storage_backend, storage_id, access_level, allowed_agents,
          is_archived, archived_at, archive_location
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);
      
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
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('createAgentAsset error:', errMsg);
      return {
        success: false,
        error: errMsg,
        metadata: {
          operationTime: Date.now(),
        },
      };
    }
  }
  
  async getAgentAsset(assetId: string): Promise<StorageResult<AgentAsset>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const stmt = this.db.prepare('SELECT * FROM agent_assets WHERE id = ?');
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
  
  async getAgentAssetsByAgent(agentId: string, limit: number = 100, offset: number = 0): Promise<StorageResult<AgentAsset[]>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const stmt = this.db.prepare(`
        SELECT * FROM agent_assets 
        WHERE agent_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `);
      
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
  
  async searchAgentAssets(query: AssetQueryOptions): Promise<StorageResult<AssetSearchResult>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      // 构建基础查询
      let sql = 'SELECT * FROM agent_assets WHERE 1=1';
      const params: any[] = [];
      
      if (query.agentId) {
        sql += ' AND agent_id = ?';
        params.push(query.agentId);
      }
      
      if (query.assetType) {
        sql += ' AND asset_type = ?';
        params.push(query.assetType);
      }
      
      if (query.partition) {
        sql += ' AND partition = ?';
        params.push(query.partition);
      }
      
      if (query.keywords && query.keywords.length > 0) {
        // 简单实现：检查关键词是否在JSON数组中
        sql += ' AND keywords LIKE ?';
        params.push(`%${query.keywords[0]}%`);
      }
      
      if (query.startTime) {
        sql += ' AND created_at >= ?';
        params.push(query.startTime);
      }
      
      if (query.endTime) {
        sql += ' AND created_at <= ?';
        params.push(query.endTime);
      }
      
      // 排序
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      const sortFieldMap: Record<string, string> = {
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'title': 'title',
      };
      const sortField = sortFieldMap[sortBy] || sortBy;
      sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;
      
      // 分页
      const limit = query.limit || 100;
      const offset = query.offset || 0;
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      // 执行查询
      const stmt = this.db.prepare(sql);
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
      const countSql = sql
        .replace(/SELECT \* FROM/, 'SELECT COUNT(*) as total FROM')
        .split('ORDER BY')[0]
        ?.split('LIMIT')[0] || sql.replace(/SELECT \* FROM/, 'SELECT COUNT(*) as total FROM');
      const countStmt = this.db.prepare(countSql);
      
      // 计算需要的参数数量（排除LIMIT和OFFSET参数）
      let countParamCount = params.length;
      if (sql.includes('LIMIT ?')) {
        countParamCount -= 2;
      }
      const countParams = params.slice(0, Math.max(0, countParamCount));
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
  
  // ==================== 批量操作 ====================
  
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
  
  // ==================== 数据管理 ====================
  
  async archiveOldAssets(retentionDays: number = 30): Promise<StorageResult<number>> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
      
      const stmt = this.db.prepare(`
        UPDATE agent_assets 
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
  
  // ==================== 存根方法 ====================
  
  async updateAgentAsset(_assetId: string, _asset: Partial<AgentAsset>): Promise<StorageResult<AgentAsset>> {
    throw new Error('Method not implemented in simplified adapter');
  }
  
  async deleteAgentAsset(_assetId: string): Promise<StorageResult<void>> {
    throw new Error('Method not implemented in simplified adapter');
  }
  
  async bulkUpdateAgentAssets(_updates: Array<{ assetId: string; asset: Partial<AgentAsset> }>): Promise<BulkResult> {
    throw new Error('Method not implemented in simplified adapter');
  }
  
  async bulkDeleteAgentAssets(_assetIds: string[]): Promise<BulkResult> {
    throw new Error('Method not implemented in simplified adapter');
  }
  
  async cleanupArchivedAssets(_olderThanDays: number = 90): Promise<StorageResult<number>> {
    throw new Error('Method not implemented in simplified adapter');
  }
  
  async backup(_backupPath: string): Promise<StorageResult<void>> {
    throw new Error('Method not implemented in simplified adapter');
  }
}