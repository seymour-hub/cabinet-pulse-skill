#!/usr/bin/env node
/**
 * Cabinet Pulse CLI工具
 * 内阁脉动Skill的命令行界面
 */

import { Command } from 'commander';
import { AgentManager } from '../agents/agent-manager';
import { AgentConfig, StorageType, AccessLevel } from '../types';

const program = new Command();

program
  .name('cabinet-pulse')
  .description('内阁脉动Skill - 多Agent协作记忆管理系统')
  .version('1.0.0-alpha.0');

// 全局选项
program.option('-c, --config <path>', '配置文件路径', './config/cabinet-pulse.json');

// Agent管理命令
const agentCommand = program.command('agent')
  .description('Agent管理操作');

agentCommand
  .command('list')
  .description('列出所有Agent')
  .action(async () => {
    try {
      const manager = await initializeManager();
      const result = await manager.getAllAgents();
      
      if (result.success && result.data) {
        console.log('🤖 所有Agent列表:');
        console.log('='.repeat(60));
        result.data.forEach((agent, index) => {
          console.log(`${index + 1}. ${agent.displayName} (${agent.agentId})`);
          console.log(`   描述: ${agent.description}`);
          console.log(`   专长: ${agent.expertiseDomains.join(', ')}`);
          console.log(`   资产类型: ${agent.assetTypes.join(', ')}`);
          console.log(`   状态: ${agent.isActive ? '🟢 活跃' : '🔴 非活跃'}`);
          console.log();
        });
        console.log(`总计: ${result.data.length} 个Agent`);
      } else {
        console.error('❌ 获取Agent列表失败:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 操作失败:', error);
      process.exit(1);
    }
  });

agentCommand
  .command('create <agentId>')
  .description('创建新Agent')
  .option('-n, --name <name>', '显示名称', '')
  .option('-d, --description <desc>', '描述', '新创建的Agent')
  .option('-e, --expertise <domains>', '专长领域（逗号分隔）', 'general')
  .option('-t, --types <types>', '资产类型（逗号分隔）', 'log,report')
  .action(async (agentId, options) => {
    try {
      const manager = await initializeManager();
      
      const config: Partial<AgentConfig> = {
        agentId,
        displayName: options.name || agentId,
        description: options.description,
        expertiseDomains: options.expertise.split(','),
        assetTypes: options.types.split(','),
        partition: 'default',
      };
      
      const result = await manager.createAgent(config);
      
      if (result.success) {
        console.log('✅ Agent创建成功:');
        console.log(`   ID: ${result.data?.agentId}`);
        console.log(`   名称: ${result.data?.displayName}`);
        console.log(`   描述: ${result.data?.description}`);
        console.log(`   状态: ${result.data?.isActive ? '活跃' : '非活跃'}`);
      } else {
        console.error('❌ Agent创建失败:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 操作失败:', error);
      process.exit(1);
    }
  });

agentCommand
  .command('status <agentId>')
  .description('查看Agent状态')
  .action(async (agentId) => {
    try {
      const manager = await initializeManager();
      const result = await manager.getAgentStatus(agentId);
      
      if (result.success && result.data) {
        const status = result.data;
        console.log(`📊 Agent状态: ${status.displayName} (${status.agentId})`);
        console.log('='.repeat(60));
        console.log(`🔹 显示名称: ${status.displayName}`);
        console.log(`🔹 状态: ${status.isActive ? '🟢 活跃' : '🔴 非活跃'}`);
        console.log(`🔹 最后心跳: ${new Date(status.lastHeartbeat).toLocaleString()}`);
        if (status.lastError) {
          console.log(`🔹 最后错误: ${status.lastError}`);
        }
        console.log(`🔹 资产数量: ${status.assetCount}`);
        if (status.lastArchiveTime) {
          console.log(`🔹 最后归档: ${new Date(status.lastArchiveTime).toLocaleString()}`);
        }
        console.log();
        console.log('📈 指标统计:');
        console.log(`   总查询数: ${status.metrics.totalQueries}`);
        console.log(`   总资产数: ${status.metrics.totalAssets}`);
        console.log(`   最后查询: ${new Date(status.metrics.lastQueryTime).toLocaleString()}`);
        console.log(`   平均查询时间: ${status.metrics.averageQueryTime.toFixed(2)}ms`);
      } else {
        console.error('❌ 获取Agent状态失败:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 操作失败:', error);
      process.exit(1);
    }
  });

// 资产管理命令
const assetCommand = program.command('asset')
  .description('资产管理操作');

assetCommand
  .command('add <agentId>')
  .description('为Agent添加资产')
  .option('--title <title>', '资产标题', '未命名资产')
  .option('--content <content>', '资产内容', '')
  .option('--type <type>', '资产类型', 'log')
  .option('--keywords <keywords>', '关键词（逗号分隔）', 'default')
  .action(async (agentId, options) => {
    try {
      const manager = await initializeManager();
      
      const asset = {
        agentId,
        assetType: options.type,
        partition: 'default',
        title: options.title,
        content: options.content || options.title,
        summary: options.title,
        keywords: options.keywords.split(','),
        sourceContext: 'cli',
        sourceTimestamp: Date.now(),
        confidence: 0.9,
        version: 1,
        storageBackend: StorageType.SQLITE,
        storageId: `cli-${Date.now()}`,
        accessLevel: AccessLevel.PRIVATE,
      };
      
      const result = await manager.addAsset(agentId, asset);
      
      if (result.success) {
        console.log('✅ 资产添加成功:');
        console.log(`   ID: ${result.data?.id}`);
        console.log(`   标题: ${result.data?.title}`);
        console.log(`   类型: ${result.data?.assetType}`);
        console.log(`   创建时间: ${new Date(result.data?.createdAt || 0).toLocaleString()}`);
      } else {
        console.error('❌ 资产添加失败:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 操作失败:', error);
      process.exit(1);
    }
  });

assetCommand
  .command('list <agentId>')
  .description('列出Agent的所有资产')
  .option('-l, --limit <number>', '限制数量', '10')
  .action(async (agentId, options) => {
    try {
      const manager = await initializeManager();
      const result = await manager.getAssets(agentId, { 
        limit: parseInt(options.limit) 
      });
      
      if (result.success && result.data) {
        console.log(`📚 ${agentId} 的资产列表:`);
        console.log('='.repeat(60));
        result.data.forEach((asset, index) => {
          console.log(`${index + 1}. ${asset.title} (${asset.id})`);
          console.log(`   类型: ${asset.assetType}`);
          console.log(`   创建: ${new Date(asset.createdAt).toLocaleString()}`);
          console.log(`   关键词: ${asset.keywords.join(', ')}`);
          console.log();
        });
        console.log(`总计: ${result.data.length} 个资产`);
      } else {
        console.error('❌ 获取资产列表失败:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ 操作失败:', error);
      process.exit(1);
    }
  });

// 数据库维护命令
program
  .command('maintenance')
  .description('执行数据库维护')
  .action(async () => {
    try {
      const manager = await initializeManager();
      console.log('🔧 开始数据库维护...');
      
      // 归档旧资产
      console.log('📦 归档旧资产...');
      const archiveResult = await manager.archiveOldAssets();
      if (archiveResult.success) {
        console.log(`✅ 归档完成，处理了 ${archiveResult.data || 0} 个资产`);
      } else {
        console.warn('⚠️ 归档操作失败:', archiveResult.error);
      }
      
      // 运行数据库维护
      console.log('🧹 运行数据库维护...');
      const maintenanceResult = await manager.runMaintenance();
      if (maintenanceResult.success) {
        console.log('✅ 数据库维护完成');
      } else {
        console.warn('⚠️ 数据库维护失败:', maintenanceResult.error);
      }
      
      console.log('🎉 所有维护任务完成');
    } catch (error) {
      console.error('❌ 维护操作失败:', error);
      process.exit(1);
    }
  });

// 初始化函数
async function initializeManager(): Promise<AgentManager> {
  const manager = new AgentManager({
    storage: {
      connectionString: 'sqlite:///data/cabinet-pulse.db',
      type: 'sqlite',
    },
    logLevel: 'info',
  });
  
  const result = await manager.initialize();
  if (!result.success) {
    console.error('❌ 初始化Agent管理器失败:', result.error);
    process.exit(1);
  }
  
  return manager;
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供子命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}