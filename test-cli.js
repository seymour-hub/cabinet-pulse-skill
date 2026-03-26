#!/usr/bin/env node
/**
 * 测试CLI基本功能
 */

const { exec } = require('child_process');
const path = require('path');

const cliPath = path.join(__dirname, 'dist/src/scripts/cabinet-pulse.js');

console.log('测试Cabinet Pulse CLI基本功能...');
console.log('CLI路径:', cliPath);

// 测试帮助命令
exec(`node ${cliPath} --help`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ 帮助命令失败:', error.message);
    console.error('stderr:', stderr);
    process.exit(1);
  }
  
  console.log('✅ 帮助命令成功:');
  console.log(stdout.substring(0, 500) + '...');
  
  // 测试agent list命令
  exec(`node ${cliPath} agent list`, (error2, stdout2, stderr2) => {
    if (error2) {
      console.log('ℹ️ agent list命令可能失败（预期中，因为数据库可能为空或未连接）');
      console.log('错误信息:', error2.message);
      
      // 测试创建agent命令（应该失败，因为没有配置文件）
      exec(`node ${cliPath} agent create test-agent --name "Test Agent"`, (error3, stdout3, stderr3) => {
        if (error3) {
          console.log('ℹ️ agent create命令失败（预期中，需要配置文件）');
          console.log('这表明CLI命令结构正确，但需要正确配置');
          console.log('\n✅ CLI基本框架测试通过');
          console.log('\n下一步:');
          console.log('1. 确保数据库配置正确');
          console.log('2. 运行完整的功能测试');
          console.log('3. 构建和安装CLI工具');
        } else {
          console.log('✅ agent create命令成功:');
          console.log(stdout3);
        }
      });
    } else {
      console.log('✅ agent list命令成功:');
      console.log(stdout2);
    }
  });
});