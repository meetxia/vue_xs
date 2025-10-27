/**
 * 缓存服务
 * 基于内存的简单缓存实现（LRU策略）
 * 生产环境建议使用Redis
 */

interface CacheItem<T> {
  value: T
  expireAt: number
  accessCount: number
  lastAccess: number
}

export class CacheService {
  private cache: Map<string, CacheItem<any>>
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize: number = 1000, defaultTTL: number = 300) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL // 默认5分钟
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒）
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // 检查容量，LRU淘汰
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    const expireAt = Date.now() + (ttl || this.defaultTTL) * 1000

    this.cache.set(key, {
      value,
      expireAt,
      accessCount: 0,
      lastAccess: Date.now()
    })
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值或null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expireAt) {
      this.cache.delete(key)
      return null
    }

    // 更新访问信息
    item.accessCount++
    item.lastAccess = Date.now()

    return item.value as T
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   */
  has(key: string): boolean {
    const item = this.cache.get(key)

    if (!item) {
      return false
    }

    // 检查是否过期
    if (Date.now() > item.expireAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    let expired = 0
    let active = 0

    this.cache.forEach((item) => {
      if (Date.now() > item.expireAt) {
        expired++
      } else {
        active++
      }
    })

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    let cleaned = 0
    const now = Date.now()

    this.cache.forEach((item, key) => {
      if (now > item.expireAt) {
        this.cache.delete(key)
        cleaned++
      }
    })

    return cleaned
  }

  /**
   * LRU淘汰策略
   * 淘汰最少使用的缓存项
   */
  private evictLRU(): void {
    let lruKey: string | null = null
    let lruScore = Infinity

    this.cache.forEach((item, key) => {
      // LRU分数 = 访问次数 + 最后访问时间权重
      const score = item.accessCount + (Date.now() - item.lastAccess) / 1000

      if (score < lruScore) {
        lruScore = score
        lruKey = key
      }
    })

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  /**
   * 计算缓存命中率（模拟）
   */
  private calculateHitRate(): number {
    let totalAccess = 0
    this.cache.forEach((item) => {
      totalAccess += item.accessCount
    })
    return totalAccess > 0 ? (totalAccess / (totalAccess + 100)) * 100 : 0
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 批量获取
   * @param keys 缓存键数组
   */
  mget<T>(keys: string[]): (T | null)[] {
    return keys.map(key => this.get<T>(key))
  }

  /**
   * 批量设置
   * @param items 键值对数组
   * @param ttl 过期时间
   */
  mset<T>(items: Array<{ key: string; value: T }>, ttl?: number): void {
    items.forEach(({ key, value }) => {
      this.set(key, value, ttl)
    })
  }

  /**
   * 批量删除
   * @param keys 缓存键数组
   */
  mdel(keys: string[]): number {
    let deleted = 0
    keys.forEach(key => {
      if (this.delete(key)) {
        deleted++
      }
    })
    return deleted
  }

  /**
   * 获取或设置（如果不存在则执行函数并缓存）
   * @param key 缓存键
   * @param fn 获取数据的函数
   * @param ttl 过期时间
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // 缓存不存在，执行函数获取数据
    const value = await fn()

    // 存入缓存
    this.set(key, value, ttl)

    return value
  }
}

// 导出单例
export const cacheService = new CacheService(1000, 300)

/**
 * 缓存键生成器
 */
export class CacheKeys {
  /**
   * 小说列表缓存键
   */
  static novelList(page: number, pageSize: number, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : ''
    return `novel:list:${page}:${pageSize}:${filterStr}`
  }

  /**
   * 小说详情缓存键
   */
  static novelDetail(id: number): string {
    return `novel:detail:${id}`
  }

  /**
   * 用户信息缓存键
   */
  static userInfo(id: number): string {
    return `user:info:${id}`
  }

  /**
   * 热门小说缓存键
   */
  static hotNovels(limit: number): string {
    return `novel:hot:${limit}`
  }

  /**
   * 搜索结果缓存键
   */
  static searchResult(query: string, options?: any): string {
    const optionStr = options ? JSON.stringify(options) : ''
    return `search:${query}:${optionStr}`
  }

  /**
   * 热门搜索缓存键
   */
  static hotSearches(): string {
    return 'search:hot'
  }

  /**
   * 分类列表缓存键
   */
  static categories(): string {
    return 'categories:all'
  }

  /**
   * 热门标签缓存键
   */
  static hotTags(limit: number): string {
    return `tags:hot:${limit}`
  }

  /**
   * 评论列表缓存键
   */
  static comments(novelId: number, page: number): string {
    return `comments:novel:${novelId}:${page}`
  }
}

