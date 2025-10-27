/**
 * 密码加密工具
 * 使用bcrypt进行密码哈希和验证
 */

import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

/**
 * 哈希密码
 * @param password - 明文密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

/**
 * 验证密码
 * @param password - 明文密码
 * @param hash - 哈希密码
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * 验证密码强度
 * @param password - 密码
 * @returns 是否符合强度要求
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  message?: string
} {
  // 最少8位
  if (password.length < 8) {
    return { valid: false, message: '密码至少需要8个字符' }
  }
  
  // 最多72位（bcrypt限制）
  if (password.length > 72) {
    return { valid: false, message: '密码最多72个字符' }
  }
  
  // 必须包含字母和数字
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: '密码必须包含字母和数字' }
  }
  
  return { valid: true }
}

