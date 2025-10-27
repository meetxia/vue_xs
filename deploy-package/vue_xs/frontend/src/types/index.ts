// ==========================================
// TypeScript类型定义
// ==========================================

export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  bio?: string
  membershipType?: string
  membershipExpiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface Novel {
  id: number
  title: string
  summary?: string
  content?: string
  category?: string
  tags?: string[]
  coverType: string
  coverData?: any
  views: number
  likes: number
  favorites: number
  status: string
  accessLevel: string
  authorId: number
  author?: {
    id: number
    username: string
    avatar?: string
  }
  publishedAt?: string
  createdAt: string
  updatedAt: string
  isLiked?: boolean
  isFavorited?: boolean
}

export interface Comment {
  id: number
  content: string
  novelId: number
  userId: number
  user?: {
    id: number
    username: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface NovelListParams extends PaginationParams {
  category?: string
  status?: string
  sort?: string
  order?: string
  search?: string
}

