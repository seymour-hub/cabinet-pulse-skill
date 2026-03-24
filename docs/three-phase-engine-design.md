# 三阶段引擎设计文档

**文档版本**: 1.0  
**创建时间**: 2026-03-24 15:50 GMT+8  
**状态**: 草案  
**关联需求**: `cabinet-pulse-requirements.md`

---

## 🎯 核心目标

实现"夕阳无限-物理清场-紫气东来"多Agent记忆管理系统的三个核心阶段：

1. **夕阳无限 (Sunset Archive)**: 主动脱水型记忆归档
2. **物理清场 (The Purge)**: 零负载系统重启和清理
3. **紫气东来 (Sunrise Resurrection)**: 定向记忆恢复和人格接续

---

## 🏗️ 总体架构

```
📁 three-phase-engine/
├── 📁 sunset-archive/      # 夕阳无限引擎
│   ├── memory-detector/    # 记忆检测器
│   ├── content-extractor/  # 内容提取器
│   ├── snapshot-builder/   # 快照构建器
│   └── archive-manager/    # 归档管理器
├── 📁 the-purge/          # 物理清场调度器
│   ├── system-monitor/     # 系统监控器
│   ├── safety-validator/   # 安全验证器
│   ├── cleanup-executor/   # 清理执行器
│   └── restart-manager/    # 重启管理器
├── 📁 sunrise-resurrection/ # 紫气东来恢复器
│   ├── role-identifier/    # 角色识别器
│   ├── memory-selector/    # 记忆选择器
│   ├── context-builder/    # 上下文构建器
│   └── injection-manager/  # 注入管理器
└── 📁 integration/         # 集成层
    ├── openclaw-client/    # OpenClaw客户端
    ├── agent-coordinator/  # Agent协调器
    └── orchestration/      # 流程编排
```

---

## 🔧 夕阳无限引擎 (SunsetArchiveEngine)

### **核心功能**：
1. **记忆检测**：监控Agent上下文大小，达到阈值时触发归档
2. **内容提取**：从上下文中识别和提取重要记忆
3. **快照构建**：创建标准化的记忆快照
4. **归档存储**：保存快照到持久化存储

### **技术实现**：

#### **记忆检测器 (MemoryDetector)**
```typescript
interface MemoryDetector {
  // 检测是否需要归档
  shouldArchive(agentId: string, contextSize: number): boolean;
  
  // 检测重要任务完成事件
  detectImportantTasks(agentId: string, recentActions: AgentAction[]): TaskEvent[];
  
  // 计算上下文复杂度
  calculateComplexity(context: AgentContext): ComplexityScore;
}

interface ComplexityScore {
  tokenCount: number;
  topicDiversity: number;
  decisionDensity: number;
  timeSpan: number; // 时间跨度（毫秒）
}
```

#### **内容提取器 (ContentExtractor)**
```typescript
interface ContentExtractor {
  // 提取重要对话
  extractImportantConversations(context: AgentContext): Conversation[];
  
  // 提取决策和结论
  extractDecisions(context: AgentContext): Decision[];
  
  // 提取持久性知识
  extractPersistentKnowledge(context: AgentContext): Knowledge[];
  
  // 评估内容重要性
  evaluateImportance(content: ExtractedContent): ImportanceScore;
}

interface ExtractedContent {
  type: 'conversation' | 'decision' | 'knowledge';
  content: string;
  metadata: {
    participants: string[];
    timestamp: number;
    confidence: number;
  };
  importance: number; // 0-1
}
```

#### **快照构建器 (SnapshotBuilder)**
```typescript
interface SnapshotBuilder {
  // 构建记忆快照
  buildSnapshot(
    agentId: string,
    extractedContent: ExtractedContent[],
    context: AgentContext
  ): MemorySnapshot;
  
  // 压缩和优化快照
  compressSnapshot(snapshot: MemorySnapshot): CompressedSnapshot;
  
  // 建立快照关联
  linkSnapshots(snapshots: MemorySnapshot[]): SnapshotGraph;
}

interface MemorySnapshot {
  id: string;
  agentId: string;
  content: string;
  summary: string;
  importance: number;
  category: string;
  timestamp: number;
  metadata: {
    originalContextSize: number;
    compressionRatio: number;
    extractionMethod: string;
    relatedSnapshots: string[];
  };
}
```

---

## 🔧 物理清场调度器 (PurgeScheduler)

### **核心功能**：
1. **系统监控**：监控OpenClaw服务状态和性能指标
2. **安全验证**：验证清理操作的安全性
3. **清理执行**：执行标准的清理流程
4. **重启管理**：控制OpenClaw服务重启

### **技术实现**：

#### **系统监控器 (SystemMonitor)**
```typescript
interface SystemMonitor {
  // 监控OpenClaw服务状态
  monitorOpenClawStatus(): OpenClawStatus;
  
  // 检测性能问题
  detectPerformanceIssues(): PerformanceIssue[];
  
  // 监控token淤积
  monitorTokenAccumulation(): TokenAccumulationReport;
  
  // 监控内存使用
  monitorMemoryUsage(): MemoryUsageReport;
}

interface OpenClawStatus {
  isRunning: boolean;
  uptime: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  sessionCount: number;
  agentStatuses: AgentStatus[];
}
```

#### **安全验证器 (SafetyValidator)**
```typescript
interface SafetyValidator {
  // 验证所有记忆已归档
  verifyAllMemoriesArchived(): VerificationResult;
  
  // 验证备份完整性
  verifyBackupIntegrity(): BackupVerification;
  
  // 检查清理风险
  assessPurgeRisks(): RiskAssessment;
  
  // 生成安全报告
  generateSafetyReport(): SafetyReport;
}

interface VerificationResult {
  allArchived: boolean;
  missingArchives: string[];
  archiveIntegrity: boolean;
  recommendations: string[];
}
```

#### **清理执行器 (CleanupExecutor)**
```typescript
interface CleanupExecutor {
  // 执行标准清理流程
  executeStandardPurge(): PurgeResult;
  
  // 执行自定义清理
  executeCustomPurge(options: PurgeOptions): PurgeResult;
  
  // 验证清理结果
  verifyCleanup(): CleanupVerification;
  
  // 生成清理报告
  generateCleanupReport(): CleanupReport;
}

interface PurgeResult {
  success: boolean;
  steps: PurgeStep[];
  backups: BackupInfo[];
  errors: string[];
  warnings: string[];
  duration: number;
}
```

---

## 🔧 紫气东来恢复器 (SunriseResurrectionEngine)

### **核心功能**：
1. **角色识别**：识别每个Agent的职能角色
2. **记忆选择**：基于角色筛选相关记忆
3. **上下文构建**：构建个性化的初始化上下文
4. **记忆注入**：将记忆安全注入Agent上下文

### **技术实现**：

#### **角色识别器 (RoleIdentifier)**
```typescript
interface RoleIdentifier {
  // 识别Agent角色
  identifyAgentRole(agentId: string): AgentRole;
  
  // 建立角色与记忆类型的映射
  buildRoleMemoryMapping(role: AgentRole): MemoryTypeMapping;
  
  // 验证角色识别准确性
  validateRoleIdentification(agentId: string): ValidationResult;
}

interface AgentRole {
  id: string; // back-pot-man, non-stick-pan, pie-maker, holdout
  name: string;
  description: string;
  memoryCategories: string[];
  contextPreferences: ContextPreferences;
  contaminationRisks: string[];
}
```

#### **记忆选择器 (MemorySelector)**
```typescript
interface MemorySelector {
  // 为Agent选择相关记忆
  selectMemoriesForAgent(agentId: string, role: AgentRole): MemorySelection;
  
  // 过滤无关记忆
  filterIrrelevantMemories(memories: MemorySnapshot[], role: AgentRole): MemorySnapshot[];
  
  // 优先级排序
  prioritizeMemories(memories: MemorySnapshot[]): PrioritizedMemories;
  
  // 验证无污染
  verifyNoContamination(selection: MemorySelection): ContaminationCheck;
}

interface MemorySelection {
  agentId: string;
  role: AgentRole;
  selectedMemories: MemorySnapshot[];
  rejectedMemories: MemorySnapshot[];
  selectionCriteria: SelectionCriteria;
  confidence: number;
}
```

#### **上下文构建器 (ContextBuilder)**
```typescript
interface ContextBuilder {
  // 构建初始化上下文
  buildInitialContext(agentId: string, memories: MemorySnapshot[]): AgentContext;
  
  // 优化上下文大小
  optimizeContextSize(context: AgentContext, maxTokens: number): OptimizedContext;
  
  // 添加上下文元数据
  addContextMetadata(context: AgentContext, metadata: ContextMetadata): EnhancedContext;
  
  // 验证上下文质量
  validateContextQuality(context: AgentContext): QualityAssessment;
}

interface AgentContext {
  agentId: string;
  content: string;
  metadata: {
    sourceMemories: string[];
    builtAt: number;
    tokenCount: number;
    roleSpecific: boolean;
  };
  instructions: string;
  examples: Example[];
  constraints: Constraint[];
}
```

---

## 🔄 工作流集成

### **标准工作流**：
```
1. 夕阳无限触发
   ├── 记忆检测 → 内容提取 → 快照构建 → 归档存储
   └── 验证归档完整性

2. 物理清场准备
   ├── 系统监控 → 安全验证 → 备份创建
   └── 确认清理条件

3. 物理清场执行
   ├── 停止OpenClaw → 清理会话 → 重启服务
   └── 验证清理结果

4. 紫气东来恢复
   ├── 角色识别 → 记忆选择 → 上下文构建 → 记忆注入
   └── 验证无污染
```

### **错误处理和恢复**：
1. **优雅降级**：任何阶段失败时提供降级方案
2. **自动重试**：对临时性错误自动重试
3. **手动干预**：关键失败时请求人工干预
4. **回滚机制**：支持操作回滚到安全状态

---

## 🚀 实施计划

### **阶段1：夕阳无限引擎实现**（3-4天）
1. **Day 1-2**: 记忆检测器和内容提取器
2. **Day 3**: 快照构建器和归档管理器
3. **Day 4**: 集成测试和性能优化

### **阶段2：物理清场调度器实现**（2-3天）
1. **Day 1**: 系统监控器和安全验证器
2. **Day 2**: 清理执行器和重启管理器
3. **Day 3**: OpenClaw集成测试

### **阶段3：紫气东来恢复器实现**（3-4天）
1. **Day 1-2**: 角色识别器和记忆选择器
2. **Day 3**: 上下文构建器和注入管理器
3. **Day 4**: 集成测试和污染防止

### **阶段4：系统集成和测试**（2-3天）
1. **Day 1**: 三阶段引擎集成
2. **Day 2**: 端到端工作流测试
3. **Day 3**: 性能测试和优化

---

## ⚠️ 技术风险与缓解

### **风险1：OpenClaw集成复杂性**
- **缓解**：提前验证API，准备备选方案
- **备选**：提供手动操作指南和脚本

### **风险2：记忆提取准确性**
- **缓解**：采用保守策略，宁可少提取不错提取
- **增强**：提供手动调整和验证工具

### **风险3：系统安全风险**
- **缓解**：严格的备份和验证机制
- **保护**：操作前多重确认，提供回滚

### **风险4：性能影响**
- **缓解**：异步处理，资源限制，监控告警
- **优化**：增量处理，缓存机制，懒加载

---

## 📊 验收标准

### **夕阳无限引擎**：
- ✅ 能够检测Agent上下文大小并触发归档
- ✅ 能够提取和保存记忆快照
- ✅ 支持手动触发和查询归档记忆
- ✅ 归档完整性验证通过

### **物理清场调度器**：
- ✅ 能够监控系统状态并判断清理时机
- ✅ 安全执行清理流程
- ✅ 支持OpenClaw服务重启
- ✅ 清理操作可验证

### **紫气东来恢复器**：
- ✅ 能够识别Agent角色
- ✅ 能够为Agent选择相关记忆
- ✅ 能够构建初始化上下文
- ✅ 验证无记忆污染

---

## 🏁 下一步行动

1. **立即行动**：
   - 完善详细接口设计
   - 创建项目目录结构
   - 准备开发环境

2. **短期计划**：
   - 开始夕阳无限引擎开发
   - 验证OpenClaw集成可行性
   - 建立测试框架

3. **长期计划**：
   - 完成三阶段引擎实现
   - 进行系统集成测试
   - 准备生产部署

---

**文档状态**: 🟡 草案  
**最后更新**: 2026-03-24 15:50 GMT+8  
**负责人**: 中枢Agent (main)  
**关联文件**: `cabinet-pulse-requirements.md`, `agent-manager.ts`, `sqlite-adapter.ts`