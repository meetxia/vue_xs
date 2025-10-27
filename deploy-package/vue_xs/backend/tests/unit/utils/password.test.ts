import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength
} from '../../../src/utils/password'

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('应该成功加密密码', async () => {
      const password = 'Test123456!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
    })

    it('相同密码每次加密结果应不同', async () => {
      const password = 'Test123456!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('应该验证正确的密码', async () => {
      const password = 'Test123456!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)
      
      expect(isValid).toBe(true)
    })

    it('应该拒绝错误的密码', async () => {
      const password = 'Test123456!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('WrongPassword!', hash)
      
      expect(isValid).toBe(false)
    })

    it('应该拒绝空密码', async () => {
      const hash = await hashPassword('Test123456!')
      const isValid = await verifyPassword('', hash)
      
      expect(isValid).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('应该接受强密码', () => {
      const validPasswords = [
        'Test123456!',
        'MyP@ssw0rd',
        'Secure#2024'
      ]
      
      validPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('应该拒绝过短的密码', () => {
      const result = validatePasswordStrength('Test1!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('密码长度至少为8个字符')
    })

    it('应该拒绝没有数字的密码', () => {
      const result = validatePasswordStrength('TestPassword!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('密码必须包含至少一个数字')
    })

    it('应该拒绝没有大写字母的密码', () => {
      const result = validatePasswordStrength('test123456!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('密码必须包含至少一个大写字母')
    })

    it('应该拒绝没有小写字母的密码', () => {
      const result = validatePasswordStrength('TEST123456!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('密码必须包含至少一个小写字母')
    })
  })
})

