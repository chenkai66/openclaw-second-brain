/**
 * 对话总结系统 - 日志工具
 */

import fs from 'fs';
import path from 'path';
import { configManager } from './config';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    const paths = configManager.getStoragePaths();
    this.logDir = paths.logsDir;
    this.logFile = path.join(this.logDir, `summary-${this.getDateString()}.log`);
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = this.getTimestamp();
    let logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      logMessage += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    return logMessage;
  }

  private writeLog(level: LogLevel, message: string, data?: any): void {
    const logMessage = this.formatMessage(level, message, data);
    
    // 控制台输出
    if (level === LogLevel.ERROR) {
      console.error(logMessage);
    } else if (level === LogLevel.WARN) {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
    
    // 文件输出
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (error) {
      console.error('Failed to write log file:', error);
    }
  }

  debug(message: string, data?: any): void {
    this.writeLog(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.writeLog(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.writeLog(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any): void {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    this.writeLog(LogLevel.ERROR, message, errorData);
  }

  /**
   * 清理旧日志文件（保留最近7天）
   */
  cleanOldLogs(daysToKeep: number = 7): void {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (file.startsWith('summary-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          const age = now - stats.mtime.getTime();

          if (age > maxAge) {
            fs.unlinkSync(filePath);
            this.info(`Deleted old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      this.error('Failed to clean old logs', error);
    }
  }
}

// 导出单例实例
export const logger = new Logger();

