/**
 * 常量定义
 * 优化：Day 5 新增
 */

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1
} as const

// 小说状态
export const NOVEL_STATUS = {
  DRAFT: 'draft',           // 草稿
  PUBLISHED: 'published',   // 已发布
  ARCHIVED: 'archived'      // 已归档
} as const

// 访问级别
export const ACCESS_LEVEL = {
  FREE: 'free',             // 免费
  MEMBER: 'member',         // 会员
  VIP: 'vip'                // VIP
} as const

// 会员类型
export const MEMBERSHIP_TYPE = {
  FREE: 'free',             // 免费用户
  MONTHLY: 'monthly',       // 月度会员
  YEARLY: 'yearly',         // 年度会员
  LIFETIME: 'lifetime'      // 终身会员
} as const

// 文件上传限制
export const UPLOAD_LIMITS = {
  AVATAR_MAX_SIZE: 2 * 1024 * 1024,        // 2MB
  COVER_MAX_SIZE: 5 * 1024 * 1024,         // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  AVATAR_DIMENSIONS: { width: 200, height: 200 },
  COVER_DIMENSIONS: { width: 800, height: 600 }
} as const

// 内容限制
export const CONTENT_LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 50,
  EMAIL_MAX: 100,
  NOVEL_TITLE_MAX: 200,
  NOVEL_SUMMARY_MAX: 500,
  NOVEL_CONTENT_MIN: 100,
  COMMENT_MAX: 1000,
  BIO_MAX: 500
} as const

// 正则表达式
export const REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/.+/
} as const

// JWT配置
export const JWT_CONFIG = {
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ALGORITHM: 'HS256'
} as const

// 缓存TTL（秒）
export const CACHE_TTL = {
  SHORT: 60,              // 1分钟
  MEDIUM: 300,            // 5分钟
  LONG: 1800,             // 30分钟
  VERY_LONG: 3600         // 1小时
} as const

// 排序选项
export const SORT_OPTIONS = {
  CREATED_DESC: { createdAt: 'desc' },
  CREATED_ASC: { createdAt: 'asc' },
  VIEWS_DESC: { views: 'desc' },
  LIKES_DESC: { likes: 'desc' },
  UPDATED_DESC: { updatedAt: 'desc' }
} as const

// 错误消息
export const ERROR_MESSAGES = {
  // 认证
  UNAUTHORIZED: '未授权，请先登录',
  INVALID_TOKEN: 'Token无效',
  TOKEN_EXPIRED: 'Token已过期',
  INVALID_CREDENTIALS: '用户名或密码错误',
  
  // 用户
  USER_NOT_FOUND: '用户不存在',
  USER_ALREADY_EXISTS: '用户已存在',
  USERNAME_TAKEN: '用户名已被使用',
  EMAIL_TAKEN: '邮箱已被注册',
  
  // 小说
  NOVEL_NOT_FOUND: '小说不存在',
  NOVEL_FORBIDDEN: '无权访问此小说',
  
  // 评论
  COMMENT_NOT_FOUND: '评论不存在',
  COMMENT_FORBIDDEN: '无权操作此评论',
  
  // 通用
  VALIDATION_ERROR: '输入验证失败',
  INTERNAL_ERROR: '服务器内部错误',
  NOT_FOUND: '资源不存在',
  FORBIDDEN: '无权访问'
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  REGISTER_SUCCESS: '注册成功',
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出成功',
  CREATE_SUCCESS: '创建成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功'
} as const

