import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateUsername,
  sanitizeInput
} from '../../../src/utils/validator'

describe('Validator Utils', () => {
  describe('validateEmail', () => {
    it('应该接受有效的邮箱地址', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com'
      ]
      
      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('应该拒绝无效的邮箱地址', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@example.com',
        'user@',
        'user @example.com',
        'user@exam ple.com'
      ]
      
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })

    it('应该拒绝空邮箱', () => {
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validateUsername', () => {
    it('应该接受有效的用户名', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'User-Name',
        'abc',
        'a'.repeat(20)
      ]
      
      validUsernames.forEach(username => {
        expect(validateUsername(username)).toBe(true)
      })
    })

    it('应该拒绝过短的用户名', () => {
      expect(validateUsername('ab')).toBe(false)
      expect(validateUsername('a')).toBe(false)
    })

    it('应该拒绝过长的用户名', () => {
      const longUsername = 'a'.repeat(51)
      expect(validateUsername(longUsername)).toBe(false)
    })

    it('应该拒绝包含特殊字符的用户名', () => {
      const invalidUsernames = [
        'user@name',
        'user#123',
        'user name',
        'user!',
        'user$'
      ]
      
      invalidUsernames.forEach(username => {
        expect(validateUsername(username)).toBe(false)
      })
    })

    it('应该拒绝空用户名', () => {
      expect(validateUsername('')).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('应该移除HTML标签', () => {
      const input = '<script>alert("xss")</script>Hello'
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('</script>')
    })

    it('应该转义特殊字符', () => {
      const input = '<div>Test & "quotes"</div>'
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).not.toContain('<div>')
      expect(sanitized).not.toContain('</div>')
    })

    it('应该修剪空白字符', () => {
      const input = '  hello world  '
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).toBe('hello world')
    })

    it('应该处理空字符串', () => {
      expect(sanitizeInput('')).toBe('')
    })
  })
})
