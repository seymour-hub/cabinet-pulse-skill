# 🏮 Cabinet-Pulse (内阁脉动)

> **"Sunset Archive, Sunrise Resurrection."** > 一套针对 OpenClaw 多 Agent 协作系统的“主动脱水”型记忆管理协议。

---

## 💡 项目背景 (The Why)

在高强度的 AI 基础设施研发（AIos）与市场调研场景下，基于多 Agent 协同（Multi-Agent Orchestration）的架构常面临以下三座大山：

1. **Token 淤积 (Brain Fog)**：长周期运行导致上下文超过 100k+，引发 `.lock` 冲突、响应超时（10000ms+）及严重的逻辑漂移。
2. **人格污染 (Character Contamination)**：简单的记忆恢复导致 Agent 职能边界模糊，基建参数与市场话术交叉污染，降低决策专业性。
3. **资产散落 (Asset Fragmentation)**：高价值的深度推演结论仅存于瞬时缓存，缺乏自动化的结构化“脱水”与持久化归档。

**Cabinet-Pulse** 借鉴了分布式系统中的“状态快照”与“冷热分离”理念，通过 **“夕阳无限-紫气东来”** 逻辑，实现系统减熵、逻辑固化与 0 负载重启。

---

## 🏛️ 内阁职能隔离 (Cabinet Roles)

本项目基于严密的职能权限模型（RBAC for Agents）设计：

* **背锅侠 (Back-Pot Man)**：**中枢指挥官**。负责全局任务分发、归档状态校验及重启后的记忆分拣。
* **不粘锅 (Non-Stick Pan)**：**首席战略官**。专注于竞品对比逻辑、长期技术路线图的纯净固化。
* **画饼师 (Pie-Maker)**：**市场营销专家**。负责产品亮点提炼、客户价值主张的语义脱水。
* **钉子户 (Holdout)**：**基础设施专家**。锁定 GPU 拓扑、PCIe 带宽、散热参数等底层物理指标。

---

## 🔄 核心工作流 (The Workflow)

### 1. 夕阳无限 (Sunset Archive)
* **触发**：由中枢“背锅侠”下发分布式归档指令。
* **动作**：各 Agent 提取当日“脱水结论”，调用 `feishu-docx-powerwrite` 分类存入核心资产库的四个**物理隔离分区**。
* **产出**：发送 `[READY_FOR_PURGE]` 原子信号，固化今日“知识资产”。

### 2. 物理清场 (The Purge)
* **动作**：由外部监控系统执行 `stop` -> `rm sessions/*` -> `restart`。
* **目标**：从底层物理层面彻底根除死锁与 Token 冗余，实现第二天启动时 **0% Context 负载**。

### 3. 紫气东来 (Sunrise Resurrection)
* **动作**：服务重启后，由“背锅侠”执行 **“灵魂注入”**。通过定向读取飞书分区，仅将属于各 Agent 职责范围的记忆摘要推送到其 Context Window。
* **目标**：实现专业人格在“无杂质”环境下的完美接续。

---

## 📊 性能表现 (Performance)

| 指标 | 传统全量恢复方案 | Cabinet-Pulse 协议 |
| :--- | :--- | :--- |
| **启动 Context 负载** | 100k+ (极高延迟) | < 5k (零延迟) |
| **人格纯净度** | 逻辑交叉污染 (严重) | 物理隔离 (极高) |
| **系统稳态** | 易崩溃、锁冲突 | 每日重置、恒定稳定 |
| **知识产物** | 不可读 JSON 缓存 | 结构化飞书核心资产库 |

---

## 🚀 快速开始 (Quick Start)

1.  将本项目 Skill 部署至 `~/.openclaw/skills/cabinet-pulse/`。
2.  在配置文件中配置您的飞书文档分区逻辑与存储路径。
3.  确保您的“多 Agent 任务监控系统”具备监听 `[READY_FOR_PURGE]` 字符并执行 shell 重启脚本的权限。

---

## 🏛️ Enterprise & Customization (商业合作)

**Cabinet-Pulse** 采用“核心开源 + 插件隔离”架构。以下高级模块专为企业级深度场景提供：

* **Deep-Infra Adapter**：针对 NVIDIA GPU 算力集群拓扑的专用正则提取与监控逻辑。
* **Zero-Latency Logic-Gate**：高并发场景下的飞书限频冲突处理算法（Pro 专用）。
* **PMM Insight Template**：针对部门汇报、决策支持生成的结构化日报动态模板。

*如需获取企业级增强脚本、日报模板或寻求技术合作，请通过 GitHub Discussion 或私信联系。*

---

## 📜 许可证 (License)

基于 **MIT License** 开源。
*注意：本仓库仅包含开源核心架构，不含闭源的企业级监控脚本与核心业务 Prompt。*
