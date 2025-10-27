import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { CommentService } from '../../../src/services/comment.service'

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      comment: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
      },
      novel: {
        findUnique: vi.fn()
      }
    }))
  }
})

describe('CommentService', () => {
  let commentService: CommentService
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    commentService = new CommentService(mockPrisma)
    vi.clearAllMocks()
  })

  describe('createComment', () => {
    it('应该成功创建评论', async () => {
      const commentData = {
        novelId: 1,
        userId: 1,
        content: '这是一条测试评论'
      }

      const mockNovel = { id: 1, title: '测试小说' }
      const mockComment = {
        id: 1,
        ...commentData,
        createdAt: new Date()
      }

      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)
      mockPrisma.comment.create.mockResolvedValue(mockComment)

      const result = await commentService.createComment(commentData)

      expect(result).toBeDefined()
      expect(result.id).toBe(1)
      expect(result.content).toBe(commentData.content)
      expect(mockPrisma.comment.create).toHaveBeenCalledTimes(1)
    })

    it('应该拒绝空评论内容', async () => {
      const commentData = {
        novelId: 1,
        userId: 1,
        content: ''
      }

      await expect(commentService.createComment(commentData)).rejects.toThrow('评论内容不能为空')
    })

    it('应该拒绝过长的评论', async () => {
      const commentData = {
        novelId: 1,
        userId: 1,
        content: 'a'.repeat(1001)
      }

      await expect(commentService.createComment(commentData)).rejects.toThrow('评论内容不能超过1000个字符')
    })

    it('应该检查小说是否存在', async () => {
      const commentData = {
        novelId: 999,
        userId: 1,
        content: '测试评论'
      }

      mockPrisma.novel.findUnique.mockResolvedValue(null)

      await expect(commentService.createComment(commentData)).rejects.toThrow('小说不存在')
    })
  })

  describe('getCommentsByNovelId', () => {
    it('应该返回评论列表', async () => {
      const mockComments = [
        {
          id: 1,
          content: '评论1',
          userId: 1,
          user: { id: 1, username: 'user1', avatar: null },
          createdAt: new Date()
        },
        {
          id: 2,
          content: '评论2',
          userId: 2,
          user: { id: 2, username: 'user2', avatar: null },
          createdAt: new Date()
        }
      ]

      mockPrisma.comment.findMany.mockResolvedValue(mockComments)
      mockPrisma.comment.count.mockResolvedValue(2)

      const result = await commentService.getCommentsByNovelId(1, { page: 1, pageSize: 20 })

      expect(result.comments).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.comments[0].user).toBeDefined()
    })

    it('应该支持分页', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([])
      mockPrisma.comment.count.mockResolvedValue(100)

      await commentService.getCommentsByNovelId(1, { page: 3, pageSize: 10 })

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10
        })
      )
    })

    it('应该按创建时间倒序排列', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([])
      mockPrisma.comment.count.mockResolvedValue(0)

      await commentService.getCommentsByNovelId(1, { page: 1, pageSize: 20 })

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      )
    })
  })

  describe('deleteComment', () => {
    it('应该成功删除自己的评论', async () => {
      const mockComment = {
        id: 1,
        content: '测试评论',
        userId: 1,
        novelId: 1
      }

      mockPrisma.comment.findUnique.mockResolvedValue(mockComment)
      mockPrisma.comment.delete.mockResolvedValue(mockComment)

      await commentService.deleteComment(1, 1)

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('应该拒绝删除他人的评论', async () => {
      const mockComment = {
        id: 1,
        content: '测试评论',
        userId: 1,
        novelId: 1
      }

      mockPrisma.comment.findUnique.mockResolvedValue(mockComment)

      await expect(commentService.deleteComment(1, 2)).rejects.toThrow('无权删除此评论')
    })

    it('应该拒绝删除不存在的评论', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null)

      await expect(commentService.deleteComment(999, 1)).rejects.toThrow('评论不存在')
    })
  })

  describe('getUserComments', () => {
    it('应该返回用户的评论列表', async () => {
      const mockComments = [
        {
          id: 1,
          content: '评论1',
          userId: 1,
          novel: { id: 1, title: '小说1' },
          createdAt: new Date()
        },
        {
          id: 2,
          content: '评论2',
          userId: 1,
          novel: { id: 2, title: '小说2' },
          createdAt: new Date()
        }
      ]

      mockPrisma.comment.findMany.mockResolvedValue(mockComments)
      mockPrisma.comment.count.mockResolvedValue(2)

      const result = await commentService.getUserComments(1, { page: 1, pageSize: 20 })

      expect(result.comments).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.comments[0].novel).toBeDefined()
    })

    it('应该支持分页', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([])
      mockPrisma.comment.count.mockResolvedValue(50)

      await commentService.getUserComments(1, { page: 2, pageSize: 20 })

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20
        })
      )
    })
  })
})

