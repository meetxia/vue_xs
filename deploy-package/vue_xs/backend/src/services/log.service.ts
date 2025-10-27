import { PrismaClient } from '@prisma/client'
import { FastifyRequest } from 'fastify'

const prisma = new PrismaClient()

/**
 * 操作日志服务
 */
export class LogService {
  /**
   * 记录操作日志
   */
  async log(params: {
    action: string
    module: string
    description?: string
    userId?: number
    username?: string
    ip?: string
    userAgent?: string
    targetType?: string
    targetId?: number
    changes?: any
    success?: boolean
    errorMsg?: string
  }) {
    try {
      const logData: any = {
        action: params.action,
        module: params.module,
        description: params.description,
        userId: params.userId,
        username: params.username,
        ip: params.ip,
        userAgent: params.userAgent,
        targetType: params.targetType,
        targetId: params.targetId,
        changes: params.changes ? JSON.stringify(params.changes) : null,
        success: params.success !== undefined ? params.success : true,
        errorMsg: params.errorMsg
      }

      await prisma.operationLog.create({
        data: logData
      })
    } catch (error) {
      // 日志记录失败不应影响主流程
      console.error('记录操作日志失败:', error)
    }
  }

  /**
   * 从请求中提取信息并记录日志
   */
  async logFromRequest(
    request: FastifyRequest,
    action: string,
    module: string,
    description?: string,
    targetType?: string,
    targetId?: number,
    changes?: any
  ) {
    await this.log({
      action,
      module,
      description,
      userId: request.user?.userId,
      username: request.user?.username,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      targetType,
      targetId,
      changes
    })
  }

  /**
   * 获取操作日志列表
   */
  async getLogs(options: {
    page?: number
    pageSize?: number
    userId?: number
    module?: string
    action?: string
    success?: boolean
  } = {}) {
    const {
      page = 1,
      pageSize = 50,
      userId,
      module,
      action,
      success
    } = options

    const skip = (page - 1) * pageSize

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (module) {
      where.module = module
    }

    if (action) {
      where.action = action
    }

    if (success !== undefined) {
      where.success = success
    }

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.operationLog.count({ where })
    ])

    // 解析changes字段
    const processedLogs = logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null
    }))

    return {
      logs: processedLogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * 获取用户操作日志
   */
  async getUserLogs(userId: number, limit: number = 20) {
    const logs = await prisma.operationLog.findMany({
      where: { userId },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null
    }))
  }

  /**
   * 清理旧日志
   * @param days 保留天数
   */
  async cleanOldLogs(days: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await prisma.operationLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    return {
      deleted: result.count,
      cutoffDate
    }
  }
}

// 导出单例
export const logService = new LogService()

/**
 * 日志记录辅助函数
 */
export const LogActions = {
  // 用户操作
  USER_REGISTER: 'register',
  USER_LOGIN: 'login',
  USER_LOGOUT: 'logout',
  USER_UPDATE: 'update',
  USER_DELETE: 'delete',
  
  // 小说操作
  NOVEL_CREATE: 'create',
  NOVEL_UPDATE: 'update',
  NOVEL_DELETE: 'delete',
  NOVEL_PUBLISH: 'publish',
  
  // 评论操作
  COMMENT_CREATE: 'create',
  COMMENT_DELETE: 'delete',
  
  // 管理操作
  ADMIN_USER_BAN: 'ban_user',
  ADMIN_USER_UNBAN: 'unban_user',
  ADMIN_NOVEL_REVIEW: 'review_novel',
  ADMIN_COMMENT_DELETE: 'delete_comment'
}

export const LogModules = {
  AUTH: 'auth',
  USER: 'user',
  NOVEL: 'novel',
  COMMENT: 'comment',
  ADMIN: 'admin',
  SYSTEM: 'system'
}

