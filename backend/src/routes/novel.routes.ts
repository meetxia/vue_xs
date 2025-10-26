/**
 * 小说路由
 * 定义小说相关的API端点
 */

import { FastifyInstance } from 'fastify'
import { NovelController } from '../controllers/novel.controller'
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware'

export default async function novelRoutes(fastify: FastifyInstance) {
  const controller = new NovelController()
  
  // 获取小说列表（公开，但可选认证以获取点赞收藏状态）
  fastify.get('/', {
    schema: {
      tags: ['Novel'],
      description: '获取小说列表',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          pageSize: { type: 'number', default: 20 },
          category: { type: 'string' },
          status: { type: 'string' },
          sort: { type: 'string', enum: ['createdAt', 'views', 'likes', 'favorites'] },
          order: { type: 'string', enum: ['asc', 'desc'] },
          search: { type: 'string' }
        }
      }
    },
    preHandler: optionalAuthMiddleware
  }, controller.getNovelList)
  
  // 创建小说（需要认证）
  fastify.post('/', {
    schema: {
      tags: ['Novel'],
      description: '创建小说',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          summary: { type: 'string' },
          content: { type: 'string', minLength: 1 },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          coverType: { type: 'string', enum: ['text', 'image', 'gradient'] },
          coverData: { type: 'object' },
          status: { type: 'string', enum: ['draft', 'published'] },
          accessLevel: { type: 'string', enum: ['free', 'member', 'premium'] }
        }
      }
    },
    preHandler: authMiddleware
  }, controller.createNovel)
  
  // 获取小说详情（公开，但可选认证）
  fastify.get('/:id', {
    schema: {
      tags: ['Novel'],
      description: '获取小说详情',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      }
    },
    preHandler: optionalAuthMiddleware
  }, controller.getNovelById)
  
  // 更新小说（需要认证，仅作者）
  fastify.put('/:id', {
    schema: {
      tags: ['Novel'],
      description: '更新小说',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          content: { type: 'string' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          coverType: { type: 'string' },
          coverData: { type: 'object' },
          status: { type: 'string' },
          accessLevel: { type: 'string' }
        }
      }
    },
    preHandler: authMiddleware
  }, controller.updateNovel)
  
  // 删除小说（需要认证，仅作者）
  fastify.delete('/:id', {
    schema: {
      tags: ['Novel'],
      description: '删除小说',
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
  }, controller.deleteNovel)
  
  // 点赞/取消点赞（需要认证）
  fastify.post('/:id/like', {
    schema: {
      tags: ['Novel'],
      description: '点赞/取消点赞',
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
  }, controller.toggleLike)
  
  // 收藏/取消收藏（需要认证）
  fastify.post('/:id/favorite', {
    schema: {
      tags: ['Novel'],
      description: '收藏/取消收藏',
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
  }, controller.toggleFavorite)
}

