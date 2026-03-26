#!/usr/bin/env node
/**
 * Agent Manager简单测试（不依赖Jest）
 */

const { AgentManager } = require('./dist/src/agents/agent-manager');

async function runTests() {
  console.log('🧪 开始Agent Manager简单测试');
  console.log('='.repeat(60));
  
  try {
    // 1. 创建Agent Manager
    const manager = new AgentManager({
      storage: {
        connectionString: ':memory:',
        adapterType: 'sqlite',
      },
      logLevel: 'info',
    });
    
    console.log('✅ Agent Manager创建成功');
    
    // 2. 初始化
    const initResult = await manager.initialize();
    if (!initResult.success) {
      console.error('❌ Agent Manager初始化失败:', initResult.error);
      return;
    }
    console.log('✅ Agent Manager初始化成功');
    
    // 3. 检查状态
    const status = manager.getStatus();
    console.log('📊 Agent Manager状态:');
    console.log(`   - 已初始化: ${status.initialized}`);
    console.log(`   - Agent数量: ${status.agentCount}`);
    console.log(`   - 存储连接: ${status.storageConnected}`);
    
    // 4. 创建测试Agent
    const createResult = await manager.createAgent({
      agentId: 'test-agent-001',
      displayName: '测试Agent 001',
      description: '用于简单测试的Agent',
      expertiseDomains: ['testing', 'development'],
      assetTypes: ['log', 'report'],
      partition: 'test',
    });
    
    if (!createResult.success) {
      console.error('❌ 创建Agent失败:', createResult.error);
    } else {
      console.log('✅ 创建Agent成功:', createResult.data?.agentId);
    }
    
    // 5. 获取Agent
    const getResult = await manager.getAgent('test-agent-001');
    if (!getResult.success) {
      console.error('❌ 获取Agent失败:', getResult.error);
    } else {
      console.log('✅ 获取Agent成功:', getResult.data?.displayName);
    }
    
    // 6. 获取所有Agent
    const allResult = await manager.getAllAgents();
    if (!allResult.success) {
      console.error('❌ 获取所有Agent失败:', allResult.error);
    } else {
      console.log(`✅ 获取所有Agent成功，共 ${allResult.data?.length || 0} 个Agent`);
    }
    
    // 7. 关闭Agent Manager
    const shutdownResult = await manager.shutdown();
    if (!shutdownResult.success) {
      console.error('❌ 关闭Agent Manager失败:', shutdownResult.error);
    } else {
      console.log('✅ Agent Manager关闭成功');
    }
    
    console.log('='.repeat(60));
    console.log('🎉 简单测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

runTests();