/**
 * 推荐系统服务
 * Week 2 Day 8 新增
 * 负责基于分类、热门、相关推荐等功能
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import { PAGINATION, CACHE_TTL } from '../utils/constants'

const prisma = new PrismaClient()

export interface RecommendOptions {
  limit?: number
  excludeIds?: number[]
}

export class RecommendationService {
  /**
   * 基于分类推荐
   * 推荐同分类的热门小说
   */
  async recommendByCategory(
    novelId: number,
    options: RecommendOptions = {}
  ): Promise<any[]> {
    const { limit = 10, excludeIds = [] } = options

    try {
      // 获取当前小说的分类
      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { category: true }
      })

      if (!novel || !novel.category) {
        logger.warn('小说不存在或无分类', { novelId })
        return []
      }

      // 排除ID列表（包含当前小说）
      const excludeList = [...excludeIds, novelId]

      // 查询同分类的热门小说
      const recommendations = await prisma.novel.findMany({
        where: {
          category: novel.category,
          status: 'published',
          id: {
            notIn: excludeList
          }
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: [
          { views: 'desc' },
          { likes: 'desc' }
        ],
        take: limit
      })

      logger.debug('基于分类推荐完成', { 
        novelId, 
        category: novel.category,
        count: recommendations.length 
      })

      return recommendations
    } catch (error) {
      logger.error('分类推荐失败', { novelId, error })
      return []
    }
  }

  /**
   * 热门推荐
   * 推荐全站最热门的小说
   */
  async recommendHot(options: RecommendOptions = {}): Promise<any[]> {
    const { limit = 20, excludeIds = [] } = options

    try {
      const recommendations = await prisma.novel.findMany({
        where: {
          status: 'published',
          id: excludeIds.length > 0 ? {
            notIn: excludeIds
          } : undefined
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: [
          { views: 'desc' },
          { favorites: 'desc' },
          { likes: 'desc' }
        ],
        take: limit
      })

      logger.debug('热门推荐完成', { count: recommendations.length })

      return recommendations
    } catch (error) {
      logger.error('热门推荐失败', { error })
      return []
    }
  }

  /**
   * 最新推荐
   * 推荐最新发布的小说
   */
  async recommendNew(options: RecommendOptions = {}): Promise<any[]> {
    const { limit = 20, excludeIds = [] } = options

    try {
      const recommendations = await prisma.novel.findMany({
        where: {
          status: 'published',
          id: excludeIds.length > 0 ? {
            notIn: excludeIds
          } : undefined
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        take: limit
      })

      logger.debug('最新推荐完成', { count: recommendations.length })

      return recommendations
    } catch (error) {
      logger.error('最新推荐失败', { error })
      return []
    }
  }

  /**
   * 相关推荐（基于标签）
   * 推荐有相同标签的小说
   */
  async recommendRelated(
    novelId: number,
    options: RecommendOptions = {}
  ): Promise<any[]> {
    const { limit = 10, excludeIds = [] } = options

    try {
      // 获取当前小说的标签
      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { tags: true, category: true }
      })

      if (!novel) {
        logger.warn('小说不存在', { novelId })
        return []
      }

      // 解析标签
      let tags: string[] = []
      if (novel.tags) {
        try {
          tags = JSON.parse(novel.tags)
        } catch {
          tags = []
        }
      }

      // 排除ID列表
      const excludeList = [...excludeIds, novelId]

      // 如果有标签，基于标签推荐
      if (tags.length > 0) {
        const tagConditions = tags.map(tag => ({
          tags: {
            contains: tag
          }
        }))

        const recommendations = await prisma.novel.findMany({
          where: {
            status: 'published',
            id: {
              notIn: excludeList
            },
            OR: tagConditions
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: [
            { views: 'desc' },
            { likes: 'desc' }
          ],
          take: limit
        })

        if (recommendations.length > 0) {
          logger.debug('基于标签推荐完成', { 
            novelId, 
            tags,
            count: recommendations.length 
          })
          return recommendations
        }
      }

      // 如果没有标签或基于标签没找到，回退到分类推荐
      return this.recommendByCategory(novelId, options)
    } catch (error) {
      logger.error('相关推荐失败', { novelId, error })
      return []
    }
  }

  /**
   * 基于作者推荐
   * 推荐同一作者的其他作品
   */
  async recommendByAuthor(
    novelId: number,
    options: RecommendOptions = {}
  ): Promise<any[]> {
    const { limit = 10, excludeIds = [] } = options

    try {
      // 获取当前小说的作者
      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { authorId: true }
      })

      if (!novel) {
        logger.warn('小说不存在', { novelId })
        return []
      }

      // 排除ID列表
      const excludeList = [...excludeIds, novelId]

      // 查询同一作者的其他作品
      const recommendations = await prisma.novel.findMany({
        where: {
          authorId: novel.authorId,
          status: 'published',
          id: {
            notIn: excludeList
          }
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: [
          { views: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      })

      logger.debug('作者推荐完成', { 
        novelId, 
        authorId: novel.authorId,
        count: recommendations.length 
      })

      return recommendations
    } catch (error) {
      logger.error('作者推荐失败', { novelId, error })
      return []
    }
  }

  /**
   * 个性化推荐（基于用户行为）
   * 根据用户的收藏和浏览历史推荐
   */
  async recommendForUser(
    userId: number,
    options: RecommendOptions = {}
  ): Promise<any[]> {
    const { limit = 20 } = options

    try {
      // 获取用户收藏的小说
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        select: { 
          novel: {
            select: {
              category: true,
              tags: true
            }
          }
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (favorites.length === 0) {
        // 如果用户没有收藏，返回热门推荐
        return this.recommendHot({ limit })
      }

      // 统计用户喜欢的分类
      const categoryCount: Record<string, number> = {}
      const allTags: string[] = []

      favorites.forEach(fav => {
        if (fav.novel.category) {
          categoryCount[fav.novel.category] = 
            (categoryCount[fav.novel.category] || 0) + 1
        }
        
        if (fav.novel.tags) {
          try {
            const tags = JSON.parse(fav.novel.tags)
            allTags.push(...tags)
          } catch {}
        }
      })

      // 找出最喜欢的分类
      const favoriteCategory = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0]

      // 获取用户已收藏的小说ID
      const favoriteNovelIds = await prisma.favorite.findMany({
        where: { userId },
        select: { novelId: true }
      })
      const excludeIds = favoriteNovelIds.map(f => f.novelId)

      // 基于喜欢的分类推荐
      const recommendations = await prisma.novel.findMany({
        where: {
          status: 'published',
          category: favoriteCategory,
          id: {
            notIn: excludeIds
          }
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: [
          { views: 'desc' },
          { likes: 'desc' }
        ],
        take: limit
      })

      logger.debug('个性化推荐完成', { 
        userId,
        favoriteCategory,
        count: recommendations.length 
      })

      return recommendations
    } catch (error) {
      logger.error('个性化推荐失败', { userId, error })
      // 失败时返回热门推荐
      return this.recommendHot({ limit })
    }
  }

  /**
   * 综合推荐
   * 混合多种推荐策略
   */
  async recommendMixed(
    novelId: number,
    options: RecommendOptions = {}
  ): Promise<any[]> {
    const { limit = 20 } = options

    try {
      // 并行获取多种推荐结果
      const [categoryRecs, relatedRecs, authorRecs] = await Promise.all([
        this.recommendByCategory(novelId, { limit: 5 }),
        this.recommendRelated(novelId, { limit: 5 }),
        this.recommendByAuthor(novelId, { limit: 5 })
      ])

      // 合并结果并去重
      const allRecs = [...categoryRecs, ...relatedRecs, ...authorRecs]
      const uniqueRecs = allRecs.filter((rec, index, self) =>
        index === self.findIndex(r => r.id === rec.id)
      )

      // 如果推荐不足，补充热门推荐
      if (uniqueRecs.length < limit) {
        const excludeIds = uniqueRecs.map(r => r.id)
        const hotRecs = await this.recommendHot({ 
          limit: limit - uniqueRecs.length,
          excludeIds: [...excludeIds, novelId]
        })
        uniqueRecs.push(...hotRecs)
      }

      return uniqueRecs.slice(0, limit)
    } catch (error) {
      logger.error('综合推荐失败', { novelId, error })
      return []
    }
  }

  /**
   * 获取推荐统计信息
   */
  async getRecommendationStats(): Promise<any> {
    try {
      const [totalNovels, publishedNovels, categories] = await Promise.all([
        prisma.novel.count(),
        prisma.novel.count({ where: { status: 'published' } }),
        prisma.novel.groupBy({
          by: ['category'],
          where: { status: 'published' },
          _count: true
        })
      ])

      return {
        totalNovels,
        publishedNovels,
        categories: categories.map(c => ({
          category: c.category,
          count: c._count
        }))
      }
    } catch (error) {
      logger.error('获取推荐统计失败', { error })
      return null
    }
  }
}

export const recommendationService = new RecommendationService()

