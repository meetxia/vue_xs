/**
 * Fastify服务器入口文件
 * MOMO炒饭店小说网站后端API
 */

import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { PrismaClient } from '@prisma/client'
import routes from './routes'
import { errorHandler } from './middlewares/error.middleware'

// 初始化Fastify
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
})

// 初始化Prisma
const prisma = new PrismaClient()

// 注册CORS
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5188',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
})

// 注册文件上传
fastify.register(multipart, {
  limits: {
    fileSize: Number(process.env.UPLOAD_MAX_SIZE) || 5242880 // 5MB
  }
})

// 注册路由
fastify.register(routes)

// 注册错误处理器
fastify.setErrorHandler(errorHandler)

// 优雅关闭
const closeGracefully = async (signal: string) => {
  fastify.log.info(`Received signal ${signal}, closing gracefully`)
  await prisma.$disconnect()
  await fastify.close()
  process.exit(0)
}

process.on('SIGINT', () => closeGracefully('SIGINT'))
process.on('SIGTERM', () => closeGracefully('SIGTERM'))

// 启动服务器
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000
    const host = process.env.HOST || '0.0.0.0'
    
    // 测试数据库连接
    await prisma.$connect()
    fastify.log.info('✅ 数据库连接成功')
    
    // 启动服务器
    await fastify.listen({ port, host })
    
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  🚀 MOMO炒饭店小说网站 - 后端API服务器                 ║
║                                                       ║
║  📍 地址:    http://${host}:${port}                   ║
║  📡 API:     http://${host}:${port}/api               ║
║  🏥 健康检查: http://${host}:${port}/health            ║
║  ⏰ 启动时间: ${new Date().toLocaleString()}           ║
║  🌍 环境:    ${process.env.NODE_ENV || 'development'}  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📚 API文档:
  - POST   /api/auth/register    用户注册
  - POST   /api/auth/login       用户登录
  - GET    /api/auth/me          获取当前用户信息
  - POST   /api/auth/logout      退出登录

🔗 测试API:
  curl http://localhost:${port}/health
    `)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

