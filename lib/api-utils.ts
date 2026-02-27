/**
 * API 错误处理工具
 *
 * 提供统一的错误处理、日志记录和响应格式
 */

import { NextResponse } from 'next/server';

export interface APIError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * 标准错误响应
 */
export function errorResponse(
  error: Error | AppError | string,
  fallbackCode: string = 'INTERNAL_ERROR',
  fallbackStatus: number = 500
): NextResponse {
  if (typeof error === 'string') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: fallbackCode,
          message: error,
        },
      },
      { status: fallbackStatus }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // 普通 Error
  console.error('Unhandled error:', error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: fallbackCode,
        message: error.message || 'An unexpected error occurred',
      },
    },
    { status: fallbackStatus }
  );
}

/**
 * 标准成功响应
 */
export function successResponse(data: any, statusCode: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status: statusCode }
  );
}

/**
 * 包装异步 API 处理函数
 *
 * 自动捕获错误并返回标准响应
 */
export function apiHandler<T = any>(
  handler: (...args: any[]) => Promise<NextResponse | T>
): (...args: any[]) => Promise<NextResponse> {
  return async (...args: any[]): Promise<NextResponse> => {
    try {
      const result = await handler(...args);

      // 如果已经是 NextResponse，直接返回
      if (result instanceof NextResponse) {
        return result;
      }

      // 否则包装成成功响应
      return successResponse(result);
    } catch (error: any) {
      return errorResponse(error);
    }
  };
}

/**
 * 验证请求体
 */
export function validateRequestBody(
  body: any,
  schema: Record<string, { required?: boolean; type?: string; validator?: (val: any) => boolean }>
): void {
  for (const [key, rules] of Object.entries(schema)) {
    const value = body[key];

    // 检查必填字段
    if (rules.required && (value === undefined || value === null)) {
      throw new AppError(`Missing required field: ${key}`, 'VALIDATION_ERROR', 400);
    }

    // 检查类型
    if (value !== undefined && rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        throw new AppError(
          `Invalid type for field "${key}": expected ${rules.type}, got ${actualType}`,
          'VALIDATION_ERROR',
          400
        );
      }
    }

    // 自定义验证
    if (value !== undefined && rules.validator && !rules.validator(value)) {
      throw new AppError(`Validation failed for field: ${key}`, 'VALIDATION_ERROR', 400);
    }
  }
}

/**
 * 超时包装器
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new AppError(errorMessage, 'TIMEOUT_ERROR', 408));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * 重试包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1 && shouldRetry(error)) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * 速率限制器
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // 清理过期的请求记录
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * 请求日志记录
 */
export function logRequest(
  method: string,
  path: string,
  duration: number,
  statusCode: number
): void {
  const timestamp = new Date().toISOString();
  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  const message = `[${timestamp}] ${method} ${path} - ${statusCode} (${duration}ms)`;

  if (logLevel === 'error') {
    console.error(message);
  } else if (logLevel === 'warn') {
    console.warn(message);
  } else {
    console.log(message);
  }
}

/**
 * 中间件：请求计时和日志
 */
export function withRequestLogging(
  handler: (req: any) => Promise<NextResponse>
): (req: any) => Promise<NextResponse> {
  return async (req: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = req.method;
    const path = req.url;

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;
      logRequest(method, path, duration, response.status);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logRequest(method, path, duration, 500);
      throw error;
    }
  };
}

/**
 * 中间件：速率限制
 */
export function withRateLimit(
  handler: (req: any) => Promise<NextResponse>,
  limiter: RateLimiter,
  getKey: (req: any) => string = (req) => req.ip || 'global'
): (req: any) => Promise<NextResponse> {
  return async (req: any): Promise<NextResponse> => {
    const key = getKey(req);

    if (!limiter.check(key)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
          },
        },
        { status: 429 }
      );
    }

    return handler(req);
  };
}

/**
 * 工具：延迟
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 安全的 JSON 解析
 */
export function safeJSONParse<T = any>(text: string, defaultValue?: T): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new AppError('Invalid JSON format', 'PARSE_ERROR', 400, { originalText: text });
  }
}

/**
 * 数据验证工具
 */
export const validators = {
  isString: (val: any): boolean => typeof val === 'string',
  isNumber: (val: any): boolean => typeof val === 'number' && !isNaN(val),
  isBoolean: (val: any): boolean => typeof val === 'boolean',
  isArray: (val: any): boolean => Array.isArray(val),
  isObject: (val: any): boolean => typeof val === 'object' && val !== null && !Array.isArray(val),
  isEmail: (val: any): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  isURL: (val: any): boolean => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  minLength: (min: number) => (val: any): boolean =>
    typeof val === 'string' && val.length >= min,
  maxLength: (max: number) => (val: any): boolean =>
    typeof val === 'string' && val.length <= max,
  inRange: (min: number, max: number) => (val: any): boolean =>
    typeof val === 'number' && val >= min && val <= max,
  oneOf: (values: any[]) => (val: any): boolean => values.includes(val),
};
