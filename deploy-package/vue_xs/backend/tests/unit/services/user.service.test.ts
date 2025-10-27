import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { UserService } from '../../../src/services/user.service'
import * as passwordUtils from '../../../src/utils/password'

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      user: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      favorite: {
        findMany: vi.fn(),
        count: vi.fn()
      }
    }))
  }
})

describe('UserService', () => {
  let userService: UserService
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    userService = new UserService(mockPrisma)
    vi.clearAllMocks()
  })

  describe('getUserById', () => {
    it('应该返回用户信息', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        avatar: null,
        bio: 'Test bio',
        membershipType: 'free',
        createdAt: new Date(),
        _count: {
          novels: 5,
          comments: 10,
          favorites: 3
        }
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await userService.getUserById(1)

      expect(result).toBeDefined()
      expect(result.id).toBe(1)
      expect(result.username).toBe('testuser')
      expect(result.stats).toBeDefined()
      expect(result.stats.novels).toBe(5)
    })

    it('应该拒绝不存在的用户', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(userService.getUserById(999)).rejects.toThrow('用户不存在')
    })

    it('不应该返回密码字段', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date()
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await userService.getUserById(1)

      expect(result.password).toBeUndefined()
    })
  })

  describe('updateUserInfo', () => {
    it('应该成功更新用户信息', async () => {
      const mockUser = {
        id: 1,
        username: 'oldname',
        email: 'old@example.com',
        bio: 'old bio'
      }

      const updateData = {
        username: 'newname',
        bio: 'new bio',
        avatar: 'new-avatar.jpg'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        ...updateData
      })

      const result = await userService.updateUserInfo(1, updateData)

      expect(result.username).toBe('newname')
      expect(result.bio).toBe('new bio')
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1)
    })

    it('应该检查用户名唯一性', async () => {
      const mockUser = { id: 1, username: 'user1' }
      const existingUser = { id: 2, username: 'user2' }

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser) // 第一次：查找要更新的用户
        .mockResolvedValueOnce(existingUser) // 第二次：检查用户名是否被占用

      await expect(
        userService.updateUserInfo(1, { username: 'user2' })
      ).rejects.toThrow('用户名已被使用')
    })

    it('应该允许保持原用户名不变', async () => {
      const mockUser = {
        id: 1,
        username: 'user1',
        email: 'user1@example.com'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        bio: 'new bio'
      })

      const result = await userService.updateUserInfo(1, {
        username: 'user1', // 保持不变
        bio: 'new bio'
      })

      expect(result).toBeDefined()
      expect(mockPrisma.user.update).toHaveBeenCalled()
    })

    it('应该拒绝空用户名', async () => {
      const mockUser = { id: 1, username: 'user1' }
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      await expect(
        userService.updateUserInfo(1, { username: '' })
      ).rejects.toThrow('用户名不能为空')
    })
  })

  describe('changePassword', () => {
    it('应该成功修改密码', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'old_hashed_password'
      }

      const passwordData = {
        oldPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock 旧密码验证通过
      vi.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(true)
      
      // Mock 密码加密
      vi.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('new_hashed_password')
      
      // Mock 密码强度验证
      vi.spyOn(passwordUtils, 'validatePasswordStrength').mockReturnValue({
        isValid: true,
        errors: []
      })

      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        password: 'new_hashed_password'
      })

      await userService.changePassword(1, passwordData)

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { password: 'new_hashed_password' }
        })
      )
    })

    it('应该拒绝不一致的新密码', async () => {
      const passwordData = {
        oldPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'DifferentPassword123!'
      }

      await expect(
        userService.changePassword(1, passwordData)
      ).rejects.toThrow('两次输入的新密码不一致')
    })

    it('应该拒绝错误的旧密码', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password'
      }

      const passwordData = {
        oldPassword: 'WrongPassword!',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock 旧密码验证失败
      vi.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(false)

      await expect(
        userService.changePassword(1, passwordData)
      ).rejects.toThrow('旧密码不正确')
    })

    it('应该拒绝弱密码', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password'
      }

      const passwordData = {
        oldPassword: 'OldPassword123!',
        newPassword: 'weak',
        confirmNewPassword: 'weak'
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      vi.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(true)
      vi.spyOn(passwordUtils, 'validatePasswordStrength').mockReturnValue({
        isValid: false,
        errors: ['密码长度至少为8个字符']
      })

      await expect(
        userService.changePassword(1, passwordData)
      ).rejects.toThrow('密码长度至少为8个字符')
    })
  })

  describe('getUserFavorites', () => {
    it('应该返回用户收藏列表', async () => {
      const mockFavorites = [
        {
          id: 1,
          novelId: 1,
          userId: 1,
          novel: {
            id: 1,
            title: '小说1',
            summary: '摘要1',
            author: { id: 2, username: 'author1', avatar: null }
          },
          createdAt: new Date()
        },
        {
          id: 2,
          novelId: 2,
          userId: 1,
          novel: {
            id: 2,
            title: '小说2',
            summary: '摘要2',
            author: { id: 3, username: 'author2', avatar: null }
          },
          createdAt: new Date()
        }
      ]

      mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites)
      mockPrisma.favorite.count.mockResolvedValue(2)

      const result = await userService.getUserFavorites(1, { page: 1, pageSize: 20 })

      expect(result.favorites).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.favorites[0].novel).toBeDefined()
      expect(result.favorites[0].novel.author).toBeDefined()
    })

    it('应该支持分页', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([])
      mockPrisma.favorite.count.mockResolvedValue(100)

      await userService.getUserFavorites(1, { page: 3, pageSize: 10 })

      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10
        })
      )
    })

    it('应该按收藏时间倒序排列', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([])
      mockPrisma.favorite.count.mockResolvedValue(0)

      await userService.getUserFavorites(1, { page: 1, pageSize: 20 })

      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      )
    })
  })
})

