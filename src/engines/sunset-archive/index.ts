/**
 * 夕阳无限引擎导出
 * 主动脱水型记忆归档引擎
 */

// 首先导入需要的组件
import { SunsetArchiveEngine } from './sunset-archive-engine';

// 导出接口
export * from './interfaces';

// 导出记忆检测器
export { 
  BasicMemoryDetector, 
  type MemoryDetectorConfig 
} from './memory-detector';

// 导出内容提取器
export { 
  BasicContentExtractor, 
  type ContentExtractorConfig 
} from './content-extractor';

// 导出快照构建器
export { 
  BasicSnapshotBuilder, 
  type SnapshotBuilderConfig 
} from './snapshot-builder';

// 导出主引擎
export { SunsetArchiveEngine };

/**
 * 默认引擎配置
 */
export const DEFAULT_SUNSET_ARCHIVE_CONFIG = {
  name: 'sunset-archive-engine',
  version: '1.0.0',
  enabled: true,
  detectionThreshold: 8000,
  importanceThreshold: 60,
  maxProcessingTime: 30000,
  aiEnhancementEnabled: false,
  logLevel: 'info' as const,
};

/**
 * 创建默认夕阳无限引擎
 */
export function createDefaultSunsetArchiveEngine() {
  return new SunsetArchiveEngine(DEFAULT_SUNSET_ARCHIVE_CONFIG);
}

/**
 * 引擎工厂函数
 */
export function createSunsetArchiveEngine(config?: Partial<typeof DEFAULT_SUNSET_ARCHIVE_CONFIG>) {
  return new SunsetArchiveEngine({
    ...DEFAULT_SUNSET_ARCHIVE_CONFIG,
    ...config,
  });
}