// 夕阳无限引擎集成测试

const { SunsetArchiveEngine } = require('./dist/src/engines/sunset-archive/sunset-archive-engine');
const { AssetType } = require('./dist/src/types');

// 测试上下文
const testContext = `这是测试上下文内容，包含一些重要信息。
我们做出了一个重要决策：使用TypeScript进行开发。
这是一个重要经验：测试驱动开发能提高代码质量。
我们需要完成以下任务：
1. 实现夕阳无限引擎
2. 编写测试用例
3. 集成到Agent管理器中

参与者：Mars, DeveloperA, DeveloperB
最后更新时间：2026-03-25`;

// 测试Agent配置
const testAgentConfig = {
  agentId: 'test-agent-1',
  displayName: '测试Agent',
  description: '用于测试夕阳无限引擎的Agent',
  expertiseDomains: ['测试', '开发'],
  assetTypes: [AssetType.KEY_DECISIONS, AssetType.LESSONS_LEARNED],
  restrictedToTypes: false,
  partition: 'test',
  retentionDays: 30,
  contextSizeLimit: 100, // 设置为小值以触发归档
  compressionEnabled: true,
  summaryEnabled: true,
  encryptionEnabled: false,
  dependencies: [],
  notificationSettings: {
    onSuccess: false,
    onFailure: false,
    onWarning: false,
    dailyReport: false,
    channels: [],
  },
  scheduleEnabled: false,
  scheduleTime: '',
  scheduleTimezone: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: '1.0.0',
  createdBy: 'test-runner',
  lastModifiedBy: 'test-runner',
  isActive: true,
};

async function runIntegrationTest() {
  console.log('🚀 开始夕阳无限引擎集成测试...\n');
  
  try {
    // 1. 创建并初始化引擎
    console.log('1. 创建夕阳无限引擎...');
    const engine = new SunsetArchiveEngine({
      name: 'integration-test-engine',
      version: '1.0.0',
      enabled: true,
      detectionThreshold: 100,
      importanceThreshold: 50,
      maxProcessingTime: 30000,
      aiEnhancementEnabled: false,
      logLevel: 'info',
    }, console);
    
    const initResult = await engine.initialize();
    if (!initResult.success) {
      console.error('❌ 引擎初始化失败:', initResult.error);
      return;
    }
    console.log('✅ 引擎初始化成功\n');
    
    // 2. 检查引擎状态
    console.log('2. 检查引擎状态...');
    const status = engine.getStatus();
    console.log('   - 已初始化:', status.initialized);
    console.log('   - 总归档次数:', status.totalArchives);
    console.log('   - 成功归档次数:', status.successfulArchives);
    console.log('   - 平均处理时间:', status.averageProcessingTime, 'ms\n');
    
    // 3. 检测记忆
    console.log('3. 检测记忆是否需要归档...');
    const detectionResult = await engine.detectMemory(
      'test-agent-1',
      testContext,
      testAgentConfig
    );
    
    if (!detectionResult.success) {
      console.error('❌ 记忆检测失败:', detectionResult.error);
      return;
    }
    
    console.log('   - 是否需要归档:', detectionResult.data?.shouldArchive);
    console.log('   - 检测原因:', detectionResult.data?.detectionReason);
    console.log('   - 上下文大小:', detectionResult.data?.contextSize, '字符');
    console.log('   - 重要性评分:', detectionResult.data?.importanceScore, '/100\n');
    
    // 4. 提取重要内容
    if (detectionResult.data?.shouldArchive) {
      console.log('4. 提取重要内容...');
      const extractionResult = await engine.extractImportantContent(
        testContext,
        detectionResult.data
      );
      
      if (!extractionResult.success) {
        console.error('❌ 内容提取失败:', extractionResult.error);
        return;
      }
      
      console.log('   - 提取质量:', extractionResult.data?.extractionQuality, '/100');
      console.log('   - 重要决策数:', extractionResult.data?.decisions.length);
      console.log('   - 持久知识数:', extractionResult.data?.persistentKnowledge.length);
      console.log('   - 任务数:', extractionResult.data?.tasks.length);
      console.log('   - 重要对话数:', extractionResult.data?.importantConversations.length, '\n');
      
      // 5. 构建记忆快照
      console.log('5. 构建记忆快照...');
      const snapshotResult = await engine.buildMemorySnapshot(
        extractionResult.data,
        'test-agent-1',
        testAgentConfig
      );
      
      if (!snapshotResult.success) {
        console.error('❌ 快照构建失败:', snapshotResult.error);
        return;
      }
      
      console.log('   - 快照ID:', snapshotResult.data?.snapshotId);
      console.log('   - 原始大小:', snapshotResult.data?.metadata.originalContextSize, '字符');
      console.log('   - 压缩后大小:', snapshotResult.data?.metadata.compressedSize, '字符');
      console.log('   - 压缩率:', (snapshotResult.data?.metadata.compressionRatio * 100).toFixed(1), '%');
      console.log('   - 重要性评分:', snapshotResult.data?.metadata.importanceScore);
      console.log('   - 关键主题:', snapshotResult.data?.metadata.keyTopics?.join(', '), '\n');
      
      // 6. 模拟归档
      console.log('6. 模拟归档（无实际存储）...');
      const mockStorageAdapter = {
        createAgentAsset: async () => ({ success: true, data: {} })
      };
      
      const archiveResult = await engine.archiveMemorySnapshot(
        snapshotResult.data,
        mockStorageAdapter
      );
      
      if (!archiveResult.success) {
        console.error('❌ 归档失败:', archiveResult.error);
        return;
      }
      
      console.log('   - 归档成功:', archiveResult.success);
      console.log('   - 归档时间:', archiveResult.metadata?.archiveTime, 'ms');
      console.log('   - 资产ID:', archiveResult.data?.id, '\n');
      
      // 7. 再次检查引擎状态
      console.log('7. 归档后引擎状态...');
      const finalStatus = engine.getStatus();
      console.log('   - 总归档次数:', finalStatus.totalArchives);
      console.log('   - 成功归档次数:', finalStatus.successfulArchives);
      console.log('   - 最后归档时间:', finalStatus.lastArchiveTime ? new Date(finalStatus.lastArchiveTime).toISOString() : '无');
      
      console.log('\n🎉 集成测试完成！');
    } else {
      console.log('⚠️ 记忆无需归档，跳过后续步骤\n');
    }
    
  } catch (error) {
    console.error('❌ 集成测试异常:', error);
  }
}

// 运行测试
runIntegrationTest().then(() => {
  console.log('\n🏁 测试执行完成');
  process.exit(0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});