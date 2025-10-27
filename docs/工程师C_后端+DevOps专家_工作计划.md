# ⚙️ 工程师C - 后端+DevOps专家 工作计划

> **角色定位**: 后端架构师 + 运维自动化专家  
> **核心职责**: Next.js API Routes、认证系统、文件上传、CI/CD、宝塔部署  
> **工作周期**: 6周  
> **难度评级**: ⭐⭐⭐⭐⭐ (全栈后端+运维 - 稳定性就是生命！)

---

## 🎯 核心目标

### 📊 量化指标
- ✅ 开发 30+ 个 API 路由
- ✅ 实现完整的 NextAuth.js 认证系统
- ✅ 搭建 CI/CD 自动化流程
- ✅ 配置宝塔面板生产环境
- ✅ API 响应时间 < 100ms
- ✅ 系统可用性 99.9%+

### 🏆 挑战任务
1. **API架构设计** - RESTful + Next.js Route Handlers
2. **认证系统** - NextAuth.js + JWT + Session管理
3. **文件上传** - 支持大文件、断点续传、阿里云OSS
4. **自动化部署** - GitHub Actions → 阿里云宝塔
5. **监控告警** - 日志系统 + 性能监控

---

## 📅 详细排期

### 🔥 第1周 (Day 1-5) - API架构 + 认证系统

#### Day 1-2: Next.js API Routes 架构设计

**目录结构**:
```
app/api/
├── auth/
│   └── [...nextauth]/route.ts    # NextAuth 配置
├── novels/
│   ├── route.ts                  # GET /api/novels, POST /api/novels
│   ├── [id]/route.ts             # GET/PUT/DELETE /api/novels/:id
│   ├── [id]/like/route.ts        # POST /api/novels/:id/like
│   └── [id]/favorite/route.ts    # POST /api/novels/:id/favorite
├── users/
│   ├── route.ts                  # GET /api/users
│   ├── [id]/route.ts             # GET/PUT /api/users/:id
│   └── [id]/profile/route.ts     # GET/PUT /api/users/:id/profile
├── comments/
│   ├── route.ts                  # GET/POST /api/comments
│   └── [id]/route.ts             # PUT/DELETE /api/comments/:id
├── tags/
│   └── route.ts                  # GET /api/tags
├── categories/
│   └── route.ts                  # GET /api/categories
├── upload/
│   ├── image/route.ts            # POST /api/upload/image
│   └── file/route.ts             # POST /api/upload/file
├── admin/
│   ├── stats/route.ts            # GET /api/admin/stats
│   └── settings/route.ts         # GET/PUT /api/admin/settings
└── health/route.ts               # GET /api/health
```

**API设计规范**:
```typescript
// app/api/novels/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

// GET /api/novels - 获取小说列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  
  try {
    const result = await getPublishedNovels({ page, pageSize })
    
    return NextResponse.json({
      success: true,
      data: result.novels,
      pagination: result.pagination
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch novels' },
      { status: 500 }
    )
  }
}

// POST /api/novels - 创建小说（需要认证）
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Zod 验证
  const schema = z.object({
    title: z.string().min(1).max(200),
    summary: z.string().optional(),
    content: z.string().min(1),
    categoryId: z.number().optional(),
    tagIds: z.array(z.number()).optional()
  })
  
  const body = await request.json()
  const validated = schema.parse(body)
  
  const novel = await createNovel({
    ...validated,
    authorId: session.user.id,
    slug: generateSlug(validated.title)
  })
  
  return NextResponse.json({ success: true, data: novel })
}
```

**任务清单**:
```bash
[ ] 1. 设计完整的 API 路由结构
[ ] 2. 统一的响应格式
[ ] 3. 错误处理中间件
[ ] 4. 请求验证（Zod Schema）
[ ] 5. API 文档（可选：使用 Swagger）
```

---

#### Day 3-4: NextAuth.js 认证系统 ⭐⭐⭐⭐⭐

**核心配置**:
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user || !user.password) {
          throw new Error('User not found')
        }
        
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )
        
        if (!isValid) {
          throw new Error('Invalid password')
        }
        
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**权限中间件**:
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    
    // 管理员路由保护
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // 公开路由
        if (['/login', '/register', '/'].includes(path)) {
          return true
        }
        
        // 需要登录的路由
        return !!token
      }
    }
  }
)

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/api/novels/:path*']
}
```

**任务清单**:
```bash
[ ] 1. NextAuth.js 配置
[ ] 2. 用户注册 API
[ ] 3. 登录/登出功能
[ ] 4. Session 管理
[ ] 5. 权限中间件
[ ] 6. 密码重置流程（可选）
```

---

#### Day 5: 文件上传系统

**本地上传配置**:
```typescript
// app/api/upload/image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return NextResponse.json(
      { success: false, error: 'No file provided' },
      { status: 400 }
    )
  }
  
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Invalid file type' },
      { status: 400 }
    )
  }
  
  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, error: 'File too large' },
      { status: 400 }
    )
  }
  
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // 生成唯一文件名
  const filename = `${Date.now()}-${Math.random().toString(36)}.webp`
  const filepath = join(process.cwd(), 'public/uploads', filename)
  
  // 使用 sharp 压缩图片
  await sharp(buffer)
    .webp({ quality: 80 })
    .resize(1200, 1200, { fit: 'inside' })
    .toFile(filepath)
  
  return NextResponse.json({
    success: true,
    data: {
      url: `/uploads/${filename}`,
      filename
    }
  })
}

export const config = {
  api: {
    bodyParser: false // 禁用默认解析器
  }
}
```

**阿里云OSS集成（可选）**:
```typescript
// lib/oss.ts
import OSS from 'ali-oss'

const client = new OSS({
  region: process.env.ALIYUN_OSS_REGION,
  accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.ALIYUN_OSS_BUCKET
})

export async function uploadToOSS(file: Buffer, filename: string) {
  const result = await client.put(filename, file)
  return result.url
}
```

**任务清单**:
```bash
[ ] 1. 图片上传 API（本地）
[ ] 2. 文件上传 API（TXT/DOCX）
[ ] 3. 图片压缩优化（sharp）
[ ] 4. 阿里云OSS集成（可选）
[ ] 5. 上传进度追踪
```

---

### 🔥 第2周 (Day 6-10) - API 完善 + 测试

#### Day 6-8: 完善所有 API 端点

**任务分配**:
```bash
[ ] Day 6: 小说相关 API（8个端点）
    - CRUD 操作
    - 点赞/收藏/浏览量
    - 搜索功能
    
[ ] Day 7: 用户/评论 API（6个端点）
    - 用户资料管理
    - 评论CRUD
    - 关注系统
    
[ ] Day 8: 管理后台 API（6个端点）
    - 统计数据
    - 用户管理
    - 系统配置
```

---

#### Day 9-10: API 测试 ⭐⭐⭐⭐⭐

**测试任务**:
```bash
[ ] 1. API 单元测试（Vitest + Supertest）
    - 测试所有30+个API端点
    - 测试请求验证
    - 测试错误处理
    - 目标覆盖率: 90%+
    
[ ] 2. 集成测试
    - 测试完整的业务流程
    - 测试数据库交互
    - 测试认证授权
    
[ ] 3. 安全测试
    - SQL注入测试
    - XSS攻击测试
    - CSRF测试
    - 权限绕过测试
```

**测试代码示例**:
```typescript
// __tests__/api/novels.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/novels/route'
import { prisma } from '@/lib/prisma'

describe('小说API测试', () => {
  beforeEach(async () => {
    // 清理测试数据
    await prisma.novel.deleteMany()
  })
  
  describe('GET /api/novels', () => {
    it('应该返回小说列表', async () => {
      const request = new Request('http://localhost/api/novels?page=1')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })
    
    it('应该支持分页', async () => {
      const request = new Request('http://localhost/api/novels?page=2&pageSize=10')
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.pageSize).toBe(10)
    })
  })
  
  describe('POST /api/novels', () => {
    it('未登录应该返回401', async () => {
      const request = new Request('http://localhost/api/novels', {
        method: 'POST',
        body: JSON.stringify({ title: '测试' })
      })
      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })
    
    it('应该验证输入数据', async () => {
      const request = new Request('http://localhost/api/novels', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer valid-token' },
        body: JSON.stringify({ title: '' }) // 空标题
      })
      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })
  })
})

// __tests__/api/security.test.ts
describe('API安全测试', () => {
  it('应该防止SQL注入', async () => {
    const request = new Request("http://localhost/api/novels?search='; DROP TABLE novels;--")
    const response = await GET(request)
    
    // 不应该报错，应该正常返回
    expect(response.status).toBe(200)
  })
  
  it('应该防止XSS攻击', async () => {
    const maliciousContent = '<script>alert("XSS")</script>'
    const request = new Request('http://localhost/api/novels', {
      method: 'POST',
      body: JSON.stringify({ title: maliciousContent })
    })
    
    const response = await POST(request)
    const novel = await response.json()
    
    // 应该转义特殊字符
    expect(novel.data.title).not.toContain('<script>')
  })
})
```

**API文档生成**:
```bash
# 使用 Postman 导出文档
# 或生成 OpenAPI 规范文档
```

---

#### 测试报告生成

**任务**:
```bash
[ ] 1. 生成测试报告
    - API测试覆盖率
    - 安全测试结果
    - 性能测试数据
    
[ ] 2. BUG修复
    - 修复测试中发现的问题
    - 重新运行测试验证
```

---

### 🔥 第3周 (Day 11-15) - CI/CD + 宝塔部署

#### Day 11-12: GitHub Actions 配置 ⭐⭐⭐⭐

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Aliyun
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /www/wwwroot/novel-platform
            git pull origin main
            npm install --production
            npm run build
            pm2 reload ecosystem.config.js
```

---

#### Day 13-14: 宝塔面板部署配置 ⭐⭐⭐⭐⭐

**部署清单**:
```bash
[ ] 1. 服务器环境配置
    - Node.js 18+
    - MySQL 8.0
    - Nginx
    - PM2
    
[ ] 2. 宝塔面板设置
    - 创建网站
    - 配置 Nginx 反向代理
    - SSL 证书配置
    - 防火墙规则
    
[ ] 3. 数据库配置
    - 创建数据库
    - 导入初始数据
    - 配置远程访问（可选）
    
[ ] 4. 应用部署
    - 上传代码
    - 安装依赖
    - 配置环境变量
    - PM2 启动
    
[ ] 5. Nginx 配置优化
    - Gzip 压缩
    - 静态资源缓存
    - Rate Limiting
```

**Nginx 配置模板**（已在技术方案文档中提供）

**PM2 配置**:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'novel-platform',
    script: '.next/standalone/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: 'https://your-domain.com'
    },
    error_file: '/www/wwwlogs/novel-error.log',
    out_file: '/www/wwwlogs/novel-out.log',
    max_memory_restart: '1G',
  }]
}
```

---

#### Day 15: 监控与告警

**监控工具配置**:
```bash
[ ] 1. 日志系统
    - Winston/Pino 日志库
    - 日志分级（error/warn/info/debug）
    - 日志轮转
    
[ ] 2. 性能监控
    - API 响应时间监控
    - 数据库查询性能
    - 内存/CPU 使用率
    
[ ] 3. 错误追踪
    - Sentry 集成（可选）
    - 邮件/微信告警
    
[ ] 4. 健康检查
    - /api/health 端点
    - 定时任务检查
```

**日志配置**:
```typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

---

### 🔥 第4-5周 (Day 16-25) - 优化 + 安全

**任务分配**:
```bash
[ ] Week 4: API 性能优化
    - 数据库查询优化
    - Redis 缓存集成（可选）
    - API 限流策略
    - 压缩响应数据
    
[ ] Week 5: 安全加固
    - CORS 配置
    - CSRF 防护
    - SQL 注入防护
    - XSS 防护
    - Rate Limiting
    - 敏感数据加密
```

**安全配置**:
```typescript
// middleware.ts - 安全头
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 安全头
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}
```

---

### 🔥 第6周 (Day 26-30) - 联调 + 上线

**最后冲刺**:
```bash
[ ] Day 26-27: 全面联调测试
    - 前后端接口对接
    - 错误场景测试
    - 性能压测
    
[ ] Day 28: 生产环境部署
    - 数据库迁移
    - 应用部署
    - DNS 配置
    
[ ] Day 29: 灰度发布
    - 5% 流量测试
    - 监控指标
    - 快速回滚准备
    
[ ] Day 30: 正式上线
    - 100% 流量切换
    - 监控告警
    - 文档交付
```

---

## 📊 交付物清单

### 必须交付
- [x] 30+ 个 API 端点
- [x] 完整的认证系统
- [x] **API 单元测试（覆盖率 90%+）** ⭐
- [x] **API 集成测试** ⭐
- [x] **安全测试报告** ⭐
- [x] CI/CD 自动化流程
- [x] 宝塔生产环境配置
- [x] 监控告警系统
- [x] **BUG修复记录** ⭐
- [x] API 文档
- [x] 运维手册

### 可选加分项
- [ ] API 自动化测试覆盖率 > 80%
- [ ] Redis 缓存系统
- [ ] 阿里云 OSS 集成
- [ ] Docker 容器化部署
- [ ] 灰度发布系统

---

## 🏆 考核标准

| 维度 | 权重 | 评分标准 |
|------|------|----------|
| **API质量** | 20% | 接口设计、错误处理、响应速度 |
| **测试质量** | 25% | ⭐ 测试覆盖率、安全测试、集成测试 |
| **安全性** | 20% | 认证机制、权限控制、安全加固 |
| **部署能力** | 20% | CI/CD流程、自动化程度、稳定性 |
| **运维能力** | 10% | 监控告警、日志系统、应急响应 |
| **文档质量** | 5% | API文档、运维手册、部署文档 |

---

## 💪 你的使命

作为后端+DevOps专家，你将：
- ⚙️ **稳定可靠** - 系统永不宕机是你的追求
- 🚀 **高效部署** - 自动化一切可自动化的
- 🛡️ **安全第一** - 守护用户数据安全
- 📊 **可观测性** - 一切尽在掌控

---

## 🎖️ 最后寄语

**工程师C，你是项目的"守护神"！**

没有稳定的后端和流畅的部署，再漂亮的前端也只是空中楼阁。你的代码将24/7运行在生产环境，守护着用户的每一次请求。

**稳定性就是生命线！** 💪🔒

加油，期待你的铜墙铁壁！🚀

---

**计划制定人**: AI 技术总监  
**最后更新**: 2025-10-26  
**文档状态**: ✅ 已确认

