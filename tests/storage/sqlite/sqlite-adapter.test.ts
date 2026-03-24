/**
 * SQLite适配器单元测试
 */

import { SQLiteAdapter } from '../../../src/adapters/sqlite/sqlite-adapter';
import { StorageAdapterConfig } from '../../../src/types';

describe('SQLiteAdapter', () => {
  let adapter: SQLiteAdapter;
  let testConfig: StorageAdapterConfig;
  
  beforeAll(() => {
    // 使用内存数据库进行测试
    testConfig = {
      type: 'sqlite',
      connectionString: 'sqlite://:memory:',
      options: {},
    };
  });
  
  beforeEach(() => {
    adapter = new SQLiteAdapter(testConfig);
  });
  
  afterEach(async () => {
    if (adapter.isConnected()) {
      await adapter.disconnect();
    }
  });
  
  describe('初始化与连接', () => {
    test('应该成功初始化适配器', async () => {
      const result = await adapter.initialize(testConfig);
      expect(result.success).toBe(true);
    });
    
    test('应该成功连接到内存数据库', async () => {
      const result = await adapter.connect();
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(adapter.isConnected()).toBe(true);
    });
    
    test('应该成功断开连接', async () => {
      await adapter.connect();
      const result = await adapter.disconnect();
      expect(result.success).toBe(true);
      expect(adapter.isConnected()).toBe(false);
    });
    
    test('应该返回正确的状态信息', async () => {
      await adapter.connect();
      const status = adapter.getStatus();
      
      expect(status.connected).toBe(true);
      expect(status.ready).toBe(true);
      expect(status.health.healthy).toBe(true);
      expect(typeof status.version).toBe('string');
      expect(status.metrics).toBeDefined();
    });
    
    test('应该成功验证适配器配置', async () => {
      await adapter.connect();
      const result = await adapter.validate();
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });
  
  describe('Agent配置管理', () => {
    beforeEach(async () => {
      await adapter.connect();
    });
    
    test('应该成功创建Agent配置', async () => {
      const config = {
        agentId: 'test-agent-1',
        displayName: 'Test Agent',
        description: 'A test agent',
        expertiseDomains: ['testing', 'development'],
        assetTypes: ['log', 'report'],
        restrictedToTypes: false,
        partition: 'test',
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {},
        scheduleEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'test',
        lastModifiedBy: 'test',
        isActive: true,
      };
      
      const result = await adapter.createAgentConfig(config);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
    });
    
    test('应该成功获取Agent配置', async () => {
      const config = {
        agentId: 'test-agent-2',
        displayName: 'Test Agent 2',
        description: 'Another test agent',
        expertiseDomains: ['testing'],
        assetTypes: ['log'],
        restrictedToTypes: false,
        partition: 'test',
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {},
        scheduleEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'test',
        lastModifiedBy: 'test',
        isActive: true,
      };
      
      await adapter.createAgentConfig(config);
      const result = await adapter.getAgentConfig('test-agent-2');
      
      expect(result.success).toBe(true);
      expect(result.data?.agentId).toBe('test-agent-2');
      expect(result.data?.displayName).toBe('Test Agent 2');
    });
    
    test('应该成功获取所有Agent配置', async () => {
      const config1 = {
        agentId: 'test-agent-3',
        displayName: 'Test Agent 3',
        description: 'Agent 3',
        expertiseDomains: ['testing'],
        assetTypes: ['log'],
        restrictedToTypes: false,
        partition: 'test',
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {},
        scheduleEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'test',
        lastModifiedBy: 'test',
        isActive: true,
      };
      
      const config2 = {
        agentId: 'test-agent-4',
        displayName: 'Test Agent 4',
        description: 'Agent 4',
        expertiseDomains: ['development'],
        assetTypes: ['report'],
        restrictedToTypes: false,
        partition: 'test',
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {},
        scheduleEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'test',
        lastModifiedBy: 'test',
        isActive: true,
      };
      
      await adapter.createAgentConfig(config1);
      await adapter.createAgentConfig(config2);
      
      const result = await adapter.getAllAgentConfigs();
      
      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThanOrEqual(2);
      expect(result.data?.map(c => c.agentId)).toContain('test-agent-3');
      expect(result.data?.map(c => c.agentId)).toContain('test-agent-4');
    });
    
    test('应该成功更新Agent配置', async () => {
      const config = {
        agentId: 'test-agent-5',
        displayName: 'Test Agent 5',
        description: 'Agent 5',
        expertiseDomains: ['testing'],
        assetTypes: ['log'],
        restrictedToTypes: false,
        partition: 'test',
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {},
        scheduleEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'test',
        lastModifiedBy: 'test',
        isActive: true,
      };
      
      await adapter.createAgentConfig(config);
      
      const update = {
        displayName: 'Updated Agent 5',
        description: 'Updated description',
        isActive: false,
      };
      
      const result = await adapter.updateAgentConfig('test-agent-5', update);
      
      expect(result.success).toBe(true);
      expect(result.data?.displayName).toBe('Updated Agent 5');
      expect(result.data?.description).toBe('Updated description');
      expect(result.data?.isActive).toBe(false);
    });
    
    test('应该成功删除Agent配置', async () => {
      const config = {
        agentId: 'test-agent-6',
        displayName: 'Test Agent 6',
        description: 'Agent 6',
        expertiseDomains: ['testing'],
        assetTypes: ['log'],
        restrictedToTypes: false,
        partition: 'test',
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {},
        scheduleEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'test',
        lastModifiedBy: 'test',
        isActive: true,
      };
      
      await adapter.createAgentConfig(config);
      
      const deleteResult = await adapter.deleteAgentConfig('test-agent-6');
      expect(deleteResult.success).toBe(true);
      
      const getResult = await adapter.getAgentConfig('test-agent-6');
      expect(getResult.success).toBe(false);
      expect(getResult.error).toBeDefined();
    });
  });
  
  describe('Agent资产管理', () => {
    beforeEach(async () => {
      await adapter.connect();
      
      // 创建测试Agent配置
      const config = {
        agentId: 'asset-test-agent',
        displayName: 'Asset Test Agent',
        description: 'For asset testing',
        expertiseDomains: ['testing'],
        assetTypes: ['log', 'report', 'conversation'],
        restrictedToTypes: false,
        partition: 'test',
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {},
        scheduleEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'test',
        lastModifiedBy: 'test',
        isActive: true,
      };
      
      await adapter.createAgentConfig(config);
    });
    
    test('应该成功创建Agent资产', async () => {
      const asset = {
        id: 'test-asset-1',
        agentId: 'asset-test-agent',
        assetType: 'log',
        partition: 'test',
        title: 'Test Log',
        content: 'This is a test log content',
        summary: 'Test log summary',
        keywords: ['test', 'log', 'debug'],
        sourceContext: 'unit-test',
        sourceTimestamp: Date.now(),
        confidence: 0.9,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        storageBackend: 'sqlite',
        storageId: 'test-asset-1',
        accessLevel: 'internal',
      };
      
      const result = await adapter.createAgentAsset(asset);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(asset);
    });
    
    test('应该成功获取Agent资产', async () => {
      const asset = {
        id: 'test-asset-2',
        agentId: 'asset-test-agent',
        assetType: 'report',
        partition: 'test',
        title: 'Test Report',
        content: 'This is a test report content',
        summary: 'Test report summary',
        keywords: ['test', 'report', 'analysis'],
        sourceContext: 'unit-test',
        sourceTimestamp: Date.now(),
        confidence: 0.95,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        storageBackend: 'sqlite',
        storageId: 'test-asset-2',
        accessLevel: 'internal',
      };
      
      await adapter.createAgentAsset(asset);
      const result = await adapter.getAgentAsset('test-asset-2');
      
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('test-asset-2');
      expect(result.data?.title).toBe('Test Report');
      expect(result.data?.assetType).toBe('report');
    });
    
    test('应该成功获取Agent的所有资产', async () => {
      const asset1 = {
        id: 'test-asset-3',
        agentId: 'asset-test-agent',
        assetType: 'log',
        partition: 'test',
        title: 'Test Log 3',
        content: 'Content 3',
        summary: 'Summary 3',
        keywords: ['test'],
        sourceContext: 'unit-test',
        sourceTimestamp: Date.now(),
        confidence: 0.9,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        storageBackend: 'sqlite',
        storageId: 'test-asset-3',
        accessLevel: 'internal',
      };
      
      const asset2 = {
        id: 'test-asset-4',
        agentId: 'asset-test-agent',
        assetType: 'report',
        partition: 'test',
        title: 'Test Report 4',
        content: 'Content 4',
        summary: 'Summary 4',
        keywords: ['test'],
        sourceContext: 'unit-test',
        sourceTimestamp: Date.now(),
        confidence: 0.9,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        storageBackend: 'sqlite',
        storageId: 'test-asset-4',
        accessLevel: 'internal',
      };
      
      await adapter.createAgentAsset(asset1);
      await adapter.createAgentAsset(asset2);
      
      const result = await adapter.getAgentAssetsByAgent('asset-test-agent', 10, 0);
      
      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThanOrEqual(2);
      expect(result.data?.map(a => a.id)).toContain('test-asset-3');
      expect(result.data?.map(a => a.id)).toContain('test-asset-4');
    });
    
    test('应该成功搜索Agent资产', async () => {
      const asset1 = {
        id: 'search-asset-1',
        agentId: 'asset-test-agent',
        assetType: 'conversation',
        partition: 'test',
        title: 'User Feedback Conversation',
        content: 'User reported an issue with the login system',
        summary: 'Login issue report',
        keywords: ['login', 'issue', 'user', 'feedback'],
        sourceContext: 'user-support',
        sourceTimestamp: Date.now() - 10000,
        confidence: 0.8,
        version: 1,
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 10000,
        storageBackend: 'sqlite',
        storageId: 'search-asset-1',
        accessLevel: 'internal',
      };
      
      const asset2 = {
        id: 'search-asset-2',
        agentId: 'asset-test-agent',
        assetType: 'report',
        partition: 'test',
        title: 'System Performance Report',
        content: 'System performance metrics and analysis',
        summary: 'Performance analysis',
        keywords: ['performance', 'metrics', 'analysis', 'system'],
        sourceContext: 'monitoring',
        sourceTimestamp: Date.now(),
        confidence: 0.95,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        storageBackend: 'sqlite',
        storageId: 'search-asset-2',
        accessLevel: 'internal',
      };
      
      await adapter.createAgentAsset(asset1);
      await adapter.createAgentAsset(asset2);
      
      const query = {
        agentId: 'asset-test-agent',
        assetType: 'conversation',
        keywords: ['login'],
        limit: 10,
        offset: 0,
      };
      
      const result = await adapter.searchAgentAssets(query);
      
      expect(result.success).toBe(true);
      expect(result.data?.assets.length).toBeGreaterThanOrEqual(1);
      expect(result.data?.assets[0]?.assetType).toBe('conversation');
      expect(result.data?.totalCount).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('批量操作', () => {
    beforeEach(async () => {
      await adapter.connect();
      
      // 创建测试Agent配置
      const config = {
        agentId: 'bulk-test-agent',
        displayName: 'Bulk Test Agent',
        description: 'For bulk operations testing',
        expertiseDomains: ['testing'],
        assetTypes: ['log'],
        restrictedToTypes: false,
        partition: 'test',
        retentionDays: 30,
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {},
        scheduleEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'test',
        lastModifiedBy: 'test',
        isActive: true,
      };
      
      await adapter.createAgentConfig(config);
    });
    
    test('应该成功批量创建Agent资产', async () => {
      const assets = Array.from({ length: 5 }, (_, i) => ({
        id: `bulk-asset-${i}`,
        agentId: 'bulk-test-agent',
        assetType: 'log',
        partition: 'test',
        title: `Bulk Asset ${i}`,
        content: `Content ${i}`,
        summary: `Summary ${i}`,
        keywords: ['bulk', 'test'],
        sourceContext: 'bulk-test',
        sourceTimestamp: Date.now() + i * 1000,
        confidence: 0.9,
        version: 1,
        createdAt: Date.now() + i * 1000,
        updatedAt: Date.now() + i * 1000,
        storageBackend: 'sqlite',
        storageId: `bulk-asset-${i}`,
        accessLevel: 'internal',
      }));
      
      const result = await adapter.bulkCreateAgentAssets(assets);
      
      expect(result.total).toBe(5);
      expect(result.successful).toBe(5);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      
      // 验证资产是否创建成功
      for (const asset of assets) {
        const getResult = await adapter.getAgentAsset(asset.id);
        expect(getResult.success).toBe(true);
        expect(getResult.data?.id).toBe(asset.id);
      }
    });
  });
  
  describe('数据管理', () => {
    beforeEach(async () => {
      await adapter.connect();
      
      // 创建测试Agent配置
      const config = {
        agentId: 'maintenance-test-agent',
        displayName: 'Maintenance Test Agent',
        description: 'For maintenance operations testing',
        expertiseDomains: ['testing'],
        assetTypes: ['log'],
        restrictedToTypes: false,
        partition: 'test',
        retentionDays: 7, // 较短的保留期便于测试
        contextSizeLimit: 8192,
        compressionEnabled: true,
        summaryEnabled: true,
        encryptionEnabled: false,
        dependencies: [],
        notificationSettings: {},
        scheduleEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0',
        createdBy: 'test',
        lastModifiedBy: 'test',
        isActive: true,
      };
      
      await adapter.createAgentConfig(config);
      
      // 创建一些旧资产用于归档测试
      const oldTimestamp = Date.now() - (14 * 24 * 60 * 60 * 1000); // 14天前
      const oldAsset = {
        id: 'old-asset-1',
        agentId: 'maintenance-test-agent',
        assetType: 'log',
        partition: 'test',
        title: 'Old Asset',
        content: 'Old content',
        summary: 'Old summary',
        keywords: ['old'],
        sourceContext: 'test',
        sourceTimestamp: oldTimestamp,
        confidence: 0.9,
        version: 1,
        createdAt: oldTimestamp,
        updatedAt: oldTimestamp,
        storageBackend: 'sqlite',
        storageId: 'old-asset-1',
        accessLevel: 'internal',
      };
      
      await adapter.createAgentAsset(oldAsset);
    });
    
    test('应该成功归档旧资产', async () => {
      const result = await adapter.archiveOldAssets(10); // 归档10天前的资产
      
      expect(result.success).toBe(true);
      expect(result.data).toBeGreaterThanOrEqual(1);
    });
    
    test('应该成功运行数据库维护', async () => {
      const result = await adapter.runMaintenance();
      expect(result.success).toBe(true);
    });
  });
});