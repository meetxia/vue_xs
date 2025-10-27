import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Novel } from '@/types'
import * as novelApi from '@/api/novel'

export const useNovelStore = defineStore('novel', () => {
  // 状态
  const novels = ref<Novel[]>([])
  const currentNovel = ref<Novel | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // 计算属性
  const hasMore = computed(() => novels.value.length < total.value)

  // 获取小说列表
  const fetchNovels = async (params?: {
    page?: number
    pageSize?: number
    category?: string
    search?: string
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await novelApi.getNovelList({
        page: params?.page || currentPage.value,
        pageSize: params?.pageSize || pageSize.value,
        category: params?.category,
        search: params?.search
      })

      if (response.success && response.data) {
        novels.value = response.data.novels
        total.value = response.data.total
        currentPage.value = params?.page || currentPage.value
      }
    } catch (err: any) {
      error.value = err.message || '获取小说列表失败'
      console.error('获取小说列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取小说详情
  const fetchNovelDetail = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await novelApi.getNovelDetail(id)
      if (response.success && response.data) {
        currentNovel.value = response.data
      }
    } catch (err: any) {
      error.value = err.message || '获取小说详情失败'
      console.error('获取小说详情失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 点赞/取消点赞
  const toggleLike = async (novelId: number) => {
    try {
      const response = await novelApi.toggleLike(novelId)
      if (response.success) {
        // 更新本地数据
        const novel = novels.value.find(n => n.id === novelId)
        if (novel) {
          novel.isLiked = !novel.isLiked
          novel.likes = response.data?.likes || novel.likes
        }
        if (currentNovel.value && currentNovel.value.id === novelId) {
          currentNovel.value.isLiked = !currentNovel.value.isLiked
          currentNovel.value.likes = response.data?.likes || currentNovel.value.likes
        }
      }
      return response
    } catch (err: any) {
      error.value = err.message || '操作失败'
      throw err
    }
  }

  // 收藏/取消收藏
  const toggleFavorite = async (novelId: number) => {
    try {
      const response = await novelApi.toggleFavorite(novelId)
      if (response.success) {
        // 更新本地数据
        const novel = novels.value.find(n => n.id === novelId)
        if (novel) {
          novel.isFavorited = !novel.isFavorited
          novel.favorites = response.data?.favorites || novel.favorites
        }
        if (currentNovel.value && currentNovel.value.id === novelId) {
          currentNovel.value.isFavorited = !currentNovel.value.isFavorited
          currentNovel.value.favorites = response.data?.favorites || currentNovel.value.favorites
        }
      }
      return response
    } catch (err: any) {
      error.value = err.message || '操作失败'
      throw err
    }
  }

  // 搜索小说
  const searchNovels = async (keyword: string) => {
    return fetchNovels({ search: keyword, page: 1 })
  }

  // 重置状态
  const reset = () => {
    novels.value = []
    currentNovel.value = null
    loading.value = false
    error.value = null
    total.value = 0
    currentPage.value = 1
  }

  return {
    // 状态
    novels,
    currentNovel,
    loading,
    error,
    total,
    currentPage,
    pageSize,
    
    // 计算属性
    hasMore,
    
    // 方法
    fetchNovels,
    fetchNovelDetail,
    toggleLike,
    toggleFavorite,
    searchNovels,
    reset
  }
})

