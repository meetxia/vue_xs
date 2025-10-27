# 🚀 三人团队重构实施计划 - 宝塔面板 + MySQL 版

**项目名称：** MOMO炒饭店小说网站重构  
**项目根目录：** `H:\momo-ruanjiansheji\axs_html\deploy-package\vue_xs\`  
**部署环境：** 阿里云Linux + 宝塔面板 + MySQL  
**技术栈：** Vue 3 + Fastify + Prisma + MySQL + Redis  
**团队规模：** 3人全栈团队  
**项目周期：** 8周（56天）  
**制定日期：** 2025-10-27

---

## 📋 目录

1. [团队组成与角色分工](#1-团队组成与角色分工)
2. [技术栈配置（宝塔版）](#2-技术栈配置宝塔版)
3. [数据库设计（MySQL）](#3-数据库设计mysql)
4. [8周详细实施计划](#4-8周详细实施计划)
5. [并行开发策略](#5-并行开发策略)
6. [宝塔面板部署指南](#6-宝塔面板部署指南)
7. [质量保证与测试](#7-质量保证与测试)
8. [风险管控](#8-风险管控)

---

## 1. 团队组成与角色分工

### 1.1 团队架构

```
项目经理/架构师: 工程师A（Leader）
├─ 负责整体架构设计
├─ 技术决策与评审
├─ 进度把控与协调
└─ 核心难点攻关

前端负责人: 工程师B
├─ Vue 3 前端架构
├─ 组件库设计开发
├─ 前端性能优化
└─ 前端测试

后端负责人: 工程师C
├─ Fastify 后端架构
├─ 数据库设计实施
├─ API 开发与优化
└─ 后端测试
```

### 1.2 人员职责详细说明

#### 👨‍💻 工程师A（架构师+全栈） - Leader

**主要职责：**
- 🏗️ **架构设计**（Week 1）
  - 制定技术方案
  - 搭建项目骨架
  - 配置开发环境
  - 编写技术规范文档

- 🔧 **核心模块开发**（Week 2-6）
  - 数据库设计与迁移
  - 认证授权系统
  - 文件上传系统
  - 缓存策略设计

- 🎯 **质量把控**（Week 1-8）
  - Code Review
  - 性能优化
  - 安全加固
  - 部署与运维

**技能要求：**
- 5年+ 全栈开发经验
- 熟悉 Vue 3、Node.js、MySQL
- 有架构设计经验
- 熟悉宝塔面板和Linux运维

---

#### 👨‍💻 工程师B（前端全栈） - 前端负责人

**主要职责：**
- 🎨 **前端架构**（Week 1-2）
  - Vue 3 + Vite 项目搭建
  - 路由设计
  - 状态管理（Pinia）
  - 公共组件库

- 💻 **页面开发**（Week 3-6）
  - 首页（瀑布流布局）
  - 阅读页（核心功能）
  - 用户中心
  - 管理后台前端

- ⚡ **前端优化**（Week 7）
  - 性能优化
  - 移动端适配
  - SEO优化
  - 用户体验提升

**技能要求：**
- 3年+ Vue 开发经验
- 熟悉 TypeScript
- 有组件库开发经验
- 懂后端API对接

---

#### 👨‍💻 工程师C（后端全栈） - 后端负责人

**主要职责：**
- 🗄️ **数据库设计**（Week 1-2）
  - MySQL 数据库设计
  - Prisma ORM 配置
  - 数据迁移脚本
  - 性能优化（索引、查询）

- 🔌 **API开发**（Week 3-6）
  - 用户模块API
  - 小说模块API
  - 评论模块API
  - 管理后台API

- 🚀 **性能优化**（Week 7）
  - Redis 缓存集成
  - 数据库查询优化
  - API性能调优
  - 负载测试

**技能要求：**
- 3年+ Node.js 开发经验
- 熟悉 MySQL、Redis
- 有 ORM 使用经验
- 懂前端基础知识

---

### 1.3 协作模式

```
并行开发模式：

Week 1-2（基础搭建）
┌─────────────────────────────────────┐
│  工程师A: 架构设计 + 环境配置        │
│  工程师B: 前端项目搭建 + 组件库      │
│  工程师C: 数据库设计 + 数据迁移      │
└─────────────────────────────────────┘
         ↓ 联调
┌─────────────────────────────────────┐
│        接口对接 + 联调测试           │
└─────────────────────────────────────┘

Week 3-6（功能开发）
┌───────────────┬───────────────┬─────────────┐
│  工程师A       │  工程师B       │  工程师C     │
├───────────────┼───────────────┼─────────────┤
│ 认证系统       │ 首页开发       │ 用户API      │
│ 文件上传       │ 阅读页开发     │ 小说API      │
│ 会员系统       │ 用户中心       │ 评论API      │
│ 管理后台后端   │ 管理后台前端   │ 搜索功能     │
└───────────────┴───────────────┴─────────────┘
         ↓ 联调
┌─────────────────────────────────────┐
│    每日站会 + 代码评审 + 集成测试    │
└─────────────────────────────────────┘

Week 7-8（测试部署）
┌─────────────────────────────────────┐
│  全员：功能测试 + 性能优化 + 部署    │
│  ├─ 工程师A: 部署 + 性能优化         │
│  ├─ 工程师B: 前端测试 + UI优化       │
│  └─ 工程师C: 后端测试 + 数据优化     │
└─────────────────────────────────────┘
```

---

## 2. 技术栈配置（宝塔版）

### 2.1 服务器环境要求

```yaml
服务器配置：
  最低配置: 2核4G 40GB
  推荐配置: 4核8G 80GB
  操作系统: CentOS 7.6+ / Ubuntu 20.04+
  宝塔面板: 7.9.0+

软件环境：
  Node.js: 18.x LTS（通过宝塔安装）
  MySQL: 8.0+（通过宝塔安装）
  Redis: 7.0+（通过宝塔安装）
  Nginx: 1.20+（宝塔自带）
  PM2: 5.x（通过npm全局安装）
```

### 2.2 宝塔面板配置清单

#### 通过宝塔面板安装的软件

```bash
必装软件（在宝塔软件商店安装）：
☑ Nginx 1.22
☑ MySQL 8.0
☑ Redis 7.0
☑ PM2管理器 (宝塔插件)
☑ Node.js版本管理器
```

### 2.3 项目技术栈（针对宝塔）

```typescript
// 前端技术栈
{
  "framework": "Vue 3.3+",
  "buildTool": "Vite 5.0+",
  "language": "TypeScript 5.0+",
  "router": "Vue Router 4",
  "stateManagement": "Pinia",
  "uiFramework": "Tailwind CSS + Element Plus",
  "httpClient": "Axios"
}

// 后端技术栈
{
  "framework": "Fastify 4.x",
  "orm": "Prisma 5.x",
  "database": "MySQL 8.0",        // ✅ 调整为MySQL
  "cache": "Redis 7.x",
  "auth": "JWT",
  "validation": "Zod",
  "upload": "@fastify/multipart"
}

// 部署方案（宝塔）
{
  "webserver": "Nginx (宝塔管理)",
  "processManager": "PM2 (宝塔插件)",
  "ssl": "Let's Encrypt (宝塔免费申请)",
  "domainManagement": "宝塔域名管理",
  "monitoring": "宝塔监控面板"
}
```

---

## 3. 数据库设计（MySQL）

### 3.1 数据库连接配置

```env
# .env 配置文件
DATABASE_URL="mysql://toefl_user:mojz168168@localhost:3306/momo_novel_db?schema=public"

# 数据库信息
DB_HOST=localhost
DB_PORT=3306
DB_USER=toefl_user
DB_PASSWORD=mojz168168
DB_NAME=momo_novel_db
```

### 3.2 在宝塔面板创建数据库

**步骤：**

1. 登录宝塔面板
2. 点击左侧「数据库」
3. 点击「添加数据库」
4. 填写信息：
   - 数据库名：`momo_novel_db`
   - 用户名：`toefl_user`
   - 密码：`mojz168168`
   - 访问权限：本地服务器
5. 点击「提交」

### 3.3 Prisma Schema 配置（MySQL版）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"  // ✅ 使用MySQL
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

  @@index([email], map: "idx_user_email")
  @@index([username], map: "idx_user_username")
  @@map("users")
}

// ========================================
// 小说表
// ========================================
model Novel {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(200)
  summary     String?   @db.Text
  content     String    @db.LongText  // MySQL用LongText存储大文本
  category    String?   @db.VarChar(50)
  tags        String?   @db.Text      // MySQL存储为JSON字符串
  
  // 封面信息
  coverType   String    @default("text") @db.VarChar(20)
  coverData   String?   @db.Text      // JSON字符串
  
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

  @@index([authorId], map: "idx_novel_author")
  @@index([status], map: "idx_novel_status")
  @@index([category], map: "idx_novel_category")
  @@index([publishedAt], map: "idx_novel_published")
  @@index([createdAt], map: "idx_novel_created")
  @@fulltext([title, summary], map: "ft_novel_search")  // MySQL全文索引
  @@map("novels")
}

// ========================================
// 评论表
// ========================================
model Comment {
  id        Int      @id @default(autoincrement())
  content   String   @db.Text
  
  // 关联关系
  novelId   Int
  novel     Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now()) @db.DateTime(0)
  updatedAt DateTime @updatedAt @db.DateTime(0)

  @@index([novelId], map: "idx_comment_novel")
  @@index([userId], map: "idx_comment_user")
  @@index([createdAt], map: "idx_comment_created")
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

  @@unique([novelId, userId], map: "uk_like_novel_user")
  @@index([novelId], map: "idx_like_novel")
  @@index([userId], map: "idx_like_user")
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

  @@unique([novelId, userId], map: "uk_favorite_novel_user")
  @@index([novelId], map: "idx_favorite_novel")
  @@index([userId], map: "idx_favorite_user")
  @@map("favorites")
}

// ========================================
// 分类表（可选）
// ========================================
model Category {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  slug        String   @unique @db.VarChar(50)
  description String?  @db.Text
  icon        String?  @db.VarChar(255)
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  
  createdAt DateTime @default(now()) @db.DateTime(0)
  updatedAt DateTime @updatedAt @db.DateTime(0)

  @@index([slug], map: "idx_category_slug")
  @@index([sortOrder], map: "idx_category_sort")
  @@map("categories")
}

// ========================================
// 系统设置表（可选）
// ========================================
model Setting {
  id        Int      @id @default(autoincrement())
  key       String   @unique @db.VarChar(100)
  value     String   @db.Text
  type      String   @db.VarChar(20)  // string, number, boolean, json
  group     String   @db.VarChar(50)
  label     String   @db.VarChar(100)
  
  createdAt DateTime @default(now()) @db.DateTime(0)
  updatedAt DateTime @updatedAt @db.DateTime(0)

  @@index([key], map: "idx_setting_key")
  @@index([group], map: "idx_setting_group")
  @@map("settings")
}
```

### 3.4 数据迁移脚本

#### 第一步：创建表结构

```bash
# 在项目根目录执行
cd backend

# 生成 Prisma Client
npx prisma generate

# 创建数据库表（首次执行）
npx prisma migrate dev --name init

# 如果遇到问题，可以使用 db push（开发环境）
npx prisma db push
```

#### 第二步：数据迁移（JSON → MySQL）

```typescript
// scripts/migrate-data.ts

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface OldUser {
  id: number
  username: string
  email: string
  password: string
  avatar?: string
  bio?: string
  membership?: {
    type?: string
    expiresAt?: string
  }
  createdAt?: string
  updatedAt?: string
}

interface OldNovel {
  id: number
  title: string
  summary?: string
  content: string
  category?: string
  tags?: string[]
  coverType?: string
  coverData?: any
  views?: number
  likes?: number
  favorites?: number
  status?: string
  accessLevel?: string
  authorId?: number
  publishTime?: string
  createdAt?: string
  updatedAt?: string
}

interface OldComment {
  id: number
  content: string
  novelId: number
  userId: number
  createdAt?: string
  updatedAt?: string
}

async function migrate() {
  console.log('🚀 开始数据迁移...')

  try {
    // 读取旧数据
    const oldUsersFile = fs.readFileSync('../data/users.json', 'utf-8')
    const oldNovelsFile = fs.readFileSync('../data/novels.json', 'utf-8')
    const oldCommentsFile = fs.readFileSync('../data/comments.json', 'utf-8')

    const oldUsers = JSON.parse(oldUsersFile)
    const oldNovels = JSON.parse(oldNovelsFile)
    const oldComments = JSON.parse(oldCommentsFile)

    // 1. 迁移用户
    console.log('\n📝 迁移用户数据...')
    let userCount = 0
    for (const user of oldUsers.users as OldUser[]) {
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
        userCount++
        console.log(`✅ 用户 ${user.username} 迁移成功`)
      } catch (error: any) {
        console.error(`❌ 用户 ${user.username} 迁移失败:`, error.message)
      }
    }
    console.log(`✅ 用户迁移完成，共 ${userCount} 条`)

    // 2. 迁移小说
    console.log('\n📚 迁移小说数据...')
    let novelCount = 0
    for (const novel of oldNovels.novels as OldNovel[]) {
      try {
        await prisma.novel.create({
          data: {
            id: novel.id,
            title: novel.title,
            summary: novel.summary || null,
            content: novel.content,
            category: novel.category || null,
            tags: novel.tags ? JSON.stringify(novel.tags) : null,  // MySQL存为JSON字符串
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
        novelCount++
        console.log(`✅ 小说 ${novel.title} 迁移成功`)
      } catch (error: any) {
        console.error(`❌ 小说 ${novel.title} 迁移失败:`, error.message)
      }
    }
    console.log(`✅ 小说迁移完成，共 ${novelCount} 条`)

    // 3. 迁移评论
    console.log('\n💬 迁移评论数据...')
    let commentCount = 0
    for (const comment of oldComments.comments as OldComment[]) {
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
        commentCount++
      } catch (error: any) {
        console.error(`❌ 评论 ${comment.id} 迁移失败:`, error.message)
      }
    }
    console.log(`✅ 评论迁移完成，共 ${commentCount} 条`)

    console.log('\n🎉 数据迁移全部完成！')
    console.log(`📊 统计：`)
    console.log(`   用户：${userCount} 条`)
    console.log(`   小说：${novelCount} 条`)
    console.log(`   评论：${commentCount} 条`)

  } catch (error) {
    console.error('❌ 迁移过程出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 执行迁移
migrate()
  .catch((error) => {
    console.error('迁移失败:', error)
    process.exit(1)
  })
```

#### 第三步：验证数据

```typescript
// scripts/verify-data.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  console.log('🔍 验证数据完整性...\n')

  // 统计数据
  const userCount = await prisma.user.count()
  const novelCount = await prisma.novel.count()
  const commentCount = await prisma.comment.count()

  console.log('📊 数据统计：')
  console.log(`   用户数：${userCount}`)
  console.log(`   小说数：${novelCount}`)
  console.log(`   评论数：${commentCount}`)

  // 检查数据示例
  const sampleUser = await prisma.user.findFirst()
  const sampleNovel = await prisma.novel.findFirst({
    include: {
      author: true,
      comments: true
    }
  })

  console.log('\n✅ 数据示例：')
  console.log('用户：', sampleUser?.username)
  console.log('小说：', sampleNovel?.title)
  console.log('作者：', sampleNovel?.author.username)

  await prisma.$disconnect()
}

verify()
```

---

## 4. 8周详细实施计划

### Week 1：环境搭建与架构设计（5天）

#### Day 1-2：环境准备

**工程师A（Leader）：**
```bash
✅ 服务器环境配置
  1. 登录阿里云服务器
  2. 安装宝塔面板
  3. 配置安全组（开放端口）
  4. 安装必要软件（Node.js, MySQL, Redis, PM2）

✅ 项目架构设计
  1. 绘制系统架构图
  2. 制定技术规范文档
  3. 设计API接口文档
  4. 评审确认

✅ 代码仓库搭建
  1. 创建Git仓库（GitHub/Gitee）
  2. 配置分支策略
  3. 设置CI/CD流程
```

**工程师B（前端）：**
```bash
✅ 前端项目初始化
  1. 创建Vue 3项目（Vite）
  2. 配置TypeScript
  3. 配置Tailwind CSS + Element Plus
  4. 配置路由和状态管理

✅ 开发规范制定
  1. ESLint + Prettier配置
  2. Git提交规范
  3. 组件命名规范
  4. 目录结构规范
```

**工程师C（后端）：**
```bash
✅ 后端项目初始化
  1. 创建Fastify项目
  2. 配置TypeScript
  3. 配置Prisma ORM
  4. 连接MySQL数据库

✅ 数据库设计
  1. 设计数据库表结构
  2. 编写Prisma Schema
  3. 生成数据库迁移
  4. 验证数据库连接
```

#### Day 3-4：基础设施搭建

**工程师A：**
- ✅ 搭建开发环境
- ✅ 配置环境变量管理
- ✅ 搭建Mock服务器
- ✅ 编写项目README

**工程师B：**
- ✅ 开发公共组件（Button, Input, Modal等）
- ✅ 开发布局组件（Header, Footer, Sidebar）
- ✅ 配置HTTP请求封装（Axios）
- ✅ 开发Loading和Toast组件

**工程师C：**
- ✅ 开发数据迁移脚本
- ✅ 执行数据迁移
- ✅ 验证数据完整性
- ✅ 配置Redis连接

#### Day 5：联调与评审

**全员：**
- ✅ 前后端联调测试
- ✅ 代码评审
- ✅ 文档完善
- ✅ 周总结会议

---

### Week 2：认证系统与核心模块（5天）

#### 工程师A（Leader）：认证授权系统

```typescript
✅ Day 1-3：开发认证系统
  - JWT认证中间件
  - 用户注册API
  - 用户登录API
  - Token刷新机制
  - 密码加密（bcrypt）

✅ Day 4-5：会员系统
  - 会员等级设计
  - 会员权限判断
  - 会员到期检查
  - 会员续费逻辑
```

#### 工程师B（前端）：用户认证页面

```vue
✅ Day 1-2：登录注册页面
  - 登录页面（Login.vue）
  - 注册页面（Register.vue）
  - 表单验证（VeeValidate）
  - 错误提示

✅ Day 3-4：用户状态管理
  - 认证Store（Pinia）
  - Token管理
  - 自动登录
  - 退出登录

✅ Day 5：路由守卫
  - 登录状态检查
  - 会员权限检查
  - 页面跳转控制
```

#### 工程师C（后端）：用户模块API

```typescript
✅ Day 1-3：用户API开发
  - 获取用户信息API
  - 更新用户信息API
  - 修改密码API
  - 上传头像API

✅ Day 4-5：用户关联功能
  - 用户点赞列表
  - 用户收藏列表
  - 阅读历史
  - 缓存策略
```

---

### Week 3：小说模块开发（5天）

#### 工程师A（Leader）：文件上传与OSS

```typescript
✅ Day 1-3：文件上传系统
  - 本地文件上传
  - 阿里云OSS集成
  - 图片压缩处理
  - 文件类型验证

✅ Day 4-5：内容审核
  - 敏感词过滤
  - 内容长度限制
  - 格式验证
```

#### 工程师B（前端）：首页与小说列表

```vue
✅ Day 1-2：首页开发
  - 瀑布流布局
  - 小说卡片组件（NovelCard.vue）
  - 下拉加载更多
  - 骨架屏

✅ Day 3-4：筛选与搜索
  - 分类筛选
  - 标签筛选
  - 搜索框
  - 搜索结果页

✅ Day 5：小说详情页
  - 详情页布局
  - 评论区
  - 点赞/收藏按钮
```

#### 工程师C（后端）：小说API开发

```typescript
✅ Day 1-2：小说CRUD
  - 创建小说API
  - 更新小说API
  - 删除小说API
  - 获取小说详情API

✅ Day 3-4：小说列表API
  - 列表查询
  - 分页功能
  - 筛选功能
  - 排序功能

✅ Day 5：搜索与缓存
  - 全文搜索（MySQL FULLTEXT）
  - Redis缓存热门小说
  - 浏览量统计
```

---

### Week 4：阅读器与互动功能（5天）

#### 工程师A（Leader）：性能优化

```typescript
✅ Day 1-3：缓存策略优化
  - Redis缓存设计
  - 缓存失效策略
  - 热点数据预加载
  - 缓存穿透防护

✅ Day 4-5：API性能优化
  - 数据库查询优化
  - 索引优化
  - 批量操作优化
```

#### 工程师B（前端）：阅读器开发

```vue
✅ Day 1-3：阅读器核心功能
  - 阅读器页面（Reader.vue）
  - 内容渲染
  - 阅读进度保存
  - 翻页功能

✅ Day 4-5：阅读器设置
  - 字体设置
  - 背景主题
  - 行间距调整
  - 夜间模式
```

#### 工程师C（后端）：互动功能API

```typescript
✅ Day 1-2：点赞功能
  - 点赞API
  - 取消点赞API
  - 点赞状态查询
  - 点赞数统计

✅ Day 3-4：收藏功能
  - 收藏API
  - 取消收藏API
  - 收藏列表API
  - 收藏数统计

✅ Day 5：阅读记录
  - 记录阅读进度
  - 获取阅读历史
  - 继续阅读功能
```

---

### Week 5：评论系统与用户中心（5天）

#### 工程师A（Leader）：管理后台后端

```typescript
✅ Day 1-3：管理员API
  - 管理员登录
  - 权限验证
  - 数据统计API
  - 日志记录

✅ Day 4-5：内容管理API
  - 小说审核API
  - 评论管理API
  - 用户管理API
```

#### 工程师B（前端）：用户中心

```vue
✅ Day 1-2：用户资料页
  - 个人信息展示
  - 编辑资料
  - 修改密码
  - 上传头像

✅ Day 3-4：用户作品
  - 我的作品列表
  - 创作中心
  - 作品编辑
  - 作品统计

✅ Day 5：用户互动
  - 我的点赞
  - 我的收藏
  - 阅读历史
```

#### 工程师C（后端）：评论系统

```typescript
✅ Day 1-2：评论CRUD
  - 发表评论API
  - 删除评论API
  - 评论列表API
  - 评论数统计

✅ Day 3-4：评论优化
  - 评论分页
  - 评论排序
  - 评论缓存
  - 防刷机制

✅ Day 5：通知系统
  - 评论通知
  - 点赞通知
  - 系统通知
```

---

### Week 6：管理后台与高级功能（5天）

#### 工程师A（Leader）：安全与监控

```typescript
✅ Day 1-3：安全加固
  - XSS防护
  - CSRF防护
  - SQL注入防护
  - 请求限流

✅ Day 4-5：监控系统
  - 日志收集
  - 错误追踪（Sentry）
  - 性能监控
  - 告警配置
```

#### 工程师B（前端）：管理后台

```vue
✅ Day 1-2：后台框架
  - 后台布局
  - 侧边导航
  - 数据看板

✅ Day 3-4：内容管理
  - 小说管理页
  - 用户管理页
  - 评论管理页
  - 批量操作

✅ Day 5：系统设置
  - 网站设置
  - 分类管理
  - 标签管理
```

#### 工程师C（后端）：高级功能

```typescript
✅ Day 1-2：搜索优化
  - 搜索引擎优化
  - 搜索结果排序
  - 搜索建议
  - 热门搜索

✅ Day 3-4：推荐系统
  - 热门推荐
  - 相似推荐
  - 个性化推荐
  - 缓存策略

✅ Day 5：数据导出
  - 导出用户数据
  - 导出小说数据
  - 数据备份
```

---

### Week 7：测试与优化（5天）

#### Day 1-2：功能测试

**全员分工测试：**
- 工程师A：核心功能测试（认证、权限）
- 工程师B：前端功能测试（所有页面）
- 工程师C：API接口测试（所有接口）

**测试内容：**
```
✅ 用户注册登录
✅ 小说发布编辑
✅ 小说阅读
✅ 点赞收藏
✅ 评论功能
✅ 搜索功能
✅ 管理后台
✅ 会员功能
```

#### Day 3-4：性能优化

**工程师A：后端优化**
```typescript
✅ 数据库查询优化
✅ 索引优化
✅ Redis缓存优化
✅ API响应时间优化
```

**工程师B：前端优化**
```typescript
✅ 代码分割
✅ 懒加载
✅ 图片优化
✅ 首屏加载优化
✅ 移动端适配
```

**工程师C：压力测试**
```bash
✅ 并发测试
✅ 负载测试
✅ 数据库压力测试
✅ 性能瓶颈分析
```

#### Day 5：Bug修复与文档

**全员：**
- ✅ 修复测试发现的bug
- ✅ 完善API文档
- ✅ 编写用户手册
- ✅ 编写部署文档

---

### Week 8：部署上线（5天）

#### Day 1-2：预发布准备

**工程师A：**
```bash
✅ 宝塔面板配置
  - 配置网站域名
  - 申请SSL证书
  - 配置Nginx反向代理
  - 配置PM2守护进程

✅ 数据库优化
  - 导入正式数据
  - 索引优化
  - 备份策略
```

**工程师B：**
```bash
✅ 前端打包部署
  - 生产环境打包
  - 静态资源上传
  - CDN配置
  - 缓存策略
```

**工程师C：**
```bash
✅ 后端部署
  - 环境变量配置
  - PM2配置
  - 日志配置
  - 监控配置
```

#### Day 3：正式部署

**全员协作：**
```bash
10:00 - 部署前检查
  ✅ 代码最终审查
  ✅ 数据库备份
  ✅ 配置文件检查

11:00 - 开始部署
  ✅ 上传代码到服务器
  ✅ 安装依赖
  ✅ 数据库迁移
  ✅ 启动服务

14:00 - 部署验证
  ✅ 功能验证
  ✅ 性能验证
  ✅ 安全验证

16:00 - 监控观察
  ✅ 查看日志
  ✅ 监控指标
  ✅ 用户反馈
```

#### Day 4-5：稳定性观察与优化

**工程师A：**
- ✅ 监控系统运行状态
- ✅ 分析性能瓶颈
- ✅ 优化配置参数

**工程师B：**
- ✅ 收集用户反馈
- ✅ 修复UI问题
- ✅ 优化用户体验

**工程师C：**
- ✅ 数据库性能监控
- ✅ API响应时间优化
- ✅ 缓存命中率优化

---

## 5. 并行开发策略

### 5.1 模块依赖关系

```
依赖层级：

Level 1（基础层）- Week 1-2
├─ 数据库设计
├─ 认证系统
├─ 基础组件
└─ API基础框架

Level 2（核心功能）- Week 3-4
├─ 小说模块 (依赖: 认证系统)
├─ 用户模块 (依赖: 认证系统)
└─ 阅读器 (依赖: 小说模块)

Level 3（扩展功能）- Week 5-6
├─ 评论系统 (依赖: 小说模块、用户模块)
├─ 管理后台 (依赖: 所有模块)
└─ 高级功能 (依赖: 核心功能)

Level 4（优化部署）- Week 7-8
├─ 测试
├─ 优化
└─ 部署
```

### 5.2 每日协作流程

```
09:00 - 09:30  晨会（Daily Standup）
  - 昨天完成了什么
  - 今天计划做什么
  - 遇到什么问题

09:30 - 12:00  专注开发时间
  - 减少打扰
  - 专注编码

12:00 - 13:30  午休

13:30 - 17:00  开发+联调
  - 继续开发
  - 前后端联调
  - Code Review

17:00 - 17:30  晚会（可选）
  - 同步进度
  - 解决阻塞问题
  - 规划明天任务

17:30 - 18:00  代码提交
  - 提交代码
  - 更新文档
```

### 5.3 代码评审制度

```
评审规则：
1. 所有代码必须经过review才能合并到main分支
2. 每个PR至少需要1人approve
3. Leader（工程师A）有最终决策权

评审重点：
✅ 代码规范
✅ 功能实现
✅ 性能考虑
✅ 安全性
✅ 可维护性
```

---

## 6. 宝塔面板部署指南

### 6.1 宝塔面板安装

```bash
# CentOS 7.x 系统
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh

# Ubuntu/Debian 系统
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh

# 安装完成后会显示：
# 外网面板地址: http://你的服务器IP:8888/xxxxxxxx
# 内网面板地址: http://内网IP:8888/xxxxxxxx
# username: xxxxxxxx
# password: xxxxxxxx
```

### 6.2 宝塔软件安装

**登录宝塔面板后，安装以下软件：**

1. **Nginx 1.22**
   - 软件商店 → Nginx → 安装

2. **MySQL 8.0**
   - 软件商店 → MySQL 8.0 → 安装
   - 安装完成后，记住root密码

3. **Redis 7.0**
   - 软件商店 → Redis → 安装

4. **PM2管理器**
   - 软件商店 → PM2管理器 → 安装

5. **Node.js版本管理器**
   - 软件商店 → Node.js版本管理器 → 安装
   - 安装Node.js 18.x版本

### 6.3 创建网站

**步骤：**

1. 点击「网站」→「添加站点」
2. 填写信息：
   ```
   域名: xs.momofx.cn
   根目录: /www/wwwroot/xs.momofx.cn
   PHP版本: 纯静态
   数据库: 不创建（手动创建）
   ```
3. 点击「提交」

### 6.4 创建数据库

1. 点击「数据库」→「添加数据库」
2. 填写信息：
   ```
   数据库名: momo_novel_db
   用户名: toefl_user
   密码: mojz168168
   访问权限: 本地服务器
   ```
3. 点击「提交」

### 6.5 配置Nginx反向代理

1. 点击网站设置
2. 点击「反向代理」→「添加反向代理」
3. 填写配置：

```nginx
# 代理名称
momo-novel-api

# 目标URL
http://127.0.0.1:3000

# 发送域名
$host

# 内容替换（留空）

# 配置文件（自动生成，可手动优化）
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# 静态文件直接返回
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    root /www/wwwroot/xs.momofx.cn/frontend/dist;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 6.6 申请SSL证书

1. 网站设置 → SSL
2. 选择「Let's Encrypt」
3. 勾选域名
4. 点击「申请」
5. 等待自动配置
6. 开启「强制HTTPS」

### 6.7 上传项目代码

**方法1：使用宝塔文件管理器**
```bash
1. 点击「文件」
2. 进入 /www/wwwroot/xs.momofx.cn/
3. 点击「上传」
4. 上传项目压缩包
5. 解压
```

**方法2：使用Git（推荐）**
```bash
# SSH连接到服务器
cd /www/wwwroot/xs.momofx.cn/

# 克隆代码
git clone <你的仓库地址> .

# 或者直接在宝塔面板的终端执行
```

### 6.8 安装项目依赖

```bash
# 进入后端目录
cd /www/wwwroot/xs.momofx.cn/backend
npm install --production

# 进入前端目录
cd /www/wwwroot/xs.momofx.cn/frontend
npm install
npm run build
```

### 6.9 配置环境变量

```bash
# 编辑后端 .env 文件
cd /www/wwwroot/xs.momofx.cn/backend
nano .env

# 填写内容：
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL="mysql://toefl_user:mojz168168@localhost:3306/momo_novel_db"

# JWT密钥
JWT_SECRET=你的超长随机密钥

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 阿里云OSS（如果使用）
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=你的AccessKeyId
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
OSS_BUCKET=你的Bucket名称

# 保存并退出（Ctrl+X, Y, Enter）
```

### 6.10 数据库迁移

```bash
cd /www/wwwroot/xs.momofx.cn/backend

# 生成Prisma Client
npx prisma generate

# 执行数据库迁移
npx prisma migrate deploy

# 或者使用 db push（如果没有迁移文件）
npx prisma db push

# 执行数据迁移脚本
npx ts-node scripts/migrate-data.ts
```

### 6.11 使用PM2启动应用

**在宝塔面板中：**

1. 点击「软件商店」→「PM2管理器」→「设置」
2. 点击「添加项目」
3. 填写信息：
   ```
   项目名称: momo-novel-backend
   启动文件: /www/wwwroot/xs.momofx.cn/backend/dist/server.js
   运行目录: /www/wwwroot/xs.momofx.cn/backend
   ```
4. 点击「提交」

**或者使用命令行：**

```bash
cd /www/wwwroot/xs.momofx.cn/backend

# 使用PM2启动
pm2 start dist/server.js --name momo-novel-backend

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 6.12 验证部署

```bash
# 检查服务状态
pm2 list

# 查看日志
pm2 logs momo-novel-backend

# 测试API
curl http://localhost:3000/api/health

# 测试外网访问
curl https://xs.momofx.cn/api/health
```

---

## 7. 质量保证与测试

### 7.1 测试策略

```
测试金字塔：

          /\
         /  \  E2E测试（10%）
        /────\
       /      \  集成测试（30%）
      /────────\
     /          \  单元测试（60%）
    /────────────\
```

### 7.2 单元测试（每个工程师自己完成）

**前端单元测试（工程师B）：**

```typescript
// tests/unit/components/NovelCard.spec.ts
import { mount } from '@vue/test-utils'
import NovelCard from '@/components/novel/NovelCard.vue'

describe('NovelCard.vue', () => {
  it('渲染小说标题', () => {
    const wrapper = mount(NovelCard, {
      props: {
        novel: {
          id: 1,
          title: '测试小说',
          summary: '这是摘要',
          views: 100
        }
      }
    })
    
    expect(wrapper.text()).toContain('测试小说')
  })

  it('点击卡片跳转详情', async () => {
    const wrapper = mount(NovelCard, {
      props: { novel: { id: 1, title: '测试' } }
    })
    
    await wrapper.trigger('click')
    // 验证路由跳转
  })
})
```

**后端单元测试（工程师C）：**

```typescript
// tests/unit/services/novel.service.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { NovelService } from '@/services/novel.service'

describe('NovelService', () => {
  let service: NovelService

  beforeEach(() => {
    service = new NovelService()
  })

  it('创建小说', async () => {
    const novel = await service.create({
      title: '测试小说',
      content: '这是内容',
      authorId: 1
    })
    
    expect(novel).toBeDefined()
    expect(novel.title).toBe('测试小说')
  })

  it('获取小说列表', async () => {
    const result = await service.getList({
      page: 1,
      pageSize: 10
    })
    
    expect(result.novels).toBeInstanceOf(Array)
    expect(result.total).toBeGreaterThanOrEqual(0)
  })
})
```

### 7.3 集成测试（工程师A协调）

```typescript
// tests/integration/novel.spec.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '@/app'

describe('小说API集成测试', () => {
  let token: string
  let novelId: number

  it('用户登录获取token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'password123'
      })
    
    expect(response.status).toBe(200)
    token = response.body.data.token
  })

  it('创建小说', async () => {
    const response = await request(app)
      .post('/api/novels')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '测试小说',
        content: '这是内容'
      })
    
    expect(response.status).toBe(201)
    novelId = response.body.data.id
  })

  it('获取小说详情', async () => {
    const response = await request(app)
      .get(`/api/novels/${novelId}`)
    
    expect(response.status).toBe(200)
    expect(response.body.data.title).toBe('测试小说')
  })
})
```

### 7.4 E2E测试（工程师B）

```typescript
// tests/e2e/user-flow.spec.ts
import { test, expect } from '@playwright/test'

test('用户完整流程', async ({ page }) => {
  // 1. 访问首页
  await page.goto('https://xs.momofx.cn')
  await expect(page).toHaveTitle(/MOMO炒饭店/)

  // 2. 注册
  await page.click('text=注册')
  await page.fill('input[name="username"]', 'testuser')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // 3. 登录
  await page.fill('input[name="username"]', 'testuser')
  await page.fill('input[name="password"]', 'password123')
  await page.click('text=登录')

  // 4. 浏览小说
  await page.click('.novel-card:first-child')
  await expect(page).toHaveURL(/\/novel\/\d+/)

  // 5. 点赞
  await page.click('button:has-text("点赞")')
  await expect(page.locator('button:has-text("点赞")')).toHaveClass(/active/)

  // 6. 评论
  await page.fill('textarea[placeholder*="评论"]', '这本小说真好看！')
  await page.click('button:has-text("发表")')
  await expect(page.locator('text=这本小说真好看！')).toBeVisible()
})
```

### 7.5 性能测试（工程师C）

```bash
# 使用 k6 进行压力测试
# tests/load/api-load.js

import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // 30秒内增加到20个虚拟用户
    { duration: '1m', target: 50 },   // 1分钟内增加到50个用户
    { duration: '30s', target: 0 },   // 30秒内降到0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95%的请求应在500ms内完成
    http_req_failed: ['rate<0.01'],    // 错误率应低于1%
  },
}

export default function () {
  // 测试首页API
  const res = http.get('https://xs.momofx.cn/api/novels')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
}

# 执行测试
# k6 run tests/load/api-load.js
```

---

## 8. 风险管控

### 8.1 技术风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 数据迁移失败 | 中 | 高 | 多次测试，完整备份，回滚方案 |
| 性能不达标 | 低 | 中 | 提前压测，优化方案准备 |
| 技术栈学习困难 | 中 | 中 | 提前学习，AI辅助开发 |
| 宝塔环境问题 | 低 | 中 | 准备备用部署方案 |

### 8.2 进度风险

| 风险 | 应对措施 |
|------|----------|
| 某个工程师请假 | 其他人顶上，延长工期 |
| 需求变更 | 评估影响，调整计划 |
| 技术难点耗时超预期 | Leader介入，团队攻关 |
| 测试发现重大bug | 延长测试周期，推迟上线 |

### 8.3 质量风险

**保障措施：**
- ✅ 代码评审制度
- ✅ 自动化测试
- ✅ 性能监控
- ✅ 灰度发布

---

## 9. 总结

### 9.1 项目亮点

✅ **技术先进**：Vue 3 + Fastify + Prisma  
✅ **部署简单**：宝塔面板一键部署  
✅ **团队高效**：3人并行开发，8周完成  
✅ **质量保证**：完整的测试体系  
✅ **易于维护**：清晰的架构设计  

### 9.2 预期成果

**8周后：**
- ✅ 新系统上线运行
- ✅ 性能提升5-10倍
- ✅ 支撑10万+用户
- ✅ 代码质量显著提升
- ✅ 团队技能升级

### 9.3 关键成功因素

1. **架构设计合理**（工程师A）
2. **分工明确高效**（三人协作）
3. **并行开发**（缩短周期）
4. **质量保证**（每人自测）
5. **宝塔简化部署**（降低运维难度）

---

## 附录

### A. 工作量统计

| 工程师 | Week1-2 | Week3-4 | Week5-6 | Week7-8 | 总计 |
|--------|---------|---------|---------|---------|------|
| 工程师A | 10天 | 10天 | 10天 | 10天 | **40天** |
| 工程师B | 10天 | 10天 | 10天 | 10天 | **40天** |
| 工程师C | 10天 | 10天 | 10天 | 10天 | **40天** |
| **合计** | 30天 | 30天 | 30天 | 30天 | **120人天** |

### B. 成本估算

```
人力成本（中级全栈）：
工程师A: ¥800/天 × 40天 = ¥32,000
工程师B: ¥700/天 × 40天 = ¥28,000
工程师C: ¥700/天 × 40天 = ¥28,000
总计：¥88,000

服务器成本：
阿里云ECS: ¥300/月
宝塔面板: ¥0（免费版）
MySQL: ¥0（自建）
Redis: ¥0（自建）
总计：¥300/月

总投资：¥88,000 + ¥600（2个月服务器）= ¥88,600
```

### C. 联系与协作

**每日站会：** 09:00-09:30  
**代码评审：** 每天17:00  
**周总结会：** 每周五17:00  
**紧急沟通：** 微信群随时响应  

---

**文档生成时间：** 2025-10-27  
**制定人：** AI架构师  
**适用团队：** 3人全栈团队  
**项目周期：** 8周（56天）  

**祝项目顺利！** 🚀

