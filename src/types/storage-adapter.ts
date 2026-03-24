/**
 * 增强存储适配器接口定义
 * 支持多后端存储、加密管理、跨Agent关联
 */

import {
  AgentAsset,
  AgentConfig,
  AgentConfigUpdate,
  ExecutionLog,
  SystemMetrics,
  DailyReport,
  StorageResult,
  BulkResult,
  AssetQueryOptions,
  AssetSearchResult,
  TimeRange,
  QueryOptions,
  SearchResult,
} from './index';

/**
 * 存储适配器配置
 */
export interface StorageAdapterConfig {
  type: 'sqlite' | 'postgres' | 'mongodb' | 'elasticsearch';
  connectionString: string;
  options?: Record<string, any>;
  encryptionKey?: string;
  compressionEnabled?: boolean;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

/**
 * 存储适配器状态
 */
export interface StorageAdapterStatus {
  connected: boolean;
  ready: boolean;
  version: string;
  health: {
    healthy: boolean;
    message: string;
    details?: any;
  };
  metrics: {
    totalConnections: number;
    activeConnections: number;
    queryCount: number;
    errorCount: number;
    averageQueryTime: number;
  };
}

/**
 * 增强存储适配器接口
 */
export interface IEnhancedStorageAdapter {
  // 配置管理
  initialize(config: StorageAdapterConfig): Promise<StorageResult<void>>;
  connect(): Promise<StorageResult<boolean>>;
  disconnect(): Promise<StorageResult<void>>;
  getStatus(): StorageAdapterStatus;
  validate(): Promise<StorageResult<boolean>>;
  
  // Agent配置管理
  createAgentConfig(config: AgentConfig): Promise<StorageResult<AgentConfig>>;
  getAgentConfig(agentId: string): Promise<StorageResult<AgentConfig>>;
  getAllAgentConfigs(): Promise<StorageResult<AgentConfig[]>>;
  updateAgentConfig(agentId: string, update: AgentConfigUpdate): Promise<StorageResult<AgentConfig>>;
  deleteAgentConfig(agentId: string): Promise<StorageResult<void>>;
  
  // Agent资产管理
  createAgentAsset(asset: AgentAsset): Promise<StorageResult<AgentAsset>>;
  getAgentAsset(assetId: string): Promise<StorageResult<AgentAsset>>;
  getAgentAssetsByAgent(agentId: string, limit?: number, offset?: number): Promise<StorageResult<AgentAsset[]>>;
  updateAgentAsset(assetId: string, asset: Partial<AgentAsset>): Promise<StorageResult<AgentAsset>>;
  deleteAgentAsset(assetId: string): Promise<StorageResult<void>>;
  searchAgentAssets(query: AssetQueryOptions): Promise<StorageResult<AssetSearchResult>>;
  
  // 批量操作
  bulkCreateAgentAssets(assets: AgentAsset[]): Promise<BulkResult>;
  bulkUpdateAgentAssets(updates: Array<{ assetId: string; asset: Partial<AgentAsset> }>): Promise<BulkResult>;
  bulkDeleteAgentAssets(assetIds: string[]): Promise<BulkResult>;
  
  // 执行日志管理
  createExecutionLog(log: ExecutionLog): Promise<StorageResult<ExecutionLog>>;
  getExecutionLog(logId: string): Promise<StorageResult<ExecutionLog>>;
  getExecutionLogsByAgent(agentId: string, timeRange?: TimeRange, options?: QueryOptions): Promise<SearchResult<ExecutionLog>>;
  getExecutionLogsByOperation(operationType: string, timeRange?: TimeRange, options?: QueryOptions): Promise<SearchResult<ExecutionLog>>;
  
  // 系统指标管理
  createSystemMetric(metric: SystemMetrics): Promise<StorageResult<SystemMetrics>>;
  getSystemMetrics(metricType: string, timeRange?: TimeRange, options?: QueryOptions): Promise<SearchResult<SystemMetrics>>;
  getAgentSystemMetrics(agentId: string, metricType?: string, timeRange?: TimeRange): Promise<SearchResult<SystemMetrics>>;
  
  // 日报管理
  createDailyReport(report: DailyReport): Promise<StorageResult<DailyReport>>;
  getDailyReport(reportId: string): Promise<StorageResult<DailyReport>>;
  getDailyReportsByDate(reportDate: string, options?: QueryOptions): Promise<SearchResult<DailyReport>>;
  getDailyReportsByAgent(agentId: string, timeRange?: TimeRange): Promise<SearchResult<DailyReport>>;
  
  // 搜索功能
  fullTextSearch(query: string, options?: QueryOptions): Promise<SearchResult<AgentAsset>>;
  semanticSearch(query: string, embedding?: number[], options?: QueryOptions): Promise<SearchResult<AgentAsset>>;
  advancedSearch(query: QueryOptions): Promise<SearchResult<any>>;
  
  // 数据管理
  archiveOldAssets(retentionDays?: number): Promise<StorageResult<number>>;
  cleanupArchivedAssets(olderThanDays?: number): Promise<StorageResult<number>>;
  exportData(format: 'json' | 'csv' | 'sql', options?: QueryOptions): Promise<StorageResult<string>>;
  importData(data: string, format: 'json' | 'csv' | 'sql'): Promise<StorageResult<number>>;
  
  // 维护操作
  runMaintenance(): Promise<StorageResult<void>>;
  backup(backupPath: string): Promise<StorageResult<void>>;
  restore(backupPath: string): Promise<StorageResult<void>>;
  
  // 性能优化
  createIndex(field: string | string[], indexType?: string): Promise<StorageResult<void>>;
  dropIndex(field: string | string[]): Promise<StorageResult<void>>;
  optimize(): Promise<StorageResult<void>>;
  
  // 加密管理
  encryptData(data: string, keyId?: string): Promise<StorageResult<string>>;
  decryptData(encryptedData: string, keyId?: string): Promise<StorageResult<string>>;
  rotateEncryptionKey(oldKeyId: string, newKeyId: string): Promise<StorageResult<void>>;
  
  // 跨Agent关联
  createAssetRelation(sourceAssetId: string, targetAssetId: string, relationType: string): Promise<StorageResult<void>>;
  getAssetRelations(assetId: string, relationType?: string): Promise<StorageResult<Array<{
    assetId: string;
    relationType: string;
    createdAt: number;
  }>>>;
  deleteAssetRelation(sourceAssetId: string, targetAssetId: string, relationType?: string): Promise<StorageResult<void>>;
  
  // 统计和分析
  getAssetStatistics(options?: QueryOptions): Promise<StorageResult<{
    totalAssets: number;
    assetsByType: Record<string, number>;
    assetsByAgent: Record<string, number>;
    assetsByTime: Array<{ time: number; count: number }>;
    averageAssetSize: number;
    largestAsset: { id: string; size: number };
  }>>;
  
  getSystemStatistics(timeRange?: TimeRange): Promise<StorageResult<{
    operationCount: number;
    successRate: number;
    averageResponseTime: number;
    agentActivity: Record<string, { operations: number; lastActive: number }>;
    storageUsage: { total: number; used: number; free: number };
  }>>;
}