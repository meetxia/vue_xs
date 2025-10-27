/**
 * 用户服务
 * 处理用户信息相关的业务逻辑
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password'
import type { UpdateUserDto, ChangePasswordDto } from '../types'
import { ErrorCode } from '../types'

const prisma = new PrismaClient()

export class UserService {
  /**
   * 更新用户信息
   * @param userId - 用户ID
   * @param data - 更新数据
   * @returns 更新后的用户信息
   */
  async updateUserInfo(userId: number, data: UpdateUserDto) {
    const updateData: any = {}
    
    // 验证并更新用户名
    if (data.username !== undefined) {
      const username = data.username.trim()
      
      // 检查用户名是否被占用
      const existing = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId }
        }
      })
      
      if (existing) {
        const error: any = new Error('用户名已被占用')
        error.code = ErrorCode.USER_USERNAME_EXISTS
        throw error
      }
      
      updateData.username = username
    }
    
    // 更新简介
    if (data.bio !== undefined) {
      updateData.bio = data.bio.trim()
    }
    
    // 更新头像
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar
    }
    
    // 更新用户
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        membershipType: true,
        membershipExpiresAt: true,
        updatedAt: true
      }
    })
    
    return user
  }
  
  /**
   * 修改密码
   * @param userId - 用户ID
   * @param data - 密码数据
   */
  async changePassword(userId: number, data: ChangePasswordDto) {
    const { oldPassword, newPassword, confirmPassword } = data
    
    // 验证新密码一致性
    if (newPassword !== confirmPassword) {
      throw new Error('两次输入的新密码不一致')
    }
    
    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || '密码格式不正确')
    }
    
    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      const error: any = new Error('用户不存在')
      error.code = ErrorCode.AUTH_USER_NOT_FOUND
      throw error
    }
    
    // 验证旧密码
    const isOldPasswordValid = await verifyPassword(oldPassword, user.password)
    
    if (!isOldPasswordValid) {
      const error: any = new Error('旧密码错误')
      error.code = ErrorCode.USER_WRONG_PASSWORD
      throw error
    }
    
    // 加密新密码
    const hashedPassword = await hashPassword(newPassword)
    
    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })
  }
  
  /**
   * 获取用户详细信息
   * @param userId - 用户ID
   * @returns 用户详细信息
   */
  async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        membershipType: true,
        membershipExpiresAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            novels: true,
            comments: true,
            likes: true,
            favorites: true
          }
        }
      }
    })
    
    if (!user) {
      const error: any = new Error('用户不存在')
      error.code = ErrorCode.AUTH_USER_NOT_FOUND
      throw error
    }
    
    return {
      ...user,
      stats: {
        novels: user._count.novels,
        comments: user._count.comments,
        likes: user._count.likes,
        favorites: user._count.favorites
      }
    }
  }
  
  /**
   * 获取用户的收藏列表
   * @param userId - 用户ID
   * @param page - 页码
   * @param pageSize - 每页数量
   * @returns 收藏的小说列表
   */
  async getUserFavorites(userId: number, page: number = 1, pageSize: number = 20) {
    const { page: validPage, pageSize: validPageSize, skip } = validatePagination(page, pageSize)
    
    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        skip,
        take: validPageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          novel: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true
                }
              }
            }
          }
        }
      }),
      prisma.favorite.count({ where: { userId } })
    ])
    
    // 提取小说信息
    const novels = items.map(item => ({
      ...item.novel,
      tags: item.novel.tags ? JSON.parse(item.novel.tags) : null,
      coverData: item.novel.coverData ? JSON.parse(item.novel.coverData) : null,
      favoritedAt: item.createdAt
    }))
    
    return {
      items: novels,
      pagination: {
        page: validPage,
        pageSize: validPageSize,
        total,
        totalPages: Math.ceil(total / validPageSize)
      }
    }
  }
}

// 导入validatePagination
import { validatePagination } from '../utils/validator'

