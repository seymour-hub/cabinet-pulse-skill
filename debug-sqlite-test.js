/**
 * SQLite适配器调试脚本
 * 用于定位测试失败的具体原因
 */

const { SQLiteAdapter } = require('./dist/adapters/sqlite/sqlite-adapter');

async function debugTests() {
  console.log('=== 开始SQLite适配器调试 ===\n');
  
  // 1. 创建适配器实例
  const adapter = new SQLiteAdapter({
    type: 'sqlite',
    connectionString: 'sqlite://:memory:',
    options: {},
  });
  
  console.log('1. 测试连接...');
  const connectResult = await adapter.connect();
  console.log('连接结果:', JSON.stringify(connectResult, null, 2));
  
  if (!connectResult.success) {
    console.error('连接失败，无法继续测试');
    return;
  }
  
  console.log('\n2. 测试创建Agent配置...');
  const agentConfig = {
    agentId: 'debug-test-agent',
    displayName: 'Debug Test Agent',
    description: 'For debugging',
    expertiseDomains: ['debugging'],
    assetTypes: ['log'],
    restrictedToTypes: false,
    partition: 'debug',
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
    createdBy: 'debug',
    lastModifiedBy: 'debug',
    isActive: true,
  };
  
  const createConfigResult = await adapter.createAgentConfig(agentConfig);
  console.log('创建Agent配置结果:', JSON.stringify(createConfigResult, null, 2));
  
  console.log('\n3. 测试获取Agent配置...');
  const getConfigResult = await adapter.getAgentConfig('debug-test-agent');
  console.log('获取Agent配置结果:', JSON.stringify(getConfigResult, null, 2));
  
  console.log('\n4. 测试创建Agent资产...');
  const agentAsset = {
    id: 'debug-asset-1',
    agentId: 'debug-test-agent',
    assetType: 'log',
    partition: 'debug',
    title: 'Debug Log',
    content: 'Debug content',
    summary: 'Debug summary',
    keywords: ['debug', 'test'],
    sourceContext: 'debug-test',
    sourceTimestamp: Date.now(),
    confidence: 0.9,
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    storageBackend: 'sqlite',
    storageId: 'debug-asset-1',
    accessLevel: 'internal',
  };
  
  const createAssetResult = await adapter.createAgentAsset(agentAsset);
  console.log('创建Agent资产结果:', JSON.stringify(createAssetResult, null, 2));
  
  if (!createAssetResult.success) {
    console.error('\n=== 创建Agent资产失败详情 ===');
    console.error('错误:', createAssetResult.error);
    console.error('资产数据:', JSON.stringify(agentAsset, null, 2));
    
    // 检查数据库状态
    console.log('\n5. 检查数据库状态...');
    const status = adapter.getStatus();
    console.log('适配器状态:', JSON.stringify(status, null, 2));
  } else {
    console.log('\n5. 测试获取Agent资产...');
    const getAssetResult = await adapter.getAgentAsset('debug-asset-1');
    console.log('获取Agent资产结果:', JSON.stringify(getAssetResult, null, 2));
  }
  
  console.log('\n6. 测试断开连接...');
  const disconnectResult = await adapter.disconnect();
  console.log('断开连接结果:', disconnectResult.success);
  
  console.log('\n=== 调试完成 ===');
}

// 运行调试
debugTests().catch(console.error);