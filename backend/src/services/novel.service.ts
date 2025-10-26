/**
 * 小说服务
 * 处理小说相关的业务逻辑
 */

import { PrismaClient } from '@prisma/client'
import type { CreateNovelDto, UpdateNovelDto, NovelQuery } from '../types'
import { validatePagination } from '../utils/validator'
import { ErrorCode } from '../types'

const prisma = new PrismaClient()

export class NovelService {
  /**
   * 创建小说
   * @param authorId - 作者ID
   * @param data - 小说数据
   * @returns 创建的小说
   */
  async createNovel(authorId: number, data: CreateNovelDto) {
    const { title, summary, content, category, tags, coverType, coverData, status, accessLevel } = data
    
    if (!title || title.trim().length === 0) {
      const error: any = new Error('小说标题不能为空')
      error.code = ErrorCode.NOVEL_TITLE_REQUIRED
      throw error
    }
    
    if (!content || content.trim().length === 0) {
      const error: any = new Error('小说内容不能为空')
      error.code = ErrorCode.NOVEL_CONTENT_REQUIRED
      throw error
    }
    
    const novel = await prisma.novel.create({
      data: {
        title: title.trim(),
        summary: summary?.trim() || null,
        content: content.trim(),
        category: category || null,
        tags: tags ? JSON.stringify(tags) : null,
        coverType: coverType || 'text',
        coverData: coverData ? JSON.stringify(coverData) : null,
        status: status || 'draft',
        accessLevel: accessLevel || 'free',
        authorId,
        publishedAt: status === 'published' ? new Date() : null
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
    })
    
    // 解析tags和coverData
    return {
      ...novel,
      tags: novel.tags ? JSON.parse(novel.tags) : null,
      coverData: novel.coverData ? JSON.parse(novel.coverData) : null
    }
  }
  
  /**
   * 获取小说列表（分页+筛选）
   * @param query - 查询参数
   * @returns 小说列表和分页信息
   */
  async getNovelList(query: NovelQuery) {
    const { page, pageSize, skip } = validatePagination(query.page, query.pageSize)
    const { category, status, sort, order, search } = query
    
    // 构建查询条件
    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (status) {
      where.status = status
    } else {
      // 默认只显示已发布的小说
      where.status = 'published'
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } }
      ]
    }
    
    // 排序
    const orderBy: any = {}
    if (sort) {
      orderBy[sort] = order || 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }
    
    // 查询
    const [items, total] = await Promise.all([
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
    
    // 解析tags和coverData
    const novels = items.map(novel => ({
      ...novel,
      tags: novel.tags ? JSON.parse(novel.tags) : null,
      coverData: novel.coverData ? JSON.parse(novel.coverData) : null
    }))
    
    return {
      items: novels,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }
  
  /**
   * 获取小说详情
   * @param id - 小说ID
   * @param userId - 当前用户ID（可选）
   * @returns 小说详情
   */
  async getNovelById(id: number, userId?: number) {
    const novel = await prisma.novel.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        }
      }
    })
    
    if (!novel) {
      const error: any = new Error('小说不存在')
      error.code = ErrorCode.NOVEL_NOT_FOUND
      throw error
    }
    
    // 增加浏览量
    await prisma.novel.update({
      where: { id },
      data: { views: { increment: 1 } }
    })
    
    // 检查用户是否点赞和收藏
    let isLiked = false
    let isFavorited = false
    
    if (userId) {
      const [like, favorite] = await Promise.all([
        prisma.like.findUnique({
          where: {
            novelId_userId: {
              novelId: id,
              userId
            }
          }
        }),
        prisma.favorite.findUnique({
          where: {
            novelId_userId: {
              novelId: id,
              userId
            }
          }
        })
      ])
      
      isLiked = !!like
      isFavorited = !!favorite
    }
    
    return {
      ...novel,
      tags: novel.tags ? JSON.parse(novel.tags) : null,
      coverData: novel.coverData ? JSON.parse(novel.coverData) : null,
      isLiked,
      isFavorited
    }
  }
  
  /**
   * 更新小说
   * @param id - 小说ID
   * @param authorId - 作者ID
   * @param data - 更新数据
   * @returns 更新后的小说
   */
  async updateNovel(id: number, authorId: number, data: UpdateNovelDto) {
    // 检查小说是否存在
    const novel = await prisma.novel.findUnique({
      where: { id }
    })
    
    if (!novel) {
      const error: any = new Error('小说不存在')
      error.code = ErrorCode.NOVEL_NOT_FOUND
      throw error
    }
    
    // 检查权限
    if (novel.authorId !== authorId) {
      const error: any = new Error('无权编辑此小说')
      error.code = ErrorCode.NOVEL_NO_PERMISSION
      throw error
    }
    
    // 更新数据
    const updateData: any = {}
    
    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.summary !== undefined) updateData.summary = data.summary.trim()
    if (data.content !== undefined) updateData.content = data.content.trim()
    if (data.category !== undefined) updateData.category = data.category
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
    if (data.coverType !== undefined) updateData.coverType = data.coverType
    if (data.coverData !== undefined) updateData.coverData = JSON.stringify(data.coverData)
    if (data.accessLevel !== undefined) updateData.accessLevel = data.accessLevel
    
    // 状态变更处理
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === 'published' && !novel.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    
    const updated = await prisma.novel.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })
    
    return {
      ...updated,
      tags: updated.tags ? JSON.parse(updated.tags) : null,
      coverData: updated.coverData ? JSON.parse(updated.coverData) : null
    }
  }
  
  /**
   * 删除小说
   * @param id - 小说ID
   * @param authorId - 作者ID
   */
  async deleteNovel(id: number, authorId: number) {
    // 检查小说是否存在
    const novel = await prisma.novel.findUnique({
      where: { id }
    })
    
    if (!novel) {
      const error: any = new Error('小说不存在')
      error.code = ErrorCode.NOVEL_NOT_FOUND
      throw error
    }
    
    // 检查权限
    if (novel.authorId !== authorId) {
      const error: any = new Error('无权删除此小说')
      error.code = ErrorCode.NOVEL_NO_PERMISSION
      throw error
    }
    
    // 删除（级联删除评论、点赞、收藏）
    await prisma.novel.delete({
      where: { id }
    })
  }
  
  /**
   * 点赞/取消点赞
   * @param novelId - 小说ID
   * @param userId - 用户ID
   * @returns 点赞状态和点赞数
   */
  async toggleLike(novelId: number, userId: number) {
    // 检查小说是否存在
    const novel = await prisma.novel.findUnique({
      where: { id: novelId }
    })
    
    if (!novel) {
      const error: any = new Error('小说不存在')
      error.code = ErrorCode.NOVEL_NOT_FOUND
      throw error
    }
    
    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        novelId_userId: {
          novelId,
          userId
        }
      }
    })
    
    if (existingLike) {
      // 取消点赞
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id }
        }),
        prisma.novel.update({
          where: { id: novelId },
          data: { likes: { decrement: 1 } }
        })
      ])
      
      return {
        liked: false,
        likesCount: novel.likes - 1
      }
    } else {
      // 点赞
      await prisma.$transaction([
        prisma.like.create({
          data: {
            novelId,
            userId
          }
        }),
        prisma.novel.update({
          where: { id: novelId },
          data: { likes: { increment: 1 } }
        })
      ])
      
      return {
        liked: true,
        likesCount: novel.likes + 1
      }
    }
  }
  
  /**
   * 收藏/取消收藏
   * @param novelId - 小说ID
   * @param userId - 用户ID
   * @returns 收藏状态和收藏数
   */
  async toggleFavorite(novelId: number, userId: number) {
    // 检查小说是否存在
    const novel = await prisma.novel.findUnique({
      where: { id: novelId }
    })
    
    if (!novel) {
      const error: any = new Error('小说不存在')
      error.code = ErrorCode.NOVEL_NOT_FOUND
      throw error
    }
    
    // 检查是否已收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        novelId_userId: {
          novelId,
          userId
        }
      }
    })
    
    if (existingFavorite) {
      // 取消收藏
      await prisma.$transaction([
        prisma.favorite.delete({
          where: { id: existingFavorite.id }
        }),
        prisma.novel.update({
          where: { id: novelId },
          data: { favorites: { decrement: 1 } }
        })
      ])
      
      return {
        favorited: false,
        favoritesCount: novel.favorites - 1
      }
    } else {
      // 收藏
      await prisma.$transaction([
        prisma.favorite.create({
          data: {
            novelId,
            userId
          }
        }),
        prisma.novel.update({
          where: { id: novelId },
          data: { favorites: { increment: 1 } }
        })
      ])
      
      return {
        favorited: true,
        favoritesCount: novel.favorites + 1
      }
    }
  }
  
  /**
   * 获取用户的小说列表
   * @param authorId - 作者ID
   * @param page - 页码
   * @param pageSize - 每页数量
   * @returns 小说列表
   */
  async getUserNovels(authorId: number, page: number = 1, pageSize: number = 20) {
    const { skip } = validatePagination(page, pageSize)
    
    const [items, total] = await Promise.all([
      prisma.novel.findMany({
        where: { authorId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.novel.count({ where: { authorId } })
    ])
    
    const novels = items.map(novel => ({
      ...novel,
      tags: novel.tags ? JSON.parse(novel.tags) : null,
      coverData: novel.coverData ? JSON.parse(novel.coverData) : null
    }))
    
    return {
      items: novels,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }
}

