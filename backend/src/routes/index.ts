/**
 * 路由索引
 * 注册所有路由
 */

import { FastifyInstance } from 'fastify'
import authRoutes from './auth.routes'
import novelRoutes from './novel.routes'

export default async function routes(fastify: FastifyInstance) {
  // 健康检查
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  })
  
  // 注册认证路由
  fastify.register(authRoutes, { prefix: '/api/auth' })
  
  // 注册小说路由
  fastify.register(novelRoutes, { prefix: '/api/novels' })
  
  // TODO: 注册其他路由
  // fastify.register(commentRoutes, { prefix: '/api/comments' })
}

