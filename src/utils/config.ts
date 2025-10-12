import type { AppConfig } from '../types';

/**
 * 应用配置
 */
export const CONFIG: AppConfig = {
  api: {
    retryCount: 3,
    timeout: 10000,
    delay: 500,
  },
  export: {
    concurrency: 3,
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
  cache: {
    ttl: 5 * 60 * 1000, // 5分钟
  },
};

/**
 * 获取配置值
 */
export function getConfig(): AppConfig {
  return CONFIG;
}

/**
 * 更新配置
 */
export function updateConfig(newConfig: Partial<AppConfig>): void {
  Object.assign(CONFIG, newConfig);
}