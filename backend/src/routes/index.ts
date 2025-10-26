/**
 * 路由索引
 * 注册所有路由
 */

import { FastifyInstance } from 'fastify'
import authRoutes from './auth.routes'

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
  
  // TODO: 注册其他路由
  // fastify.register(userRoutes, { prefix: '/api/users' })
  // fastify.register(novelRoutes, { prefix: '/api/novels' })
}

