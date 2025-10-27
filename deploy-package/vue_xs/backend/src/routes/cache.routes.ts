import { FastifyInstance } from 'fastify'
import {
  getCacheStats,
  clearAllCache,
  clearCacheByPattern,
  warmupCache,
  cleanupExpiredCache
} from '../controllers/cache.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

export default async function cacheRoutes(fastify: FastifyInstance) {
  /**
   * @route GET /api/cache/stats
   * @desc 获取缓存统计信息
   * @access Private (Admin)
   */
  fastify.get(
    '/stats',
    {
      preHandler: authMiddleware
    },
    getCacheStats
  )

  /**
   * @route DELETE /api/cache
   * @desc 清空所有缓存
   * @access Private (Admin)
   */
  fastify.delete(
    '/',
    {
      preHandler: authMiddleware
    },
    clearAllCache
  )

  /**
   * @route POST /api/cache/clear
   * @desc 按模式清除缓存
   * @access Private (Admin)
   * @body pattern - 缓存键模式
   */
  fastify.post(
    '/clear',
    {
      preHandler: authMiddleware
    },
    clearCacheByPattern
  )

  /**
   * @route POST /api/cache/warmup
   * @desc 预热缓存
   * @access Private (Admin)
   */
  fastify.post(
    '/warmup',
    {
      preHandler: authMiddleware
    },
    warmupCache
  )

  /**
   * @route POST /api/cache/cleanup
   * @desc 清理过期缓存
   * @access Private (Admin)
   */
  fastify.post(
    '/cleanup',
    {
      preHandler: authMiddleware
    },
    cleanupExpiredCache
  )
}

