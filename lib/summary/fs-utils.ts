/**
 * 文件系统工具 - 提供鲁棒的文件操作
 *
 * 特性：
 * - 自动创建目录
 * - 原子写入（写入临时文件再重命名）
 * - 文件锁支持
 * - 重试机制
 * - 错误恢复
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

export interface FileSystemOptions {
  maxRetries?: number;
  retryDelay?: number;
  atomic?: boolean;
  createDir?: boolean;
  backup?: boolean;
}

const DEFAULT_OPTIONS: Required<FileSystemOptions> = {
  maxRetries: 3,
  retryDelay: 100,
  atomic: true,
  createDir: true,
  backup: false,
};

/**
 * 确保目录存在
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
}

/**
 * 安全写入文件
 *
 * 使用原子写入：先写入临时文件，再重命名
 * 这样即使写入过程中断，也不会损坏原文件
 */
export async function safeWriteFile(
  filePath: string,
  content: string | Buffer,
  options: FileSystemOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  // 确保目录存在
  if (opts.createDir) {
    const dir = path.dirname(filePath);
    await ensureDir(dir);
  }

  // 备份现有文件
  if (opts.backup && fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup`;
    try {
      await fs.promises.copyFile(filePath, backupPath);
    } catch (error: any) {
      console.warn(`Failed to create backup for ${filePath}:`, error.message);
    }
  }

  // 重试写入
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      if (opts.atomic) {
        // 原子写入
        const tempPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
        await writeFile(tempPath, content, 'utf-8');
        await rename(tempPath, filePath);
      } else {
        // 直接写入
        await writeFile(filePath, content, 'utf-8');
      }
      return;
    } catch (error: any) {
      lastError = error;
      if (attempt < opts.maxRetries - 1) {
        await sleep(opts.retryDelay * Math.pow(2, attempt));
      }
    }
  }

  throw new Error(
    `Failed to write file ${filePath} after ${opts.maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * 安全读取文件
 */
export async function safeReadFile(
  filePath: string,
  options: FileSystemOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // 重试读取
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      const content = await readFile(filePath, 'utf-8');
      return content;
    } catch (error: any) {
      lastError = error;
      if (attempt < opts.maxRetries - 1) {
        await sleep(opts.retryDelay * Math.pow(2, attempt));
      }
    }
  }

  throw new Error(
    `Failed to read file ${filePath} after ${opts.maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * 安全读取 JSON 文件
 */
export async function safeReadJSON<T = any>(
  filePath: string,
  defaultValue?: T,
  options: FileSystemOptions = {}
): Promise<T> {
  try {
    const content = await safeReadFile(filePath, options);
    return JSON.parse(content) as T;
  } catch (error: any) {
    if (error.message.includes('File not found') && defaultValue !== undefined) {
      return defaultValue;
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 安全写入 JSON 文件
 */
export async function safeWriteJSON(
  filePath: string,
  data: any,
  options: FileSystemOptions = {}
): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await safeWriteFile(filePath, content, options);
  } catch (error: any) {
    throw new Error(`Failed to write JSON to ${filePath}: ${error.message}`);
  }
}

/**
 * 检查文件是否被锁定
 */
export function isFileLocked(filePath: string): boolean {
  const lockPath = `${filePath}.lock`;
  return fs.existsSync(lockPath);
}

/**
 * 等待文件解锁
 */
export async function waitForUnlock(
  filePath: string,
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();
  const lockPath = `${filePath}.lock`;

  while (fs.existsSync(lockPath)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for file to unlock: ${filePath}`);
    }
    await sleep(100);
  }
}

/**
 * 创建文件锁
 */
export async function createLock(filePath: string): Promise<() => Promise<void>> {
  const lockPath = `${filePath}.lock`;

  // 等待现有锁释放
  await waitForUnlock(filePath, 10000);

  // 创建锁文件
  await writeFile(lockPath, process.pid.toString(), 'utf-8');

  // 返回解锁函数
  return async () => {
    try {
      await unlink(lockPath);
    } catch (error: any) {
      console.warn(`Failed to remove lock file ${lockPath}:`, error.message);
    }
  };
}

/**
 * 安全删除文件
 */
export async function safeDeleteFile(
  filePath: string,
  options: FileSystemOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!fs.existsSync(filePath)) {
    return; // 文件不存在，无需删除
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      await unlink(filePath);
      return;
    } catch (error: any) {
      lastError = error;
      if (attempt < opts.maxRetries - 1) {
        await sleep(opts.retryDelay * Math.pow(2, attempt));
      }
    }
  }

  throw new Error(
    `Failed to delete file ${filePath} after ${opts.maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * 流式读取大文件
 */
export function createReadStream(filePath: string): fs.ReadStream {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.createReadStream(filePath, { encoding: 'utf-8' });
}

/**
 * 流式写入大文件
 */
export function createWriteStream(filePath: string): fs.WriteStream {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return fs.createWriteStream(filePath, { encoding: 'utf-8' });
}

/**
 * 复制文件
 */
export async function safeCopyFile(
  sourcePath: string,
  destPath: string,
  options: FileSystemOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  if (opts.createDir) {
    const destDir = path.dirname(destPath);
    await ensureDir(destDir);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      await fs.promises.copyFile(sourcePath, destPath);
      return;
    } catch (error: any) {
      lastError = error;
      if (attempt < opts.maxRetries - 1) {
        await sleep(opts.retryDelay * Math.pow(2, attempt));
      }
    }
  }

  throw new Error(
    `Failed to copy file ${sourcePath} to ${destPath} after ${opts.maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * 获取文件大小
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error: any) {
    throw new Error(`Failed to get file size for ${filePath}: ${error.message}`);
  }
}

/**
 * 检查文件是否可读写
 */
export function checkFileAccess(filePath: string): {
  exists: boolean;
  readable: boolean;
  writable: boolean;
} {
  const result = {
    exists: false,
    readable: false,
    writable: false,
  };

  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    result.exists = true;
  } catch {
    return result;
  }

  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    result.readable = true;
  } catch {}

  try {
    fs.accessSync(filePath, fs.constants.W_OK);
    result.writable = true;
  } catch {}

  return result;
}

/**
 * 列出目录中的文件
 */
export async function listFiles(
  dirPath: string,
  options: {
    recursive?: boolean;
    pattern?: RegExp;
  } = {}
): Promise<string[]> {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files: string[] = [];
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory() && options.recursive) {
      const subFiles = await listFiles(fullPath, options);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      if (!options.pattern || options.pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * 工具函数：延迟
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 清理临时文件
 */
export async function cleanupTempFiles(dirPath: string): Promise<number> {
  let cleanedCount = 0;

  try {
    const files = await listFiles(dirPath, {
      recursive: false,
      pattern: /\.tmp\.\d+\.\d+$/,
    });

    for (const file of files) {
      try {
        await safeDeleteFile(file);
        cleanedCount++;
      } catch (error) {
        console.warn(`Failed to delete temp file ${file}:`, error);
      }
    }
  } catch (error) {
    console.warn(`Failed to cleanup temp files in ${dirPath}:`, error);
  }

  return cleanedCount;
}
