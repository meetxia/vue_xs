// ==========================================
// 认证相关API
// ==========================================

import request from '@/utils/request'
import type { LoginRequest, RegisterRequest, LoginResponse, User, ApiResponse } from '@/types'

/**
 * 用户注册
 */
export function register(data: RegisterRequest) {
  return request<ApiResponse<LoginResponse>>({
    url: '/api/auth/register',
    method: 'post',
    data
  })
}

/**
 * 用户登录
 */
export function login(data: LoginRequest) {
  return request<ApiResponse<LoginResponse>>({
    url: '/api/auth/login',
    method: 'post',
    data
  })
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return request<ApiResponse<User>>({
    url: '/api/auth/me',
    method: 'get'
  })
}

/**
 * 退出登录
 */
export function logout() {
  return request<ApiResponse<void>>({
    url: '/api/auth/logout',
    method: 'post'
  })
}

