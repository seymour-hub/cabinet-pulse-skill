#!/usr/bin/env node
/**
 * 简单的SQLite连接测试
 */

try {
  const Database = require('better-sqlite3');
  console.log('✅ better-sqlite3模块加载成功');
  
  // 测试内存数据库
  const db = new Database(':memory:');
  console.log('✅ SQLite内存数据库连接成功');
  
  // 测试简单查询
  db.prepare('SELECT 1 as test').get();
  console.log('✅ SQLite查询执行成功');
  
  db.close();
  console.log('✅ SQLite数据库关闭成功');
  console.log('🎉 所有SQLite测试通过！');
} catch (error) {
  console.error('❌ SQLite测试失败:', error);
  process.exit(1);
}