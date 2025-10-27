import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../../../src/services/auth.service'
import * as passwordUtils from '../../../src/utils/password'
import * as jwtUtils from '../../../src/utils/jwt'

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      user: {
        findUnique: vi.fn(),
        create: vi.fn()
      }
    }))
  }
})

describe('AuthService', () => {
  let authService: AuthService
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    authService = new AuthService(mockPrisma)
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Test123456!'
      }

      // Mock 检查用户不存在
      mockPrisma.user.findUnique.mockResolvedValue(null)
      
      // Mock 创建用户成功
      const mockUser = {
        id: 1,
        username: registerData.username,
        email: registerData.email,
        password: 'hashed_password',
        createdAt: new Date()
      }
      mockPrisma.user.create.mockResolvedValue(mockUser)

      // Mock JWT生成
      vi.spyOn(jwtUtils, 'generateToken').mockReturnValue('mock_token')

      const result = await authService.register(registerData)

      expect(result).toBeDefined()
      expect(result.token).toBe('mock_token')
      expect(result.user.username).toBe(registerData.username)
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1)
    })

    it('应该拒绝重复的用户名', async () => {
      const registerData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'Test123456!'
      }

      // Mock 用户名已存在
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'existinguser'
      })

      await expect(authService.register(registerData)).rejects.toThrow('用户名已存在')
    })

    it('应该拒绝重复的邮箱', async () => {
      const registerData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'Test123456!'
      }

      // Mock 第一次查询用户名不存在
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)
      // Mock 第二次查询邮箱已存在
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'existing@example.com'
      })

      await expect(authService.register(registerData)).rejects.toThrow('邮箱已被注册')
    })

    it('应该加密用户密码', async () => {
      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Test123456!'
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      
      const hashSpy = vi.spyOn(passwordUtils, 'hashPassword')
        .mockResolvedValue('hashed_password')

      const mockUser = {
        id: 1,
        username: registerData.username,
        email: registerData.email,
        password: 'hashed_password',
        createdAt: new Date()
      }
      mockPrisma.user.create.mockResolvedValue(mockUser)
      vi.spyOn(jwtUtils, 'generateToken').mockReturnValue('mock_token')

      await authService.register(registerData)

      expect(hashSpy).toHaveBeenCalledWith(registerData.password)
    })
  })

  describe('login', () => {
    it('应该成功登录', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test123456!'
      }

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: loginData.email,
        password: 'hashed_password',
        avatar: null,
        bio: null,
        createdAt: new Date()
      }

      // Mock 查找用户
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock 密码验证通过
      vi.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(true)
      
      // Mock JWT生成
      vi.spyOn(jwtUtils, 'generateToken').mockReturnValue('mock_token')

      const result = await authService.login(loginData)

      expect(result).toBeDefined()
      expect(result.token).toBe('mock_token')
      expect(result.user.email).toBe(loginData.email)
    })

    it('应该拒绝不存在的用户', async () => {
      const loginData = {
        email: 'notexist@example.com',
        password: 'Test123456!'
      }

      // Mock 用户不存在
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.login(loginData)).rejects.toThrow('用户不存在')
    })

    it('应该拒绝错误的密码', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword!'
      }

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: loginData.email,
        password: 'hashed_password',
        createdAt: new Date()
      }

      // Mock 查找用户
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock 密码验证失败
      vi.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(false)

      await expect(authService.login(loginData)).rejects.toThrow('密码错误')
    })
  })

  describe('getCurrentUser', () => {
    it('应该返回用户信息（不包含密码）', async () => {
      const userId = 1
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        avatar: null,
        bio: 'Test bio',
        membershipType: 'free',
        createdAt: new Date()
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await authService.getCurrentUser(userId)

      expect(result).toBeDefined()
      expect(result.id).toBe(userId)
      expect(result.password).toBeUndefined() // 密码不应返回
    })

    it('应该拒绝不存在的用户ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.getCurrentUser(999)).rejects.toThrow('用户不存在')
    })
  })
})
