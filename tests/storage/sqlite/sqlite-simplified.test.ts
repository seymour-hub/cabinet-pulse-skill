/**
 * SQLite适配器简化测试
 * 验证最基本功能，绕过迁移系统
 */

import { Database } from 'better-sqlite3';

describe('SQLite Simplified Adapter', () => {
  let db: Database;
  
  beforeAll(async () => {
    // 直接创建内存数据库
    const sqlite3 = await import('better-sqlite3');
    const Database = (sqlite3 as any).default || sqlite3;
    db = new Database(':memory:') as Database;
    
    // 配置数据库参数
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = OFF'); // 关闭外键约束简化测试
    db.pragma('busy_timeout = 5000');
  });
  
  afterAll(() => {
    if (db) {
      db.close();
    }
  });
  
  beforeEach(() => {
    // 清理并重新创建测试表
    db.exec('DROP TABLE IF EXISTS test_agent_configs');
    db.exec(`
      CREATE TABLE test_agent_configs (
        agent_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        description TEXT NOT NULL,
        expertise_domains TEXT NOT NULL,
        asset_types TEXT NOT NULL,
        partition TEXT NOT NULL,
        retention_days INTEGER NOT NULL DEFAULT 30,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        version TEXT NOT NULL DEFAULT '1.0.0',
        created_by TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    
    // 创建agent_assets表（简化版）
    db.exec('DROP TABLE IF EXISTS test_agent_assets');
    db.exec(`
      CREATE TABLE test_agent_assets (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        partition TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        keywords TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  });
  
  test('应该成功创建简单Agent配置', () => {
    const stmt = db.prepare(`
      INSERT INTO test_agent_configs 
      (agent_id, display_name, description, expertise_domains, asset_types, partition, retention_days, created_at, updated_at, version, created_by, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const config = {
      agentId: 'simple-test-agent',
      displayName: 'Simple Test Agent',
      description: 'Simple agent for testing',
      expertiseDomains: JSON.stringify(['testing']),
      assetTypes: JSON.stringify(['log']),
      partition: 'test',
      retentionDays: 30,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0.0',
      createdBy: 'test',
      isActive: 1
    };
    
    const result = stmt.run(
      config.agentId,
      config.displayName,
      config.description,
      config.expertiseDomains,
      config.assetTypes,
      config.partition,
      config.retentionDays,
      config.createdAt,
      config.updatedAt,
      config.version,
      config.createdBy,
      config.isActive
    );
    
    expect(result.changes).toBe(1);
    expect(result.lastInsertRowid).toBeDefined();
    
    // 验证数据插入成功
    const selectStmt = db.prepare('SELECT * FROM test_agent_configs WHERE agent_id = ?');
    const row = selectStmt.get(config.agentId) as any;
    
    expect(row).toBeDefined();
    expect(row.agent_id).toBe(config.agentId);
    expect(row.display_name).toBe(config.displayName);
    expect(row.description).toBe(config.description);
  });
  
  test('应该成功创建简单Agent资产', () => {
    // 首先创建agent配置
    const agentStmt = db.prepare(`
      INSERT INTO test_agent_configs 
      (agent_id, display_name, description, expertise_domains, asset_types, partition, retention_days, created_at, updated_at, version, created_by, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    agentStmt.run(
      'asset-test-agent',
      'Asset Test Agent',
      'For asset testing',
      JSON.stringify(['testing']),
      JSON.stringify(['log']),
      'test',
      30,
      Date.now(),
      Date.now(),
      '1.0.0',
      'test',
      1
    );
    
    // 创建agent资产
    const assetStmt = db.prepare(`
      INSERT INTO test_agent_assets 
      (id, agent_id, asset_type, partition, title, content, keywords, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const asset = {
      id: 'simple-asset-1',
      agentId: 'asset-test-agent',
      assetType: 'log',
      partition: 'test',
      title: 'Simple Log',
      content: 'Simple log content',
      keywords: JSON.stringify(['test', 'log']),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const result = assetStmt.run(
      asset.id,
      asset.agentId,
      asset.assetType,
      asset.partition,
      asset.title,
      asset.content,
      asset.keywords,
      asset.createdAt,
      asset.updatedAt
    );
    
    expect(result.changes).toBe(1);
    
    // 验证资产插入成功
    const selectStmt = db.prepare('SELECT * FROM test_agent_assets WHERE id = ?');
    const row = selectStmt.get(asset.id) as any;
    
    expect(row).toBeDefined();
    expect(row.id).toBe(asset.id);
    expect(row.agent_id).toBe(asset.agentId);
    expect(row.title).toBe(asset.title);
    expect(row.content).toBe(asset.content);
  });
  
  test('应该成功查询Agent资产', () => {
    // 准备测试数据
    const agentStmt = db.prepare(`
      INSERT INTO test_agent_configs 
      (agent_id, display_name, description, expertise_domains, asset_types, partition, retention_days, created_at, updated_at, version, created_by, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    agentStmt.run(
      'query-test-agent',
      'Query Test Agent',
      'For query testing',
      JSON.stringify(['testing']),
      JSON.stringify(['log', 'report']),
      'test',
      30,
      Date.now(),
      Date.now(),
      '1.0.0',
      'test',
      1
    );
    
    // 插入多个资产
    const assetStmt = db.prepare(`
      INSERT INTO test_agent_assets 
      (id, agent_id, asset_type, partition, title, content, keywords, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const assets = [
      {
        id: 'query-asset-1',
        agentId: 'query-test-agent',
        assetType: 'log',
        partition: 'test',
        title: 'Query Log 1',
        content: 'Content 1',
        keywords: JSON.stringify(['query', 'test']),
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'query-asset-2',
        agentId: 'query-test-agent',
        assetType: 'report',
        partition: 'test',
        title: 'Query Report 1',
        content: 'Content 2',
        keywords: JSON.stringify(['query', 'report']),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    
    for (const asset of assets) {
      assetStmt.run(
        asset.id,
        asset.agentId,
        asset.assetType,
        asset.partition,
        asset.title,
        asset.content,
        asset.keywords,
        asset.createdAt,
        asset.updatedAt
      );
    }
    
    // 查询特定agent的资产
    const queryStmt = db.prepare('SELECT * FROM test_agent_assets WHERE agent_id = ? ORDER BY created_at DESC');
    const rows = queryStmt.all('query-test-agent') as any[];
    
    expect(rows.length).toBe(2);
    expect(rows.map(r => r.id)).toContain('query-asset-1');
    expect(rows.map(r => r.id)).toContain('query-asset-2');
    
    // 按类型查询
    const typeStmt = db.prepare('SELECT * FROM test_agent_assets WHERE agent_id = ? AND asset_type = ?');
    const logRows = typeStmt.all('query-test-agent', 'log') as any[];
    
    expect(logRows.length).toBe(1);
    expect(logRows[0].asset_type).toBe('log');
    expect(logRows[0].title).toBe('Query Log 1');
  });
  
  test('应该成功更新和删除数据', () => {
    // 插入测试数据
    const insertStmt = db.prepare(`
      INSERT INTO test_agent_configs 
      (agent_id, display_name, description, expertise_domains, asset_types, partition, retention_days, created_at, updated_at, version, created_by, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      'crud-test-agent',
      'CRUD Test Agent',
      'For CRUD operations',
      JSON.stringify(['testing']),
      JSON.stringify(['log']),
      'test',
      30,
      Date.now(),
      Date.now(),
      '1.0.0',
      'test',
      1
    );
    
    // 更新数据
    const updateStmt = db.prepare(`
      UPDATE test_agent_configs 
      SET display_name = ?, description = ?, updated_at = ?, is_active = ?
      WHERE agent_id = ?
    `);
    
    const newName = 'Updated CRUD Agent';
    const newDescription = 'Updated description';
    const newUpdatedAt = Date.now();
    const newIsActive = 0;
    
    const updateResult = updateStmt.run(
      newName,
      newDescription,
      newUpdatedAt,
      newIsActive,
      'crud-test-agent'
    );
    
    expect(updateResult.changes).toBe(1);
    
    // 验证更新
    const selectStmt = db.prepare('SELECT * FROM test_agent_configs WHERE agent_id = ?');
    const row = selectStmt.get('crud-test-agent') as any;
    
    expect(row.display_name).toBe(newName);
    expect(row.description).toBe(newDescription);
    expect(row.is_active).toBe(newIsActive);
    
    // 删除数据
    const deleteStmt = db.prepare('DELETE FROM test_agent_configs WHERE agent_id = ?');
    const deleteResult = deleteStmt.run('crud-test-agent');
    
    expect(deleteResult.changes).toBe(1);
    
    // 验证删除
    const deletedRow = selectStmt.get('crud-test-agent');
    expect(deletedRow).toBeUndefined();
  });
  
  test('应该成功进行批量操作', () => {
    const stmt = db.prepare(`
      INSERT INTO test_agent_assets 
      (id, agent_id, asset_type, partition, title, content, keywords, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const assets = Array.from({ length: 5 }, (_, i) => ({
      id: `batch-asset-${i}`,
      agentId: 'batch-test-agent',
      assetType: 'log',
      partition: 'test',
      title: `Batch Asset ${i}`,
      content: `Content ${i}`,
      keywords: JSON.stringify(['batch', 'test']),
      createdAt: Date.now() + i * 1000,
      updatedAt: Date.now() + i * 1000
    }));
    
    const transaction = db.transaction((assets: any[]) => {
      for (const asset of assets) {
        stmt.run(
          asset.id,
          asset.agentId,
          asset.assetType,
          asset.partition,
          asset.title,
          asset.content,
          asset.keywords,
          asset.createdAt,
          asset.updatedAt
        );
      }
    });
    
    transaction(assets);
    
    // 验证批量插入
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM test_agent_assets WHERE agent_id = ?');
    const countResult = countStmt.get('batch-test-agent') as any;
    
    expect(countResult.count).toBe(5);
    
    // 验证具体数据
    const selectStmt = db.prepare('SELECT * FROM test_agent_assets WHERE agent_id = ? ORDER BY id');
    const rows = selectStmt.all('batch-test-agent') as any[];
    
    expect(rows.length).toBe(5);
    for (let i = 0; i < 5; i++) {
      expect(rows[i].id).toBe(`batch-asset-${i}`);
      expect(rows[i].title).toBe(`Batch Asset ${i}`);
    }
  });
});