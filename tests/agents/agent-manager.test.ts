/**
 * Agent Manager 测试
 */

import { AgentManager } from '../../src/agents/agent-manager';
import { AgentConfig, AgentAsset } from '../../src/types';

describe('Agent Manager', () => {
  let manager: AgentManager;
  
  beforeAll(async () => {
    manager = new AgentManager({
      storage: {
        connectionString: ':memory:',
        adapterType: 'sqlite',
      },
      logLevel: 'error', // 减少测试日志输出
    });
    
    await manager.initialize();
  });
  
  afterAll(async () => {
    await manager.shutdown();
  });
  
  afterEach(async () => {
    // 清理测试数据
    const agents = await manager.getAllAgents();
    if (agents.success && agents.data) {
      for (const agent of agents.data) {
        if (agent.agentId.startsWith('test-')) {
          await manager.deleteAgent(agent.agentId);
        }
      }
    }
  });
  
  test('应该成功初始化Agent Manager', () => {
    expect(manager).toBeDefined();
    const status = manager.getStatus();
    expect(status.initialized).toBe(true);
    expect(status.storageConnected).toBe(true);
  });
  
  test('应该成功创建Agent', async () => {
    const config: Partial<AgentConfig> = {
      agentId: 'test-agent-1',
      displayName: 'Test Agent 1',
      description: 'A test agent for unit testing',
      expertiseDomains: ['testing', 'development'],
      assetTypes: ['log', 'report'],
      partition: 'test',
    };
    
    const result = await manager.createAgent(config);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.agentId).toBe('test-agent-1');
    expect(result.data?.displayName).toBe('Test Agent 1');
    expect(result.data?.expertiseDomains).toEqual(['testing', 'development']);
    expect(result.data?.isActive).toBe(true);
  });
  
  test('应该失败创建重复Agent', async () => {
    const config: Partial<AgentConfig> = {
      agentId: 'test-agent-duplicate',
      displayName: 'Duplicate Agent',
    };
    
    const result1 = await manager.createAgent(config);
    expect(result1.success).toBe(true);
    
    const result2 = await manager.createAgent(config);
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('already exists');
  });
  
  test('应该成功获取Agent', async () => {
    const config: Partial<AgentConfig> = {
      agentId: 'test-agent-get',
      displayName: 'Get Test Agent',
      description: 'Agent for get testing',
    };
    
    const createResult = await manager.createAgent(config);
    expect(createResult.success).toBe(true);
    
    const getResult = await manager.getAgent('test-agent-get');
    
    expect(getResult.success).toBe(true);
    expect(getResult.data).toBeDefined();
    expect(getResult.data?.agentId).toBe('test-agent-get');
    expect(getResult.data?.displayName).toBe('Get Test Agent');
    expect(getResult.data?.description).toBe('Agent for get testing');
  });
  
  test('应该返回Agent未找到错误', async () => {
    const result = await manager.getAgent('non-existent-agent');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('not found');
  });
  
  test('应该成功更新Agent', async () => {
    const config: Partial<AgentConfig> = {
      agentId: 'test-agent-update',
      displayName: 'Original Agent',
      description: 'Original description',
    };
    
    const createResult = await manager.createAgent(config);
    expect(createResult.success).toBe(true);
    
    const updateResult = await manager.updateAgent('test-agent-update', {
      displayName: 'Updated Agent',
      description: 'Updated description',
      isActive: false,
    });
    
    expect(updateResult.success).toBe(true);
    expect(updateResult.data).toBeDefined();
    expect(updateResult.data?.displayName).toBe('Updated Agent');
    expect(updateResult.data?.description).toBe('Updated description');
    expect(updateResult.data?.isActive).toBe(false);
    
    // 验证更新已持久化
    const getResult = await manager.getAgent('test-agent-update');
    expect(getResult.success).toBe(true);
    expect(getResult.data?.displayName).toBe('Updated Agent');
    expect(getResult.data?.isActive).toBe(false);
  });
  
  test('应该成功删除Agent', async () => {
    const config: Partial<AgentConfig> = {
      agentId: 'test-agent-delete',
      displayName: 'Agent to delete',
    };
    
    const createResult = await manager.createAgent(config);
    expect(createResult.success).toBe(true);
    
    const deleteResult = await manager.deleteAgent('test-agent-delete');
    expect(deleteResult.success).toBe(true);
    
    const getResult = await manager.getAgent('test-agent-delete');
    expect(getResult.success).toBe(false);
    expect(getResult.error).toContain('not found');
  });
  
  test('应该成功获取所有Agent', async () => {
    // 创建多个测试Agent
    const agents = [
      { agentId: 'test-agent-all-1', displayName: 'Agent All 1' },
      { agentId: 'test-agent-all-2', displayName: 'Agent All 2' },
      { agentId: 'test-agent-all-3', displayName: 'Agent All 3' },
    ];
    
    for (const config of agents) {
      const result = await manager.createAgent(config);
      expect(result.success).toBe(true);
    }
    
    const allResult = await manager.getAllAgents();
    
    expect(allResult.success).toBe(true);
    expect(allResult.data).toBeDefined();
    expect(allResult.data?.length).toBeGreaterThanOrEqual(3);
    
    // 检查是否包含创建的Agent
    const agentIds = allResult.data?.map(a => a.agentId) || [];
    expect(agentIds).toContain('test-agent-all-1');
    expect(agentIds).toContain('test-agent-all-2');
    expect(agentIds).toContain('test-agent-all-3');
  });
  
  test('应该成功添加Agent资产', async () => {
    const agentConfig: Partial<AgentConfig> = {
      agentId: 'test-agent-assets',
      displayName: 'Agent with Assets',
    };
    
    const agentResult = await manager.createAgent(agentConfig);
    expect(agentResult.success).toBe(true);
    
    const asset = {
      agentId: 'test-agent-assets',
      assetType: 'log' as const,
      partition: 'test',
      title: 'Test Log Entry',
      content: 'This is a test log entry for unit testing',
      summary: 'Test log summary',
      keywords: ['test', 'log', 'unit'],
      sourceContext: 'unit-test',
      sourceTimestamp: Date.now(),
      confidence: 0.95,
      version: 1,
      storageBackend: 'sqlite' as const,
      storageId: 'test-storage-id',
      accessLevel: 'internal' as const,
    };
    
    const assetResult = await manager.addAsset('test-agent-assets', asset);
    
    expect(assetResult.success).toBe(true);
    expect(assetResult.data).toBeDefined();
    expect(assetResult.data?.id).toBeDefined();
    expect(assetResult.data?.title).toBe('Test Log Entry');
    expect(assetResult.data?.agentId).toBe('test-agent-assets');
    expect(assetResult.data?.assetType).toBe('log');
    expect(assetResult.data?.createdAt).toBeDefined();
    expect(assetResult.data?.updatedAt).toBeDefined();
  });
  
  test('应该成功获取Agent资产', async () => {
    const agentConfig: Partial<AgentConfig> = {
      agentId: 'test-agent-get-assets',
      displayName: 'Agent for get assets',
    };
    
    const agentResult = await manager.createAgent(agentConfig);
    expect(agentResult.success).toBe(true);
    
    // 添加多个资产
    for (let i = 1; i <= 3; i++) {
      const asset = {
        agentId: 'test-agent-get-assets',
        assetType: 'report' as const,
        partition: 'test',
        title: `Test Report ${i}`,
        content: `Report content ${i}`,
        summary: `Report summary ${i}`,
        keywords: ['test', 'report'],
        sourceContext: 'unit-test',
        sourceTimestamp: Date.now() + i * 1000, // 确保不同时间戳
        confidence: 0.9,
        version: 1,
        storageBackend: 'sqlite' as const,
        storageId: `test-storage-${i}`,
        accessLevel: 'internal' as const,
      };
      
      const assetResult = await manager.addAsset('test-agent-get-assets', asset);
      expect(assetResult.success).toBe(true);
    }
    
    const assetsResult = await manager.getAssets('test-agent-get-assets', { limit: 10 });
    
    expect(assetsResult.success).toBe(true);
    expect(assetsResult.data).toBeDefined();
    expect(assetsResult.data?.length).toBe(3);
    expect(assetsResult.data?.every(a => a.agentId === 'test-agent-get-assets')).toBe(true);
    expect(assetsResult.data?.every(a => a.assetType === 'report')).toBe(true);
    
    // 验证资产按时间戳降序排列
    const timestamps = assetsResult.data?.map(a => a.createdAt) || [];
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i + 1]);
    }
  });
  
  test('应该成功搜索Agent资产', async () => {
    const agentConfig: Partial<AgentConfig> = {
      agentId: 'test-agent-search',
      displayName: 'Agent for search testing',
    };
    
    const agentResult = await manager.createAgent(agentConfig);
    expect(agentResult.success).toBe(true);
    
    // 添加不同类型的资产
    const assets = [
      {
        title: 'Error Log 2024-03-24',
        content: 'Database connection failed at 10:30:45',
        assetType: 'log' as const,
        keywords: ['error', 'database', 'connection'],
      },
      {
        title: 'Performance Report Q1',
        content: 'Quarterly performance analysis showing 15% improvement',
        assetType: 'report' as const,
        keywords: ['performance', 'report', 'analysis'],
      },
      {
        title: 'Error Report System Down',
        content: 'System was down for 2 hours due to network issues',
        assetType: 'report' as const,
        keywords: ['error', 'system', 'downtime'],
      },
    ];
    
    for (const assetData of assets) {
      const asset = {
        agentId: 'test-agent-search',
        assetType: assetData.assetType,
        partition: 'test',
        title: assetData.title,
        content: assetData.content,
        summary: assetData.title,
        keywords: assetData.keywords,
        sourceContext: 'unit-test',
        sourceTimestamp: Date.now(),
        confidence: 0.85,
        version: 1,
        storageBackend: 'sqlite' as const,
        storageId: 'test-storage',
        accessLevel: 'internal' as const,
      };
      
      const assetResult = await manager.addAsset('test-agent-search', asset);
      expect(assetResult.success).toBe(true);
    }
    
    // 搜索包含"error"的资产
    const searchResult = await manager.searchAssets({
      agentId: 'test-agent-search',
      keywords: ['error'],
    });
    
    expect(searchResult.success).toBe(true);
    expect(searchResult.data).toBeDefined();
    expect(searchResult.data?.assets.length).toBe(2); // 两个包含"error"的资产
    expect(searchResult.data?.totalCount).toBe(2);
    
    // 按类型筛选
    const typeSearchResult = await manager.searchAssets({
      agentId: 'test-agent-search',
      assetType: 'report',
    });
    
    expect(typeSearchResult.success).toBe(true);
    expect(typeSearchResult.data?.assets.length).toBe(2); // 两个报告
    expect(typeSearchResult.data?.assets.every(a => a.assetType === 'report')).toBe(true);
  });
  
  test('应该成功获取Agent状态', async () => {
    const agentConfig: Partial<AgentConfig> = {
      agentId: 'test-agent-status',
      displayName: 'Agent for status testing',
    };
    
    const agentResult = await manager.createAgent(agentConfig);
    expect(agentResult.success).toBe(true);
    
    // 添加一些资产
    for (let i = 1; i <= 2; i++) {
      const asset = {
        agentId: 'test-agent-status',
        assetType: 'log' as const,
        partition: 'test',
        title: `Status Test Log ${i}`,
        content: `Content ${i}`,
        summary: `Summary ${i}`,
        keywords: ['status', 'test'],
        sourceContext: 'unit-test',
        sourceTimestamp: Date.now(),
        confidence: 0.9,
        version: 1,
        storageBackend: 'sqlite' as const,
        storageId: `status-test-${i}`,
        accessLevel: 'internal' as const,
      };
      
      await manager.addAsset('test-agent-status', asset);
    }
    
    const statusResult = await manager.getAgentStatus('test-agent-status');
    
    expect(statusResult.success).toBe(true);
    expect(statusResult.data).toBeDefined();
    expect(statusResult.data?.agentId).toBe('test-agent-status');
    expect(statusResult.data?.displayName).toBe('Agent for status testing');
    expect(statusResult.data?.isActive).toBe(true);
    expect(statusResult.data?.assetCount).toBe(2);
    expect(statusResult.data?.lastHeartbeat).toBeDefined();
  });
  
  test('应该成功归档旧资产', async () => {
    // 这个测试需要实际有旧资产，在内存数据库中可能没有
    // 我们可以验证方法能够被调用而不出错
    const archiveResult = await manager.archiveOldAssets();
    
    expect(archiveResult.success).toBe(true);
    expect(archiveResult.data).toBeDefined();
  });
  
  test('应该成功运行数据库维护', async () => {
    const maintenanceResult = await manager.runMaintenance();
    
    expect(maintenanceResult.success).toBe(true);
  });
});