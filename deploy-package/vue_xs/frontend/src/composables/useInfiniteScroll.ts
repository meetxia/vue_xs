// ==========================================
// 无限滚动Composable
// ==========================================

import { ref, onMounted, onBeforeUnmount } from 'vue'

export interface InfiniteScrollOptions {
  // 距离底部多少像素时触发加载
  threshold?: number
  // 加载函数
  onLoad: () => Promise<void>
  // 是否还有更多数据
  hasMore: () => boolean
  // 目标元素（默认window）
  target?: HTMLElement | null
}

export function useInfiniteScroll(options: InfiniteScrollOptions) {
  const {
    threshold = 200,
    onLoad,
    hasMore,
    target = null
  } = options

  const loading = ref(false)
  const finished = ref(false)

  // 检查是否需要加载更多
  const checkScroll = async () => {
    if (loading.value || finished.value) return

    const scrollTarget = target || window
    const scrollElement = target || document.documentElement

    let scrollTop: number
    let scrollHeight: number
    let clientHeight: number

    if (target) {
      scrollTop = target.scrollTop
      scrollHeight = target.scrollHeight
      clientHeight = target.clientHeight
    } else {
      scrollTop = window.pageYOffset || document.documentElement.scrollTop
      scrollHeight = document.documentElement.scrollHeight
      clientHeight = window.innerHeight
    }

    const distanceToBottom = scrollHeight - scrollTop - clientHeight

    if (distanceToBottom <= threshold) {
      if (!hasMore()) {
        finished.value = true
        return
      }

      loading.value = true
      try {
        await onLoad()
      } catch (error) {
        console.error('加载更多失败:', error)
      } finally {
        loading.value = false
      }
    }
  }

  // 节流函数
  let timer: ReturnType<typeof setTimeout> | null = null
  const throttledCheck = () => {
    if (timer) return
    timer = setTimeout(() => {
      checkScroll()
      timer = null
    }, 200)
  }

  onMounted(() => {
    const scrollTarget = target || window
    scrollTarget.addEventListener('scroll', throttledCheck as EventListener)
    // 初始检查
    checkScroll()
  })

  onBeforeUnmount(() => {
    const scrollTarget = target || window
    scrollTarget.removeEventListener('scroll', throttledCheck as EventListener)
    if (timer) {
      clearTimeout(timer)
    }
  })

  // 重置状态
  const reset = () => {
    finished.value = false
    loading.value = false
  }

  return {
    loading,
    finished,
    reset
  }
}

