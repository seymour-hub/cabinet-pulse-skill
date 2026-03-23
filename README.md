# 🏛️ Cabinet Pulse (内阁脉动)

**Zero-pressure memory reset system for multi-Agent collaboration in OpenClaw**

> **"Sunset Archive, Sunrise Resurrection."** - A proactive dehydration memory management protocol for OpenClaw multi-Agent collaboration systems.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-success.svg)](https://docs.openclaw.ai)

## 🎯 The Problem

High-intensity AI R&D and market research scenarios with multi-Agent collaboration (central, strategic, market, infrastructure) often face:

- **Token Accumulation (Brain Fog)**: Context exceeding 100k tokens leading to response delays and logical drift
- **Character Contamination (Role Bleeding)**: Agent role boundaries blurring after context cleanup, diluting professionalism
- **Asset Fragmentation**: Deep reasoning conclusions existing only in unstable cache memory

## 🏛️ The Solution: Cabinet Pulse

Cabinet Pulse transforms multi-Agent collaboration from a fragile, memory-intensive process into a robust, scalable system with:

1. **Automated Context Archival**: Real-time Agent context capture and structured storage
2. **Intelligent Memory Restoration**: Context-aware memory injection based on Agent roles
3. **Automated Scheduling**: Cron-based task scheduling with robust failure handling
4. **Detailed Monitoring**: Real-time metrics collection and comprehensive reporting

## 🔄 Core Workflow

### Phase 1: Sunset Archive (黄昏归档)
- **Action**: Each Agent archives daily conclusions into structured assets
- **Target**: Transform "short-term dialogue" into "long-term structured assets"
- **Signal**: Send `[READY_FOR_PURGE]` signal when archival completes

### Phase 2: Physical Cleanup (物理清场)
- **Action**: Supervisory system deletes stale sessions and restarts services
- **Target**: Eliminate deadlocks, achieve 0% token load startup next day

### Phase 3: Sunrise Resurrection (紫气东来)
- **Action**: After restart, Agents access their dedicated memory partitions
- **Target**: Achieve "each takes what they need" logical resurrection

## 📊 Technical Architecture

### Data Model
- **AgentAsset**: Structured memory assets with metadata and content
- **AgentConfig**: Agent-specific configuration and permissions
- **ExecutionLog**: Workflow execution records and performance metrics
- **SystemMetrics**: System health and performance indicators
- **DailyReport**: Consolidated execution reports and recommendations

### Storage Architecture
- **Primary**: SQLite with FTS5 full-text search
- **Fallback**: Local file system with JSON/JSONL format
- **Cloud**: Feishu document integration (optional)
- **Encryption**: Field-level encryption for sensitive data

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- OpenClaw 2026.3.11+
- SQLite3 (included as dependency)

### Installation
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

### Configuration
Create `config/default.json`:
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
      "restore_time": "02:20",
      "report_time": "02:30",
      "timezone": "Asia/Shanghai"
    },
    "agents": {
      "infrastructure-expert": {
        "asset_types": ["technical_specs", "architecture_design"],
        "partition": "infrastructure-partition"
      },
      "chief-strategist": {
        "asset_types": ["strategic_plan", "competitive_analysis"],
        "partition": "strategy-partition"
      }
    }
  }
}
```

### Basic Usage
```bash
# Manual context archival
npm run archive -- --agent infrastructure-expert

# Generate daily report
npm run report -- --date $(date +%Y-%m-%d)

# List archived assets
npm run list -- --agent chief-strategist
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

## 🔧 Development

### Setup Development Environment
```bash
# Install dependencies
npm install

# Build in watch mode
npm run build:watch

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure
```
cabinet-pulse-skill/
├── src/                        # TypeScript source code
│   ├── core/                   # Core engine and orchestrator
│   ├── adapters/               # Storage adapters (SQLite, Feishu, etc.)
│   ├── agents/                 # Agent management and coordination
│   ├── monitor/                # Health monitoring and reporting
│   └── utils/                  # Utility functions and helpers
├── config/                     # Configuration files
├── scripts/                    # CLI scripts and tools
├── examples/                   # Usage examples
├── tests/                      # Test suites
└── docs/                       # Documentation
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Documentation

- [SKILL.md](SKILL.md): OpenClaw skill definition and detailed documentation
- [API Documentation](docs/api/): Complete API reference
- [User Guide](docs/guides/user-guide.md): Step-by-step usage instructions
- [Developer Guide](docs/guides/developer-guide.md): Contributing and extending the system

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

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenClaw Community** for the amazing multi-Agent collaboration platform
- **All Contributors** who help improve this system
- **The AI/ML Research Community** for advancing the state of the art

---

**Cabinet Pulse** - Transforming multi-Agent collaboration through intelligent memory management.