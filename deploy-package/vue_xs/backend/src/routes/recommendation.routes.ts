/**
 * 推荐系统路由
 * Week 2 Day 8 新增
 */

import { FastifyInstance } from 'fastify'
import * as recommendationController from '../controllers/recommendation.controller'
import { authenticate } from '../middlewares/auth.middleware'

export default async function recommendationRoutes(fastify: FastifyInstance) {
  // 热门推荐 - 公开
  fastify.get('/recommendations/hot', recommendationController.getHotRecommendations)

  // 最新推荐 - 公开
  fastify.get('/recommendations/new', recommendationController.getNewRecommendations)

  // 基于分类推荐 - 公开
  fastify.get(
    '/recommendations/category/:novelId',
    recommendationController.getRecommendationsByCategory
  )

  // 相关推荐 - 公开
  fastify.get(
    '/recommendations/related/:novelId',
    recommendationController.getRelatedRecommendations
  )

  // 作者推荐 - 公开
  fastify.get(
    '/recommendations/author/:novelId',
    recommendationController.getAuthorRecommendations
  )

  // 综合推荐 - 公开
  fastify.get(
    '/recommendations/mixed/:novelId',
    recommendationController.getMixedRecommendations
  )

  // 个性化推荐 - 需登录
  fastify.get(
    '/recommendations/personalized',
    { onRequest: [authenticate] },
    recommendationController.getPersonalizedRecommendations
  )

  // 推荐统计信息 - 公开
  fastify.get('/recommendations/stats', recommendationController.getRecommendationStats)
}

