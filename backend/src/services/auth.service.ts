/**
 * 认证服务
 * 处理用户注册、登录等认证相关业务逻辑
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { isValidEmail, isValidUsername } from '../utils/validator'
import type { RegisterDto, LoginDto, JwtPayload } from '../types'
import { ErrorCode } from '../types'

const prisma = new PrismaClient()

export class AuthService {
  /**
   * 用户注册
   * @param data - 注册数据
   * @returns 用户信息和Token
   */
  async register(data: RegisterDto) {
    const { username, email, password, confirmPassword } = data
    
    // 验证用户名格式
    if (!isValidUsername(username)) {
      throw new Error('用户名格式不正确（3-20个字符，只能包含字母、数字、下划线）')
    }
    
    // 验证邮箱格式
    if (!isValidEmail(email)) {
      throw new Error('邮箱格式不正确')
    }
    
    // 验证密码
    if (password !== confirmPassword) {
      throw new Error('两次输入的密码不一致')
    }
    
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || '密码格式不正确')
    }
    
    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })
    
    if (existingUsername) {
      const error: any = new Error('用户名已存在')
      error.code = ErrorCode.USER_USERNAME_EXISTS
      throw error
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingEmail) {
      const error: any = new Error('邮箱已被注册')
      error.code = ErrorCode.USER_EMAIL_EXISTS
      throw error
    }
    
    // 加密密码
    const hashedPassword = await hashPassword(password)
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        membershipType: 'free'
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        membershipType: true,
        createdAt: true
      }
    })
    
    // 生成Token
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      membershipType: user.membershipType || 'free'
    }
    
    const token = generateToken(payload)
    
    return {
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  }
  
  /**
   * 用户登录
   * @param data - 登录数据
   * @returns 用户信息和Token
   */
  async login(data: LoginDto) {
    const { email, password } = data
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      const error: any = new Error('邮箱或密码错误')
      error.code = ErrorCode.AUTH_INVALID_CREDENTIALS
      throw error
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      const error: any = new Error('邮箱或密码错误')
      error.code = ErrorCode.AUTH_INVALID_CREDENTIALS
      throw error
    }
    
    // 生成Token
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      membershipType: user.membershipType || 'free'
    }
    
    const token = generateToken(payload)
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user
    
    return {
      user: userWithoutPassword,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  }
  
  /**
   * 获取当前用户信息
   * @param userId - 用户ID
   * @returns 用户信息
   */
  async getCurrentUser(userId: number) {
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
}

