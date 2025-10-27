<template>
  <header class="site-header">
    <div class="header-container">
      <!-- Logo -->
      <div class="header-logo">
        <router-link to="/" class="logo-link">
          <el-icon class="logo-icon"><Reading /></el-icon>
          <span class="logo-text">MOMO小说</span>
        </router-link>
      </div>

      <!-- 导航菜单 -->
      <nav class="header-nav">
        <router-link to="/" class="nav-item">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </router-link>
        <router-link to="/novels" class="nav-item">
          <el-icon><Reading /></el-icon>
          <span>小说库</span>
        </router-link>
        <router-link to="/ranking" class="nav-item">
          <el-icon><TrendCharts /></el-icon>
          <span>排行榜</span>
        </router-link>
        <router-link to="/categories" class="nav-item">
          <el-icon><Menu /></el-icon>
          <span>分类</span>
        </router-link>
      </nav>

      <!-- 搜索框 -->
      <div class="header-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索小说、作者"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
        />
      </div>

      <!-- 用户操作 -->
      <div class="header-actions">
        <template v-if="authStore.isLoggedIn">
          <!-- 已登录 -->
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :src="authStore.user?.avatar" :size="32">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">{{ authStore.user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="favorites">
                  <el-icon><Star /></el-icon>
                  我的收藏
                </el-dropdown-item>
                <el-dropdown-item command="history">
                  <el-icon><Clock /></el-icon>
                  阅读历史
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        
        <template v-else>
          <!-- 未登录 -->
          <router-link to="/login" class="btn-login">登录</router-link>
          <router-link to="/register" class="btn-register">注册</router-link>
        </template>
      </div>

      <!-- 移动端菜单按钮 -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <el-icon><Menu /></el-icon>
      </button>
    </div>

    <!-- 移动端菜单 -->
    <Transition name="slide">
      <div v-if="mobileMenuVisible" class="mobile-menu">
        <router-link to="/" class="mobile-nav-item" @click="closeMobileMenu">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </router-link>
        <router-link to="/novels" class="mobile-nav-item" @click="closeMobileMenu">
          <el-icon><Reading /></el-icon>
          <span>小说库</span>
        </router-link>
        <router-link to="/ranking" class="mobile-nav-item" @click="closeMobileMenu">
          <el-icon><TrendCharts /></el-icon>
          <span>排行榜</span>
        </router-link>
        <router-link to="/categories" class="mobile-nav-item" @click="closeMobileMenu">
          <el-icon><Menu /></el-icon>
          <span>分类</span>
        </router-link>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Reading,
  House,
  TrendCharts,
  Menu,
  Search,
  User,
  ArrowDown,
  Star,
  Clock,
  SwitchButton
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const searchKeyword = ref('')
const mobileMenuVisible = ref(false)

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push({
    path: '/search',
    query: { q: searchKeyword.value }
  })
}

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'favorites':
      router.push('/favorites')
      break
    case 'history':
      router.push('/history')
      break
    case 'logout':
      authStore.logout()
      ElMessage.success('退出登录成功')
      router.push('/')
      break
  }
}

const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value
}

const closeMobileMenu = () => {
  mobileMenuVisible.value = false
}
</script>

<style scoped>
.site-header {
  @apply bg-white shadow-md sticky top-0 z-40;
}

.header-container {
  @apply max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4;
}

.header-logo {
  @apply flex-shrink-0;
}

.logo-link {
  @apply flex items-center gap-2 text-blue-600 hover:text-blue-700 
         transition-colors duration-200 no-underline;
}

.logo-icon {
  @apply text-2xl;
}

.logo-text {
  @apply text-xl font-bold hidden md:block;
}

.header-nav {
  @apply hidden md:flex items-center gap-1;
}

.nav-item {
  @apply flex items-center gap-1 px-3 py-2 rounded-md 
         text-gray-700 hover:bg-gray-100 hover:text-blue-600
         transition-all duration-200 no-underline;
}

.nav-item.router-link-active {
  @apply bg-blue-50 text-blue-600;
}

.header-search {
  @apply flex-1 max-w-md hidden md:block;
}

.header-actions {
  @apply flex items-center gap-3;
}

.user-info {
  @apply flex items-center gap-2 cursor-pointer 
         px-3 py-2 rounded-md hover:bg-gray-100
         transition-colors duration-200;
}

.username {
  @apply text-sm font-medium text-gray-700 hidden sm:block;
}

.btn-login,
.btn-register {
  @apply px-4 py-2 rounded-md font-medium transition-all duration-200 no-underline;
}

.btn-login {
  @apply text-gray-700 hover:bg-gray-100;
}

.btn-register {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.mobile-menu-btn {
  @apply md:hidden flex items-center justify-center w-10 h-10 
         rounded-md hover:bg-gray-100 transition-colors duration-200;
}

.mobile-menu {
  @apply md:hidden bg-white border-t border-gray-200 
         absolute top-16 left-0 right-0 shadow-lg;
}

.mobile-nav-item {
  @apply flex items-center gap-3 px-4 py-3 
         text-gray-700 hover:bg-gray-50 
         border-b border-gray-100 no-underline;
}

.mobile-nav-item.router-link-active {
  @apply bg-blue-50 text-blue-600;
}

/* 动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%);
}
</style>

