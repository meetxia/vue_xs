<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <el-button @click="router.back()" class="mb-4">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>

      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-bold mb-6">个人中心</h1>
        
        <div v-if="authStore.currentUser" class="space-y-4">
          <div class="flex items-center space-x-4 mb-6">
            <el-avatar :size="80" :src="authStore.currentUser.avatar">
              {{ authStore.currentUser.username.charAt(0).toUpperCase() }}
            </el-avatar>
            <div>
              <h2 class="text-2xl font-bold">{{ authStore.currentUser.username }}</h2>
              <p class="text-gray-600">{{ authStore.currentUser.email }}</p>
            </div>
          </div>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">
              {{ authStore.currentUser.username }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ authStore.currentUser.email }}
            </el-descriptions-item>
            <el-descriptions-item label="个人简介">
              {{ authStore.currentUser.bio || '暂无简介' }}
            </el-descriptions-item>
            <el-descriptions-item label="会员类型">
              {{ authStore.currentUser.membershipType || 'free' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ new Date(authStore.currentUser.createdAt).toLocaleDateString() }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </div>
  </div>
</template>

