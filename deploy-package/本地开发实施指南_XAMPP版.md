# 🏠 本地开发实施指南 - XAMPP版

**项目根目录：** `H:\momo-ruanjiansheji\axs_html\deploy-package\vue_xs\`  
**开发模式：** 本地XAMPP开发 → 打包 → 宝塔服务器部署  
**团队规模：** 3人全栈团队  
**项目周期：** 8周  
**制定日期：** 2025-10-27

---

## 📋 目录

1. [本地开发环境配置](#1-本地开发环境配置)
2. [创建数据库表结构](#2-创建数据库表结构)
3. [三人团队协作流程](#3-三人团队协作流程)
4. [开发完成后打包](#4-开发完成后打包)
5. [上传部署到宝塔](#5-上传部署到宝塔)
6. [快速启动步骤](#6-快速启动步骤)

---

## 1. 本地开发环境配置

### 1.1 当前环境确认 ✅

根据你的截图，已确认：

```yaml
XAMPP环境：
  - Apache: 运行中 (端口 80, 443)
  - MySQL: 运行中 (端口 3306)
  - PHP: 可用
  - phpMyAdmin: 可用 (http://127.0.0.1:3306)

数据库信息：
  - 主机: localhost (127.0.0.1)
  - 端口: 3306
  - 用户名: toefl_user
  - 密码: mojz168168
  - 数据库: 待创建
```

### 1.2 需要安装的软件

#### Node.js（必装）

```bash
# 1. 下载Node.js 18.x LTS
# https://nodejs.org/zh-cn/

# 2. 安装后验证
node -v   # 应显示 v18.x.x
npm -v    # 应显示 9.x.x

# 3. 配置npm国内镜像（可选，提速）
npm config set registry https://registry.npmmirror.com
```

#### Git（必装）

```bash
# 下载Git
# https://git-scm.com/download/win

# 安装后验证
git --version
```

#### VS Code（推荐）

```bash
# 下载VS Code
# https://code.visualstudio.com/

# 必装插件：
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)  
- Prisma
- ESLint
- Prettier
```

### 1.3 项目目录结构

```bash
# 项目根目录
# H:\momo-ruanjiansheji\axs_html\deploy-package\vue_xs\

vue_xs/
├── frontend/              # 前端项目（工程师B负责）
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/               # 后端项目（工程师C负责）
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                  # 文档
├── scripts/               # 脚本文件
└── README.md
```

---

## 2. 创建数据库表结构

### 2.1 在phpMyAdmin创建数据库

**步骤：**

1. 打开 http://127.0.0.1/phpmyadmin/
2. 使用账号登录：
   - 用户名：`toefl_user`
   - 密码：`mojz168168`

3. 点击「新建」→ 创建数据库
   - 数据库名：`momo_novel_db`
   - 排序规则：`utf8mb4_unicode_ci`
   - 点击「创建」

### 2.2 初始化后端项目（工程师C）

```bash
# 1. 创建后端目录
mkdir backend
cd backend

# 2. 初始化Node.js项目
npm init -y

# 3. 安装依赖
npm install fastify @fastify/cors @fastify/jwt @fastify/multipart
npm install @prisma/client bcrypt jsonwebtoken dotenv ioredis

# 4. 安装开发依赖
npm install -D typescript @types/node ts-node nodemon
npm install -D prisma
npm install -D @types/bcrypt @types/jsonwebtoken

# 5. 初始化TypeScript
npx tsc --init

# 6. 初始化Prisma
npx prisma init
```

### 2.3 配置Prisma连接本地MySQL

**编辑 `backend/.env` 文件：**

```env
# 开发环境配置
NODE_ENV=development
PORT=3000

# 本地MySQL数据库连接
DATABASE_URL="mysql://toefl_user:mojz168168@localhost:3306/momo_novel_db"

# JWT密钥（开发环境）
JWT_SECRET=dev-secret-key-change-in-production

# Redis配置（本地暂时不用，可以先注释）
# REDIS_HOST=localhost
# REDIS_PORT=6379

# 管理员账号（开发环境）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=mojz168
```

### 2.4 编写Prisma Schema

**创建 `backend/prisma/schema.prisma`：**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ========================================
// 用户表
// ========================================
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique @db.VarChar(50)
  email     String   @unique @db.VarChar(100)
  password  String   @db.VarChar(255)
  avatar    String?  @db.VarChar(255)
  bio       String?  @db.Text
  
  // 会员信息
  membershipType      String?   @default("free") @db.VarChar(20)
  membershipExpiresAt DateTime? @db.DateTime(0)
  
  // 关联关系
  novels     Novel[]
  comments   Comment[]
  likes      Like[]
  favorites  Favorite[]
  
  createdAt DateTime @default(now()) @db.DateTime(0)
  updatedAt DateTime @updatedAt @db.DateTime(0)

  @@index([email])
  @@index([username])
  @@map("users")
}

// ========================================
// 小说表
// ========================================
model Novel {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(200)
  summary     String?   @db.Text
  content     String    @db.LongText
  category    String?   @db.VarChar(50)
  tags        String?   @db.Text  // JSON字符串
  
  // 封面信息
  coverType   String    @default("text") @db.VarChar(20)
  coverData   String?   @db.Text  // JSON字符串
  
  // 统计信息
  views       Int       @default(0)
  likes       Int       @default(0)
  favorites   Int       @default(0)
  
  // 状态信息
  status      String    @default("draft") @db.VarChar(20)
  accessLevel String    @default("free") @db.VarChar(20)
  
  // 作者关联
  authorId    Int
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // 关联关系
  comments    Comment[]
  likeList    Like[]
  favoriteList Favorite[]
  
  publishedAt DateTime? @db.DateTime(0)
  createdAt   DateTime  @default(now()) @db.DateTime(0)
  updatedAt   DateTime  @updatedAt @db.DateTime(0)

  @@index([authorId])
  @@index([status])
  @@index([category])
  @@index([publishedAt])
  @@index([createdAt])
  @@fulltext([title, summary])
  @@map("novels")
}

// ========================================
// 评论表
// ========================================
model Comment {
  id        Int      @id @default(autoincrement())
  content   String   @db.Text
  
  novelId   Int
  novel     Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now()) @db.DateTime(0)
  updatedAt DateTime @updatedAt @db.DateTime(0)

  @@index([novelId])
  @@index([userId])
  @@index([createdAt])
  @@map("comments")
}

// ========================================
// 点赞表
// ========================================
model Like {
  id        Int      @id @default(autoincrement())
  
  novelId   Int
  novel     Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now()) @db.DateTime(0)

  @@unique([novelId, userId])
  @@index([novelId])
  @@index([userId])
  @@map("likes")
}

// ========================================
// 收藏表
// ========================================
model Favorite {
  id        Int      @id @default(autoincrement())
  
  novelId   Int
  novel     Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now()) @db.DateTime(0)

  @@unique([novelId, userId])
  @@index([novelId])
  @@index([userId])
  @@map("favorites")
}
```

### 2.5 创建数据库表

```bash
# 在 backend 目录执行

# 1. 生成Prisma Client
npx prisma generate

# 2. 创建数据库表（推荐方式）
npx prisma db push

# 或者使用迁移（生产环境推荐）
# npx prisma migrate dev --name init

# 3. 打开Prisma Studio查看数据库
npx prisma studio
# 访问 http://localhost:5555
```

**验证：**
- 刷新phpMyAdmin
- 应该能看到 `momo_novel_db` 数据库下创建了所有表
- 表名：users, novels, comments, likes, favorites

### 2.6 迁移现有数据（如果有）

**创建数据迁移脚本 `backend/scripts/migrate-from-json.ts`：**

```typescript
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function migrate() {
  console.log('🚀 开始从JSON文件迁移数据...\n')

  try {
    // 读取旧数据（从现有的data目录）
    const oldDataPath = '../../data'  // 相对于 vue_xs/backend/scripts/
    
    const usersFile = fs.readFileSync(path.join(__dirname, oldDataPath, 'users.json'), 'utf-8')
    const novelsFile = fs.readFileSync(path.join(__dirname, oldDataPath, 'novels.json'), 'utf-8')
    const commentsFile = fs.readFileSync(path.join(__dirname, oldDataPath, 'comments.json'), 'utf-8')

    const oldUsers = JSON.parse(usersFile)
    const oldNovels = JSON.parse(novelsFile)
    const oldComments = JSON.parse(commentsFile)

    // 1. 迁移用户
    console.log('📝 迁移用户数据...')
    for (const user of oldUsers.users || []) {
      try {
        await prisma.user.create({
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            avatar: user.avatar || null,
            bio: user.bio || null,
            membershipType: user.membership?.type || 'free',
            membershipExpiresAt: user.membership?.expiresAt 
              ? new Date(user.membership.expiresAt) 
              : null,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
          }
        })
        console.log(`  ✅ ${user.username}`)
      } catch (error: any) {
        console.error(`  ❌ ${user.username}: ${error.message}`)
      }
    }

    // 2. 迁移小说
    console.log('\n📚 迁移小说数据...')
    for (const novel of oldNovels.novels || []) {
      try {
        await prisma.novel.create({
          data: {
            id: novel.id,
            title: novel.title,
            summary: novel.summary || null,
            content: novel.content,
            category: novel.category || null,
            tags: novel.tags ? JSON.stringify(novel.tags) : null,
            coverType: novel.coverType || 'text',
            coverData: novel.coverData ? JSON.stringify(novel.coverData) : null,
            views: novel.views || 0,
            likes: novel.likes || 0,
            favorites: novel.favorites || 0,
            status: novel.status || 'published',
            accessLevel: novel.accessLevel || 'free',
            authorId: novel.authorId || 1,
            publishedAt: novel.publishTime ? new Date(novel.publishTime) : null,
            createdAt: novel.createdAt ? new Date(novel.createdAt) : new Date(),
            updatedAt: novel.updatedAt ? new Date(novel.updatedAt) : new Date()
          }
        })
        console.log(`  ✅ ${novel.title}`)
      } catch (error: any) {
        console.error(`  ❌ ${novel.title}: ${error.message}`)
      }
    }

    // 3. 迁移评论
    console.log('\n💬 迁移评论数据...')
    for (const comment of oldComments.comments || []) {
      try {
        await prisma.comment.create({
          data: {
            id: comment.id,
            content: comment.content,
            novelId: comment.novelId,
            userId: comment.userId,
            createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
            updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : new Date()
          }
        })
        console.log(`  ✅ 评论 #${comment.id}`)
      } catch (error: any) {
        console.error(`  ❌ 评论 #${comment.id}: ${error.message}`)
      }
    }

    console.log('\n🎉 数据迁移完成！')
    
    // 统计
    const userCount = await prisma.user.count()
    const novelCount = await prisma.novel.count()
    const commentCount = await prisma.comment.count()
    
    console.log('\n📊 数据统计：')
    console.log(`   用户：${userCount} 条`)
    console.log(`   小说：${novelCount} 条`)
    console.log(`   评论：${commentCount} 条`)

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

**执行迁移：**

```bash
cd backend
npx ts-node scripts/migrate-from-json.ts
```

---

## 3. 三人团队协作流程

### 3.1 初始化前端项目（工程师B）

```bash
# 1. 创建Vue 3项目
cd frontend
npm create vite@latest . -- --template vue-ts

# 2. 安装依赖
npm install

# 3. 安装UI框架和工具
npm install element-plus @element-plus/icons-vue
npm install vue-router pinia axios @vueuse/core

# 4. 安装Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 5. 安装开发工具
npm install -D @types/node eslint prettier

# 6. 启动开发服务器
npm run dev
# 访问 http://localhost:5188
```

**配置前端环境变量 `frontend/.env.development`：**

```env
# 开发环境 - 后端API地址
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3.2 创建后端基础服务器（工程师C）

**创建 `backend/src/server.ts`：**

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
})

const prisma = new PrismaClient()

// 注册CORS
fastify.register(cors, {
  origin: ['http://localhost:5188'], // 前端地址
  credentials: true
})

// 健康检查
fastify.get('/api/health', async (request, reply) => {
  try {
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    }
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    }
  }
})

// 测试路由
fastify.get('/api/test', async (request, reply) => {
  const userCount = await prisma.user.count()
  const novelCount = await prisma.novel.count()
  
  return {
    success: true,
    message: '后端API运行正常',
    data: {
      users: userCount,
      novels: novelCount
    }
  }
})

// 启动服务器
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000
    await fastify.listen({ port, host: '0.0.0.0' })
    
    console.log(`
╔════════════════════════════════════════╗
║  🚀 后端服务器启动成功！                ║
║  📍 地址: http://localhost:${port}     ║
║  📡 API: http://localhost:${port}/api  ║
║  ⏰ 时间: ${new Date().toLocaleString()} ║
╚════════════════════════════════════════╝
    `)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

start()
```

**配置 `backend/package.json`：**

```json
{
  "name": "momo-novel-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

**启动后端：**

```bash
cd backend
npm run dev

# 测试
# 浏览器访问 http://localhost:3000/api/health
```

### 3.3 每日协作流程

```
09:00 - 09:30  晨会（线上/线下）
├─ 昨天完成了什么
├─ 今天计划做什么
└─ 遇到什么问题

09:30 - 12:00  专注开发
├─ 工程师A: 架构设计 + 核心模块
├─ 工程师B: 前端页面开发
└─ 工程师C: 后端API开发

12:00 - 13:30  午休

13:30 - 17:00  开发 + 联调
├─ 前后端接口联调
├─ Code Review
└─ 解决问题

17:00 - 17:30  提交代码
├─ Git提交
├─ 更新文档
└─ 同步进度
```

### 3.4 Git协作规范

```bash
# 1. 克隆/拉取最新代码
git pull origin main

# 2. 创建功能分支
git checkout -b feature/用户登录-工程师B

# 3. 开发...

# 4. 提交代码
git add .
git commit -m "feat(auth): 完成用户登录页面"

# 5. 推送到远程
git push origin feature/用户登录-工程师B

# 6. 创建Pull Request（可选）
# 或直接合并到main（小团队可以这样）

# 7. 合并到主分支
git checkout main
git merge feature/用户登录-工程师B
git push origin main
```

**提交信息规范：**

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具

示例：
feat(auth): 完成用户注册功能
fix(novel): 修复小说列表分页bug
docs: 更新API文档
```

---

## 4. 开发完成后打包

### 4.1 前端打包（工程师B）

```bash
cd frontend

# 1. 配置生产环境变量
# 创建 .env.production
VITE_API_BASE_URL=https://xs.momofx.cn/api

# 2. 生产环境打包
npm run build

# 3. 打包完成后，dist目录就是前端静态文件
# dist/
#   ├── index.html
#   ├── assets/
#   │   ├── index-xxx.js
#   │   ├── index-xxx.css
#   │   └── ...
#   └── ...

# 4. 本地预览（可选）
npm run preview
# 访问 http://localhost:4173
```

### 4.2 后端打包（工程师C）

```bash
cd backend

# 1. TypeScript编译
npm run build

# 2. 编译完成后，dist目录就是后端代码
# dist/
#   ├── server.js
#   ├── controllers/
#   ├── services/
#   └── ...

# 3. 准备部署文件
# 需要上传的文件：
#   - dist/              (编译后的代码)
#   - prisma/            (Prisma schema)
#   - package.json       (依赖配置)
#   - .env.production    (生产环境变量)
#   - ecosystem.config.js (PM2配置)
```

### 4.3 创建部署配置

**创建 `backend/ecosystem.config.js`：**

```javascript
module.exports = {
  apps: [{
    name: 'momo-novel-api',
    script: './dist/server.js',
    cwd: '/www/wwwroot/xs.momofx.cn/backend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

**创建 `backend/.env.production`：**

```env
NODE_ENV=production
PORT=3000

# 生产数据库连接（服务器上的MySQL）
DATABASE_URL="mysql://toefl_user:mojz168168@localhost:3306/momo_novel_db"

# JWT密钥（生产环境要改成强密钥）
JWT_SECRET=你的超强密钥-至少32位-随机字符串

# Redis配置（如果服务器上有）
REDIS_HOST=localhost
REDIS_PORT=6379

# 管理员账号
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的强密码
```

---

## 5. 上传部署到宝塔

### 5.1 准备部署包

```bash
# 创建部署目录
mkdir deploy-package-v2

# 复制前端打包文件
cp -r frontend/dist deploy-package-v2/frontend

# 复制后端文件
mkdir deploy-package-v2/backend
cp -r backend/dist deploy-package-v2/backend/
cp -r backend/prisma deploy-package-v2/backend/
cp backend/package.json deploy-package-v2/backend/
cp backend/.env.production deploy-package-v2/backend/.env
cp backend/ecosystem.config.js deploy-package-v2/backend/

# 压缩打包
# Windows: 右键 → 压缩为 deploy-package-v2.zip
# 或使用命令：
# tar -czf deploy-package-v2.tar.gz deploy-package-v2/
```

### 5.2 上传到服务器

**方法1：宝塔文件管理器**

1. 登录宝塔面板
2. 点击「文件」
3. 进入 `/www/wwwroot/xs.momofx.cn/`
4. 点击「上传」
5. 选择 `deploy-package-v2.zip`
6. 上传完成后，解压

**方法2：SFTP工具**

使用 FileZilla / WinSCP：
- 主机：你的服务器IP
- 端口：22
- 用户：root
- 密码：你的服务器密码

上传到：`/www/wwwroot/xs.momofx.cn/`

### 5.3 在宝塔配置网站

#### Step 1: 创建网站

1. 宝塔面板 → 网站 → 添加站点
2. 填写：
   ```
   域名: xs.momofx.cn
   根目录: /www/wwwroot/xs.momofx.cn/frontend
   PHP版本: 纯静态
   ```
3. 提交

#### Step 2: 配置Nginx反向代理

1. 点击网站设置 → 配置文件
2. 修改配置：

```nginx
server {
    listen 80;
    server_name xs.momofx.cn www.xs.momofx.cn;
    
    # 静态文件根目录
    root /www/wwwroot/xs.momofx.cn/frontend;
    index index.html;
    
    # API反向代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 前端路由支持（Vue Router history模式）
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 文件上传大小限制
    client_max_body_size 50M;
}
```

#### Step 3: 申请SSL证书

1. 网站设置 → SSL
2. 选择「Let's Encrypt」
3. 勾选域名
4. 点击「申请」
5. 开启「强制HTTPS」

### 5.4 安装后端依赖并启动

```bash
# SSH连接到服务器
ssh root@你的服务器IP

# 进入后端目录
cd /www/wwwroot/xs.momofx.cn/backend

# 安装依赖（仅生产依赖）
npm install --production

# 生成Prisma Client
npx prisma generate

# 创建日志目录
mkdir -p logs

# 使用PM2启动
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup

# 查看运行状态
pm2 list
pm2 logs momo-novel-api
```

### 5.5 服务器MySQL配置

如果服务器还没创建数据库：

```bash
# 1. 宝塔面板 → 数据库 → 添加数据库
数据库名: momo_novel_db
用户名: toefl_user
密码: mojz168168

# 2. 创建数据库表
cd /www/wwwroot/xs.momofx.cn/backend
npx prisma db push

# 3. 如果需要导入数据
# 方法A: 使用迁移脚本
npx ts-node scripts/migrate-from-json.ts

# 方法B: 导入SQL文件（如果有）
# 宝塔面板 → 数据库 → 导入
```

### 5.6 验证部署

```bash
# 测试后端API
curl http://localhost:3000/api/health

# 测试外网访问
curl https://xs.momofx.cn/api/health

# 查看PM2日志
pm2 logs momo-novel-api

# 查看Nginx错误日志
# 宝塔面板 → 网站 → 日志
```

---

## 6. 快速启动步骤

### Day 1 上午：环境准备

**工程师A（Leader）：**
- [ ] ✅ XAMPP已运行（Apache + MySQL）
- [ ] 创建Git仓库
- [ ] 制定开发规范文档

**工程师B（前端）：**
- [ ] 安装Node.js 18.x
- [ ] 安装VS Code + 插件
- [ ] 初始化前端项目

**工程师C（后端）：**
- [ ] 安装Node.js 18.x
- [ ] 在phpMyAdmin创建数据库
- [ ] 初始化后端项目

### Day 1 下午：基础搭建

**工程师C：**
```bash
# 1. 配置Prisma
cd backend
编辑 prisma/schema.prisma
编辑 .env

# 2. 创建数据库表
npx prisma generate
npx prisma db push

# 3. 验证数据库
npx prisma studio

# 4. 创建基础服务器
编辑 src/server.ts
npm run dev

# 5. 测试
访问 http://localhost:3000/api/health
```

**工程师B：**
```bash
# 1. 配置Vue项目
cd frontend
安装依赖
配置Tailwind CSS

# 2. 创建基础页面
src/App.vue
src/router/index.ts

# 3. 启动开发服务器
npm run dev

# 4. 测试
访问 http://localhost:5188
```

### Day 2 开始：正式开发

按照8周计划执行：
- Week 1-2: 认证系统
- Week 3-4: 小说模块
- Week 5-6: 评论+管理后台
- Week 7: 测试优化
- Week 8: 打包部署

---

## 📚 常用命令速查

### 前端开发

```bash
cd frontend

npm run dev          # 开发服务器
npm run build        # 生产打包
npm run preview      # 预览生产构建
npm run lint         # 代码检查
```

### 后端开发

```bash
cd backend

npm run dev          # 开发服务器
npm run build        # TypeScript编译
npm start            # 启动生产服务器

npx prisma studio    # 数据库可视化
npx prisma generate  # 生成Prisma Client
npx prisma db push   # 同步数据库
```

### 数据库操作

```bash
# 查看数据库
npx prisma studio
# 或访问 http://127.0.0.1/phpmyadmin/

# 重置数据库（危险！）
npx prisma db push --force-reset

# 导出数据
# phpMyAdmin → 导出 → SQL格式

# 导入数据
# phpMyAdmin → 导入 → 选择SQL文件
```

---

## 🆘 常见问题

### Q1: Prisma连接数据库失败

```bash
# 检查MySQL是否启动
# XAMPP控制面板 → MySQL → Start

# 检查DATABASE_URL是否正确
# backend/.env
DATABASE_URL="mysql://toefl_user:mojz168168@localhost:3306/momo_novel_db"

# 测试连接
npx prisma db pull
```

### Q2: 前端无法访问后端

```bash
# 1. 检查后端是否启动
cd backend
npm run dev

# 2. 检查端口
# 后端：http://localhost:3000
# 前端：http://localhost:5188

# 3. 检查CORS配置
# backend/src/server.ts
origin: ['http://localhost:5188']
```

### Q3: 部署后API 404

```nginx
# 检查Nginx配置
# location /api 配置是否正确

# 检查PM2状态
pm2 list
pm2 logs momo-novel-api

# 检查端口
netstat -tulpn | grep 3000
```

---

## 📞 团队协作建议

### 每日站会（15分钟）

```
工程师A: 我完成了认证中间件，今天做文件上传
工程师B: 我完成了登录页面，今天做首页布局
工程师C: 我完成了用户API，今天做小说API

遇到的问题：
- 前端调用API跨域 → 工程师C配置CORS
- 数据库查询慢 → 工程师A review SQL
```

### 代码评审（每天傍晚）

```
1. 工程师B提交前端代码
2. 工程师A review代码质量
3. 提出改进建议
4. 合并到main分支
```

### 周总结会（每周五）

```
本周完成：
✅ 认证系统（100%）
✅ 用户模块（100%）
🔄 小说模块（60%）

下周计划：
- 完成小说模块
- 开始评论系统
- 性能优化

遇到的问题和解决方案
```

---

**祝开发顺利！** 🚀

有任何问题随时找我！

