import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 搜索服务
 */
export class SearchService {
  /**
   * 全文搜索小说
   * @param query 搜索关键词
   * @param options 搜索选项
   */
  async searchNovels(
    query: string,
    options: {
      page?: number
      pageSize?: number
      category?: string
      sortBy?: 'relevance' | 'views' | 'likes' | 'createdAt'
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const {
      page = 1,
      pageSize = 20,
      category,
      sortBy = 'relevance',
      order = 'desc'
    } = options

    const skip = (page - 1) * pageSize

    // 构建where条件
    const where: any = {
        status: 'published', // 只搜索已发布的小说
        OR: [
          {
            title: {
            contains: query
            }
          },
          {
            summary: {
            contains: query
          }
        },
        {
          tags: {
            contains: query
          }
        }
      ]
    }

    // 添加分类筛选
      if (category) {
        where.category = category
      }

    // 构建排序
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
        case 'relevance':
      default:
        // 相关性排序：标题匹配优先，然后是浏览量
        orderBy = [
          { views: 'desc' }
        ]
          break
      }

    // 并行查询总数和结果
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

    // 处理tags（从JSON字符串转为数组）
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
  }

  /**
   * 搜索建议（自动补全）
   * @param query 部分关键词
   * @param limit 返回数量
   */
  async getSearchSuggestions(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return []
    }

    // 搜索标题匹配的小说
      const novels = await prisma.novel.findMany({
        where: {
          status: 'published',
          title: {
          contains: query
          }
        },
      take: limit,
        orderBy: {
          views: 'desc'
        },
      select: {
        id: true,
        title: true,
        category: true,
        views: true
      }
    })

    // 返回建议列表
    return novels.map(novel => ({
      id: novel.id,
      title: novel.title,
      category: novel.category,
      type: 'novel'
    }))
  }

  /**
   * 获取热门搜索词
   * @param limit 返回数量
   */
  async getHotSearches(limit: number = 10) {
    // 获取浏览量最高的小说标题作为热门搜索
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
  }

  /**
   * 按分类搜索
   * @param category 分类名称
   * @param options 搜索选项
   */
  async searchByCategory(
    category: string,
    options: {
      page?: number
      pageSize?: number
      sortBy?: 'views' | 'likes' | 'createdAt'
      order?: 'asc' | 'desc'
    } = {}
  ) {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'views',
      order = 'desc'
    } = options

    const skip = (page - 1) * pageSize

    const where = {
      status: 'published',
      category
    }

    const orderBy = { [sortBy]: order }

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

    return {
      novels,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * 按标签搜索
   * @param tag 标签
   * @param options 搜索选项
   */
  async searchByTag(
    tag: string,
    options: {
    page?: number
    pageSize?: number
    } = {}
  ) {
    const {
      page = 1,
      pageSize = 20
    } = options

    const skip = (page - 1) * pageSize

    // 标签存储为JSON数组，使用LIKE查询
    const where = {
      status: 'published',
      tags: {
        contains: tag
      }
      }

      const [novels, total] = await Promise.all([
        prisma.novel.findMany({
          where,
        skip,
        take: pageSize,
        orderBy: {
          views: 'desc'
        },
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

    // 处理tags
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
  }

  /**
   * 搜索作者
   * @param query 搜索关键词
   * @param limit 返回数量
   */
  async searchAuthors(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return []
    }

    const authors = await prisma.user.findMany({
      where: {
        username: {
          contains: query
        }
      },
      take: limit,
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        _count: {
          select: {
            novels: true
          }
        }
      }
    })

    return authors.map(author => ({
      id: author.id,
      username: author.username,
      avatar: author.avatar,
      bio: author.bio,
      novelCount: author._count.novels,
      type: 'author'
    }))
  }

  /**
   * 综合搜索（小说+作者）
   * @param query 搜索关键词
   * @param limit 返回数量
   */
  async searchAll(query: string, limit: number = 20) {
    if (!query || query.length < 2) {
      return {
        novels: [],
        authors: [],
        total: 0
      }
    }

    // 并行搜索小说和作者
    const [novels, authors] = await Promise.all([
      this.searchNovels(query, { pageSize: limit }),
      this.searchAuthors(query, Math.floor(limit / 2))
    ])

    return {
      novels: novels.novels,
      authors,
      total: novels.total + authors.length
    }
  }

  /**
   * 获取所有分类
   */
  async getAllCategories() {
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
  }

  /**
   * 获取热门标签
   * @param limit 返回数量
   */
  async getHotTags(limit: number = 20) {
    // 获取所有已发布小说的标签
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

    // 统计标签频率
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

    // 转换为数组并排序
    const sortedTags = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return sortedTags
  }
}
