import { PrismaClient } from '@prisma/client'
import { cacheService, CacheKeys } from './cache.service'

const prisma = new PrismaClient()

/**
 * 增强版搜索服务（带缓存）
 */
export class SearchServiceEnhanced {
  /**
   * 获取热门搜索（带缓存）
   * @param limit 返回数量
   */
  async getHotSearches(limit: number = 10) {
    return cacheService.getOrSet(
      CacheKeys.hotSearches(),
      async () => {
        const hotNovels = await prisma.novel.findMany({
          where: {
            status: 'published'
          },
          take: limit,
          orderBy: [
            { views: 'desc' },
            { likes: 'desc' }
          ],
          select: {
            id: true,
            title: true,
            category: true,
            views: true
          }
        })

        return hotNovels.map((novel, index) => ({
          rank: index + 1,
          keyword: novel.title,
          category: novel.category,
          heat: novel.views
        }))
      },
      600 // 缓存10分钟
    )
  }

  /**
   * 获取所有分类（带缓存）
   */
  async getAllCategories() {
    return cacheService.getOrSet(
      CacheKeys.categories(),
      async () => {
        const result = await prisma.novel.groupBy({
          by: ['category'],
          where: {
            status: 'published',
            category: {
              not: null
            }
          },
          _count: {
            category: true
          },
          orderBy: {
            _count: {
              category: 'desc'
            }
          }
        })

        return result.map(item => ({
          name: item.category,
          count: item._count.category
        }))
      },
      1800 // 缓存30分钟
    )
  }

  /**
   * 获取热门标签（带缓存）
   * @param limit 返回数量
   */
  async getHotTags(limit: number = 20) {
    return cacheService.getOrSet(
      CacheKeys.hotTags(limit),
      async () => {
        const novels = await prisma.novel.findMany({
          where: {
            status: 'published',
            tags: {
              not: null
            }
          },
          select: {
            tags: true
          }
        })

        const tagCount: { [key: string]: number } = {}

        novels.forEach(novel => {
          if (novel.tags) {
            try {
              const tags = JSON.parse(novel.tags)
              tags.forEach((tag: string) => {
                tagCount[tag] = (tagCount[tag] || 0) + 1
              })
            } catch (e) {
              // 忽略JSON解析错误
            }
          }
        })

        const sortedTags = Object.entries(tagCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)

        return sortedTags
      },
      900 // 缓存15分钟
    )
  }

  /**
   * 搜索小说（带缓存）
   */
  async searchNovels(
    query: string,
    options: {
      page?: number
      pageSize?: number
      category?: string
      sortBy?: string
      order?: string
    } = {}
  ) {
    const cacheKey = CacheKeys.searchResult(query, options)

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const {
          page = 1,
          pageSize = 20,
          category,
          sortBy = 'relevance',
          order = 'desc'
        } = options

        const skip = (page - 1) * pageSize

        const where: any = {
          status: 'published',
          OR: [
            { title: { contains: query } },
            { summary: { contains: query } },
            { tags: { contains: query } }
          ]
        }

        if (category) {
          where.category = category
        }

        let orderBy: any = {}
        switch (sortBy) {
          case 'views':
            orderBy = { views: order }
            break
          case 'likes':
            orderBy = { likes: order }
            break
          case 'createdAt':
            orderBy = { createdAt: order }
            break
          default:
            orderBy = { views: 'desc' }
        }

        const [novels, total] = await Promise.all([
          prisma.novel.findMany({
            where,
            skip,
            take: pageSize,
            orderBy,
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true
                }
              }
            }
          }),
          prisma.novel.count({ where })
        ])

        const processedNovels = novels.map(novel => ({
          ...novel,
          tags: novel.tags ? JSON.parse(novel.tags) : []
        }))

        return {
          novels: processedNovels,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      },
      120 // 搜索结果缓存2分钟
    )
  }

  /**
   * 清除相关缓存
   * @param pattern 缓存键模式
   */
  clearPattern(pattern: string): number {
    let cleared = 0
    const keys = Array.from(cacheService['cache'].keys())

    keys.forEach(key => {
      if (key.includes(pattern)) {
        cacheService.delete(key)
        cleared++
      }
    })

    return cleared
  }

  /**
   * 预热缓存
   * 提前加载热门数据到缓存
   */
  async warmup(): Promise<void> {
    console.log('🔥 开始预热缓存...')

    try {
      // 预热热门搜索
      await this.getHotSearches(10)
      console.log('  ✅ 热门搜索已缓存')

      // 预热分类列表
      await this.getAllCategories()
      console.log('  ✅ 分类列表已缓存')

      // 预热热门标签
      await this.getHotTags(20)
      console.log('  ✅ 热门标签已缓存')

      console.log('🎉 缓存预热完成！')
    } catch (error) {
      console.error('❌ 缓存预热失败:', error)
    }
  }
}

// 导出增强服务单例
export const searchServiceEnhanced = new SearchServiceEnhanced()

