// 全局类型定义

import { FastifyRequest } from 'fastify'

// ==========================================
// API 响应类型
// ==========================================

export interface ApiResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  success: true
  data: {
    items: T[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }
}

// ==========================================
// JWT Payload
// ==========================================

export interface JwtPayload {
  userId: number
  username: string
  email: string
  membershipType?: string
}

// ==========================================
// 认证请求扩展
// ==========================================

export interface AuthRequest extends FastifyRequest {
  user?: JwtPayload
}

// ==========================================
// 用户相关类型
// ==========================================

export interface RegisterDto {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface UpdateUserDto {
  username?: string
  bio?: string
  avatar?: string
}

export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

// ==========================================
// 小说相关类型
// ==========================================

export interface CreateNovelDto {
  title: string
  summary?: string
  content: string
  category?: string
  tags?: string[]
  coverType?: 'text' | 'image' | 'gradient'
  coverData?: any
  status?: 'draft' | 'published'
  accessLevel?: 'free' | 'member' | 'premium'
}

export interface UpdateNovelDto {
  title?: string
  summary?: string
  content?: string
  category?: string
  tags?: string[]
  coverType?: 'text' | 'image' | 'gradient'
  coverData?: any
  status?: 'draft' | 'published' | 'archived'
  accessLevel?: 'free' | 'member' | 'premium'
}

export interface NovelQuery {
  page?: number
  pageSize?: number
  category?: string
  status?: string
  sort?: 'createdAt' | 'views' | 'likes' | 'favorites'
  order?: 'asc' | 'desc'
  search?: string
}

// ==========================================
// 评论相关类型
// ==========================================

export interface CreateCommentDto {
  content: string
}

export interface CommentQuery {
  page?: number
  pageSize?: number
  sort?: 'createdAt'
  order?: 'asc' | 'desc'
}

// ==========================================
// 错误代码
// ==========================================

export enum ErrorCode {
  // 认证错误
  AUTH_UNAUTHORIZED = 'AUTH_001',
  AUTH_INVALID_TOKEN = 'AUTH_002',
  AUTH_INVALID_CREDENTIALS = 'AUTH_003',
  AUTH_USER_NOT_FOUND = 'AUTH_004',
  AUTH_USER_DISABLED = 'AUTH_005',
  
  // 用户错误
  USER_USERNAME_EXISTS = 'USER_001',
  USER_EMAIL_EXISTS = 'USER_002',
  USER_VALIDATION_FAILED = 'USER_003',
  USER_WRONG_PASSWORD = 'USER_004',
  
  // 小说错误
  NOVEL_NOT_FOUND = 'NOVEL_001',
  NOVEL_NO_PERMISSION = 'NOVEL_002',
  NOVEL_TITLE_REQUIRED = 'NOVEL_003',
  NOVEL_CONTENT_REQUIRED = 'NOVEL_004',
  
  // 评论错误
  COMMENT_NOT_FOUND = 'COMMENT_001',
  COMMENT_NO_PERMISSION = 'COMMENT_002',
  COMMENT_CONTENT_REQUIRED = 'COMMENT_003',
  
  // 文件错误
  FILE_TYPE_NOT_SUPPORTED = 'FILE_001',
  FILE_SIZE_EXCEEDED = 'FILE_002',
  FILE_UPLOAD_FAILED = 'FILE_003',
  
  // 系统错误
  SYSTEM_ERROR = 'SYSTEM_001',
  DATABASE_ERROR = 'SYSTEM_002',
}

