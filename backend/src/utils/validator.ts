/**
 * 数据验证工具
 * 用于验证用户输入
 */

/**
 * 验证邮箱格式
 * @param email - 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证用户名格式
 * @param username - 用户名
 * @returns 是否有效
 */
export function isValidUsername(username: string): boolean {
  // 3-20个字符，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * 清理HTML标签（防XSS）
 * @param str - 输入字符串
 * @returns 清理后的字符串
 */
export function sanitizeHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

/**
 * 验证分页参数
 * @param page - 页码
 * @param pageSize - 每页数量
 * @returns 验证后的参数
 */
export function validatePagination(page?: number, pageSize?: number) {
  const validPage = Math.max(1, page || 1)
  const validPageSize = Math.min(100, Math.max(1, pageSize || 20))
  
  return {
    page: validPage,
    pageSize: validPageSize,
    skip: (validPage - 1) * validPageSize
  }
}

