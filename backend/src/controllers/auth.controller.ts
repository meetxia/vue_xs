/**
 * 认证控制器
 * 处理认证相关的HTTP请求
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '../services/auth.service'
import type { RegisterDto, LoginDto, AuthRequest } from '../types'

export class AuthController {
  private authService: AuthService
  
  constructor() {
    this.authService = new AuthService()
  }
  
  /**
   * 用户注册
   * POST /api/auth/register
   */
  register = async (
    request: FastifyRequest<{ Body: RegisterDto }>,
    reply: FastifyReply
  ) => {
    try {
      const result = await this.authService.register(request.body)
      
      return reply.code(201).send({
        success: true,
        data: result,
        message: '注册成功'
      })
    } catch (error: any) {
      const statusCode = error.code?.startsWith('USER_') ? 409 : 400
      
      return reply.code(statusCode).send({
        success: false,
        error: {
          code: error.code || 'REGISTRATION_FAILED',
          message: error.message || '注册失败'
        }
      })
    }
  }
  
  /**
   * 用户登录
   * POST /api/auth/login
   */
  login = async (
    request: FastifyRequest<{ Body: LoginDto }>,
    reply: FastifyReply
  ) => {
    try {
      const result = await this.authService.login(request.body)
      
      return reply.send({
        success: true,
        data: result
      })
    } catch (error: any) {
      return reply.code(401).send({
        success: false,
        error: {
          code: error.code || 'LOGIN_FAILED',
          message: error.message || '登录失败'
        }
      })
    }
  }
  
  /**
   * 获取当前用户信息
   * GET /api/auth/me
   * 需要认证
   */
  getCurrentUser = async (
    request: FastifyRequest,
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
            message: '未授权'
          }
        })
      }
      
      const user = await this.authService.getCurrentUser(userId)
      
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
   * 退出登录
   * POST /api/auth/logout
   */
  logout = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    // 前端删除Token即可
    return reply.send({
      success: true,
      message: '退出成功'
    })
  }
}

