/**
 * 用户路由
 * 定义用户相关的API端点
 */

import { FastifyInstance } from 'fastify'
import { UserController } from '../controllers/user.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

export default async function userRoutes(fastify: FastifyInstance) {
  const controller = new UserController()
  
  // 获取用户详细信息（公开）
  fastify.get('/:id', {
    schema: {
      tags: ['User'],
      description: '获取用户详细信息',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, controller.getUserById)
  
  // 更新用户信息（需要认证）
  fastify.put('/me', {
    schema: {
      tags: ['User'],
      description: '更新用户信息',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 20 },
          bio: { type: 'string', maxLength: 500 },
          avatar: { type: 'string' }
        }
      }
    },
    preHandler: authMiddleware
  }, controller.updateUserInfo)
  
  // 修改密码（需要认证）
  fastify.put('/me/password', {
    schema: {
      tags: ['User'],
      description: '修改密码',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['oldPassword', 'newPassword', 'confirmPassword'],
        properties: {
          oldPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
          confirmPassword: { type: 'string', minLength: 8 }
        }
      }
    },
    preHandler: authMiddleware
  }, controller.changePassword)
  
  // 获取用户的收藏列表（需要认证）
  fastify.get('/me/favorites', {
    schema: {
      tags: ['User'],
      description: '获取用户的收藏列表',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          pageSize: { type: 'number', default: 20 }
        }
      }
    },
    preHandler: authMiddleware
  }, controller.getUserFavorites)
}

