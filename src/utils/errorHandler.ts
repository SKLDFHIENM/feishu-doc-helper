import { ApiError } from '../types';
import { logger } from './logger';
import { CONFIG } from './config';

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 指数退避延迟
 */
function exponentialBackoff(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000);
}

/**
 * 安全的 API 调用，带重试机制
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: {
    retries?: number;
    context?: string;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T | null> {
  const { 
    retries = CONFIG.api.retryCount, 
    context = 'API Call',
    shouldRetry = () => true 
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      logger.performance(context, duration);
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt === retries || !shouldRetry(error)) {
        logger.apiError('', error, context);
        break;
      }

      const delay = exponentialBackoff(attempt);
      logger.warn(`${context} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms`);
      await sleep(delay);
    }
  }

  return null;
}

/**
 * 包装 fetch 请求
 */
export async function safeFetch(
  url: string, 
  options: RequestInit = {},
  context?: string
): Promise<Response | null> {
  return safeApiCall(
    () => fetch(url, {
      ...options,
      signal: AbortSignal.timeout(CONFIG.api.timeout),
    }),
    {
      context: context || `Fetch ${url}`,
      shouldRetry: (error) => {
        // 网络错误或超时错误可以重试
        return error.name === 'TypeError' || error.name === 'TimeoutError';
      }
    }
  );
}

/**
 * 安全的 JSON 解析
 */
export async function safeJsonParse<T = any>(
  response: Response,
  context?: string
): Promise<T | null> {
  try {
    const json = await response.json();
    return json;
  } catch (error) {
    logger.error(`JSON parse failed${context ? ` [${context}]` : ''}`, error);
    return null;
  }
}

/**
 * 验证 API 响应
 */
export function validateApiResponse<T>(
  response: any,
  validator?: (data: any) => boolean
): response is { code: number; msg: string; data: T } {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if (typeof response.code !== 'number' || typeof response.msg !== 'string') {
    return false;
  }

  if (validator && !validator(response.data)) {
    return false;
  }

  return true;
}

/**
 * 创建 API 错误
 */
export function createApiError(
  message: string,
  code: number = -1,
  url?: string,
  originalError?: any
): ApiError {
  return new ApiError(message, code, url, originalError);
}

/**
 * 并发控制器
 */
export class ConcurrencyController {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrency: number) {}

  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        this.running++;
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            next?.();
          }
        }
      };

      if (this.running < this.maxConcurrency) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}