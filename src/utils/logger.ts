import { LogLevel } from '../types';

/**
 * 日志管理器
 */
class Logger {
  private level: LogLevel = LogLevel.INFO;
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${level}] ${timestamp}: ${message}`;
  }

  /**
   * 错误日志
   */
  error(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  /**
   * 警告日志
   */
  warn(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  /**
   * 信息日志
   */
  info(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, ...args: any[]): void {
    if (this.level >= LogLevel.DEBUG && this.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  /**
   * API 错误日志
   */
  apiError(url: string, error: any, context?: string): void {
    this.error(`API Error${context ? ` [${context}]` : ''}: ${url}`, error);
  }

  /**
   * 性能日志
   */
  performance(operation: string, duration: number): void {
    this.info(`Performance [${operation}]: ${duration}ms`);
  }
}

// 导出单例实例
export const logger = new Logger();

// 在开发环境下设置为 DEBUG 级别
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
}