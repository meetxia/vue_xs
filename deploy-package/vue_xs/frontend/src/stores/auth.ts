// ==========================================
// 认证状态管理 (Pinia Store)
// ==========================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, RegisterRequest } from '@/types'
import { login as apiLogin, register as apiRegister, getUserInfo, logout as apiLogout } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))
  const loading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)

  // Actions
  /**
   * 用户登录
   */
  async function login(loginData: LoginRequest) {
    loading.value = true
    try {
      const response = await apiLogin(loginData)
      if (response.success && response.data) {
        token.value = response.data.token
        user.value = response.data.user
        
        // 保存到localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        ElMessage.success('登录成功！')
        return true
      }
      return false
    } catch (error: any) {
      console.error('登录失败:', error)
      ElMessage.error(error.message || '登录失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户注册
   */
  async function register(registerData: RegisterRequest) {
    loading.value = true
    try {
      const response = await apiRegister(registerData)
      if (response.success && response.data) {
        token.value = response.data.token
        user.value = response.data.user
        
        // 保存到localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        ElMessage.success('注册成功！')
        return true
      }
      return false
    } catch (error: any) {
      console.error('注册失败:', error)
      ElMessage.error(error.message || '注册失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前用户信息
   */
  async function fetchUserInfo() {
    if (!token.value) return false
    
    loading.value = true
    try {
      const response = await getUserInfo()
      if (response.success && response.data) {
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        return true
      }
      return false
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 退出登录
   */
  async function logout() {
    loading.value = true
    try {
      await apiLogout()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      // 无论API调用是否成功，都清除本地数据
      token.value = ''
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      loading.value = false
      
      ElMessage.success('已退出登录')
    }
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    currentUser,
    login,
    register,
    fetchUserInfo,
    logout
  }
})

