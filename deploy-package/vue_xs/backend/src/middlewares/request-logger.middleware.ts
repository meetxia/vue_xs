/**
 * 请求日志中间件
 * 优化：Day 5 新增
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '../utils/logger'

/**
 * 请求日志中间件
 */
export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const startTime = Date.now()
  
  // 记录请求开始
  logger.logRequest(
    request.method,
    request.url,
    (request as any).user?.userId
  )

  // 监听响应完成
  reply.addHook('onSend', async (request, reply) => {
    const duration = Date.now() - startTime
    
    logger.logResponse(
      request.method,
      request.url,
      reply.statusCode,
      duration
    )
  })
}

