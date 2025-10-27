// ==========================================
// 文件上传API接口
// ==========================================

import request from '@/utils/request'
import type { ApiResponse } from '@/types'

/**
 * 上传图片
 */
export const uploadImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<{
    url: string
    filename: string
    size: number
  }>>('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传头像
 */
export const uploadAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<{
    url: string
    filename: string
    size: number
  }>>('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传小说封面
 */
export const uploadCover = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<{
    url: string
    filename: string
    size: number
  }>>('/upload/cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

