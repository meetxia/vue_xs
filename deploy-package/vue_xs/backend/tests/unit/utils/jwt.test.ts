import { describe, it, expect } from 'vitest'
import { generateToken, verifyToken } from '../../../src/utils/jwt'

describe('JWT Utils', () => {
  const testPayload = {
    userId: 1,
    username: 'testuser',
    email: 'test@example.com'
  }

  describe('generateToken', () => {
    it('应该成功生成JWT token', () => {
      const token = generateToken(testPayload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT格式：header.payload.signature
    })

    it('相同数据生成的token应该不同（因为时间戳）', async () => {
      const token1 = generateToken(testPayload)
      
      // 等待1ms确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 1))
      
      const token2 = generateToken(testPayload)
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('verifyToken', () => {
    it('应该成功验证有效的token', () => {
      const token = generateToken(testPayload)
      const decoded = verifyToken(token)
      
      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.username).toBe(testPayload.username)
      expect(decoded.email).toBe(testPayload.email)
    })

    it('应该拒绝无效的token', () => {
      const invalidToken = 'invalid.token.here'
      
      expect(() => verifyToken(invalidToken)).toThrow()
    })

    it('应该拒绝空token', () => {
      expect(() => verifyToken('')).toThrow()
    })

    it('应该拒绝被篡改的token', () => {
      const token = generateToken(testPayload)
      const tamperedToken = token.slice(0, -5) + 'xxxxx'
      
      expect(() => verifyToken(tamperedToken)).toThrow()
    })
  })
})
