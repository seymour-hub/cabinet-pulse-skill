"use strict";
/**
 * ExecutionLog - 执行日志实体
 * 记录工作流执行过程、性能指标和错误信息
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerType = exports.ExecutionStatus = exports.ExecutionType = void 0;
/**
 * 执行类型枚举
 */
var ExecutionType;
(function (ExecutionType) {
    ExecutionType["ARCHIVE"] = "archive";
    ExecutionType["RESTORE"] = "restore";
    ExecutionType["REPORT"] = "report";
    ExecutionType["CLEANUP"] = "cleanup";
    ExecutionType["VALIDATION"] = "validation";
    ExecutionType["MIGRATION"] = "migration";
})(ExecutionType || (exports.ExecutionType = ExecutionType = {}));
/**
 * 执行状态枚举
 */
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["PENDING"] = "pending";
    ExecutionStatus["RUNNING"] = "running";
    ExecutionStatus["COMPLETED"] = "completed";
    ExecutionStatus["FAILED"] = "failed";
    ExecutionStatus["CANCELLED"] = "cancelled";
    ExecutionStatus["TIMEOUT"] = "timeout";
})(ExecutionStatus || (exports.ExecutionStatus = ExecutionStatus = {}));
/**
 * 触发方式枚举
 */
var TriggerType;
(function (TriggerType) {
    TriggerType["SCHEDULE"] = "schedule";
    TriggerType["MANUAL"] = "manual";
    TriggerType["EVENT"] = "event";
    TriggerType["API"] = "api";
    TriggerType["TEST"] = "test";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
//# sourceMappingURL=execution-log.js.map