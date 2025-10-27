import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { processAvatar, processCover } from '../utils/image'
import { deleteFile } from '../middlewares/upload.middleware'
import * as path from 'path'

const prisma = new PrismaClient()

/**
 * 上传头像
 */
export async function uploadAvatar(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const uploadedFile = request.uploadedFile
    
    if (!uploadedFile) {
      return reply.code(400).send({
        success: false,
        message: '未检测到上传文件'
      })
    }
    
    // 获取当前用户ID
    const userId = request.user?.userId
    
    if (!userId) {
      // 删除已上传的文件
      deleteFile(uploadedFile.filepath)
      return reply.code(401).send({
        success: false,
        message: '未授权'
      })
    }
    
    // 处理头像（压缩、裁剪为正方形）
    const publicPath = path.join('public', uploadedFile.filepath)
    await processAvatar(publicPath, publicPath)
    
    // 更新用户头像
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: uploadedFile.filepath },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true
      }
    })
    
    return reply.send({
      success: true,
      message: '头像上传成功',
      data: {
        user: updatedUser,
        file: {
          url: uploadedFile.filepath,
          size: uploadedFile.size
        }
      }
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '上传失败'
    })
  }
}

/**
 * 上传封面
 */
export async function uploadCover(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const uploadedFile = request.uploadedFile
    
    if (!uploadedFile) {
      return reply.code(400).send({
        success: false,
        message: '未检测到上传文件'
      })
    }
    
    // 处理封面（压缩、调整尺寸）
    const publicPath = path.join('public', uploadedFile.filepath)
    await processCover(publicPath, publicPath)
    
    return reply.send({
      success: true,
      message: '封面上传成功',
      data: {
        file: {
          url: uploadedFile.filepath,
          filename: uploadedFile.filename,
          mimetype: uploadedFile.mimetype,
          size: uploadedFile.size
        }
      }
    })
  } catch (error: any) {
    // 删除已上传的文件
    if (request.uploadedFile) {
      deleteFile(request.uploadedFile.filepath)
    }
    
    return reply.code(500).send({
      success: false,
      message: error.message || '上传失败'
    })
  }
}

/**
 * 上传通用图片
 */
export async function uploadImage(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const uploadedFile = request.uploadedFile
    
    if (!uploadedFile) {
      return reply.code(400).send({
        success: false,
        message: '未检测到上传文件'
      })
    }
    
    return reply.send({
      success: true,
      message: '图片上传成功',
      data: {
        file: {
          url: uploadedFile.filepath,
          filename: uploadedFile.filename,
          mimetype: uploadedFile.mimetype,
          size: uploadedFile.size
        }
      }
    })
  } catch (error: any) {
    // 删除已上传的文件
    if (request.uploadedFile) {
      deleteFile(request.uploadedFile.filepath)
    }
    
    return reply.code(500).send({
      success: false,
      message: error.message || '上传失败'
    })
  }
}

/**
 * 删除文件
 */
export async function deleteUploadedFile(
  request: FastifyRequest<{
    Body: {
      filepath: string
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { filepath } = request.body
    
    if (!filepath) {
      return reply.code(400).send({
        success: false,
        message: '缺少文件路径参数'
      })
    }
    
    // 删除文件
    const deleted = deleteFile(filepath)
    
    if (!deleted) {
      return reply.code(404).send({
        success: false,
        message: '文件不存在'
      })
    }
    
    return reply.send({
      success: true,
      message: '文件删除成功'
    })
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message || '删除失败'
    })
  }
}

