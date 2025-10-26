/**
 * 认证路由
 * 定义认证相关的API端点
 */

import { FastifyInstance } from 'fastify'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

export default async function authRoutes(fastify: FastifyInstance) {
  const controller = new AuthController()
  
  // 用户注册
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      description: '用户注册',
      body: {
        type: 'object',
        required: ['username', 'email', 'password', 'confirmPassword'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 20 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          confirmPassword: { type: 'string', minLength: 8 }
        }
      }
    }
  }, controller.register)
  
  // 用户登录
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      description: '用户登录',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, controller.login)
  
  // 获取当前用户信息（需要认证）
  fastify.get('/me', {
    schema: {
      tags: ['Auth'],
      description: '获取当前用户信息',
      security: [{ bearerAuth: [] }]
    },
    preHandler: authMiddleware
  }, controller.getCurrentUser)
  
  // 退出登录
  fastify.post('/logout', {
    schema: {
      tags: ['Auth'],
      description: '退出登录',
      security: [{ bearerAuth: [] }]
    },
    preHandler: authMiddleware
  }, controller.logout)
}

