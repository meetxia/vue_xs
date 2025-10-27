/**
 * 评论控制器
 * 处理评论相关的HTTP请求
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { CommentService } from '../services/comment.service'
import type { CreateCommentDto, CommentQuery, AuthRequest } from '../types'

export class CommentController {
  private commentService: CommentService
  
  constructor() {
    this.commentService = new CommentService()
  }
  
  /**
   * 创建评论
   * POST /api/novels/:novelId/comments
   * 需要认证
   */
  createComment = async (
    request: FastifyRequest<{ 
      Params: { novelId: string }
      Body: CreateCommentDto 
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
      
      const novelId = parseInt(request.params.novelId)
      const comment = await this.commentService.createComment(novelId, userId, request.body)
      
      return reply.code(201).send({
        success: true,
        data: comment,
        message: '评论成功'
      })
    } catch (error: any) {
      const statusCode = error.code === 'NOVEL_001' ? 404 : 400
      
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: error.code || 'COMMENT_FAILED',
          message: error.message || '评论失败'
        }
      })
    }
  }
  
  /**
   * 获取小说的评论列表
   * GET /api/novels/:novelId/comments
   */
  getComments = async (
    request: FastifyRequest<{ 
      Params: { novelId: string }
      Querystring: CommentQuery
    }>,
    reply: FastifyReply
  ) => {
    try {
      const novelId = parseInt(request.params.novelId)
      const result = await this.commentService.getCommentsByNovelId(novelId, request.query)
      
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
   * 删除评论
   * DELETE /api/comments/:id
   * 需要认证
   */
  deleteComment = async (
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
      await this.commentService.deleteComment(id, userId)
      
      return reply.send({
        success: true,
        message: '删除成功'
      })
    } catch (error: any) {
      const statusCode = error.code === 'COMMENT_001' ? 404 : 
                         error.code === 'COMMENT_002' ? 403 : 400
      
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: error.code || 'DELETE_FAILED',
          message: error.message || '删除失败'
        }
      })
    }
  }
}

