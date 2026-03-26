/**
 * SQLite 数据库迁移管理
 * 支持版本化数据库架构迁移
 */

import { Database } from 'better-sqlite3';
import { TABLES } from './schema';

/**
 * 迁移定义接口
 */
export interface Migration {
  name: string;
  version: number;
  up: (db: Database) => void;
  down: (db: Database) => void;
  checksum: string;
}

/**
 * 系统迁移历史记录
 */
export interface MigrationHistory {
  id: number;
  migration_name: string;
  applied_at: number;
  applied_by: string;
  checksum: string;
  success: boolean;
  execution_time_ms: number;
  error_message?: string;
}

/**
 * 基础迁移（v1.0.0）
 * 创建所有基础表
 */
export const BASE_MIGRATION: Migration = {
  name: '0001_base_schema',
  version: 1,
  checksum: 'a1b2c3d4e5f67890123456789abcdef0',
  
  up: (db: Database) => {
    // 创建迁移历史表（首先创建，用于记录迁移）
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLES.MIGRATION_HISTORY} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name TEXT NOT NULL,
        applied_at INTEGER NOT NULL,
        applied_by TEXT NOT NULL,
        checksum TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        error_message TEXT,
        
        UNIQUE (migration_name)
      )
    `);
    
    // 创建Agent配置表
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLES.AGENT_CONFIGS} (
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
    
    // 创建Agent资产表
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLES.AGENT_ASSETS} (
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
        
        FOREIGN KEY (agent_id) REFERENCES ${TABLES.AGENT_CONFIGS}(agent_id) ON DELETE CASCADE
      )
    `);
    
    // 创建执行日志表
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLES.EXECUTION_LOGS} (
        id TEXT PRIMARY KEY,
        operation_type TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        asset_id TEXT,
        status TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        input_data TEXT,
        output_data TEXT,
        error_message TEXT,
        error_stack TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        metadata TEXT,
        
        FOREIGN KEY (agent_id) REFERENCES ${TABLES.AGENT_CONFIGS}(agent_id) ON DELETE CASCADE,
        FOREIGN KEY (asset_id) REFERENCES ${TABLES.AGENT_ASSETS}(id) ON DELETE SET NULL
      )
    `);
    
    // 创建系统指标表
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLES.SYSTEM_METRICS} (
        id TEXT PRIMARY KEY,
        metric_type TEXT NOT NULL,
        agent_id TEXT,
        timestamp INTEGER NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        tags TEXT,
        metadata TEXT,
        
        FOREIGN KEY (agent_id) REFERENCES ${TABLES.AGENT_CONFIGS}(agent_id) ON DELETE CASCADE
      )
    `);
    
    // 创建日报表
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${TABLES.DAILY_REPORTS} (
        id TEXT PRIMARY KEY,
        report_date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        report_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT NOT NULL,
        metrics TEXT NOT NULL,
        recommendations TEXT,
        generated_at INTEGER NOT NULL,
        generated_by TEXT NOT NULL,
        delivered_to TEXT,
        delivery_status TEXT NOT NULL,
        
        UNIQUE (report_date, agent_id, report_type),
        FOREIGN KEY (agent_id) REFERENCES ${TABLES.AGENT_CONFIGS}(agent_id) ON DELETE CASCADE
      )
    `);
    
    // 创建基础索引
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_configs_active ON ${TABLES.AGENT_CONFIGS} (is_active)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_configs_partition ON ${TABLES.AGENT_CONFIGS} (partition)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_assets_agent_id ON ${TABLES.AGENT_ASSETS} (agent_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_assets_asset_type ON ${TABLES.AGENT_ASSETS} (asset_type)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_assets_created_at ON ${TABLES.AGENT_ASSETS} (created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_execution_logs_agent_id ON ${TABLES.EXECUTION_LOGS} (agent_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON ${TABLES.EXECUTION_LOGS} (status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON ${TABLES.SYSTEM_METRICS} (timestamp)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_daily_reports_report_date ON ${TABLES.DAILY_REPORTS} (report_date)`);
    
    console.log('Base schema migration completed');
  },
  
  down: (db: Database) => {
    // 按依赖顺序删除表
    db.exec(`DROP TABLE IF EXISTS ${TABLES.DAILY_REPORTS}`);
    db.exec(`DROP TABLE IF EXISTS ${TABLES.SYSTEM_METRICS}`);
    db.exec(`DROP TABLE IF EXISTS ${TABLES.EXECUTION_LOGS}`);
    db.exec(`DROP TABLE IF EXISTS ${TABLES.AGENT_ASSETS}`);
    db.exec(`DROP TABLE IF EXISTS ${TABLES.AGENT_CONFIGS}`);
    db.exec(`DROP TABLE IF EXISTS ${TABLES.MIGRATION_HISTORY}`);
    
    console.log('Base schema migration rolled back');
  },
};

/**
 * 性能优化迁移（v1.1.0）
 * 添加复合索引和视图
 */
export const PERFORMANCE_MIGRATION: Migration = {
  name: '0002_performance_optimization',
  version: 2,
  checksum: 'b2c3d4e5f67890123456789abcdef1',
  
  up: (db: Database) => {
    // 添加复合索引
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_assets_agent_type ON ${TABLES.AGENT_ASSETS} (agent_id, asset_type)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_assets_type_created ON ${TABLES.AGENT_ASSETS} (asset_type, created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_execution_logs_agent_status ON ${TABLES.EXECUTION_LOGS} (agent_id, status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_execution_logs_type_time ON ${TABLES.EXECUTION_LOGS} (operation_type, start_time)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_system_metrics_agent_type ON ${TABLES.SYSTEM_METRICS} (agent_id, metric_type)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_daily_reports_date_type ON ${TABLES.DAILY_REPORTS} (report_date, report_type)`);
    
    // 创建视图
    db.exec(`
      CREATE VIEW IF NOT EXISTS v_agent_asset_stats AS
      SELECT 
        agent_id,
        COUNT(*) as total_assets,
        COUNT(DISTINCT asset_type) as distinct_asset_types,
        MIN(created_at) as first_asset_time,
        MAX(created_at) as last_asset_time,
        AVG(LENGTH(content)) as avg_content_size,
        SUM(LENGTH(content)) as total_content_size
      FROM ${TABLES.AGENT_ASSETS}
      GROUP BY agent_id
    `);
    
    db.exec(`
      CREATE VIEW IF NOT EXISTS v_agent_activity AS
      SELECT 
        ac.agent_id,
        ac.display_name,
        ac.is_active,
        ac.last_heartbeat,
        ac.last_archive_time,
        COALESCE(aas.total_assets, 0) as total_assets,
        COALESCE(el.total_operations, 0) as total_operations,
        COALESCE(el.last_operation_time, 0) as last_operation_time
      FROM ${TABLES.AGENT_CONFIGS} ac
      LEFT JOIN v_agent_asset_stats aas ON ac.agent_id = aas.agent_id
      LEFT JOIN (
        SELECT 
          agent_id,
          COUNT(*) as total_operations,
          MAX(end_time) as last_operation_time
        FROM ${TABLES.EXECUTION_LOGS}
        GROUP BY agent_id
      ) el ON ac.agent_id = el.agent_id
    `);
    
    console.log('Performance optimization migration completed');
  },
  
  down: (db: Database) => {
    // 删除视图
    db.exec(`DROP VIEW IF EXISTS v_agent_activity`);
    db.exec(`DROP VIEW IF EXISTS v_agent_asset_stats`);
    
    // 删除索引
    db.exec(`DROP INDEX IF EXISTS idx_agent_assets_agent_type`);
    db.exec(`DROP INDEX IF EXISTS idx_agent_assets_type_created`);
    db.exec(`DROP INDEX IF EXISTS idx_execution_logs_agent_status`);
    db.exec(`DROP INDEX IF EXISTS idx_execution_logs_type_time`);
    db.exec(`DROP INDEX IF EXISTS idx_system_metrics_agent_type`);
    db.exec(`DROP INDEX IF EXISTS idx_daily_reports_date_type`);
    
    console.log('Performance optimization migration rolled back');
  },
};

/**
 * 数据归档迁移（v1.2.0）
 * 添加数据归档相关字段和索引
 */
export const ARCHIVAL_MIGRATION: Migration = {
  name: '0003_archival_enhancements',
  version: 3,
  checksum: 'c3d4e5f67890123456789abcdef2',
  
  up: (db: Database) => {
    // 为Agent配置表添加归档相关字段
    try {
      db.exec(`ALTER TABLE ${TABLES.AGENT_CONFIGS} ADD COLUMN archive_schedule TEXT`);
      db.exec(`ALTER TABLE ${TABLES.AGENT_CONFIGS} ADD COLUMN last_full_archive INTEGER`);
      db.exec(`ALTER TABLE ${TABLES.AGENT_CONFIGS} ADD COLUMN archive_retention_days INTEGER DEFAULT 90`);
    } catch (error) {
      // 列可能已存在，忽略错误
      console.log('Archive columns may already exist, continuing...');
    }
    
    // 为Agent资产表添加归档标记
    try {
      db.exec(`ALTER TABLE ${TABLES.AGENT_ASSETS} ADD COLUMN is_archived BOOLEAN DEFAULT FALSE`);
      db.exec(`ALTER TABLE ${TABLES.AGENT_ASSETS} ADD COLUMN archived_at INTEGER`);
      db.exec(`ALTER TABLE ${TABLES.AGENT_ASSETS} ADD COLUMN archive_location TEXT`);
    } catch (error) {
      console.log('Archive flag columns may already exist, continuing...');
    }
    
    // 添加归档相关索引
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_assets_archived ON ${TABLES.AGENT_ASSETS} (is_archived, created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_assets_archive_time ON ${TABLES.AGENT_ASSETS} (archived_at)`);
    
    console.log('Archival enhancements migration completed');
  },
  
  down: (db: Database) => {
    // 注意：SQLite不支持删除列，这里只删除索引
    db.exec(`DROP INDEX IF EXISTS idx_agent_assets_archived`);
    db.exec(`DROP INDEX IF EXISTS idx_agent_assets_archive_time`);
    
    console.log('Archival enhancements migration rolled back (columns cannot be removed in SQLite)');
  },
};

/**
 * 所有迁移按版本顺序排列
 */
export const ALL_MIGRATIONS: Migration[] = [
  BASE_MIGRATION,
  PERFORMANCE_MIGRATION,
  ARCHIVAL_MIGRATION,
];

/**
 * 迁移管理器
 */
export class MigrationManager {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  /**
   * 获取已应用的迁移
   */
  getAppliedMigrations(): MigrationHistory[] {
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${TABLES.MIGRATION_HISTORY} WHERE success = TRUE ORDER BY applied_at ASC`);
      return stmt.all() as MigrationHistory[];
    } catch (error) {
      // 表可能不存在，返回空数组
      return [];
    }
  }
  
  /**
   * 记录迁移历史
   */
  private recordMigration(
    migration: Migration,
    success: boolean,
    executionTimeMs: number,
    errorMessage?: string
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO ${TABLES.MIGRATION_HISTORY} 
      (migration_name, applied_at, applied_by, checksum, success, execution_time_ms, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      migration.name,
      Date.now(),
      'cabinet-pulse-system',
      migration.checksum,
      success ? 1 : 0,
      executionTimeMs,
      errorMessage
    );
  }
  
  /**
   * 应用单个迁移
   */
  private applyMigration(migration: Migration): boolean {
    const startTime = Date.now();
    let transactionStarted = false;
    
    try {
      // 检查是否已应用（如果迁移历史表不存在，认为未应用）
      let alreadyApplied = false;
      try {
        const checkStmt = this.db.prepare(
          `SELECT 1 FROM ${TABLES.MIGRATION_HISTORY} WHERE migration_name = ? AND success = TRUE`
        );
        alreadyApplied = !!checkStmt.get(migration.name);
      } catch (checkError) {
        // 表可能不存在，认为迁移未应用
        console.log(`Migration history table may not exist, assuming migration ${migration.name} not applied`);
        alreadyApplied = false;
      }
      
      if (alreadyApplied) {
        console.log(`Migration ${migration.name} already applied, skipping`);
        return true;
      }
      
      // 在事务中执行迁移
      console.log(`Beginning transaction for migration ${migration.name}`);
      this.db.exec('BEGIN TRANSACTION');
      transactionStarted = true;
      
      console.log(`Applying migration: ${migration.name} (v${migration.version})`);
      migration.up(this.db);
      
      const executionTime = Date.now() - startTime;
      
      // 记录迁移（此时表应该已存在）
      this.recordMigration(migration, true, executionTime);
      
      this.db.exec('COMMIT');
      transactionStarted = false;
      console.log(`Migration ${migration.name} applied successfully (${executionTime}ms)`);
      
      return true;
    } catch (error) {
      // 只有在事务已开始时才回滚
      if (transactionStarted) {
        try {
          console.log(`Rolling back transaction for failed migration ${migration.name}`);
          this.db.exec('ROLLBACK');
        } catch (rollbackError) {
          console.error(`Failed to rollback transaction for migration ${migration.name}:`, rollbackError);
        }
      }
      
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`Failed to apply migration ${migration.name}:`, error);
      console.error(`Error details:`, {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack',
        migrationName: migration.name,
        migrationVersion: migration.version,
        transactionStarted,
      });
      
      // 尝试记录错误，但可能因为表不存在而失败
      try {
        this.recordMigration(migration, false, executionTime, errorMessage);
      } catch (recordError) {
        console.error('Failed to record migration error:', recordError);
        // 如果记录失败，可能是因为迁移历史表不存在（对于第一个迁移）
        // 这种情况下，我们可以继续，因为迁移失败了，但我们无法记录
      }
      
      return false;
    }
  }
  
  /**
   * 回滚单个迁移
   */
  private rollbackMigration(migration: Migration): boolean {
    const startTime = Date.now();
    
    try {
      // 检查是否已应用
      const checkStmt = this.db.prepare(
        `SELECT 1 FROM ${TABLES.MIGRATION_HISTORY} WHERE migration_name = ? AND success = TRUE`
      );
      const alreadyApplied = checkStmt.get(migration.name);
      
      if (!alreadyApplied) {
        console.log(`Migration ${migration.name} not applied, cannot rollback`);
        return true;
      }
      
      // 在事务中执行回滚
      this.db.exec('BEGIN TRANSACTION');
      
      console.log(`Rolling back migration: ${migration.name} (v${migration.version})`);
      migration.down(this.db);
      
      // 删除迁移记录
      const deleteStmt = this.db.prepare(
        `DELETE FROM ${TABLES.MIGRATION_HISTORY} WHERE migration_name = ?`
      );
      deleteStmt.run(migration.name);
      
      this.db.exec('COMMIT');
      const executionTime = Date.now() - startTime;
      console.log(`Migration ${migration.name} rolled back successfully (${executionTime}ms)`);
      
      return true;
    } catch (error) {
      this.db.exec('ROLLBACK');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to rollback migration ${migration.name}:`, errorMessage);
      
      return false;
    }
  }
  
  /**
   * 应用所有待处理的迁移
   */
  migrateToLatest(): boolean {
    console.log('Starting database migration to latest version...');
    
    const appliedMigrations = this.getAppliedMigrations();
    const appliedNames = new Set(appliedMigrations.map(m => m.migration_name));
    
    let allSuccess = true;
    
    for (const migration of ALL_MIGRATIONS) {
      if (!appliedNames.has(migration.name)) {
        const success = this.applyMigration(migration);
        if (!success) {
          console.error(`Migration ${migration.name} failed, stopping migration process`);
          allSuccess = false;
          break;
        }
      }
    }
    
    if (allSuccess) {
      console.log('Database migration completed successfully');
    } else {
      console.error('Database migration failed');
    }
    
    return allSuccess;
  }
  
  /**
   * 回滚到指定版本
   */
  rollbackToVersion(targetVersion: number): boolean {
    console.log(`Rolling back database to version ${targetVersion}...`);
    
    const appliedMigrations = this.getAppliedMigrations();
    const migrationsToRollback = appliedMigrations
      .filter(m => {
        const migration = ALL_MIGRATIONS.find(mm => mm.name === m.migration_name);
        return migration && migration.version > targetVersion;
      })
      .sort((a, b) => b.applied_at - a.applied_at); // 按应用时间倒序
    
    let allSuccess = true;
    
    for (const history of migrationsToRollback) {
      const migration = ALL_MIGRATIONS.find(m => m.name === history.migration_name);
      if (migration) {
        const success = this.rollbackMigration(migration);
        if (!success) {
          console.error(`Rollback of ${migration.name} failed, stopping rollback process`);
          allSuccess = false;
          break;
        }
      }
    }
    
    if (allSuccess) {
      console.log(`Database rollback to version ${targetVersion} completed successfully`);
    } else {
      console.error('Database rollback failed');
    }
    
    return allSuccess;
  }
  
  /**
   * 获取当前数据库版本
   */
  getCurrentVersion(): number {
    const appliedMigrations = this.getAppliedMigrations();
    if (appliedMigrations.length === 0) {
      return 0;
    }
    
    const lastMigration = appliedMigrations[appliedMigrations.length - 1]!;
    const migration = ALL_MIGRATIONS.find(m => m.name === lastMigration.migration_name);
    
    return migration ? migration.version : 0;
  }
  
  /**
   * 检查数据库健康状态
   */
  checkHealth(): {
    healthy: boolean;
    currentVersion: number;
    latestVersion: number;
    appliedMigrations: number;
    totalMigrations: number;
    pendingMigrations: number;
    errors: string[];
  } {
    const currentVersion = this.getCurrentVersion();
    const latestVersion = ALL_MIGRATIONS[ALL_MIGRATIONS.length - 1]?.version || 0;
    const appliedMigrations = this.getAppliedMigrations().length;
    const totalMigrations = ALL_MIGRATIONS.length;
    const pendingMigrations = totalMigrations - appliedMigrations;
    
    // 检查失败的迁移
    const errorStmt = this.db.prepare(
      `SELECT migration_name, error_message FROM ${TABLES.MIGRATION_HISTORY} WHERE success = FALSE ORDER BY applied_at DESC`
    );
    const failedMigrations = errorStmt.all() as Array<{ migration_name: string; error_message: string }>;
    const errors = failedMigrations.map(fm => `${fm.migration_name}: ${fm.error_message}`);
    
    const healthy = currentVersion === latestVersion && errors.length === 0;
    
    return {
      healthy,
      currentVersion,
      latestVersion,
      appliedMigrations,
      totalMigrations,
      pendingMigrations,
      errors,
    };
  }
}