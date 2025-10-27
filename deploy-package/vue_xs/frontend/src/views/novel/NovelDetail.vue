<template>
  <div class="novel-detail-page">
    <Loading v-if="loading" :visible="true" fullscreen text="加载中..." />
    
    <Container v-else-if="novel" max-width="xl">
      <!-- 小说信息卡片 -->
      <Card class="novel-info-card mb-6">
        <div class="novel-header">
          <!-- 封面 -->
          <div class="novel-cover-container">
            <img
              :src="novel.cover || defaultCover"
              :alt="novel.title"
              class="novel-cover"
            />
          </div>

          <!-- 信息 -->
          <div class="novel-details">
            <h1 class="novel-title">{{ novel.title }}</h1>
            
            <div class="novel-meta-row">
              <router-link
                v-if="novel.author"
                :to="`/user/${novel.author.id}`"
                class="author-link"
              >
                <el-avatar :src="novel.author.avatar" :size="32">
                  {{ novel.author.username?.charAt(0) }}
                </el-avatar>
                <span>{{ novel.author.username }}</span>
              </router-link>

              <div class="novel-stats">
                <span class="stat-item">
                  <el-icon><View /></el-icon>
                  {{ formatNumber(novel.views) }} 阅读
                </span>
                <span class="stat-item">
                  <el-icon><Star /></el-icon>
                  {{ formatNumber(novel.likes) }} 点赞
                </span>
                <span class="stat-item">
                  <el-icon><Collection /></el-icon>
                  {{ formatNumber(novel.favorites) }} 收藏
                </span>
              </div>
            </div>

            <!-- 标签 -->
            <div class="novel-tags" v-if="novel.tags && novel.tags.length">
              <el-tag
                v-for="tag in novel.tags"
                :key="tag"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>

            <!-- 简介 -->
            <div class="novel-summary">
              <p>{{ novel.summary || '暂无简介' }}</p>
            </div>

            <!-- 操作按钮 -->
            <div class="novel-actions">
              <Button
                type="primary"
                size="large"
                @click="handleStartReading"
              >
                <el-icon><Reading /></el-icon>
                开始阅读
              </Button>
              
              <Button
                :type="novel.isLiked ? 'success' : 'default'"
                @click="handleToggleLike"
                :loading="actionLoading"
              >
                <el-icon>
                  <Star v-if="!novel.isLiked" />
                  <StarFilled v-else />
                </el-icon>
                {{ novel.isLiked ? '已点赞' : '点赞' }}
              </Button>
              
              <Button
                :type="novel.isFavorited ? 'warning' : 'default'"
                @click="handleToggleFavorite"
                :loading="actionLoading"
              >
                <el-icon>
                  <Collection v-if="!novel.isFavorited" />
                  <CollectionTag v-else />
                </el-icon>
                {{ novel.isFavorited ? '已收藏' : '收藏' }}
              </Button>

              <Button @click="handleShare">
                <el-icon><Share /></el-icon>
                分享
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <!-- 章节列表 -->
      <Card title="章节列表" class="chapters-card mb-6">
        <div v-if="chapters.length" class="chapters-list">
          <div
            v-for="chapter in chapters"
            :key="chapter.id"
            class="chapter-item"
            @click="handleReadChapter(chapter.id)"
          >
            <span class="chapter-title">{{ chapter.title }}</span>
            <span class="chapter-date">{{ formatDate(chapter.createdAt) }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无章节" />
      </Card>

      <!-- 评论区 -->
      <Card title="评论" class="comments-card">
        <template #header>
          <div class="comments-header">
            <h3>评论 ({{ comments.length }})</h3>
            <Button
              v-if="authStore.isAuthenticated"
              type="primary"
              @click="showCommentModal = true"
            >
              <el-icon><Edit /></el-icon>
              发表评论
            </Button>
          </div>
        </template>

        <div v-if="comments.length" class="comments-list">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <el-avatar :src="comment.user?.avatar" :size="40">
              {{ comment.user?.username?.charAt(0) }}
            </el-avatar>
            <div class="comment-content">
              <div class="comment-user">
                {{ comment.user?.username }}
                <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无评论，快来发表第一条评论吧！" />
      </Card>
    </Container>

    <!-- 错误页面 -->
    <div v-else-if="error" class="error-container">
      <el-result
        icon="error"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <Button type="primary" @click="loadNovelDetail">
            重新加载
          </Button>
        </template>
      </el-result>
    </div>

    <!-- 评论弹窗 -->
    <Modal
      v-model:visible="showCommentModal"
      title="发表评论"
      @confirm="handleSubmitComment"
      :loading="commentLoading"
    >
      <Input
        v-model="commentContent"
        type="textarea"
        :rows="5"
        placeholder="写下你的评论..."
        :maxlength="500"
        show-word-limit
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  View,
  Star,
  StarFilled,
  Collection,
  CollectionTag,
  Reading,
  Share,
  Edit
} from '@element-plus/icons-vue'
import Container from '@/components/layout/Container.vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Loading from '@/components/common/Loading.vue'
import Modal from '@/components/common/Modal.vue'
import Input from '@/components/common/Input.vue'
import { useNovelStore } from '@/stores/novel'
import { useAuthStore } from '@/stores/auth'
import * as commentApi from '@/api/comment'

const route = useRoute()
const router = useRouter()
const novelStore = useNovelStore()
const authStore = useAuthStore()

const novel = computed(() => novelStore.currentNovel)
const loading = ref(false)
const error = ref<string | null>(null)
const actionLoading = ref(false)

const chapters = ref<any[]>([])
const comments = ref<any[]>([])

const showCommentModal = ref(false)
const commentContent = ref('')
const commentLoading = ref(false)

const defaultCover = 'https://via.placeholder.com/300x420?text=No+Cover'

// 加载小说详情
const loadNovelDetail = async () => {
  const novelId = Number(route.params.id)
  if (isNaN(novelId)) {
    error.value = '无效的小说ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    await novelStore.fetchNovelDetail(novelId)
    // 加载评论列表
    await loadComments()
    // TODO: 加载章节列表
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

// 加载评论列表
const loadComments = async () => {
  const novelId = Number(route.params.id)
  try {
    const response = await commentApi.getComments(novelId, {
      page: 1,
      pageSize: 20
    })
    if (response.data.success && response.data.data) {
      comments.value = response.data.data.items
    }
  } catch (err: any) {
    console.error('加载评论失败:', err)
  }
}

// 开始阅读
const handleStartReading = () => {
  if (chapters.value.length > 0) {
    router.push(`/read/${novel.value?.id}/${chapters.value[0].id}`)
  } else {
    ElMessage.warning('暂无章节内容')
  }
}

// 点赞
const handleToggleLike = async () => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!novel.value) return

  actionLoading.value = true
  try {
    await novelStore.toggleLike(novel.value.id)
    ElMessage.success(novel.value.isLiked ? '点赞成功' : '取消点赞')
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

// 收藏
const handleToggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!novel.value) return

  actionLoading.value = true
  try {
    await novelStore.toggleFavorite(novel.value.id)
    ElMessage.success(novel.value.isFavorited ? '收藏成功' : '取消收藏')
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

// 分享
const handleShare = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  })
}

// 阅读章节
const handleReadChapter = (chapterId: number) => {
  router.push(`/read/${novel.value?.id}/${chapterId}`)
}

// 提交评论
const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  const novelId = Number(route.params.id)
  commentLoading.value = true
  
  try {
    const response = await commentApi.createComment(novelId, {
      content: commentContent.value
    })
    
    if (response.data.success) {
      ElMessage.success('评论发表成功')
      commentContent.value = ''
      showCommentModal.value = false
      // 刷新评论列表
      await loadComments()
    }
  } catch (err: any) {
    ElMessage.error(err.message || '发表失败')
  } finally {
    commentLoading.value = false
  }
}

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 格式化日期
const formatDate = (date: string) => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadNovelDetail()
})
</script>

<style scoped>
.novel-detail-page {
  @apply min-h-screen py-6;
}

.novel-info-card {
  @apply bg-gradient-to-br from-white to-gray-50;
}

.novel-header {
  @apply flex flex-col md:flex-row gap-6;
}

.novel-cover-container {
  @apply flex-shrink-0;
}

.novel-cover {
  @apply w-full md:w-64 rounded-lg shadow-lg;
}

.novel-details {
  @apply flex-1 space-y-4;
}

.novel-title {
  @apply text-3xl font-bold text-gray-800;
}

.novel-meta-row {
  @apply flex flex-wrap items-center gap-4;
}

.author-link {
  @apply flex items-center gap-2 text-gray-700 
         hover:text-blue-600 transition-colors duration-200 
         no-underline;
}

.novel-stats {
  @apply flex items-center gap-4 text-sm text-gray-600;
}

.stat-item {
  @apply flex items-center gap-1;
}

.novel-tags {
  @apply flex flex-wrap gap-2;
}

.novel-summary {
  @apply text-gray-600 leading-relaxed;
}

.novel-actions {
  @apply flex flex-wrap gap-3;
}

.chapters-list {
  @apply divide-y divide-gray-200;
}

.chapter-item {
  @apply flex items-center justify-between py-3 px-4 
         hover:bg-gray-50 cursor-pointer rounded-md 
         transition-colors duration-200;
}

.chapter-title {
  @apply text-gray-800 font-medium;
}

.chapter-date {
  @apply text-sm text-gray-500;
}

.comments-header {
  @apply flex items-center justify-between w-full;
}

.comments-list {
  @apply space-y-4;
}

.comment-item {
  @apply flex gap-3 p-4 bg-gray-50 rounded-lg;
}

.comment-content {
  @apply flex-1;
}

.comment-user {
  @apply flex items-center gap-2 mb-2 text-sm font-medium text-gray-800;
}

.comment-date {
  @apply text-xs text-gray-500 font-normal;
}

.comment-text {
  @apply text-gray-600 leading-relaxed;
}

.error-container {
  @apply min-h-screen flex items-center justify-center;
}
</style>

