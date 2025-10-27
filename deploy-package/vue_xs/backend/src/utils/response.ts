/**
 * 统一响应格式工具
 * 优化：Day 5 新增
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

/**
 * 成功响应
 */
export function success<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }
}

/**
 * 错误响应
 */
export function error(code: string, message: string, details?: any): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * 分页响应
 */
export interface PaginationResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<PaginationResponse<T>> {
  return success({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  })
}

/**
 * 错误代码常量
 */
export const ErrorCodes = {
  // 认证相关 (1xxx)
  UNAUTHORIZED: 'AUTH_1001',
  INVALID_TOKEN: 'AUTH_1002',
  TOKEN_EXPIRED: 'AUTH_1003',
  INVALID_CREDENTIALS: 'AUTH_1004',
  
  // 验证相关 (2xxx)
  VALIDATION_ERROR: 'VALID_2001',
  INVALID_INPUT: 'VALID_2002',
  MISSING_FIELD: 'VALID_2003',
  
  // 资源相关 (3xxx)
  NOT_FOUND: 'RES_3001',
  ALREADY_EXISTS: 'RES_3002',
  FORBIDDEN: 'RES_3003',
  
  // 服务器相关 (5xxx)
  INTERNAL_ERROR: 'SRV_5001',
  DATABASE_ERROR: 'SRV_5002',
  EXTERNAL_API_ERROR: 'SRV_5003'
} as const

