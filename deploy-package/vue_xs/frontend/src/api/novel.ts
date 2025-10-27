// ==========================================
// 小说相关API
// ==========================================

import request from '@/utils/request'
import type { Novel, NovelListParams, ApiResponse } from '@/types'

/**
 * 获取小说列表
 */
export function getNovelList(params?: NovelListParams) {
  return request<ApiResponse<{ novels: Novel[]; total: number }>>({
    url: '/api/novels',
    method: 'get',
    params
  })
}

/**
 * 获取小说详情
 */
export function getNovelDetail(id: number) {
  return request<ApiResponse<Novel>>({
    url: `/api/novels/${id}`,
    method: 'get'
  })
}

/**
 * 点赞/取消点赞小说
 */
export function toggleLike(id: number) {
  return request<ApiResponse<{ isLiked: boolean }>>({
    url: `/api/novels/${id}/like`,
    method: 'post'
  })
}

/**
 * 收藏/取消收藏小说
 */
export function toggleFavorite(id: number) {
  return request<ApiResponse<{ isFavorited: boolean }>>({
    url: `/api/novels/${id}/favorite`,
    method: 'post'
  })
}

