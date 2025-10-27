import { FastifyInstance } from 'fastify'
import {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAllNovels,
  updateNovelStatus,
  deleteNovel,
  getAllComments,
  deleteComment,
  getSystemStats,
  getUserGrowth,
  getNovelGrowth
} from '../controllers/admin.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { adminMiddleware, superAdminMiddleware } from '../middlewares/admin.middleware'

export default async function adminRoutes(fastify: FastifyInstance) {
  // 所有管理后台路由都需要先通过认证
  const adminAuth = [authMiddleware, adminMiddleware]
  const superAdminAuth = [authMiddleware, superAdminMiddleware]

  /**
   * 用户管理
   */
  
  /**
   * @route GET /api/admin/users
   * @desc 获取所有用户列表
   * @access Admin
   * @query page, pageSize, role, isActive, search
   */
  fastify.get('/users', { preHandler: adminAuth }, getAllUsers)

  /**
   * @route PUT /api/admin/users/:id/status
   * @desc 更新用户状态（激活/禁用）
   * @access Admin
   */
  fastify.put('/users/:id/status', { preHandler: adminAuth }, updateUserStatus)

  /**
   * @route PUT /api/admin/users/:id/role
   * @desc 更新用户角色
   * @access Super Admin
   */
  fastify.put('/users/:id/role', { preHandler: superAdminAuth }, updateUserRole)

  /**
   * @route DELETE /api/admin/users/:id
   * @desc 删除用户
   * @access Super Admin
   */
  fastify.delete('/users/:id', { preHandler: superAdminAuth }, deleteUser)

  /**
   * 小说管理
   */
  
  /**
   * @route GET /api/admin/novels
   * @desc 获取所有小说列表
   * @access Admin
   * @query page, pageSize, status, category, search
   */
  fastify.get('/novels', { preHandler: adminAuth }, getAllNovels)

  /**
   * @route PUT /api/admin/novels/:id/status
   * @desc 更新小说状态（审核）
   * @access Admin
   */
  fastify.put('/novels/:id/status', { preHandler: adminAuth }, updateNovelStatus)

  /**
   * @route DELETE /api/admin/novels/:id
   * @desc 删除小说
   * @access Admin
   */
  fastify.delete('/novels/:id', { preHandler: adminAuth }, deleteNovel)

  /**
   * 评论管理
   */
  
  /**
   * @route GET /api/admin/comments
   * @desc 获取所有评论列表
   * @access Admin
   * @query page, pageSize, novelId, userId
   */
  fastify.get('/comments', { preHandler: adminAuth }, getAllComments)

  /**
   * @route DELETE /api/admin/comments/:id
   * @desc 删除评论
   * @access Admin
   */
  fastify.delete('/comments/:id', { preHandler: adminAuth }, deleteComment)

  /**
   * 统计数据
   */
  
  /**
   * @route GET /api/admin/stats
   * @desc 获取系统统计数据
   * @access Admin
   */
  fastify.get('/stats', { preHandler: adminAuth }, getSystemStats)

  /**
   * @route GET /api/admin/stats/users/growth
   * @desc 获取用户增长数据
   * @access Admin
   * @query days - 天数（默认7天）
   */
  fastify.get('/stats/users/growth', { preHandler: adminAuth }, getUserGrowth)

  /**
   * @route GET /api/admin/stats/novels/growth
   * @desc 获取小说增长数据
   * @access Admin
   * @query days - 天数（默认7天）
   */
  fastify.get('/stats/novels/growth', { preHandler: adminAuth }, getNovelGrowth)
}

