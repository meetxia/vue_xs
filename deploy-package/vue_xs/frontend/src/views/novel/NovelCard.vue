<template>
  <Card shadow="hover" padding="none" class="novel-card" @click="handleClick">
    <div class="novel-cover-wrapper">
      <img
        :src="novel.cover || defaultCover"
        :alt="novel.title"
        class="novel-cover"
      />
      <div class="novel-overlay">
        <Button type="primary" size="small">
          <el-icon><Reading /></el-icon>
          开始阅读
        </Button>
      </div>
    </div>
    
    <div class="novel-info">
      <h3 class="novel-title">{{ novel.title }}</h3>
      <p class="novel-author">
        <el-icon><User /></el-icon>
        {{ novel.author?.username || '佚名' }}
      </p>
      <p class="novel-desc">{{ truncateText(novel.summary, 60) }}</p>
      
      <div class="novel-tags" v-if="novel.tags && novel.tags.length">
        <el-tag
          v-for="tag in novel.tags.slice(0, 3)"
          :key="tag"
          size="small"
          type="info"
        >
          {{ tag }}
        </el-tag>
      </div>
      
      <div class="novel-meta">
        <span class="meta-item">
          <el-icon><View /></el-icon>
          {{ formatNumber(novel.views || 0) }}
        </span>
        <span class="meta-item">
          <el-icon><Star /></el-icon>
          {{ formatNumber(novel.likes || 0) }}
        </span>
        <span class="meta-item">
          <el-icon><ChatDotRound /></el-icon>
          {{ formatNumber(novel.comments || 0) }}
        </span>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Reading, User, View, Star, ChatDotRound } from '@element-plus/icons-vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import type { Novel } from '@/types'

interface Props {
  novel: Novel
}

const props = defineProps<Props>()
const router = useRouter()

const defaultCover = 'https://via.placeholder.com/200x280?text=No+Cover'

const handleClick = () => {
  router.push(`/novel/${props.novel.id}`)
}

const truncateText = (text: string | undefined, maxLength: number) => {
  if (!text) return '暂无简介'
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}
</script>

<style scoped>
.novel-card {
  @apply cursor-pointer transition-all duration-300;
}

.novel-card:hover {
  @apply transform -translate-y-1;
}

.novel-cover-wrapper {
  @apply relative overflow-hidden;
  padding-top: 140%; /* 5:7 aspect ratio */
}

.novel-cover {
  @apply absolute inset-0 w-full h-full object-cover;
}

.novel-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 
         flex items-center justify-center 
         opacity-0 hover:opacity-100 
         transition-opacity duration-300;
}

.novel-info {
  @apply p-4 space-y-2;
}

.novel-title {
  @apply text-base font-bold text-gray-800 
         line-clamp-1 hover:text-blue-600 
         transition-colors duration-200;
}

.novel-author {
  @apply text-sm text-gray-600 flex items-center gap-1;
}

.novel-desc {
  @apply text-sm text-gray-500 line-clamp-2;
  min-height: 2.5rem;
}

.novel-tags {
  @apply flex flex-wrap gap-1;
}

.novel-meta {
  @apply flex items-center gap-4 text-xs text-gray-500 pt-2 border-t;
}

.meta-item {
  @apply flex items-center gap-1;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

