import { FastifyInstance } from 'fastify'
import {
  uploadAvatar,
  uploadCover,
  uploadImage,
  deleteUploadedFile
} from '../controllers/upload.controller'
import {
  avatarUploadMiddleware,
  coverUploadMiddleware,
  imageUploadMiddleware
} from '../middlewares/upload.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'

export default async function uploadRoutes(fastify: FastifyInstance) {
  /**
   * @route POST /api/upload/avatar
   * @desc 上传头像
   * @access Private
   */
  fastify.post(
    '/avatar',
    {
      preHandler: [authMiddleware, avatarUploadMiddleware]
    },
    uploadAvatar
  )

  /**
   * @route POST /api/upload/cover
   * @desc 上传封面
   * @access Private
   */
  fastify.post(
    '/cover',
    {
      preHandler: [authMiddleware, coverUploadMiddleware]
    },
    uploadCover
  )

  /**
   * @route POST /api/upload/image
   * @desc 上传通用图片
   * @access Private
   */
  fastify.post(
    '/image',
    {
      preHandler: [authMiddleware, imageUploadMiddleware]
    },
    uploadImage
  )

  /**
   * @route DELETE /api/upload
   * @desc 删除上传的文件
   * @access Private
   */
  fastify.delete(
    '/',
    {
      preHandler: authMiddleware
    },
    deleteUploadedFile
  )
}

