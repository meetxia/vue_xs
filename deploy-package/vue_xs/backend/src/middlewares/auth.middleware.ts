/**
 * 认证中间件
 * 验证JWT Token并提取用户信息
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { extractToken, verifyToken } from '../utils/jwt'
import type { AuthRequest } from '../types'
import { ErrorCode } from '../types'

/**
 * 认证中间件
 * 验证JWT Token并将用户信息附加到request对象
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization
    const token = extractToken(authHeader)
    
    if (!token) {
      return reply.code(401).send({
        success: false,
        error: {
          code: ErrorCode.AUTH_UNAUTHORIZED,
          message: '未授权，请提供有效的Token'
        }
      })
    }
    
    // 验证Token
    const payload = verifyToken(token)
    
    // 将用户信息附加到request对象
    ;(request as AuthRequest).user = payload
    
  } catch (error: any) {
    return reply.code(401).send({
      success: false,
      error: {
        code: ErrorCode.AUTH_INVALID_TOKEN,
        message: error.message || 'Token无效或已过期'
      }
    })
  }
}

/**
 * 可选认证中间件
 * 如果有Token则验证，没有Token则继续
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization
    const token = extractToken(authHeader)
    
    if (token) {
      const payload = verifyToken(token)
      ;(request as AuthRequest).user = payload
    }
  } catch (error) {
    // 忽略错误，继续处理请求
  }
}

