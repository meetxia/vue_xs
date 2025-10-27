import { cacheService } from '../services/cache.service'

/**
 * 缓存装饰器工厂
 * @param keyGenerator 缓存键生成函数
 * @param ttl 过期时间（秒）
 */
export function Cacheable(
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args)

      // 尝试从缓存获取
      const cached = cacheService.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // 执行原始方法
      const result = await originalMethod.apply(this, args)

      // 存入缓存
      cacheService.set(cacheKey, result, ttl)

      return result
    }

    return descriptor
  }
}

/**
 * 缓存失效装饰器
 * @param patterns 需要清除的缓存键模式
 */
export function CacheEvict(patterns: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // 执行原始方法
      const result = await originalMethod.apply(this, args)

      // 清除相关缓存
      patterns.forEach(pattern => {
        const keys = Array.from(cacheService['cache'].keys())
        keys.forEach(key => {
          if (key.includes(pattern)) {
            cacheService.delete(key)
          }
        })
      })

      return result
    }

    return descriptor
  }
}

/**
 * 缓存管理工具
 */
export class CacheManager {
  /**
   * 定时清理过期缓存
   * @param interval 清理间隔（毫秒）
   */
  static startAutoCleanup(interval: number = 60000): NodeJS.Timer {
    return setInterval(() => {
      const cleaned = cacheService.cleanup()
      if (cleaned > 0) {
        console.log(`🧹 清理了 ${cleaned} 个过期缓存`)
      }
    }, interval)
  }

  /**
   * 获取缓存统计
   */
  static getStats() {
    return cacheService.getStats()
  }

  /**
   * 清空所有缓存
   */
  static clearAll() {
    cacheService.clear()
    console.log('🧹 所有缓存已清空')
  }

  /**
   * 按模式清除缓存
   * @param pattern 缓存键模式
   */
  static clearPattern(pattern: string): number {
    let cleared = 0
    const keys = Array.from(cacheService['cache'].keys())

    keys.forEach(key => {
      if (key.includes(pattern)) {
        cacheService.delete(key)
        cleared++
      }
    })

    console.log(`🧹 清除了 ${cleared} 个匹配 "${pattern}" 的缓存`)
    return cleared
  }

  /**
   * 预热热门数据
   */
  static async warmupHotData() {
    console.log('🔥 开始预热热门数据...')

    // 这里可以预加载热门数据
    // 例如：热门小说、热门搜索、分类列表等

    console.log('✅ 热门数据预热完成')
  }
}

/**
 * 缓存中间件
 * 为API响应添加缓存头
 */
export async function cacheMiddleware(request: any, reply: any) {
  // 设置缓存头
  reply.header('Cache-Control', 'public, max-age=300')
}

