// ==========================================
// 用户API接口
// ==========================================

import request from '@/utils/request'
import type { ApiResponse, User, Novel } from '@/types'

/**
 * 获取用户信息
 */
export const getUserInfo = (userId: number) => {
  return request.get<ApiResponse<User>>(`/users/${userId}`)
}

/**
 * 更新用户信息
 */
export const updateUserInfo = (data: {
  username?: string
  bio?: string
  avatar?: string
}) => {
  return request.put<ApiResponse<User>>('/users/me', data)
}

/**
 * 修改密码
 */
export const changePassword = (data: {
  oldPassword: string
  newPassword: string
}) => {
  return request.put<ApiResponse>('/users/me/password', data)
}

/**
 * 获取用户收藏列表
 */
export const getUserFavorites = (params?: {
  page?: number
  pageSize?: number
}) => {
  return request.get<ApiResponse<{
    items: Novel[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }>>('/users/me/favorites', { params })
}

/**
 * 获取用户阅读历史
 */
export const getUserHistory = (params?: {
  page?: number
  pageSize?: number
}) => {
  return request.get<ApiResponse<{
    items: any[]
    pagination: any
  }>>('/users/me/history', { params })
}

/**
 * 获取用户的小说列表
 */
export const getUserNovels = (params?: {
  page?: number
  pageSize?: number
}) => {
  return request.get<ApiResponse<{
    items: Novel[]
    pagination: any
  }>>('/users/me/novels', { params })
}

