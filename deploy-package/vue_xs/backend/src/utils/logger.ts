/**
 * 日志工具
 * 优化：Day 5 新增
 */

import fs from 'fs'
import path from 'path'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: any
}

class Logger {
  private logDir: string
  private enableFileLogging: boolean

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs')
    this.enableFileLogging = process.env.LOG_TO_FILE === 'true'
    
    if (this.enableFileLogging && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  private formatLog(entry: LogEntry): string {
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`
  }

  private writeToFile(level: LogLevel, log: string): void {
    if (!this.enableFileLogging) return

    const date = new Date().toISOString().split('T')[0]
    const logFile = path.join(this.logDir, `${date}-${level}.log`)
    
    fs.appendFile(logFile, log + '\n', (err) => {
      if (err) console.error('写入日志文件失败:', err)
    })
  }

  private log(level: LogLevel, message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }

    const formattedLog = this.formatLog(entry)

    // 控制台输出
    switch (level) {
      case 'error':
        console.error(formattedLog)
        break
      case 'warn':
        console.warn(formattedLog)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(formattedLog)
        }
        break
      default:
        console.log(formattedLog)
    }

    // 文件输出
    this.writeToFile(level, formattedLog)
  }

  info(message: string, context?: any): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: any): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: any): void {
    this.log('error', message, context)
  }

  debug(message: string, context?: any): void {
    this.log('debug', message, context)
  }

  /**
   * 记录API请求
   */
  logRequest(method: string, url: string, userId?: number): void {
    this.info(`${method} ${url}`, { userId, type: 'request' })
  }

  /**
   * 记录API响应
   */
  logResponse(method: string, url: string, statusCode: number, duration: number): void {
    this.info(`${method} ${url} - ${statusCode}`, { duration, type: 'response' })
  }

  /**
   * 记录数据库查询
   */
  logQuery(query: string, duration: number): void {
    this.debug(`DB Query: ${query}`, { duration, type: 'database' })
  }
}

// 单例模式
export const logger = new Logger()

