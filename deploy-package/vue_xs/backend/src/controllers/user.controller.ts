/**
 * 用户控制器
 * 处理用户信息相关的HTTP请求
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../services/user.service'
import type { UpdateUserDto, ChangePasswordDto, AuthRequest } from '../types'

export class UserController {
  private userService: UserService
  
  constructor() {
    this.userService = new UserService()
  }
  
  /**
   * 更新用户信息
   * PUT /api/users/me
   * 需要认证
   */
  updateUserInfo = async (
    request: FastifyRequest<{ Body: UpdateUserDto }>,
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
      
      const user = await this.userService.updateUserInfo(userId, request.body)
      
      return reply.send({
        success: true,
        data: user,
        message: '更新成功'
      })
    } catch (error: any) {
      const statusCode = error.code === 'USER_001' ? 409 : 400
      
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
   * 修改密码
   * PUT /api/users/me/password
   * 需要认证
   */
  changePassword = async (
    request: FastifyRequest<{ Body: ChangePasswordDto }>,
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
      
      await this.userService.changePassword(userId, request.body)
      
      return reply.send({
        success: true,
        message: '密码修改成功，请重新登录'
      })
    } catch (error: any) {
      const statusCode = error.code === 'USER_004' ? 401 : 400
      
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: error.code || 'CHANGE_PASSWORD_FAILED',
          message: error.message || '修改密码失败'
        }
      })
    }
  }
  
  /**
   * 获取用户详细信息
   * GET /api/users/:id
   */
  getUserById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = parseInt(request.params.id)
      const user = await this.userService.getUserById(userId)
      
      return reply.send({
        success: true,
        data: user
      })
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: {
          code: error.code || 'USER_NOT_FOUND',
          message: error.message || '用户不存在'
        }
      })
    }
  }
  
  /**
   * 获取用户的收藏列表
   * GET /api/users/me/favorites
   * 需要认证
   */
  getUserFavorites = async (
    request: FastifyRequest<{ 
      Querystring: { page?: number; pageSize?: number }
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
      
      const { page, pageSize } = request.query
      const result = await this.userService.getUserFavorites(userId, page, pageSize)
      
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

