import { FastifyRequest, FastifyReply } from 'fastify'
import { SearchService } from '../services/search.service'

const searchService = new SearchService()

/**
 * 搜索小说
 */
export async function searchNovels(
  request: FastifyRequest<{
    Querystring: {
      q: string
      page?: string
      pageSize?: string
      category?: string
      sortBy?: 'relevance' | 'views' | 'likes' | 'createdAt'
      order?: 'asc' | 'desc'
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { q, page, pageSize, category, sortBy, order } = request.query

    if (!q || q.trim().length === 0) {
      return reply.code(400).send({
        success: false,
        message: '搜索关键词不能为空'
      })
    }

    const result = await searchService.searchNovels(q, {
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      category,
      sortBy,
      order
    })

    return reply.send({
      success: true,
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '搜索失败'
    })
  }
}

/**
 * 获取搜索建议
 */
export async function getSearchSuggestions(
  request: FastifyRequest<{
    Querystring: {
      q: string
      limit?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { q, limit } = request.query

    if (!q || q.trim().length === 0) {
      return reply.send({
        success: true,
        data: []
      })
    }

    const suggestions = await searchService.getSearchSuggestions(
      q,
      limit ? parseInt(limit) : 10
    )

    return reply.send({
      success: true,
      data: suggestions
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取建议失败'
    })
  }
}

/**
 * 获取热门搜索
 */
export async function getHotSearches(
  request: FastifyRequest<{
    Querystring: {
      limit?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { limit } = request.query

    const hotSearches = await searchService.getHotSearches(
      limit ? parseInt(limit) : 10
    )

    return reply.send({
      success: true,
      data: hotSearches
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取热门搜索失败'
    })
  }
}

/**
 * 按分类搜索
 */
export async function searchByCategory(
  request: FastifyRequest<{
    Params: {
      category: string
    }
    Querystring: {
      page?: string
      pageSize?: string
      sortBy?: 'views' | 'likes' | 'createdAt'
      order?: 'asc' | 'desc'
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { category } = request.params
    const { page, pageSize, sortBy, order } = request.query

    const result = await searchService.searchByCategory(category, {
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      sortBy,
      order
    })

    return reply.send({
      success: true,
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '搜索失败'
    })
  }
}

/**
 * 按标签搜索
 */
export async function searchByTag(
  request: FastifyRequest<{
    Params: {
      tag: string
    }
    Querystring: {
      page?: string
      pageSize?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { tag } = request.params
    const { page, pageSize } = request.query

    const result = await searchService.searchByTag(tag, {
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20
    })

    return reply.send({
      success: true,
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '搜索失败'
    })
  }
}

/**
 * 综合搜索
 */
export async function searchAll(
  request: FastifyRequest<{
    Querystring: {
      q: string
      limit?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { q, limit } = request.query

    if (!q || q.trim().length === 0) {
      return reply.code(400).send({
        success: false,
        message: '搜索关键词不能为空'
      })
    }

    const result = await searchService.searchAll(
      q,
      limit ? parseInt(limit) : 20
    )

    return reply.send({
      success: true,
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '搜索失败'
    })
  }
}

/**
 * 获取所有分类
 */
export async function getAllCategories(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const categories = await searchService.getAllCategories()

    return reply.send({
      success: true,
      data: categories
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取分类失败'
    })
  }
}

/**
 * 获取热门标签
 */
export async function getHotTags(
  request: FastifyRequest<{
    Querystring: {
      limit?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { limit } = request.query

    const tags = await searchService.getHotTags(
      limit ? parseInt(limit) : 20
    )

    return reply.send({
      success: true,
      data: tags
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取标签失败'
    })
  }
}
