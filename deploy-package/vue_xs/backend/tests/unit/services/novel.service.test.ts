import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { NovelService } from '../../../src/services/novel.service'

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      novel: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
      },
      like: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
      },
      favorite: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
      }
    }))
  }
})

describe('NovelService', () => {
  let novelService: NovelService
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    novelService = new NovelService(mockPrisma)
    vi.clearAllMocks()
  })

  describe('createNovel', () => {
    it('应该成功创建小说', async () => {
      const novelData = {
        title: '测试小说',
        summary: '这是一部测试小说',
        content: '小说内容...',
        category: '玄幻',
        tags: ['修仙', '热血'],
        authorId: 1
      }

      const mockNovel = {
        id: 1,
        ...novelData,
        tags: JSON.stringify(novelData.tags),
        views: 0,
        likes: 0,
        favorites: 0,
        status: 'draft',
        createdAt: new Date()
      }

      mockPrisma.novel.create.mockResolvedValue(mockNovel)

      const result = await novelService.createNovel(novelData)

      expect(result).toBeDefined()
      expect(result.id).toBe(1)
      expect(result.title).toBe(novelData.title)
      expect(mockPrisma.novel.create).toHaveBeenCalledTimes(1)
    })

    it('应该拒绝空标题', async () => {
      const novelData = {
        title: '',
        content: '内容',
        authorId: 1
      }

      await expect(novelService.createNovel(novelData)).rejects.toThrow('标题不能为空')
    })

    it('应该拒绝过长的标题', async () => {
      const novelData = {
        title: 'a'.repeat(201),
        content: '内容',
        authorId: 1
      }

      await expect(novelService.createNovel(novelData)).rejects.toThrow('标题长度不能超过200个字符')
    })

    it('应该拒绝空内容', async () => {
      const novelData = {
        title: '测试',
        content: '',
        authorId: 1
      }

      await expect(novelService.createNovel(novelData)).rejects.toThrow('内容不能为空')
    })
  })

  describe('getNovelList', () => {
    it('应该返回小说列表', async () => {
      const mockNovels = [
        {
          id: 1,
          title: '小说1',
          summary: '摘要1',
          views: 100,
          likes: 10,
          author: { id: 1, username: 'user1', avatar: null }
        },
        {
          id: 2,
          title: '小说2',
          summary: '摘要2',
          views: 200,
          likes: 20,
          author: { id: 2, username: 'user2', avatar: null }
        }
      ]

      mockPrisma.novel.findMany.mockResolvedValue(mockNovels)
      mockPrisma.novel.count.mockResolvedValue(2)

      const result = await novelService.getNovelList({ page: 1, pageSize: 20 })

      expect(result.novels).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('应该支持分页', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(100)

      await novelService.getNovelList({ page: 2, pageSize: 10 })

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      )
    })

    it('应该支持按分类筛选', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      await novelService.getNovelList({ 
        page: 1, 
        pageSize: 20,
        category: '玄幻'
      })

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: '玄幻'
          })
        })
      )
    })

    it('应该支持按浏览量排序', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      await novelService.getNovelList({ 
        page: 1, 
        pageSize: 20,
        sortBy: 'views'
      })

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { views: 'desc' }
        })
      )
    })
  })

  describe('getNovelById', () => {
    it('应该返回小说详情', async () => {
      const mockNovel = {
        id: 1,
        title: '测试小说',
        content: '内容',
        views: 100,
        author: { id: 1, username: 'user1' }
      }

      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)

      const result = await novelService.getNovelById(1)

      expect(result).toBeDefined()
      expect(result.id).toBe(1)
      expect(result.title).toBe('测试小说')
    })

    it('应该自动增加浏览量', async () => {
      const mockNovel = {
        id: 1,
        title: '测试小说',
        views: 100
      }

      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)
      mockPrisma.novel.update.mockResolvedValue({ ...mockNovel, views: 101 })

      await novelService.getNovelById(1)

      expect(mockPrisma.novel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { views: { increment: 1 } }
        })
      )
    })

    it('应该拒绝不存在的小说ID', async () => {
      mockPrisma.novel.findUnique.mockResolvedValue(null)

      await expect(novelService.getNovelById(999)).rejects.toThrow('小说不存在')
    })
  })

  describe('updateNovel', () => {
    it('应该成功更新小说', async () => {
      const mockNovel = {
        id: 1,
        title: '旧标题',
        authorId: 1
      }

      const updateData = {
        title: '新标题',
        summary: '新摘要'
      }

      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)
      mockPrisma.novel.update.mockResolvedValue({
        ...mockNovel,
        ...updateData
      })

      const result = await novelService.updateNovel(1, 1, updateData)

      expect(result.title).toBe('新标题')
      expect(mockPrisma.novel.update).toHaveBeenCalledTimes(1)
    })

    it('应该检查作者权限', async () => {
      const mockNovel = {
        id: 1,
        title: '测试',
        authorId: 1
      }

      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)

      await expect(
        novelService.updateNovel(1, 2, { title: '新标题' })
      ).rejects.toThrow('无权编辑此小说')
    })
  })

  describe('deleteNovel', () => {
    it('应该成功删除小说', async () => {
      const mockNovel = {
        id: 1,
        title: '测试',
        authorId: 1
      }

      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)
      mockPrisma.novel.delete.mockResolvedValue(mockNovel)

      await novelService.deleteNovel(1, 1)

      expect(mockPrisma.novel.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('应该检查作者权限', async () => {
      const mockNovel = {
        id: 1,
        title: '测试',
        authorId: 1
      }

      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)

      await expect(novelService.deleteNovel(1, 2)).rejects.toThrow('无权删除此小说')
    })
  })

  describe('toggleLike', () => {
    it('应该成功点赞', async () => {
      const mockNovel = { id: 1, title: '测试', likes: 10 }
      
      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)
      mockPrisma.like.findUnique.mockResolvedValue(null) // 未点赞
      mockPrisma.like.create.mockResolvedValue({ id: 1 })
      mockPrisma.novel.update.mockResolvedValue({ ...mockNovel, likes: 11 })

      const result = await novelService.toggleLike(1, 1)

      expect(result.liked).toBe(true)
      expect(mockPrisma.like.create).toHaveBeenCalledTimes(1)
    })

    it('应该成功取消点赞', async () => {
      const mockNovel = { id: 1, title: '测试', likes: 10 }
      const mockLike = { id: 1, novelId: 1, userId: 1 }
      
      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)
      mockPrisma.like.findUnique.mockResolvedValue(mockLike) // 已点赞
      mockPrisma.like.delete.mockResolvedValue(mockLike)
      mockPrisma.novel.update.mockResolvedValue({ ...mockNovel, likes: 9 })

      const result = await novelService.toggleLike(1, 1)

      expect(result.liked).toBe(false)
      expect(mockPrisma.like.delete).toHaveBeenCalledTimes(1)
    })
  })

  describe('toggleFavorite', () => {
    it('应该成功收藏', async () => {
      const mockNovel = { id: 1, title: '测试', favorites: 5 }
      
      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)
      mockPrisma.favorite.findUnique.mockResolvedValue(null)
      mockPrisma.favorite.create.mockResolvedValue({ id: 1 })
      mockPrisma.novel.update.mockResolvedValue({ ...mockNovel, favorites: 6 })

      const result = await novelService.toggleFavorite(1, 1)

      expect(result.favorited).toBe(true)
      expect(mockPrisma.favorite.create).toHaveBeenCalledTimes(1)
    })

    it('应该成功取消收藏', async () => {
      const mockNovel = { id: 1, title: '测试', favorites: 5 }
      const mockFavorite = { id: 1, novelId: 1, userId: 1 }
      
      mockPrisma.novel.findUnique.mockResolvedValue(mockNovel)
      mockPrisma.favorite.findUnique.mockResolvedValue(mockFavorite)
      mockPrisma.favorite.delete.mockResolvedValue(mockFavorite)
      mockPrisma.novel.update.mockResolvedValue({ ...mockNovel, favorites: 4 })

      const result = await novelService.toggleFavorite(1, 1)

      expect(result.favorited).toBe(false)
      expect(mockPrisma.favorite.delete).toHaveBeenCalledTimes(1)
    })
  })
})
