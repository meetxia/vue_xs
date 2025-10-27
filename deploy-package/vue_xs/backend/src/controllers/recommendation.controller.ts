/**
 * 推荐系统控制器
 * Week 2 Day 8 新增
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { recommendationService } from '../services/recommendation.service'
import { success, error, ErrorCodes } from '../utils/response'
import { logger } from '../utils/logger'

/**
 * 基于分类推荐
 */
export async function getRecommendationsByCategory(
  request: FastifyRequest<{
    Params: { novelId: string }
    Querystring: { limit?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const novelId = parseInt(request.params.novelId)
    const limit = request.query.limit ? parseInt(request.query.limit) : 10

    if (isNaN(novelId) || novelId <= 0) {
      return reply.code(400).send(
        error(ErrorCodes.VALIDATION_ERROR, '小说ID无效')
      )
    }

    const recommendations = await recommendationService.recommendByCategory(
      novelId,
      { limit: Math.min(limit, 50) }
    )

    return reply.send(success(recommendations))
  } catch (err: any) {
    logger.error('获取分类推荐失败', { error: err })
    return reply.code(500).send(
      error(ErrorCodes.INTERNAL_ERROR, '获取推荐失败')
    )
  }
}

/**
 * 热门推荐
 */
export async function getHotRecommendations(
  request: FastifyRequest<{
    Querystring: { limit?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const limit = request.query.limit ? parseInt(request.query.limit) : 20

    const recommendations = await recommendationService.recommendHot({
      limit: Math.min(limit, 100)
    })

    return reply.send(success(recommendations))
  } catch (err: any) {
    logger.error('获取热门推荐失败', { error: err })
    return reply.code(500).send(
      error(ErrorCodes.INTERNAL_ERROR, '获取推荐失败')
    )
  }
}

/**
 * 最新推荐
 */
export async function getNewRecommendations(
  request: FastifyRequest<{
    Querystring: { limit?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const limit = request.query.limit ? parseInt(request.query.limit) : 20

    const recommendations = await recommendationService.recommendNew({
      limit: Math.min(limit, 100)
    })

    return reply.send(success(recommendations))
  } catch (err: any) {
    logger.error('获取最新推荐失败', { error: err })
    return reply.code(500).send(
      error(ErrorCodes.INTERNAL_ERROR, '获取推荐失败')
    )
  }
}

/**
 * 相关推荐
 */
export async function getRelatedRecommendations(
  request: FastifyRequest<{
    Params: { novelId: string }
    Querystring: { limit?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const novelId = parseInt(request.params.novelId)
    const limit = request.query.limit ? parseInt(request.query.limit) : 10

    if (isNaN(novelId) || novelId <= 0) {
      return reply.code(400).send(
        error(ErrorCodes.VALIDATION_ERROR, '小说ID无效')
      )
    }

    const recommendations = await recommendationService.recommendRelated(
      novelId,
      { limit: Math.min(limit, 50) }
    )

    return reply.send(success(recommendations))
  } catch (err: any) {
    logger.error('获取相关推荐失败', { error: err })
    return reply.code(500).send(
      error(ErrorCodes.INTERNAL_ERROR, '获取推荐失败')
    )
  }
}

/**
 * 作者推荐
 */
export async function getAuthorRecommendations(
  request: FastifyRequest<{
    Params: { novelId: string }
    Querystring: { limit?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const novelId = parseInt(request.params.novelId)
    const limit = request.query.limit ? parseInt(request.query.limit) : 10

    if (isNaN(novelId) || novelId <= 0) {
      return reply.code(400).send(
        error(ErrorCodes.VALIDATION_ERROR, '小说ID无效')
      )
    }

    const recommendations = await recommendationService.recommendByAuthor(
      novelId,
      { limit: Math.min(limit, 50) }
    )

    return reply.send(success(recommendations))
  } catch (err: any) {
    logger.error('获取作者推荐失败', { error: err })
    return reply.code(500).send(
      error(ErrorCodes.INTERNAL_ERROR, '获取推荐失败')
    )
  }
}

/**
 * 个性化推荐（需登录）
 */
export async function getPersonalizedRecommendations(
  request: FastifyRequest<{
    Querystring: { limit?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const userId = (request as any).user?.userId

    if (!userId) {
      return reply.code(401).send(
        error(ErrorCodes.UNAUTHORIZED, '请先登录')
      )
    }

    const limit = request.query.limit ? parseInt(request.query.limit) : 20

    const recommendations = await recommendationService.recommendForUser(
      userId,
      { limit: Math.min(limit, 100) }
    )

    return reply.send(success(recommendations))
  } catch (err: any) {
    logger.error('获取个性化推荐失败', { error: err })
    return reply.code(500).send(
      error(ErrorCodes.INTERNAL_ERROR, '获取推荐失败')
    )
  }
}

/**
 * 综合推荐
 */
export async function getMixedRecommendations(
  request: FastifyRequest<{
    Params: { novelId: string }
    Querystring: { limit?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const novelId = parseInt(request.params.novelId)
    const limit = request.query.limit ? parseInt(request.query.limit) : 20

    if (isNaN(novelId) || novelId <= 0) {
      return reply.code(400).send(
        error(ErrorCodes.VALIDATION_ERROR, '小说ID无效')
      )
    }

    const recommendations = await recommendationService.recommendMixed(
      novelId,
      { limit: Math.min(limit, 50) }
    )

    return reply.send(success(recommendations))
  } catch (err: any) {
    logger.error('获取综合推荐失败', { error: err })
    return reply.code(500).send(
      error(ErrorCodes.INTERNAL_ERROR, '获取推荐失败')
    )
  }
}

/**
 * 获取推荐统计信息
 */
export async function getRecommendationStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const stats = await recommendationService.getRecommendationStats()

    if (!stats) {
      return reply.code(500).send(
        error(ErrorCodes.INTERNAL_ERROR, '获取统计失败')
      )
    }

    return reply.send(success(stats))
  } catch (err: any) {
    logger.error('获取推荐统计失败', { error: err })
    return reply.code(500).send(
      error(ErrorCodes.INTERNAL_ERROR, '获取统计失败')
    )
  }
}

