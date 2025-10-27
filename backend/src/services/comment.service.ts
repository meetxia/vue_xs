/**
 * 评论服务
 * 处理评论相关的业务逻辑
 */

import { PrismaClient } from '@prisma/client'
import type { CreateCommentDto, CommentQuery } from '../types'
import { validatePagination } from '../utils/validator'
import { ErrorCode } from '../types'

const prisma = new PrismaClient()

export class CommentService {
  /**
   * 创建评论
   * @param novelId - 小说ID
   * @param userId - 用户ID
   * @param data - 评论数据
   * @returns 创建的评论
   */
  async createComment(novelId: number, userId: number, data: CreateCommentDto) {
    const { content } = data
    
    // 验证内容
    if (!content || content.trim().length === 0) {
      const error: any = new Error('评论内容不能为空')
      error.code = ErrorCode.COMMENT_CONTENT_REQUIRED
      throw error
    }
    
    // 检查小说是否存在
    const novel = await prisma.novel.findUnique({
      where: { id: novelId }
    })
    
    if (!novel) {
      const error: any = new Error('小说不存在')
      error.code = ErrorCode.NOVEL_NOT_FOUND
      throw error
    }
    
    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        novelId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })
    
    return comment
  }
  
  /**
   * 获取小说的评论列表
   * @param novelId - 小说ID
   * @param query - 查询参数
   * @returns 评论列表和分页信息
   */
  async getCommentsByNovelId(novelId: number, query: CommentQuery) {
    const { page, pageSize, skip } = validatePagination(query.page, query.pageSize)
    const { sort, order } = query
    
    // 排序
    const orderBy: any = {}
    if (sort) {
      orderBy[sort] = order || 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }
    
    // 查询
    const [items, total] = await Promise.all([
      prisma.comment.findMany({
        where: { novelId },
        skip,
        take: pageSize,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      }),
      prisma.comment.count({ where: { novelId } })
    ])
    
    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }
  
  /**
   * 删除评论
   * @param id - 评论ID
   * @param userId - 用户ID
   */
  async deleteComment(id: number, userId: number) {
    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id }
    })
    
    if (!comment) {
      const error: any = new Error('评论不存在')
      error.code = ErrorCode.COMMENT_NOT_FOUND
      throw error
    }
    
    // 检查权限（只有评论作者可以删除）
    if (comment.userId !== userId) {
      const error: any = new Error('无权删除此评论')
      error.code = ErrorCode.COMMENT_NO_PERMISSION
      throw error
    }
    
    // 删除评论
    await prisma.comment.delete({
      where: { id }
    })
  }
  
  /**
   * 获取用户的评论列表
   * @param userId - 用户ID
   * @param page - 页码
   * @param pageSize - 每页数量
   * @returns 评论列表
   */
  async getUserComments(userId: number, page: number = 1, pageSize: number = 20) {
    const { skip } = validatePagination(page, pageSize)
    
    const [items, total] = await Promise.all([
      prisma.comment.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          novel: {
            select: {
              id: true,
              title: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      }),
      prisma.comment.count({ where: { userId } })
    ])
    
    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }
}

