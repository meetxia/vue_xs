import { FastifyRequest, FastifyReply } from 'fastify'
import { AdminService } from '../services/admin.service'

const adminService = new AdminService()

/**
 * 获取所有用户
 */
export async function getAllUsers(
  request: FastifyRequest<{
    Querystring: {
      page?: string
      pageSize?: string
      role?: string
      isActive?: string
      search?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { page, pageSize, role, isActive, search } = request.query

    const result = await adminService.getAllUsers({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search
    })

    return reply.send({
      success: true,
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取用户列表失败'
    })
  }
}

/**
 * 更新用户状态
 */
export async function updateUserStatus(
  request: FastifyRequest<{
    Params: {
      id: string
    }
    Body: {
      isActive: boolean
    }
  }>,
  reply: FastifyReply
) {
  try {
    const userId = parseInt(request.params.id)
    const { isActive } = request.body

    if (typeof isActive !== 'boolean') {
      return reply.code(400).send({
        success: false,
        message: 'isActive必须是布尔值'
      })
    }

    const user = await adminService.updateUserStatus(userId, isActive)

    return reply.send({
      success: true,
      message: `用户已${isActive ? '激活' : '禁用'}`,
      data: user
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '更新状态失败'
    })
  }
}

/**
 * 更新用户角色
 */
export async function updateUserRole(
  request: FastifyRequest<{
    Params: {
      id: string
    }
    Body: {
      role: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const userId = parseInt(request.params.id)
    const { role } = request.body
    const operatorRole = request.user?.role || 'user'

    const user = await adminService.updateUserRole(userId, role, operatorRole)

    return reply.send({
      success: true,
      message: '角色更新成功',
      data: user
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '更新角色失败'
    })
  }
}

/**
 * 删除用户
 */
export async function deleteUser(
  request: FastifyRequest<{
    Params: {
      id: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const userId = parseInt(request.params.id)
    const operatorRole = request.user?.role || 'user'

    const result = await adminService.deleteUser(userId, operatorRole)

    return reply.send({
      success: true,
      message: '用户删除成功',
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '删除用户失败'
    })
  }
}

/**
 * 获取所有小说（管理后台）
 */
export async function getAllNovels(
  request: FastifyRequest<{
    Querystring: {
      page?: string
      pageSize?: string
      status?: string
      category?: string
      search?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { page, pageSize, status, category, search } = request.query

    const result = await adminService.getAllNovels({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      status,
      category,
      search
    })

    return reply.send({
      success: true,
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取小说列表失败'
    })
  }
}

/**
 * 更新小说状态（审核）
 */
export async function updateNovelStatus(
  request: FastifyRequest<{
    Params: {
      id: string
    }
    Body: {
      status: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const novelId = parseInt(request.params.id)
    const { status } = request.body

    const novel = await adminService.updateNovelStatus(novelId, status)

    return reply.send({
      success: true,
      message: '小说状态更新成功',
      data: novel
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '更新状态失败'
    })
  }
}

/**
 * 删除小说（管理员）
 */
export async function deleteNovel(
  request: FastifyRequest<{
    Params: {
      id: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const novelId = parseInt(request.params.id)

    const result = await adminService.deleteNovel(novelId)

    return reply.send({
      success: true,
      message: '小说删除成功',
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '删除小说失败'
    })
  }
}

/**
 * 获取所有评论（管理后台）
 */
export async function getAllComments(
  request: FastifyRequest<{
    Querystring: {
      page?: string
      pageSize?: string
      novelId?: string
      userId?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { page, pageSize, novelId, userId } = request.query

    const result = await adminService.getAllComments({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      novelId: novelId ? parseInt(novelId) : undefined,
      userId: userId ? parseInt(userId) : undefined
    })

    return reply.send({
      success: true,
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取评论列表失败'
    })
  }
}

/**
 * 删除评论（管理员）
 */
export async function deleteComment(
  request: FastifyRequest<{
    Params: {
      id: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const commentId = parseInt(request.params.id)

    const result = await adminService.deleteComment(commentId)

    return reply.send({
      success: true,
      message: '评论删除成功',
      data: result
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '删除评论失败'
    })
  }
}

/**
 * 获取系统统计
 */
export async function getSystemStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const stats = await adminService.getSystemStats()

    return reply.send({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取统计失败'
    })
  }
}

/**
 * 获取用户增长数据
 */
export async function getUserGrowth(
  request: FastifyRequest<{
    Querystring: {
      days?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const days = request.query.days ? parseInt(request.query.days) : 7

    const growth = await adminService.getUserGrowth(days)

    return reply.send({
      success: true,
      data: growth
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取增长数据失败'
    })
  }
}

/**
 * 获取小说增长数据
 */
export async function getNovelGrowth(
  request: FastifyRequest<{
    Querystring: {
      days?: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const days = request.query.days ? parseInt(request.query.days) : 7

    const growth = await adminService.getNovelGrowth(days)

    return reply.send({
      success: true,
      data: growth
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '获取增长数据失败'
    })
  }
}

