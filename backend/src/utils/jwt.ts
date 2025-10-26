/**
 * JWT工具函数
 * 用于生成和验证JWT Token
 */

import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-12345678'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

/**
 * 生成JWT Token
 * @param payload - JWT载荷
 * @returns JWT Token字符串
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/**
 * 验证JWT Token
 * @param token - JWT Token字符串
 * @returns 解析后的载荷
 * @throws 如果Token无效或过期
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token已过期')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token无效')
    }
    throw new Error('Token验证失败')
  }
}

/**
 * 解码JWT Token（不验证签名）
 * @param token - JWT Token字符串
 * @returns 解析后的载荷
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * 从Authorization header中提取Token
 * @param authHeader - Authorization header值
 * @returns Token字符串或null
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null
  }
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

