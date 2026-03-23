/**
 * DailyReport - 日报实体
 * 汇总每日执行情况、资产变化和系统状态
 */

import { AssetType } from './agent-asset';
import { SystemMetrics } from './system-metrics';

/**
 * 日报问题
 */
export interface DailyIssue {
  id: string;                    // 问题ID
  type: 'performance' | 'error' | 'warning' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;                 // 问题标题
  description: string;           // 问题描述
  affectedComponents: string[];  // 受影响组件
  rootCause?: string;            // 根本原因
  impact: string;                // 影响描述
  resolution?: string;           // 解决方案
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间
  resolvedAt?: number;           // 解决时间
}

/**
 * 优化建议
 */
export interface Recommendation {
  id: string;                    // 建议ID
  category: 'performance' | 'cost' | 'security' | 'reliability' | 'usability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;                 // 建议标题
  description: string;           // 建议描述
  benefit: string;               // 预期收益
  effort: 'low' | 'medium' | 'high'; // 实施难度
  estimatedTime: number;         // 预计耗时（小时）
  dependencies?: string[];       // 依赖条件
  implementationSteps?: string[]; // 实施步骤
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  approvedAt?: number;           // 批准时间
  completedAt?: number;          // 完成时间
}

/**
 * 执行摘要
 */
export interface ExecutionSummary {
  totalExecutions: number;       // 总执行次数
  successfulExecutions: number;  // 成功执行次数
  failedExecutions: number;      // 失败执行次数
  warningCount: number;          // 警告数量
  totalDuration: number;         // 总执行时间（毫秒）
  averageDuration: number;       // 平均执行时间（毫秒）
  
  byType: {
    archive: {
      executions: number;
      successRate: number;
      avgDuration: number;
    };
    restore: {
      executions: number;
      successRate: number;
      avgDuration: number;
    };
    report: {
      executions: number;
      successRate: number;
      avgDuration: number;
    };
    cleanup: {
      executions: number;
      successRate: number;
      avgDuration: number;
    };
  };
  
  peakTime: {
    timestamp: number;
    concurrentExecutions: number;
  };
}

/**
 * 资产摘要
 */
export interface AssetSummary {
  newAssets: number;             // 新增资产数
  updatedAssets: number;         // 更新资产数
  deletedAssets: number;         // 删除资产数
  totalAssets: number;           // 总资产数
  totalSizeBytes: number;        // 总大小（字节）
  
  topAssetTypes: Array<{         // 热门资产类型
    type: AssetType;
    count: number;
    percentage: number;
  }>;
  
  topAgents: Array<{             // 资产最多的Agent
    agentId: string;
    assetsAdded: number;
    assetsUpdated: number;
    totalAssets: number;
  }>;
  
  growthRate: {
    daily: number;               // 日增长率
    weekly: number;              // 周增长率
    monthly: number;             // 月增长率
  };
}

/**
 * 日报接口
 */
export interface DailyReport {
  // 核心标识
  reportId: string;              // 报告ID
  date: string;                  // 报告日期（YYYY-MM-DD）
  period: {
    start: number;               // 周期开始时间戳
    end: number;                 // 周期结束时间戳
  };
  
  // 执行摘要
  executionSummary: ExecutionSummary;
  
  // 资产摘要
  assetSummary: AssetSummary;
  
  // 性能指标
  performanceMetrics: SystemMetrics; // 系统指标快照
  
  // 问题与建议
  issues: DailyIssue[];          // 发现的问题
  recommendations: Recommendation[]; // 优化建议
  
  // 关键成就
  keyAchievements: string[];     // 关键成就
  
  // 存储信息
  storageLocation: string;       // 存储位置（文档链接等）
  generatedAt: number;           // 生成时间戳
  generatedBy: string;           // 生成者
  
  // 元数据
  version: string;               // 报告版本
  format: 'markdown' | 'html' | 'json' | 'feishu_card';
  tags: string[];                // 标签
}

/**
 * 周报接口（扩展日报）
 */
export interface WeeklyReport extends DailyReport {
  weekNumber: number;            // 周数
  month: string;                 // 月份
  quarterly: boolean;            // 是否为季度报告
  trendAnalysis: {
    executionTrend: 'improving' | 'declining' | 'stable';
    assetGrowthTrend: 'accelerating' | 'decelerating' | 'stable';
    errorTrend: 'improving' | 'declining' | 'stable';
    performanceTrend: 'improving' | 'declining' | 'stable';
  };
  comparativeAnalysis: {
    vsLastWeek: Record<string, number>; // 与上周对比
    vsAverage: Record<string, number>;  // 与平均值对比
  };
}

/**
 * 月报接口（扩展周报）
 */
export interface MonthlyReport extends WeeklyReport {
  month: string;                 // 月份（完整名称）
  quarter: number;               // 季度
  year: number;                  // 年份
  monthlyHighlights: string[];   // 月度亮点
  monthlyChallenges: string[];   // 月度挑战
  roadmapProgress: {
    completed: string[];         // 已完成项目
    inProgress: string[];        // 进行中项目
    planned: string[];           // 计划中项目
    blocked: string[];           // 受阻项目
  };
  budgetAnalysis?: {
    estimatedCost: number;       // 预估成本
    actualCost: number;          // 实际成本
    variance: number;            // 差异
    costDrivers: string[];       // 成本驱动因素
  };
}

/**
 * 报告生成选项
 */
export interface ReportGenerationOptions {
  date: string;                  // 报告日期
  format: 'markdown' | 'html' | 'json' | 'feishu_card';
  includeDetails: boolean;       // 是否包含详细信息
  includeCharts: boolean;        // 是否包含图表
  includeRecommendations: boolean; // 是否包含建议
  recipients?: string[];         // 接收者列表
  deliveryChannels: ('feishu' | 'email' | 'webhook')[]; // 交付渠道
  priority: 'low' | 'medium' | 'high';
}

/**
 * 报告交付结果
 */
export interface ReportDeliveryResult {
  reportId: string;
  deliveryStatus: Record<string, {
    channel: string;
    status: 'success' | 'failed' | 'pending';
    timestamp: number;
    error?: string;
    messageId?: string;
  }>;
  overallStatus: 'success' | 'partial' | 'failed';
  generatedAt: number;
  deliveredAt?: number;
}