/**
 * SQLite 数据库表结构定义
 * Cabinet Pulse Skill 数据模型对应的数据库表结构
 */

/**
 * 数据库表名常量
 */
export const TABLES = {
  AGENT_CONFIGS: 'agent_configs',
  AGENT_ASSETS: 'agent_assets',
  EXECUTION_LOGS: 'execution_logs',
  SYSTEM_METRICS: 'system_metrics',
  DAILY_REPORTS: 'daily_reports',
  MIGRATION_HISTORY: 'migration_history',
} as const;

/**
 * 创建表的SQL语句
 */
export const CREATE_TABLE_SQL = {
  // Agent配置表
  [TABLES.AGENT_CONFIGS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.AGENT_CONFIGS} (
      agent_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      description TEXT NOT NULL,
      expertise_domains TEXT NOT NULL, -- JSON数组字符串
      asset_types TEXT NOT NULL,       -- JSON数组字符串
      restricted_to_types BOOLEAN NOT NULL DEFAULT FALSE,
      partition TEXT NOT NULL,
      storage_quota TEXT,              -- JSON对象字符串
      retention_days INTEGER NOT NULL DEFAULT 30,
      context_size_limit INTEGER NOT NULL DEFAULT 8192,
      compression_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      summary_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      encryption_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      dependencies TEXT NOT NULL,      -- JSON数组字符串
      notification_settings TEXT NOT NULL, -- JSON对象字符串
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
      last_error TEXT,
      
      -- 索引
      INDEX idx_agent_configs_active (is_active),
      INDEX idx_agent_configs_partition (partition),
      INDEX idx_agent_configs_expertise (expertise_domains),
      INDEX idx_agent_configs_updated_at (updated_at)
    )
  `,

  // Agent资产表
  [TABLES.AGENT_ASSETS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.AGENT_ASSETS} (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      partition TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      keywords TEXT NOT NULL,          -- JSON数组字符串
      source_context TEXT NOT NULL,
      source_timestamp INTEGER NOT NULL,
      confidence REAL,
      version INTEGER NOT NULL DEFAULT 1,
      previous_asset_id TEXT,
      change_log TEXT,                 -- JSON数组字符串
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      storage_backend TEXT NOT NULL,
      storage_id TEXT NOT NULL,
      access_level TEXT NOT NULL,
      allowed_agents TEXT,             -- JSON数组字符串
      
      -- 索引
      INDEX idx_agent_assets_agent_id (agent_id),
      INDEX idx_agent_assets_asset_type (asset_type),
      INDEX idx_agent_assets_partition (partition),
      INDEX idx_agent_assets_created_at (created_at),
      INDEX idx_agent_assets_updated_at (updated_at),
      INDEX idx_agent_assets_keywords (keywords),
      FOREIGN KEY (agent_id) REFERENCES ${TABLES.AGENT_CONFIGS}(agent_id) ON DELETE CASCADE
    )
  `,

  // 执行日志表
  [TABLES.EXECUTION_LOGS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.EXECUTION_LOGS} (
      id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      asset_id TEXT,
      status TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      input_data TEXT,                 -- JSON对象字符串
      output_data TEXT,                -- JSON对象字符串
      error_message TEXT,
      error_stack TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      metadata TEXT,                   -- JSON对象字符串
      
      -- 索引
      INDEX idx_execution_logs_agent_id (agent_id),
      INDEX idx_execution_logs_operation_type (operation_type),
      INDEX idx_execution_logs_status (status),
      INDEX idx_execution_logs_start_time (start_time),
      INDEX idx_execution_logs_end_time (end_time),
      INDEX idx_execution_logs_asset_id (asset_id),
      FOREIGN KEY (agent_id) REFERENCES ${TABLES.AGENT_CONFIGS}(agent_id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES ${TABLES.AGENT_ASSETS}(id) ON DELETE SET NULL
    )
  `,

  // 系统指标表
  [TABLES.SYSTEM_METRICS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.SYSTEM_METRICS} (
      id TEXT PRIMARY KEY,
      metric_type TEXT NOT NULL,
      agent_id TEXT,
      timestamp INTEGER NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      tags TEXT,                       -- JSON对象字符串
      metadata TEXT,                   -- JSON对象字符串
      
      -- 索引
      INDEX idx_system_metrics_metric_type (metric_type),
      INDEX idx_system_metrics_agent_id (agent_id),
      INDEX idx_system_metrics_timestamp (timestamp),
      FOREIGN KEY (agent_id) REFERENCES ${TABLES.AGENT_CONFIGS}(agent_id) ON DELETE CASCADE
    )
  `,

  // 日报表
  [TABLES.DAILY_REPORTS]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.DAILY_REPORTS} (
      id TEXT PRIMARY KEY,
      report_date TEXT NOT NULL,       -- YYYY-MM-DD格式
      agent_id TEXT NOT NULL,
      report_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT NOT NULL,
      metrics TEXT NOT NULL,           -- JSON对象字符串
      recommendations TEXT,            -- JSON数组字符串
      generated_at INTEGER NOT NULL,
      generated_by TEXT NOT NULL,
      delivered_to TEXT,               -- JSON数组字符串
      delivery_status TEXT NOT NULL,
      
      -- 索引
      INDEX idx_daily_reports_report_date (report_date),
      INDEX idx_daily_reports_agent_id (agent_id),
      INDEX idx_daily_reports_report_type (report_type),
      INDEX idx_daily_reports_generated_at (generated_at),
      UNIQUE (report_date, agent_id, report_type),
      FOREIGN KEY (agent_id) REFERENCES ${TABLES.AGENT_CONFIGS}(agent_id) ON DELETE CASCADE
    )
  `,

  // 迁移历史表
  [TABLES.MIGRATION_HISTORY]: `
    CREATE TABLE IF NOT EXISTS ${TABLES.MIGRATION_HISTORY} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL,
      applied_at INTEGER NOT NULL,
      applied_by TEXT NOT NULL,
      checksum TEXT NOT NULL,
      success BOOLEAN NOT NULL,
      execution_time_ms INTEGER NOT NULL,
      error_message TEXT,
      
      -- 索引
      INDEX idx_migration_history_applied_at (applied_at),
      INDEX idx_migration_history_migration_name (migration_name),
      UNIQUE (migration_name)
    )
  `,
} as const;

/**
 * 数据库索引定义（额外的复合索引）
 */
export const CREATE_INDEX_SQL = [
  // Agent资产表的复合索引
  `CREATE INDEX IF NOT EXISTS idx_agent_assets_agent_type ON ${TABLES.AGENT_ASSETS} (agent_id, asset_type)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_assets_type_created ON ${TABLES.AGENT_ASSETS} (asset_type, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_assets_access_created ON ${TABLES.AGENT_ASSETS} (access_level, created_at)`,
  
  // 执行日志表的复合索引
  `CREATE INDEX IF NOT EXISTS idx_execution_logs_agent_status ON ${TABLES.EXECUTION_LOGS} (agent_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_execution_logs_type_time ON ${TABLES.EXECUTION_LOGS} (operation_type, start_time)`,
  
  // 系统指标表的复合索引
  `CREATE INDEX IF NOT EXISTS idx_system_metrics_agent_type ON ${TABLES.SYSTEM_METRICS} (agent_id, metric_type)`,
  `CREATE INDEX IF NOT EXISTS idx_system_metrics_type_time ON ${TABLES.SYSTEM_METRICS} (metric_type, timestamp)`,
  
  // 日报表的复合索引
  `CREATE INDEX IF NOT EXISTS idx_daily_reports_date_type ON ${TABLES.DAILY_REPORTS} (report_date, report_type)`,
  `CREATE INDEX IF NOT EXISTS idx_daily_reports_agent_date ON ${TABLES.DAILY_REPORTS} (agent_id, report_date)`,
];

/**
 * 数据库视图定义
 */
export const CREATE_VIEW_SQL = [
  // Agent资产统计视图
  `
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
  `,
  
  // 每日资产创建统计视图
  `
    CREATE VIEW IF NOT EXISTS v_daily_asset_creation AS
    SELECT 
      DATE(created_at / 1000, 'unixepoch') as creation_date,
      asset_type,
      COUNT(*) as asset_count,
      COUNT(DISTINCT agent_id) as distinct_agents
    FROM ${TABLES.AGENT_ASSETS}
    GROUP BY creation_date, asset_type
  `,
  
  // Agent活跃度视图
  `
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
  `,
];

/**
 * 数据库初始化脚本（包含所有表、索引和视图）
 */
export const INIT_DATABASE_SQL = [
  ...Object.values(CREATE_TABLE_SQL),
  ...CREATE_INDEX_SQL,
  ...CREATE_VIEW_SQL,
];