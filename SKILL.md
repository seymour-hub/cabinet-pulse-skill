---
name: cabinet-pulse
description: Zero-pressure memory reset system for multi-Agent collaboration in OpenClaw. Provides automated context archival, structured asset management, and intelligent memory restoration. Solves token accumulation, context fragmentation, and role contamination in multi-Agent systems. Trigger on phrases like "memory management", "context cleanup", "agent memory reset", or when coordinating long-running multi-Agent workflows.
version: 1.0.0
requires:
  - feishu-docx-powerwrite  # Optional dependency for Feishu storage
  - multi-agent-task-monitor # Optional dependency for progress tracking
metadata:
  category: system-management
  tags: [memory, agent, automation, monitoring, context-management]
---

# 🏛️ Cabinet Pulse (内阁脉动)

**"Sunset Archive, Sunrise Resurrection."** - A proactive dehydration memory management protocol for OpenClaw multi-Agent collaboration systems.

## 🎯 Core Problem Statement

High-intensity AI R&D and market research scenarios with multi-Agent collaboration (central, strategic, market, infrastructure) often face:

1. **Token Accumulation (Brain Fog)**: Context exceeding 100k tokens leading to response delays and logical drift.
2. **Character Contamination (Role Bleeding)**: Agent role boundaries blurring after context cleanup, diluting professionalism.
3. **Asset Fragmentation**: Deep reasoning conclusions existing only in unstable cache memory.

**Cabinet Pulse** addresses these through "sunset archival" and "sunrise resurrection" logic, achieving system entropy reduction and logical solidification.

## 🏛️ Cabinet Roles Architecture

This skill is designed around four core Agent roles with functional isolation:

| Role | Agent ID | Responsibility | Memory Focus |
|------|----------|----------------|--------------|
| **Back-Pot Man** | `main` | Central commander | Global coordination, archival verification, soul injection |
| **Non-Stick Pan** | `chief-strategist` | Chief strategist | Competitive logic, long-term roadmap solidification |
| **Pie-Maker** | `marketing-insight-expert` | Marketing expert | Value extraction, communication discourse dehydration |
| **Holdout** | `infrastructure-expert` | Infrastructure expert | Hardware parameters, topology structure locking |

## 🔄 Core Workflow

### Phase 1: Sunset Archive (黄昏归档)
- **Action**: Initiated by "Back-Pot Man", each Agent archives daily conclusions into structured assets.
- **Target**: Transform "short-term dialogue" into "long-term structured assets".
- **Signal**: Send `[READY_FOR_PURGE]` signal when archival completes.

### Phase 2: Physical Cleanup (物理清场)
- **Action**: Supervisory system receives signal, physically deletes `sessions` and `.lock` files, performs hard service restart.
- **Target**: Eliminate deadlocks completely, achieve 0% token load startup next day.

### Phase 3: Sunrise Resurrection (紫气东来)
- **Action**: After service restart, "Back-Pot Man" directs each Agent to access their dedicated partition.
- **Target**: Achieve "each takes what they need" logical resurrection, ensuring professional character continuation under 0 load.

## 📊 Core Data Model

### Key Entities
1. **AgentAsset**: Structured memory assets with metadata and content
2. **AgentConfig**: Agent-specific configuration and permissions
3. **ExecutionLog**: Workflow execution records and performance metrics
4. **SystemMetrics**: System health and performance indicators
5. **DailyReport**: Consolidated execution reports and recommendations

### Storage Architecture
- **Primary**: SQLite with FTS5 full-text search
- **Fallback**: Local file system with JSON/JSONL format
- **Cloud**: Feishu document integration (optional)
- **Encryption**: Field-level encryption for sensitive data

## 🚀 Core Features

### 1. Automated Context Archival (MVP)
- Real-time Agent context capture and analysis
- Intelligent asset classification and tagging
- Structured conversion from volatile memory to persistent storage
- Configurable retention policies and compression strategies

### 2. Intelligent Memory Restoration (1.0)
- Context-aware memory injection based on Agent roles
- Progressive context loading to minimize token impact
- Cross-Agent relationship discovery and asset linking
- Validation and integrity checking of restored memories

### 3. Automated Scheduling System (P0 Priority)
- Cron-based task scheduling with configurable intervals
- Robust failure handling with retry mechanisms
- Execution monitoring and performance tracking
- Graceful shutdown and recovery procedures

### 4. Detailed Monitoring Reports (P1 Priority)
- Real-time system metrics collection and analysis
- Daily/weekly/monthly report generation
- Multi-format output (Markdown, JSON, HTML, Feishu cards)
- Alerting and notification system integration

## 🔧 Technical Architecture

### Modular Design
```
Cabinet Pulse Skill
├── Pulse Engine (Core Orchestrator)
├── Asset Archiver (Context → Structured Assets)
├── Enhanced Storage Adapter (Multi-backend Support)
├── Agent Manager (Registration & Monitoring)
├── Health Monitor (Metrics & Reporting)
└── Config Manager (Unified Configuration)
```

### Storage Adapter Interface
```typescript
interface IEnhancedStorageAdapter {
  // Core CRUD operations
  saveAsset(asset: AgentAsset): Promise<StorageResult>;
  getAsset(assetId: string): Promise<AgentAsset | null>;
  listAssets(options: ListOptions): Promise<AgentAsset[]>;
  
  // Advanced features
  searchAssets(query: SearchQuery): Promise<SearchResult>;
  createAssetRelation(relation: AssetRelation): Promise<StorageResult>;
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  encryptData(data: any, configId: string): Promise<EncryptedData>;
}
```

## 📈 Implementation Roadmap

### Phase 1: MVP Core Development (1-2 weeks)
- **Week 1**: Data model implementation + SQLite storage adapter
- **Week 2**: Asset archiver core + Agent manager + CLI tool

### Phase 2: 1.0 Feature Enhancement (1-2 weeks)
- **Week 3**: Automated scheduling system + Robustness enhancements
- **Week 4**: Detailed monitoring reports + Observability integration

### Phase 3: Testing & Documentation (1 week)
- Complete test suite (unit + integration + E2E)
- Comprehensive documentation (user + developer + API)

### Phase 4: Ecosystem Expansion (Ongoing)
- Plugin system architecture + Community building
- Enterprise integrations + Cloud service adapters

## 🛠️ Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/seymour-hub/cabinet-pulse-skill.git
cd cabinet-pulse-skill

# Install dependencies
npm install

# Build the project
npm run build

# Link to OpenClaw skills directory
ln -s $(pwd) ~/.openclaw/skills/cabinet-pulse
```

### 2. Configuration
```json
{
  "cabinet_pulse": {
    "storage": {
      "primary": "sqlite",
      "database_path": "./data/cabinet-pulse.db",
      "retention_days": 30
    },
    "schedule": {
      "archive_time": "02:00",
      "timezone": "Asia/Shanghai"
    },
    "agents": {
      "infrastructure-expert": {
        "asset_types": ["technical_specs", "architecture_design"],
        "partition": "infrastructure-partition"
      }
    }
  }
}
```

### 3. Manual Execution
```bash
# Archive agent contexts
node scripts/cabinet-pulse.js archive --agent infrastructure-expert

# Generate daily report
node scripts/cabinet-pulse.js report --date $(date +%Y-%m-%d)

# List archived assets
node scripts/cabinet-pulse.js list --agent chief-strategist
```

## 🔍 Monitoring & Observability

### Key Metrics Tracked
- **Context Reduction Rate**: Compression efficiency from original context
- **Asset Archival Success Rate**: Percentage of successfully archived contexts
- **Restoration Accuracy**: Precision of memory injection and context recovery
- **System Performance**: Execution time, memory usage, storage utilization

### Report Formats
- **Daily Summary**: Executive overview of overnight operations
- **Detailed Analytics**: Agent-level performance and asset statistics
- **Health Dashboard**: System status and recommended actions
- **Audit Trail**: Complete execution history for compliance

## ⚠️ Error Handling & Recovery

### Multi-level Error Classification
- **Warning (⚠️)**: Non-critical issues, automatic retry
- **Error (❌)**: Critical failures, user notification required
- **Blockage (🚫)**: System-level issues, manual intervention needed

### Recovery Strategies
- **Automatic Retry**: Exponential backoff with configurable limits
- **Fallback Mechanisms**: Alternate storage backends and execution paths
- **Data Integrity Checks**: Validation and repair of corrupted assets
- **Graceful Degradation**: Partial functionality maintenance during failures

## 📝 License & Contribution

- **License**: MIT License
- **Source**: https://github.com/seymour-hub/cabinet-pulse-skill
- **Issues**: GitHub Issues for bug reports and feature requests
- **Contributing**: See CONTRIBUTING.md for development guidelines

---

**Cabinet Pulse** transforms multi-Agent collaboration from a fragile, memory-intensive process into a robust, scalable system with automated memory management and intelligent context preservation.