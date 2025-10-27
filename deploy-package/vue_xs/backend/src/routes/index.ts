/**
 * 路由索引
 * 注册所有路由
 */

import { FastifyInstance } from 'fastify'
import authRoutes from './auth.routes'
import novelRoutes from './novel.routes'
import commentRoutes from './comment.routes'
import userRoutes from './user.routes'
import uploadRoutes from './upload.routes'
import searchRoutes from './search.routes'
import recommendationRoutes from './recommendation.routes'
import cacheRoutes from './cache.routes'
import adminRoutes from './admin.routes'

export default async function routes(fastify: FastifyInstance) {
  // 健康检查
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      modules: {
        auth: 'enabled',
        novel: 'enabled',
        comment: 'enabled',
        user: 'enabled',
        upload: 'enabled',
        search: 'enabled',
        recommendation: 'enabled',
        cache: 'enabled',
        admin: 'enabled'
      }
    }
  })
  
  // 注册认证路由
  fastify.register(authRoutes, { prefix: '/api/auth' })
  
  // 注册小说路由
  fastify.register(novelRoutes, { prefix: '/api/novels' })
  
  // 注册评论路由
  fastify.register(commentRoutes, { prefix: '/api' })
  
  // 注册用户路由
  fastify.register(userRoutes, { prefix: '/api/users' })
  
  // 注册上传路由
  fastify.register(uploadRoutes, { prefix: '/api/upload' })
  
  // 注册搜索路由
  fastify.register(searchRoutes, { prefix: '/api' })
  
  // 注册推荐路由
  fastify.register(recommendationRoutes, { prefix: '/api' })
  
  // 注册缓存管理路由
  fastify.register(cacheRoutes, { prefix: '/api/cache' })
  
  // 注册管理后台路由
  fastify.register(adminRoutes, { prefix: '/api/admin' })
}

