import { PrismaClient } from '@prisma/client'
import { UserRole } from '../middlewares/admin.middleware'

const prisma = new PrismaClient()

/**
 * 管理后台服务
 */
export class AdminService {
  /**
   * 获取所有用户（分页）
   */
  async getAllUsers(options: {
    page?: number
    pageSize?: number
    role?: string
    isActive?: boolean
    search?: string
  } = {}) {
    const {
      page = 1,
      pageSize = 20,
      role,
      isActive,
      search
    } = options

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where: any = {}

    if (role) {
      where.role = role
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } }
      ]
    }

    // 并行查询
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          bio: true,
          role: true,
          isActive: true,
          membershipType: true,
          membershipExpiresAt: true,
          createdAt: true,
          _count: {
            select: {
              novels: true,
              comments: true,
              likes: true,
              favorites: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ])

    return {
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId: number, isActive: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    // 不能禁用超级管理员
    if (user.role === UserRole.SUPER_ADMIN && !isActive) {
      throw new Error('不能禁用超级管理员')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true
      }
    })

    return updatedUser
  }

  /**
   * 更新用户角色
   */
  async updateUserRole(userId: number, role: string, operatorRole: string) {
    // 验证角色有效性
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new Error('无效的角色')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    // 只有超级管理员可以设置管理员角色
    if ((role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) && 
        operatorRole !== UserRole.SUPER_ADMIN) {
      throw new Error('权限不足，只有超级管理员可以设置管理员')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    })

    return updatedUser
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: number, operatorRole: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    // 不能删除超级管理员
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new Error('不能删除超级管理员')
    }

    // 只有超级管理员可以删除管理员
    if (user.role === UserRole.ADMIN && operatorRole !== UserRole.SUPER_ADMIN) {
      throw new Error('权限不足，只有超级管理员可以删除管理员')
    }

    // 级联删除用户的所有数据
    await prisma.user.delete({
      where: { id: userId }
    })

    return {
      id: userId,
      username: user.username,
      deleted: true
    }
  }

  /**
   * 获取所有小说（管理后台）
   */
  async getAllNovels(options: {
    page?: number
    pageSize?: number
    status?: string
    category?: string
    search?: string
  } = {}) {
    const {
      page = 1,
      pageSize = 20,
      status,
      category,
      search
    } = options

    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } }
      ]
    }

    const [novels, total] = await Promise.all([
      prisma.novel.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              comments: true,
              likeList: true,
              favoriteList: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
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
   * 更新小说状态
   */
  async updateNovelStatus(novelId: number, status: string) {
    const validStatuses = ['draft', 'published', 'rejected', 'deleted']
    
    if (!validStatuses.includes(status)) {
      throw new Error('无效的状态')
    }

    const novel = await prisma.novel.findUnique({
      where: { id: novelId }
    })

    if (!novel) {
      throw new Error('小说不存在')
    }

    const updatedNovel = await prisma.novel.update({
      where: { id: novelId },
      data: {
        status,
        publishedAt: status === 'published' && !novel.publishedAt ? new Date() : novel.publishedAt
      },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true
      }
    })

    return updatedNovel
  }

  /**
   * 删除小说（管理员）
   */
  async deleteNovel(novelId: number) {
    const novel = await prisma.novel.findUnique({
      where: { id: novelId }
    })

    if (!novel) {
      throw new Error('小说不存在')
    }

    // 级联删除相关数据
    await prisma.novel.delete({
      where: { id: novelId }
    })

    return {
      id: novelId,
      title: novel.title,
      deleted: true
    }
  }

  /**
   * 获取所有评论（管理后台）
   */
  async getAllComments(options: {
    page?: number
    pageSize?: number
    novelId?: number
    userId?: number
  } = {}) {
    const {
      page = 1,
      pageSize = 20,
      novelId,
      userId
    } = options

    const skip = (page - 1) * pageSize

    const where: any = {}

    if (novelId) {
      where.novelId = novelId
    }

    if (userId) {
      where.userId = userId
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          novel: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.comment.count({ where })
    ])

    return {
      comments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * 删除评论（管理员）
   */
  async deleteComment(commentId: number) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: { username: true }
        },
        novel: {
          select: { title: true }
        }
      }
    })

    if (!comment) {
      throw new Error('评论不存在')
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    return {
      id: commentId,
      deleted: true,
      info: {
        user: comment.user.username,
        novel: comment.novel.title
      }
    }
  }

  /**
   * 获取系统统计数据
   */
  async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      totalNovels,
      publishedNovels,
      totalComments,
      totalViews
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.novel.count(),
      prisma.novel.count({ where: { status: 'published' } }),
      prisma.comment.count(),
      prisma.novel.aggregate({
        _sum: { views: true }
      })
    ])

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      novels: {
        total: totalNovels,
        published: publishedNovels,
        draft: totalNovels - publishedNovels
      },
      comments: {
        total: totalComments
      },
      views: {
        total: totalViews._sum.views || 0
      }
    }
  }

  /**
   * 获取用户增长数据（最近7天）
   */
  async getUserGrowth(days: number = 7) {
    const result = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })

      result.push({
        date: date.toISOString().split('T')[0],
        count
      })
    }

    return result
  }

  /**
   * 获取小说增长数据（最近7天）
   */
  async getNovelGrowth(days: number = 7) {
    const result = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = await prisma.novel.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          },
          status: 'published'
        }
      })

      result.push({
        date: date.toISOString().split('T')[0],
        count
      })
    }

    return result
  }
}

