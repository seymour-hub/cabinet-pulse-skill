# 🏮 Cabinet-Pulse (内阁脉动)

> **"Sunset Archive, Sunrise Resurrection."** > 一套针对 OpenClaw 多 Agent 协作系统的“主动脱水”记忆管理协议。

---

## 💡 项目背景 (The Why)
在高强度的 AI 研发与市场调研场景下，多 Agent 协同（如中枢、战略、市场、基建）常面临：
1. **Token 淤积 (Brain Fog)**：上下文超过 100k 导致的响应延迟与逻辑漂移。
2. **人格污染 (Character Contamination)**：清场后 Agent 角色边界模糊，专业性稀释。
3. **资产散落 (Asset Fragmentation)**：深度推演结论仅存于不稳定的缓存中。

**Cabinet-Pulse** 通过“日落归档”与“日出复苏”逻辑，实现系统减熵与逻辑固化。

---

## 🏛️ 内阁分工 (Cabinet Roles)
本项目基于四位核心 Agent 的职能隔离设计：
* **背锅侠 (Back-Pot Man)**：中枢指挥官。负责全局调度、归档校验与灵魂注入。
* **不粘锅 (Non-Stick Pan)**：首席战略官。负责竞品逻辑与长期路线固化。
* **画饼师 (Pie-Maker)**：市场营销专家。负责价值提炼与传播话术脱水。
* **钉子户 (Holdout)**：基础设施专家。负责底层硬件参数与拓扑结构锁定。

---

## 🔄 核心工作流 (The Workflow)

### 1. 夕阳无限 (Sunset Archive)
* **动作**：由“背锅侠”发起，各 Agent 将当日结论通过 `feishu-docx-powerwrite` 分类存入飞书核心资产库（四个物理隔离区）。
* **目标**：将“短期对话”转化为“长期结构化资产”，发送 `[READY_FOR_PURGE]` 信号。

### 2. 物理清场 (The Purge)
* **动作**：监督系统接收信号，物理删除 `sessions` 与 `.lock` 文件，服务硬重启。
* **目标**：彻底消除死锁，实现第二天 0% Token 负载启动。

### 3. 紫气东来 (Sunrise Resurrection)
* **动作**：服务重启后，“背锅侠”定向引导各 Agent 访问专属分区。
* **目标**：实现“各取所需”的逻辑复苏，确保专业人格在 0 负载下完美接续。

---

## 🚀 快速开始 (Quick Start)
1. 将本 Skill 部署至 `~/.openclaw/skills/cabinet-pulse/`。
2. 配置您的飞书文档分区路径。
3. 配合外部任务监督系统监听 `[READY_FOR_PURGE]` 信号。

---

## 📜 许可证 (License)
基于 **MIT License** 开源。
