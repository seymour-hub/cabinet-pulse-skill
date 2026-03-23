"use strict";
/**
 * AgentConfig - Agent配置实体
 * 定义Agent的专长配置、存储配额、权限设置等
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStatus = void 0;
/**
 * Agent状态枚举
 */
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["INACTIVE"] = "inactive";
    AgentStatus["ERROR"] = "error";
    AgentStatus["MAINTENANCE"] = "maintenance";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
//# sourceMappingURL=agent-config.js.map