/**
 * AgentAsset - 结构化记忆资产实体
 * 表示从Agent上下文中提取并持久化的结构化资产
 */
/**
 * 资产类型枚举
 */
export declare enum AssetType {
    TECHNICAL_SPECS = "technical_specs",// 技术规格
    ARCHITECTURE_DESIGN = "architecture_design",// 架构设计
    PERFORMANCE_METRICS = "performance_metrics",// 性能指标
    SECURITY_ASSESSMENT = "security_assessment",// 安全评估
    SYSTEM_CONFIG = "system_config",// 系统配置
    STRATEGIC_PLAN = "strategic_plan",// 战略规划
    COMPETITIVE_ANALYSIS = "competitive_analysis",// 竞品分析
    RISK_ASSESSMENT = "risk_assessment",// 风险评估
    MARKET_INSIGHTS = "market_insights",// 市场洞察
    KEY_DECISIONS = "key_decisions",// 关键决策
    LESSONS_LEARNED = "lessons_learned",// 经验教训
    BEST_PRACTICES = "best_practices",// 最佳实践
    METHODOLOGIES = "methodologies",// 方法论
    AGENT_STATE = "agent_state",// Agent状态
    MONITORING_DATA = "monitoring_data",// 监控数据
    EXECUTION_LOG = "execution_log"
}
/**
 * 存储后端类型枚举
 */
export declare enum StorageType {
    SQLITE = "sqlite",
    LOCAL_FILE = "local_file",
    FEISHU_DOC = "feishu_doc",
    OBJECT_STORAGE = "object_storage"
}
/**
 * 访问级别枚举
 */
export declare enum AccessLevel {
    PRIVATE = "private",// 仅所属Agent可访问
    SHARED = "shared",// 指定Agent可访问
    PUBLIC = "public"
}
/**
 * Agent资产接口
 */
export interface AgentAsset {
    id: string;
    agentId: string;
    assetType: AssetType;
    partition: string;
    title: string;
    content: string;
    summary?: string;
    keywords: string[];
    sourceContext: string;
    sourceTimestamp: number;
    confidence?: number;
    version: number;
    previousAssetId?: string;
    changeLog?: AssetChange[];
    createdAt: number;
    updatedAt: number;
    storageBackend: StorageType;
    storageId: string;
    accessLevel: AccessLevel;
    allowedAgents?: string[];
}
/**
 * 资产变更记录
 */
export interface AssetChange {
    timestamp: number;
    changedBy: string;
    description: string;
    changes: Record<string, any>;
}
/**
 * 资产查询选项
 */
export interface AssetQueryOptions {
    agentId?: string;
    assetType?: AssetType;
    partition?: string;
    keywords?: string[];
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
}
/**
 * 资产搜索结果
 */
export interface AssetSearchResult {
    assets: AgentAsset[];
    totalCount: number;
    queryTime: number;
    facets?: Record<string, any>;
}
/**
 * 资产统计信息
 */
export interface AssetStats {
    totalAssets: number;
    totalSizeBytes: number;
    byAgent: Record<string, number>;
    byType: Record<AssetType, number>;
    byPartition: Record<string, number>;
    recentActivity: {
        last24h: number;
        last7d: number;
        last30d: number;
    };
}
//# sourceMappingURL=agent-asset.d.ts.map