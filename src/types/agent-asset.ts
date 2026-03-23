/**
 * AgentAsset - 结构化记忆资产实体
 * 表示从Agent上下文中提取并持久化的结构化资产
 */

/**
 * 资产类型枚举
 */
export enum AssetType {
  // 技术类资产
  TECHNICAL_SPECS = 'technical_specs',          // 技术规格
  ARCHITECTURE_DESIGN = 'architecture_design',  // 架构设计
  PERFORMANCE_METRICS = 'performance_metrics',  // 性能指标
  SECURITY_ASSESSMENT = 'security_assessment',  // 安全评估
  SYSTEM_CONFIG = 'system_config',              // 系统配置
  
  // 战略类资产
  STRATEGIC_PLAN = 'strategic_plan',            // 战略规划
  COMPETITIVE_ANALYSIS = 'competitive_analysis', // 竞品分析
  RISK_ASSESSMENT = 'risk_assessment',          // 风险评估
  MARKET_INSIGHTS = 'market_insights',          // 市场洞察
  
  // 通用类资产
  KEY_DECISIONS = 'key_decisions',              // 关键决策
  LESSONS_LEARNED = 'lessons_learned',          // 经验教训
  BEST_PRACTICES = 'best_practices',            // 最佳实践
  METHODOLOGIES = 'methodologies',              // 方法论
  
  // 系统类资产
  AGENT_STATE = 'agent_state',                  // Agent状态
  MONITORING_DATA = 'monitoring_data',          // 监控数据
  EXECUTION_LOG = 'execution_log',              // 执行日志
}

/**
 * 存储后端类型枚举
 */
export enum StorageType {
  SQLITE = 'sqlite',
  LOCAL_FILE = 'local_file',
  FEISHU_DOC = 'feishu_doc',
  OBJECT_STORAGE = 'object_storage',
}

/**
 * 访问级别枚举
 */
export enum AccessLevel {
  PRIVATE = 'private',      // 仅所属Agent可访问
  SHARED = 'shared',        // 指定Agent可访问
  PUBLIC = 'public',        // 所有Agent可访问
}

/**
 * Agent资产接口
 */
export interface AgentAsset {
  // 核心标识
  id: string;                    // 资产唯一ID，格式：asset_<timestamp>_<hash>
  agentId: string;              // 所属Agent ID
  assetType: AssetType;         // 资产类型枚举
  partition: string;            // 存储分区，如：基建分区、战略分区
  
  // 内容数据
  title: string;                // 资产标题
  content: string;              // 结构化内容（JSON/YAML）
  summary?: string;             // 内容摘要（AI生成，用于快速检索）
  keywords: string[];           // 关键词标签
  
  // 元数据
  sourceContext: string;        // 来源上下文摘要
  sourceTimestamp: number;      // 来源时间戳
  confidence?: number;          // 置信度评分（0-1，AI生成）
  
  // 版本控制
  version: number;              // 资产版本
  previousAssetId?: string;     // 上一个版本ID
  changeLog?: AssetChange[];    // 变更历史
  
  // 系统信息
  createdAt: number;            // 创建时间戳
  updatedAt: number;            // 更新时间戳
  storageBackend: StorageType;  // 存储后端类型
  storageId: string;            // 在后端的存储ID（如文档token）
  
  // 访问控制
  accessLevel: AccessLevel;     // 访问级别
  allowedAgents?: string[];     // 允许访问的Agent列表
}

/**
 * 资产变更记录
 */
export interface AssetChange {
  timestamp: number;            // 变更时间戳
  changedBy: string;            // 变更者（Agent ID或系统）
  description: string;          // 变更描述
  changes: Record<string, any>; // 具体变更内容
}

/**
 * 资产查询选项
 */
export interface AssetQueryOptions {
  agentId?: string;             // 按Agent筛选
  assetType?: AssetType;        // 按资产类型筛选
  partition?: string;           // 按分区筛选
  keywords?: string[];          // 按关键词筛选
  startTime?: number;          // 开始时间戳
  endTime?: number;            // 结束时间戳
  limit?: number;              // 返回数量限制
  offset?: number;             // 偏移量
  sortBy?: 'createdAt' | 'updatedAt' | 'title'; // 排序字段
  sortOrder?: 'asc' | 'desc';  // 排序顺序
}

/**
 * 资产搜索结果
 */
export interface AssetSearchResult {
  assets: AgentAsset[];         // 匹配的资产列表
  totalCount: number;           // 总匹配数量
  queryTime: number;            // 查询耗时（毫秒）
  facets?: Record<string, any>; // 分面统计信息
}

/**
 * 资产统计信息
 */
export interface AssetStats {
  totalAssets: number;          // 总资产数
  totalSizeBytes: number;       // 总大小（字节）
  byAgent: Record<string, number>;      // 按Agent统计
  byType: Record<AssetType, number>;    // 按类型统计
  byPartition: Record<string, number>;  // 按分区统计
  recentActivity: {
    last24h: number;            // 过去24小时新增
    last7d: number;             // 过去7天新增
    last30d: number;            // 过去30天新增
  };
}