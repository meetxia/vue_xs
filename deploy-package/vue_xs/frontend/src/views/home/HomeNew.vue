<template>
  <div class="home-page">
    <!-- 顶部Banner -->
    <div class="hero-banner">
      <Container max-width="xl">
        <div class="hero-content">
          <h1 class="hero-title">探索无限精彩的小说世界</h1>
          <p class="hero-subtitle">海量原创小说，每日更新，随时随地畅读</p>
          <div class="hero-actions">
            <Button type="primary" size="large" @click="scrollToNovels">
              <el-icon><Reading /></el-icon>
              开始阅读
            </Button>
            <Button size="large" plain @click="router.push('/categories')">
              <el-icon><Menu /></el-icon>
              浏览分类
            </Button>
          </div>
        </div>
      </Container>
    </div>

    <!-- 搜索栏 -->
    <Container max-width="xl" class="search-section">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          size="large"
          placeholder="搜索小说、作者..."
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
    </Container>

    <!-- 分类标签 -->
    <Container max-width="xl" class="categories-section">
      <div class="categories-tabs">
        <el-tag
          v-for="category in categories"
          :key="category.value"
          :type="selectedCategory === category.value ? 'primary' : 'info'"
          :effect="selectedCategory === category.value ? 'dark' : 'plain'"
          size="large"
          class="category-tag"
          @click="selectCategory(category.value)"
        >
          {{ category.label }}
        </el-tag>
      </div>
    </Container>

    <!-- 小说瀑布流 -->
    <Container max-width="xl" class="novels-section" ref="novelsRef">
      <div class="section-header">
        <h2 class="section-title">
          {{ selectedCategory === 'all' ? '全部小说' : `${getCategoryLabel(selectedCategory)}小说` }}
        </h2>
        <div class="section-actions">
          <el-dropdown @command="handleSortChange">
            <el-button>
              {{ getSortLabel(sortBy) }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="latest">最新发布</el-dropdown-item>
                <el-dropdown-item command="hot">最热门</el-dropdown-item>
                <el-dropdown-item command="popular">最受欢迎</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 加载中 -->
      <Loading v-if="initialLoading" :visible="true" text="加载中..." />

      <!-- 瀑布流布局 -->
      <WaterfallLayout v-else :items="novels" :column-count="4" :gap="20">
        <template #item="{ item }">
          <NovelCard :novel="item" />
        </template>
      </WaterfallLayout>

      <!-- 加载更多提示 -->
      <div v-if="loadingMore" class="loading-more">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载更多...</span>
      </div>

      <!-- 没有更多了 -->
      <div v-if="noMore && novels.length > 0" class="no-more">
        <el-divider>已经到底了</el-divider>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!initialLoading && novels.length === 0" description="暂无小说">
        <Button type="primary" @click="loadNovels">刷新</Button>
      </el-empty>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search,
  Reading,
  Menu,
  ArrowDown,
  Loading as LoadingIcon
} from '@element-plus/icons-vue'
import Container from '@/components/layout/Container.vue'
import Button from '@/components/common/Button.vue'
import Loading from '@/components/common/Loading.vue'
import WaterfallLayout from '@/components/common/WaterfallLayout.vue'
import NovelCard from '@/views/novel/NovelCard.vue'
import { useNovelStore } from '@/stores/novel'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import type { Novel } from '@/types'

const router = useRouter()
const novelStore = useNovelStore()

// 状态
const novels = ref<Novel[]>([])
const initialLoading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const pageSize = 20
const total = ref(0)
const searchQuery = ref('')
const selectedCategory = ref('all')
const sortBy = ref('latest')
const novelsRef = ref<HTMLElement>()

// 计算属性
const noMore = computed(() => novels.value.length >= total.value)
const hasMore = () => !noMore.value

// 分类列表
const categories = [
  { label: '全部', value: 'all' },
  { label: '玄幻', value: 'fantasy' },
  { label: '武侠', value: 'wuxia' },
  { label: '仙侠', value: 'xianxia' },
  { label: '都市', value: 'urban' },
  { label: '历史', value: 'history' },
  { label: '科幻', value: 'sci-fi' },
  { label: '游戏', value: 'game' },
  { label: '言情', value: 'romance' }
]

// 加载小说列表
const loadNovels = async (append = false) => {
  if (!append) {
    initialLoading.value = true
    currentPage.value = 1
  } else {
    loadingMore.value = true
  }

  try {
    const response = await novelStore.fetchNovels({
      page: currentPage.value,
      pageSize,
      category: selectedCategory.value === 'all' ? undefined : selectedCategory.value,
      sort: sortBy.value
    })

    if (append) {
      novels.value = [...novels.value, ...novelStore.novels]
    } else {
      novels.value = novelStore.novels
    }
    
    total.value = novelStore.total
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    initialLoading.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (loadingMore.value || noMore.value) return
  
  currentPage.value++
  await loadNovels(true)
}

// 无限滚动
useInfiniteScroll({
  onLoad: loadMore,
  hasMore,
  threshold: 300
})

// 搜索
const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push({
    path: '/search',
    query: { q: searchQuery.value }
  })
}

// 选择分类
const selectCategory = (category: string) => {
  selectedCategory.value = category
  loadNovels()
}

// 排序变化
const handleSortChange = (command: string) => {
  sortBy.value = command
  loadNovels()
}

// 滚动到小说区域
const scrollToNovels = () => {
  novelsRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// 获取分类标签
const getCategoryLabel = (value: string) => {
  return categories.find(c => c.value === value)?.label || '全部'
}

// 获取排序标签
const getSortLabel = (value: string) => {
  const labels: Record<string, string> = {
    latest: '最新发布',
    hot: '最热门',
    popular: '最受欢迎'
  }
  return labels[value] || '最新发布'
}

// 初始加载
loadNovels()
</script>

<style scoped>
.home-page {
  @apply min-h-screen bg-gray-50;
}

.hero-banner {
  @apply bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20;
}

.hero-content {
  @apply text-center space-y-6;
}

.hero-title {
  @apply text-5xl font-bold mb-4;
}

.hero-subtitle {
  @apply text-xl opacity-90;
}

.hero-actions {
  @apply flex justify-center gap-4 mt-8;
}

.search-section {
  @apply py-8;
}

.search-bar {
  @apply max-w-2xl mx-auto;
}

.categories-section {
  @apply pb-6;
}

.categories-tabs {
  @apply flex flex-wrap gap-3 justify-center;
}

.category-tag {
  @apply cursor-pointer transition-all duration-200;
}

.category-tag:hover {
  @apply transform scale-105;
}

.novels-section {
  @apply pb-12;
}

.section-header {
  @apply flex items-center justify-between mb-6;
}

.section-title {
  @apply text-2xl font-bold text-gray-800;
}

.section-actions {
  @apply flex items-center gap-3;
}

.loading-more {
  @apply flex items-center justify-center gap-2 py-8 text-gray-500;
}

.no-more {
  @apply py-8;
}

@media (max-width: 768px) {
  .hero-title {
    @apply text-3xl;
  }
  
  .hero-subtitle {
    @apply text-base;
  }
  
  .hero-actions {
    @apply flex-col;
  }
}
</style>

