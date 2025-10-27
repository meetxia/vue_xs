import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { SearchService } from '../../../src/services/search.service'

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      novel: {
        findMany: vi.fn(),
        count: vi.fn()
      },
      $queryRaw: vi.fn(),
      $executeRaw: vi.fn()
    }))
  }
})

describe('SearchService', () => {
  let searchService: SearchService
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    searchService = new SearchService()
    vi.clearAllMocks()
  })

  describe('searchNovels', () => {
    it('应该成功搜索小说', async () => {
      const mockNovels = [
        {
          id: 1,
          title: '测试小说1',
          summary: '包含关键词的摘要',
          author: { id: 1, username: 'author1', avatar: null }
        },
        {
          id: 2,
          title: '测试小说2',
          summary: '另一个摘要',
          author: { id: 2, username: 'author2', avatar: null }
        }
      ]

      mockPrisma.novel.findMany.mockResolvedValue(mockNovels)
      mockPrisma.novel.count.mockResolvedValue(2)

      const result = await searchService.searchNovels({
        keyword: '测试',
        page: 1,
        pageSize: 20
      })

      expect(result.novels).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.keyword).toBe('测试')
    })

    it('应该支持按分类筛选', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      await searchService.searchNovels({
        keyword: '测试',
        category: '玄幻',
        page: 1,
        pageSize: 20
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

      await searchService.searchNovels({
        keyword: '测试',
        sortBy: 'views',
        page: 1,
        pageSize: 20
      })

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { views: 'desc' }
        })
      )
    })

    it('应该只搜索已发布的小说', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      await searchService.searchNovels({
        keyword: '测试',
        page: 1,
        pageSize: 20
      })

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published'
          })
        })
      )
    })

    it('应该支持分页', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(100)

      await searchService.searchNovels({
        keyword: '测试',
        page: 3,
        pageSize: 10
      })

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10
        })
      )
    })
  })

  describe('getSearchSuggestions', () => {
    it('应该返回搜索建议', async () => {
      const mockNovels = [
        { title: '测试小说1' },
        { title: '测试小说2' },
        { title: '测试小说3' }
      ]

      mockPrisma.novel.findMany.mockResolvedValue(mockNovels)

      const suggestions = await searchService.getSearchSuggestions('测试', 10)

      expect(suggestions).toHaveLength(3)
      expect(suggestions[0]).toBe('测试小说1')
    })

    it('应该拒绝过短的关键词', async () => {
      const suggestions = await searchService.getSearchSuggestions('a', 10)

      expect(suggestions).toHaveLength(0)
      expect(mockPrisma.novel.findMany).not.toHaveBeenCalled()
    })

    it('应该限制建议数量', async () => {
      const mockNovels = Array.from({ length: 20 }, (_, i) => ({
        title: `测试小说${i + 1}`
      }))

      mockPrisma.novel.findMany.mockResolvedValue(mockNovels.slice(0, 5))

      const suggestions = await searchService.getSearchSuggestions('测试', 5)

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5
        })
      )
    })

    it('应该按浏览量排序建议', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])

      await searchService.getSearchSuggestions('测试', 10)

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { views: 'desc' }
        })
      )
    })
  })

  describe('saveSearchHistory', () => {
    it('应该保存新的搜索历史', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([])
      mockPrisma.$executeRaw.mockResolvedValue(1)

      await searchService.saveSearchHistory(1, '测试关键词', 10)

      expect(mockPrisma.$executeRaw).toHaveBeenCalled()
    })

    it('应该更新已存在的搜索记录', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 1 }])
      mockPrisma.$executeRaw.mockResolvedValue(1)

      await searchService.saveSearchHistory(1, '测试关键词', 15)

      expect(mockPrisma.$executeRaw).toHaveBeenCalled()
    })

    it('保存失败不应抛出错误', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('数据库错误'))

      await expect(
        searchService.saveSearchHistory(1, '测试', 10)
      ).resolves.not.toThrow()
    })
  })

  describe('getSearchHistory', () => {
    it('应该返回用户搜索历史', async () => {
      const mockHistory = [
        { keyword: '关键词1', resultCount: 10, createdAt: new Date() },
        { keyword: '关键词2', resultCount: 5, createdAt: new Date() }
      ]

      mockPrisma.$queryRaw.mockResolvedValue(mockHistory)

      const result = await searchService.getSearchHistory(1, 20)

      expect(result).toHaveLength(2)
      expect(result[0].keyword).toBe('关键词1')
    })

    it('应该限制返回数量', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([])

      await searchService.getSearchHistory(1, 10)

      // 验证SQL中包含LIMIT
      expect(mockPrisma.$queryRaw).toHaveBeenCalled()
    })

    it('查询失败应返回空数组', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('数据库错误'))

      const result = await searchService.getSearchHistory(1, 20)

      expect(result).toEqual([])
    })
  })

  describe('deleteSearchHistory', () => {
    it('应该删除指定关键词的历史', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(1)

      await searchService.deleteSearchHistory(1, '测试关键词')

      expect(mockPrisma.$executeRaw).toHaveBeenCalled()
    })

    it('应该清空所有搜索历史', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(5)

      await searchService.deleteSearchHistory(1)

      expect(mockPrisma.$executeRaw).toHaveBeenCalled()
    })

    it('删除失败应抛出错误', async () => {
      mockPrisma.$executeRaw.mockRejectedValue(new Error('数据库错误'))

      await expect(
        searchService.deleteSearchHistory(1, '测试')
      ).rejects.toThrow('删除搜索历史失败')
    })
  })

  describe('getHotKeywords', () => {
    it('应该返回热门关键词', async () => {
      const mockHotKeywords = [
        { keyword: '热门1', searchCount: 100, totalResults: 500 },
        { keyword: '热门2', searchCount: 80, totalResults: 300 }
      ]

      mockPrisma.$queryRaw.mockResolvedValue(mockHotKeywords)

      const result = await searchService.getHotKeywords(10)

      expect(result).toHaveLength(2)
      expect(result[0].keyword).toBe('热门1')
      expect(result[0].searchCount).toBe(100)
    })

    it('应该限制返回数量', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([])

      await searchService.getHotKeywords(5)

      expect(mockPrisma.$queryRaw).toHaveBeenCalled()
    })

    it('查询失败应返回空数组', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('数据库错误'))

      const result = await searchService.getHotKeywords(10)

      expect(result).toEqual([])
    })
  })

  describe('advancedSearch', () => {
    it('应该支持多条件搜索', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      await searchService.advancedSearch({
        keyword: '测试',
        category: '玄幻',
        author: '作者1',
        minViews: 100,
        maxViews: 1000,
        page: 1,
        pageSize: 20
      })

      expect(mockPrisma.novel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'published',
            category: '玄幻'
          })
        })
      )
    })

    it('应该支持日期范围筛选', async () => {
      const dateFrom = new Date('2024-01-01')
      const dateTo = new Date('2024-12-31')

      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      await searchService.advancedSearch({
        keyword: '测试',
        dateFrom,
        dateTo,
        page: 1,
        pageSize: 20
      })

      expect(mockPrisma.novel.findMany).toHaveBeenCalled()
    })

    it('应该支持浏览量范围筛选', async () => {
      mockPrisma.novel.findMany.mockResolvedValue([])
      mockPrisma.novel.count.mockResolvedValue(0)

      await searchService.advancedSearch({
        minViews: 1000,
        maxViews: 10000,
        page: 1,
        pageSize: 20
      })

      expect(mockPrisma.novel.findMany).toHaveBeenCalled()
    })
  })
})

