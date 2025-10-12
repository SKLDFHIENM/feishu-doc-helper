/**
 * 飞书文档助手 - 统一类型定义
 */

// 文件项接口
export interface FileItem {
  url: string;
  folder_path: string;
  obj_token: string;
  obj_type: 'doc' | 'sheet' | 'bitable' | string;
  type: string;
  name: string;
}

// 文件夹项接口
export interface FolderItem {
  path: string;
  token: string;
}

// 级联选择器选项接口
export interface CascaderOption {
  label: string;
  value: string;
  children?: CascaderOption[];
}

// API 响应接口
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 导出任务参数接口
export interface ExportTaskParams {
  token: string;
  type: string;
  file_extension: string;
  event_source: number;
  need_comment: boolean;
}

// 导出结果接口
export interface ExportResult {
  ticket: string;
  file_token?: string;
}

// 错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public url?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 日志级别枚举
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// 配置接口
export interface AppConfig {
  api: {
    retryCount: number;
    timeout: number;
    delay: number;
  };
  export: {
    concurrency: number;
    maxFileSize: number;
  };
  cache: {
    ttl: number;
  };
}

// 导出进度接口
export interface ExportProgress {
  current: number;
  total: number;
  currentFile?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}