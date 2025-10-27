/**
 * 评论路由
 * 定义评论相关的API端点
 */

import { FastifyInstance } from 'fastify'
import { CommentController } from '../controllers/comment.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

export default async function commentRoutes(fastify: FastifyInstance) {
  const controller = new CommentController()
  
  // 获取小说的评论列表
  fastify.get('/novels/:novelId/comments', {
    schema: {
      tags: ['Comment'],
      description: '获取小说的评论列表',
      params: {
        type: 'object',
        required: ['novelId'],
        properties: {
          novelId: { type: 'number' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          pageSize: { type: 'number', default: 20 },
          sort: { type: 'string', enum: ['createdAt'] },
          order: { type: 'string', enum: ['asc', 'desc'] }
        }
      }
    }
  }, controller.getComments)
  
  // 发表评论（需要认证）
  fastify.post('/novels/:novelId/comments', {
    schema: {
      tags: ['Comment'],
      description: '发表评论',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['novelId'],
        properties: {
          novelId: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 1000 }
        }
      }
    },
    preHandler: authMiddleware
  }, controller.createComment)
  
  // 删除评论（需要认证，仅本人）
  fastify.delete('/comments/:id', {
    schema: {
      tags: ['Comment'],
      description: '删除评论',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      }
    },
    preHandler: authMiddleware
  }, controller.deleteComment)
}

