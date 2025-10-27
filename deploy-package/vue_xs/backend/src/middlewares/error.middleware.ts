/**
 * 错误处理中间件
 * 统一处理应用程序中的错误
 */

import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { ErrorCode } from '../types'

/**
 * 全局错误处理器
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // 记录错误
  request.log.error(error)
  
  // Prisma错误处理
  if (error.message.includes('Prisma')) {
    return reply.code(500).send({
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: '数据库操作失败',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    })
  }
  
  // 验证错误
  if (error.validation) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: error.validation
      }
    })
  }
  
  // 其他错误
  const statusCode = error.statusCode || 500
  
  return reply.code(statusCode).send({
    success: false,
    error: {
      code: ErrorCode.SYSTEM_ERROR,
      message: error.message || '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  })
}

