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
    id: string;
    type: 'performance' | 'error' | 'warning' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    affectedComponents: string[];
    rootCause?: string;
    impact: string;
    resolution?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    createdAt: number;
    updatedAt: number;
    resolvedAt?: number;
}
/**
 * 优化建议
 */
export interface Recommendation {
    id: string;
    category: 'performance' | 'cost' | 'security' | 'reliability' | 'usability';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    benefit: string;
    effort: 'low' | 'medium' | 'high';
    estimatedTime: number;
    dependencies?: string[];
    implementationSteps?: string[];
    status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
    approvedAt?: number;
    completedAt?: number;
}
/**
 * 执行摘要
 */
export interface ExecutionSummary {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    warningCount: number;
    totalDuration: number;
    averageDuration: number;
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
    newAssets: number;
    updatedAssets: number;
    deletedAssets: number;
    totalAssets: number;
    totalSizeBytes: number;
    topAssetTypes: Array<{
        type: AssetType;
        count: number;
        percentage: number;
    }>;
    topAgents: Array<{
        agentId: string;
        assetsAdded: number;
        assetsUpdated: number;
        totalAssets: number;
    }>;
    growthRate: {
        daily: number;
        weekly: number;
        monthly: number;
    };
}
/**
 * 日报接口
 */
export interface DailyReport {
    reportId: string;
    date: string;
    period: {
        start: number;
        end: number;
    };
    executionSummary: ExecutionSummary;
    assetSummary: AssetSummary;
    performanceMetrics: SystemMetrics;
    issues: DailyIssue[];
    recommendations: Recommendation[];
    keyAchievements: string[];
    storageLocation: string;
    generatedAt: number;
    generatedBy: string;
    version: string;
    format: 'markdown' | 'html' | 'json' | 'feishu_card';
    tags: string[];
}
/**
 * 周报接口（扩展日报）
 */
export interface WeeklyReport extends DailyReport {
    weekNumber: number;
    month: string;
    quarterly: boolean;
    trendAnalysis: {
        executionTrend: 'improving' | 'declining' | 'stable';
        assetGrowthTrend: 'accelerating' | 'decelerating' | 'stable';
        errorTrend: 'improving' | 'declining' | 'stable';
        performanceTrend: 'improving' | 'declining' | 'stable';
    };
    comparativeAnalysis: {
        vsLastWeek: Record<string, number>;
        vsAverage: Record<string, number>;
    };
}
/**
 * 月报接口（扩展周报）
 */
export interface MonthlyReport extends WeeklyReport {
    month: string;
    quarter: number;
    year: number;
    monthlyHighlights: string[];
    monthlyChallenges: string[];
    roadmapProgress: {
        completed: string[];
        inProgress: string[];
        planned: string[];
        blocked: string[];
    };
    budgetAnalysis?: {
        estimatedCost: number;
        actualCost: number;
        variance: number;
        costDrivers: string[];
    };
}
/**
 * 报告生成选项
 */
export interface ReportGenerationOptions {
    date: string;
    format: 'markdown' | 'html' | 'json' | 'feishu_card';
    includeDetails: boolean;
    includeCharts: boolean;
    includeRecommendations: boolean;
    recipients?: string[];
    deliveryChannels: ('feishu' | 'email' | 'webhook')[];
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
//# sourceMappingURL=daily-report.d.ts.map