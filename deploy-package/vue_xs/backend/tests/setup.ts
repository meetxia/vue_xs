/**
 * Vitest 测试环境设置文件
 */

import { beforeAll, afterAll } from 'vitest'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// 全局测试前置钩子
beforeAll(() => {
  // 可以在这里初始化测试数据库连接等
  console.log('🧪 开始运行单元测试...')
})

// 全局测试后置钩子
afterAll(() => {
  // 清理测试资源
  console.log('✅ 单元测试完成！')
})

