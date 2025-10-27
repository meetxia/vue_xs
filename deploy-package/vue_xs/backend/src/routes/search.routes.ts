import { FastifyInstance } from 'fastify'
import {
  searchNovels,
  getSearchSuggestions,
  getHotSearches,
  searchByCategory,
  searchByTag,
  searchAll,
  getAllCategories,
  getHotTags
} from '../controllers/search.controller'
import { optionalAuthMiddleware } from '../middlewares/auth.middleware'

export default async function searchRoutes(fastify: FastifyInstance) {
  /**
   * @route GET /api/search
   * @desc 搜索小说
   * @access Public
   * @query q - 搜索关键词（必需）
   * @query page - 页码（可选，默认1）
   * @query pageSize - 每页数量（可选，默认20）
   * @query category - 分类筛选（可选）
   * @query sortBy - 排序字段（可选：relevance/views/likes/createdAt）
   * @query order - 排序方式（可选：asc/desc）
   */
  fastify.get(
    '/search',
    {
      preHandler: optionalAuthMiddleware
    },
    searchNovels
  )

  /**
   * @route GET /api/search/suggest
   * @desc 获取搜索建议（自动补全）
   * @access Public
   * @query q - 部分关键词（必需）
   * @query limit - 返回数量（可选，默认10）
   */
  fastify.get('/search/suggest', getSearchSuggestions)

  /**
   * @route GET /api/search/hot
   * @desc 获取热门搜索
   * @access Public
   * @query limit - 返回数量（可选，默认10）
   */
  fastify.get('/search/hot', getHotSearches)

  /**
   * @route GET /api/search/all
   * @desc 综合搜索（小说+作者）
   * @access Public
   * @query q - 搜索关键词（必需）
   * @query limit - 返回数量（可选，默认20）
   */
  fastify.get('/search/all', searchAll)

  /**
   * @route GET /api/categories
   * @desc 获取所有分类
   * @access Public
   */
  fastify.get('/categories', getAllCategories)

  /**
   * @route GET /api/categories/:category
   * @desc 按分类搜索小说
   * @access Public
   * @param category - 分类名称
   * @query page - 页码（可选，默认1）
   * @query pageSize - 每页数量（可选，默认20）
   * @query sortBy - 排序字段（可选：views/likes/createdAt）
   * @query order - 排序方式（可选：asc/desc）
   */
  fastify.get('/categories/:category', searchByCategory)

  /**
   * @route GET /api/tags/hot
   * @desc 获取热门标签
   * @access Public
   * @query limit - 返回数量（可选，默认20）
   */
  fastify.get('/tags/hot', getHotTags)

  /**
   * @route GET /api/tags/:tag
   * @desc 按标签搜索小说
   * @access Public
   * @param tag - 标签名称
   * @query page - 页码（可选，默认1）
   * @query pageSize - 每页数量（可选，默认20）
   */
  fastify.get('/tags/:tag', searchByTag)
}
