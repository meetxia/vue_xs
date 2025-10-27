// ==========================================
// Vue Router 配置
// ==========================================

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/Home.vue'),
    meta: { title: '首页 - MOMO炒饭店' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录 - MOMO炒饭店', requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册 - MOMO炒饭店', requiresGuest: true }
  },
  {
    path: '/novel/:id',
    name: 'NovelDetail',
    component: () => import('@/views/novel/NovelDetail.vue'),
    meta: { title: '小说详情 - MOMO炒饭店' }
  },
  {
    path: '/user/profile',
    name: 'UserProfile',
    component: () => import('@/views/user/UserProfile.vue'),
    meta: { title: '个人中心 - MOMO炒饭店', requiresAuth: true }
  },
  {
    path: '/profile',
    redirect: '/user/profile'
  },
  {
    path: '/read/:novelId/:chapterId',
    name: 'Reader',
    component: () => import('@/views/reader/Reader.vue'),
    meta: { title: '阅读 - MOMO炒饭店', hideLayout: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  document.title = (to.meta.title as string) || 'MOMO炒饭店'
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  // 已登录用户访问登录/注册页，跳转到首页
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Home' })
    return
  }
  
  next()
})

export default router

