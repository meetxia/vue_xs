import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 管理员角色枚举
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

/**
 * 管理员认证中间件
 * 验证用户是否为管理员
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // 检查是否已认证
    if (!request.user || !request.user.userId) {
      return reply.code(401).send({
        success: false,
        message: '未授权，请先登录'
      })
    }

    const userId = request.user.userId

    // 查询用户角色
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    })

    if (!user) {
      return reply.code(401).send({
        success: false,
        message: '用户不存在'
      })
    }

    // 检查账号是否激活
    if (!user.isActive) {
      return reply.code(403).send({
        success: false,
        message: '账号已被禁用'
      })
    }

    // 检查是否为管理员
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return reply.code(403).send({
        success: false,
        message: '权限不足，需要管理员权限'
      })
    }

    // 将角色信息添加到request
    request.user.role = user.role
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: '权限验证失败'
    })
  }
}

/**
 * 超级管理员中间件
 * 验证用户是否为超级管理员
 */
export async function superAdminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // 检查是否已认证
    if (!request.user || !request.user.userId) {
      return reply.code(401).send({
        success: false,
        message: '未授权，请先登录'
      })
    }

    const userId = request.user.userId

    // 查询用户角色
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    })

    if (!user) {
      return reply.code(401).send({
        success: false,
        message: '用户不存在'
      })
    }

    // 检查账号是否激活
    if (!user.isActive) {
      return reply.code(403).send({
        success: false,
        message: '账号已被禁用'
      })
    }

    // 检查是否为超级管理员
    if (user.role !== UserRole.SUPER_ADMIN) {
      return reply.code(403).send({
        success: false,
        message: '权限不足，需要超级管理员权限'
      })
    }

    // 将角色信息添加到request
    request.user.role = user.role
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: '权限验证失败'
    })
  }
}

// 扩展FastifyRequest类型
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: number
      email: string
      username: string
      role?: string
    }
  }
}

