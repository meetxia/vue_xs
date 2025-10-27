import { FastifyRequest, FastifyReply } from 'fastify'
import { cacheService, CacheKeys } from '../services/cache.service'
import { CacheManager } from '../utils/cache-helper'

/**
 * 获取缓存统计
 */
export async function getCacheStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const stats = CacheManager.getStats()

    return reply.send({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取统计失败'
    })
  }
}

/**
 * 清空所有缓存
 */
export async function clearAllCache(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    CacheManager.clearAll()

    return reply.send({
      success: true,
      message: '所有缓存已清空'
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '清空失败'
    })
  }
}

/**
 * 按模式清除缓存
 */
export async function clearCacheByPattern(
  request: FastifyRequest<{
    Body: {
      pattern: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { pattern } = request.body

    if (!pattern) {
      return reply.code(400).send({
        success: false,
        message: '缺少pattern参数'
      })
    }

    const cleared = CacheManager.clearPattern(pattern)

    return reply.send({
      success: true,
      message: `清除了 ${cleared} 个缓存`,
      data: {
        cleared,
        pattern
      }
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '清除失败'
    })
  }
}

/**
 * 预热缓存
 */
export async function warmupCache(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await CacheManager.warmupHotData()

    return reply.send({
      success: true,
      message: '缓存预热完成'
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '预热失败'
    })
  }
}

/**
 * 清理过期缓存
 */
export async function cleanupExpiredCache(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const cleaned = cacheService.cleanup()

    return reply.send({
      success: true,
      message: `清理了 ${cleaned} 个过期缓存`,
      data: {
        cleaned
      }
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '清理失败'
    })
  }
}

