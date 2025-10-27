// ==========================================
// 评论API接口
// ==========================================

import request from '@/utils/request'
import type { ApiResponse, Comment } from '@/types'

/**
 * 获取小说评论列表
 */
export const getComments = (novelId: number, params?: {
  page?: number
  pageSize?: number
}) => {
  return request.get<ApiResponse<{
    items: Comment[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }>>(`/novels/${novelId}/comments`, { params })
}

/**
 * 发表评论
 */
export const createComment = (novelId: number, data: {
  content: string
}) => {
  return request.post<ApiResponse<Comment>>(`/novels/${novelId}/comments`, data)
}

/**
 * 删除评论
 */
export const deleteComment = (commentId: number) => {
  return request.delete<ApiResponse>(`/comments/${commentId}`)
}

/**
 * 获取用户评论列表
 */
export const getUserComments = (params?: {
  page?: number
  pageSize?: number
}) => {
  return request.get<ApiResponse<{
    items: Comment[]
    pagination: any
  }>>('/users/me/comments', { params })
}

