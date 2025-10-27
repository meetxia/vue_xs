import { FastifyRequest, FastifyReply } from 'fastify'
import { MultipartFile } from '@fastify/multipart'
import * as fs from 'fs'
import * as path from 'path'
import { randomBytes } from 'crypto'

/**
 * 文件上传配置
 */
export const UPLOAD_CONFIG = {
  // 允许的图片类型
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // 允许的文件类型
  allowedFileTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain'
  ],
  
  // 文件大小限制（字节）
  maxFileSize: {
    avatar: 2 * 1024 * 1024,      // 头像: 2MB
    cover: 5 * 1024 * 1024,        // 封面: 5MB
    image: 10 * 1024 * 1024        // 普通图片: 10MB
  },
  
  // 上传目录
  uploadDir: {
    avatar: 'public/uploads/avatars',
    cover: 'public/uploads/covers',
    image: 'public/uploads/images'
  }
}

/**
 * 文件上传错误代码
 */
export enum UploadErrorCode {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  NO_FILE = 'NO_FILE'
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename)
  const randomStr = randomBytes(16).toString('hex')
  const timestamp = Date.now()
  return `${timestamp}-${randomStr}${ext}`
}

/**
 * 确保目录存在
 */
export function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 验证文件类型
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType)
}

/**
 * 验证文件大小
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number
): boolean {
  return fileSize <= maxSize
}

/**
 * 保存上传文件
 */
export async function saveUploadedFile(
  file: MultipartFile,
  uploadDir: string
): Promise<string> {
  try {
    // 确保目录存在
    ensureDirectoryExists(uploadDir)
    
    // 生成唯一文件名
    const filename = generateUniqueFilename(file.filename)
    const filepath = path.join(uploadDir, filename)
    
    // 写入文件
    const buffer = await file.toBuffer()
    fs.writeFileSync(filepath, buffer)
    
    // 返回相对路径（用于数据库存储和前端访问）
    const relativePath = filepath.replace('public/', '/')
    return relativePath
  } catch (error) {
    throw new Error('文件保存失败')
  }
}

/**
 * 删除文件
 */
export function deleteFile(filepath: string): boolean {
  try {
    const fullPath = path.join('public', filepath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

/**
 * 头像上传中间件
 */
export async function avatarUploadMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const file = await request.file()
    
    if (!file) {
      const error: any = new Error('未检测到上传文件')
      error.code = UploadErrorCode.NO_FILE
      throw error
    }
    
    // 验证文件类型
    if (!validateFileType(file.mimetype, UPLOAD_CONFIG.allowedImageTypes)) {
      const error: any = new Error('不支持的文件类型，请上传图片文件')
      error.code = UploadErrorCode.INVALID_FILE_TYPE
      throw error
    }
    
    // 验证文件大小
    const buffer = await file.toBuffer()
    if (!validateFileSize(buffer.length, UPLOAD_CONFIG.maxFileSize.avatar)) {
      const error: any = new Error('文件大小超过限制（最大2MB）')
      error.code = UploadErrorCode.FILE_TOO_LARGE
      throw error
    }
    
    // 保存文件
    const filepath = await saveUploadedFile(file, UPLOAD_CONFIG.uploadDir.avatar)
    
    // 将文件路径添加到request对象
    request.uploadedFile = {
      filepath,
      filename: file.filename,
      mimetype: file.mimetype,
      size: buffer.length
    }
  } catch (error: any) {
    throw error
  }
}

/**
 * 封面上传中间件
 */
export async function coverUploadMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const file = await request.file()
    
    if (!file) {
      const error: any = new Error('未检测到上传文件')
      error.code = UploadErrorCode.NO_FILE
      throw error
    }
    
    // 验证文件类型
    if (!validateFileType(file.mimetype, UPLOAD_CONFIG.allowedImageTypes)) {
      const error: any = new Error('不支持的文件类型，请上传图片文件')
      error.code = UploadErrorCode.INVALID_FILE_TYPE
      throw error
    }
    
    // 验证文件大小
    const buffer = await file.toBuffer()
    if (!validateFileSize(buffer.length, UPLOAD_CONFIG.maxFileSize.cover)) {
      const error: any = new Error('文件大小超过限制（最大5MB）')
      error.code = UploadErrorCode.FILE_TOO_LARGE
      throw error
    }
    
    // 保存文件
    const filepath = await saveUploadedFile(file, UPLOAD_CONFIG.uploadDir.cover)
    
    // 将文件路径添加到request对象
    request.uploadedFile = {
      filepath,
      filename: file.filename,
      mimetype: file.mimetype,
      size: buffer.length
    }
  } catch (error: any) {
    throw error
  }
}

/**
 * 通用图片上传中间件
 */
export async function imageUploadMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const file = await request.file()
    
    if (!file) {
      const error: any = new Error('未检测到上传文件')
      error.code = UploadErrorCode.NO_FILE
      throw error
    }
    
    // 验证文件类型
    if (!validateFileType(file.mimetype, UPLOAD_CONFIG.allowedImageTypes)) {
      const error: any = new Error('不支持的文件类型，请上传图片文件')
      error.code = UploadErrorCode.INVALID_FILE_TYPE
      throw error
    }
    
    // 验证文件大小
    const buffer = await file.toBuffer()
    if (!validateFileSize(buffer.length, UPLOAD_CONFIG.maxFileSize.image)) {
      const error: any = new Error('文件大小超过限制（最大10MB）')
      error.code = UploadErrorCode.FILE_TOO_LARGE
      throw error
    }
    
    // 保存文件
    const filepath = await saveUploadedFile(file, UPLOAD_CONFIG.uploadDir.image)
    
    // 将文件路径添加到request对象
    request.uploadedFile = {
      filepath,
      filename: file.filename,
      mimetype: file.mimetype,
      size: buffer.length
    }
  } catch (error: any) {
    throw error
  }
}

// 扩展FastifyRequest类型
declare module 'fastify' {
  interface FastifyRequest {
    uploadedFile?: {
      filepath: string
      filename: string
      mimetype: string
      size: number
    }
  }
}

