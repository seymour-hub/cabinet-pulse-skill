"use strict";
/**
 * AgentAsset - 结构化记忆资产实体
 * 表示从Agent上下文中提取并持久化的结构化资产
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessLevel = exports.StorageType = exports.AssetType = void 0;
/**
 * 资产类型枚举
 */
var AssetType;
(function (AssetType) {
    // 技术类资产
    AssetType["TECHNICAL_SPECS"] = "technical_specs";
    AssetType["ARCHITECTURE_DESIGN"] = "architecture_design";
    AssetType["PERFORMANCE_METRICS"] = "performance_metrics";
    AssetType["SECURITY_ASSESSMENT"] = "security_assessment";
    AssetType["SYSTEM_CONFIG"] = "system_config";
    // 战略类资产
    AssetType["STRATEGIC_PLAN"] = "strategic_plan";
    AssetType["COMPETITIVE_ANALYSIS"] = "competitive_analysis";
    AssetType["RISK_ASSESSMENT"] = "risk_assessment";
    AssetType["MARKET_INSIGHTS"] = "market_insights";
    // 通用类资产
    AssetType["KEY_DECISIONS"] = "key_decisions";
    AssetType["LESSONS_LEARNED"] = "lessons_learned";
    AssetType["BEST_PRACTICES"] = "best_practices";
    AssetType["METHODOLOGIES"] = "methodologies";
    // 系统类资产
    AssetType["AGENT_STATE"] = "agent_state";
    AssetType["MONITORING_DATA"] = "monitoring_data";
    AssetType["EXECUTION_LOG"] = "execution_log";
})(AssetType || (exports.AssetType = AssetType = {}));
/**
 * 存储后端类型枚举
 */
var StorageType;
(function (StorageType) {
    StorageType["SQLITE"] = "sqlite";
    StorageType["LOCAL_FILE"] = "local_file";
    StorageType["FEISHU_DOC"] = "feishu_doc";
    StorageType["OBJECT_STORAGE"] = "object_storage";
})(StorageType || (exports.StorageType = StorageType = {}));
/**
 * 访问级别枚举
 */
var AccessLevel;
(function (AccessLevel) {
    AccessLevel["PRIVATE"] = "private";
    AccessLevel["SHARED"] = "shared";
    AccessLevel["PUBLIC"] = "public";
})(AccessLevel || (exports.AccessLevel = AccessLevel = {}));
//# sourceMappingURL=agent-asset.js.map