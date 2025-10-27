<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNovelDetail } from '@/api/novel'
import type { Novel } from '@/types'

const route = useRoute()
const router = useRouter()
const novel = ref<Novel | null>(null)
const loading = ref(false)

const loadNovelDetail = async () => {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    const response = await getNovelDetail(id)
    if (response.success && response.data) {
      novel.value = response.data
    }
  } catch (error) {
    console.error('加载小说详情失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNovelDetail()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <el-button @click="router.back()" class="mb-4">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>

      <div v-if="loading" class="text-center py-20">
        <el-icon class="is-loading" :size="50"><Loading /></el-icon>
      </div>

      <div v-else-if="novel" class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-bold mb-4">{{ novel.title }}</h1>
        <div class="text-gray-600 mb-6">
          <span>作者: @{{ novel.author?.username }}</span>
          <span class="mx-4">浏览: {{ novel.views }}</span>
          <span>点赞: {{ novel.likes }}</span>
        </div>
        <div class="prose max-w-none">
          <p>{{ novel.summary }}</p>
        </div>
      </div>

      <el-empty v-else description="小说不存在" />
    </div>
  </div>
</template>

