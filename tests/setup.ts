/**
 * Jest全局测试配置
 * 在所有测试文件运行前执行的设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 设置全局超时
jest.setTimeout(10000);

// 全局beforeAll钩子
beforeAll(() => {
  console.log('Starting Cabinet Pulse Skill tests...');
});

// 全局afterAll钩子
afterAll(() => {
  console.log('All Cabinet Pulse Skill tests completed.');
});

// 全局beforeEach钩子
beforeEach(() => {
  // 重置所有模拟
  jest.clearAllMocks();
});

// 全局afterEach钩子
afterEach(() => {
  // 清理测试数据
});