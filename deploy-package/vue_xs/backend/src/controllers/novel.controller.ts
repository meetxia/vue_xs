/**
 * 小说控制器
 * 处理小说相关的HTTP请求
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { NovelService } from '../services/novel.service'
import type { CreateNovelDto, UpdateNovelDto, NovelQuery, AuthRequest } from '../types'

export class NovelController {
  private novelService: NovelService
  
  constructor() {
    this.novelService = new NovelService()
  }
  
  /**
   * 创建小说
   * POST /api/novels
   * 需要认证
   */
  createNovel = async (
    request: FastifyRequest<{ Body: CreateNovelDto }>,
    reply: FastifyReply
  ) => {
    try {
      const authReq = request as AuthRequest
      const userId = authReq.user?.userId
      
      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录'
          }
        })
      }
      
      const novel = await this.novelService.createNovel(userId, request.body)
      
      return reply.code(201).send({
        success: true,
        data: novel,
        message: '创建成功'
      })
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: error.code || 'CREATE_FAILED',
          message: error.message || '创建失败'
        }
      })
    }
  }
  
  /**
   * 获取小说列表
   * GET /api/novels
   */
  getNovelList = async (
    request: FastifyRequest<{ Querystring: NovelQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const result = await this.novelService.getNovelList(request.query)
      
      return reply.send({
        success: true,
        data: result
      })
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'QUERY_FAILED',
          message: error.message || '查询失败'
        }
      })
    }
  }
  
  /**
   * 获取小说详情
   * GET /api/novels/:id
   */
  getNovelById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const id = parseInt(request.params.id)
      const authReq = request as AuthRequest
      const userId = authReq.user?.userId
      
      const novel = await this.novelService.getNovelById(id, userId)
      
      return reply.send({
        success: true,
        data: novel
      })
    } catch (error: any) {
      const statusCode = error.code === 'NOVEL_001' ? 404 : 500
      
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: error.code || 'QUERY_FAILED',
          message: error.message || '查询失败'
        }
      })
    }
  }
  
  /**
   * 更新小说
   * PUT /api/novels/:id
   * 需要认证
   */
  updateNovel = async (
    request: FastifyRequest<{ 
      Params: { id: string }
      Body: UpdateNovelDto 
    }>,
    reply: FastifyReply
  ) => {
    try {
      const authReq = request as AuthRequest
      const userId = authReq.user?.userId
      
      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录'
          }
        })
      }
      
      const id = parseInt(request.params.id)
      const novel = await this.novelService.updateNovel(id, userId, request.body)
      
      return reply.send({
        success: true,
        data: novel,
        message: '更新成功'
      })
    } catch (error: any) {
      const statusCode = error.code === 'NOVEL_001' ? 404 : 
                         error.code === 'NOVEL_002' ? 403 : 400
      
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: error.code || 'UPDATE_FAILED',
          message: error.message || '更新失败'
        }
      })
    }
  }
  
  /**
   * 删除小说
   * DELETE /api/novels/:id
   * 需要认证
   */
  deleteNovel = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const authReq = request as AuthRequest
      const userId = authReq.user?.userId
      
      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录'
          }
        })
      }
      
      const id = parseInt(request.params.id)
      await this.novelService.deleteNovel(id, userId)
      
      return reply.send({
        success: true,
        message: '删除成功'
      })
    } catch (error: any) {
      const statusCode = error.code === 'NOVEL_001' ? 404 : 
                         error.code === 'NOVEL_002' ? 403 : 400
      
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: error.code || 'DELETE_FAILED',
          message: error.message || '删除失败'
        }
      })
    }
  }
  
  /**
   * 点赞/取消点赞
   * POST /api/novels/:id/like
   * 需要认证
   */
  toggleLike = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const authReq = request as AuthRequest
      const userId = authReq.user?.userId
      
      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录'
          }
        })
      }
      
      const novelId = parseInt(request.params.id)
      const result = await this.novelService.toggleLike(novelId, userId)
      
      return reply.send({
        success: true,
        data: result,
        message: result.liked ? '点赞成功' : '取消点赞'
      })
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: error.code || 'LIKE_FAILED',
          message: error.message || '操作失败'
        }
      })
    }
  }
  
  /**
   * 收藏/取消收藏
   * POST /api/novels/:id/favorite
   * 需要认证
   */
  toggleFavorite = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const authReq = request as AuthRequest
      const userId = authReq.user?.userId
      
      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录'
          }
        })
      }
      
      const novelId = parseInt(request.params.id)
      const result = await this.novelService.toggleFavorite(novelId, userId)
      
      return reply.send({
        success: true,
        data: result,
        message: result.favorited ? '收藏成功' : '取消收藏'
      })
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: {
          code: error.code || 'FAVORITE_FAILED',
          message: error.message || '操作失败'
        }
      })
    }
  }
  
  /**
   * 获取用户的小说列表
   * GET /api/users/:userId/novels
   */
  getUserNovels = async (
    request: FastifyRequest<{ 
      Params: { userId: string }
      Querystring: { page?: number; pageSize?: number }
    }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = parseInt(request.params.userId)
      const { page, pageSize } = request.query
      
      const result = await this.novelService.getUserNovels(userId, page, pageSize)
      
      return reply.send({
        success: true,
        data: result
      })
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'QUERY_FAILED',
          message: error.message || '查询失败'
        }
      })
    }
  }
}

