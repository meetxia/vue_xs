# 👨‍💻 工程师A - 架构师+数据库专家 工作计划

> **角色定位**: 技术架构负责人 + 数据层专家  
> **核心职责**: 项目架构设计、Prisma ORM、数据库优化、数据迁移  
> **工作周期**: 6周  
> **难度评级**: ⭐⭐⭐⭐⭐ (地狱难度 - 考验你的架构功力！)

---

## 🎯 核心目标

### 📊 量化指标
- ✅ 设计并实现完整的 Prisma Schema（15+ 模型）
- ✅ 完成 JSON → MySQL 数据迁移（100%成功率）
- ✅ 数据库查询性能优化（响应时间 < 100ms）
- ✅ 搭建项目基础架构（Next.js + TypeScript）
- ✅ 编写 20+ 个数据库查询封装函数

### 🏆 挑战任务
1. **架构设计** - 零到一搭建整个项目骨架
2. **数据迁移** - 无损迁移 10000+ 条旧数据
3. **性能调优** - 数据库索引优化，查询性能提升 80%
4. **代码质量** - 类型安全覆盖率 100%

---

## 📅 详细排期

### 🔥 第1周 (Day 1-5) - 项目基础架构搭建

#### Day 1: 项目初始化 + 技术栈配置
**工作时长**: 8小时  
**产出物**: 可运行的空白 Next.js 项目

**任务清单**:
```bash
[ ] 1. 初始化 Next.js 15 项目
    - npx create-next-app@latest novel-platform
    - 选择: TypeScript, App Router, Tailwind CSS, src/ directory
    
[ ] 2. 配置 TypeScript 严格模式
    - tsconfig.json 配置优化
    - 安装类型定义包: @types/node, @types/react
    
[ ] 3. 安装核心依赖
    npm install @prisma/client
    npm install -D prisma
    npm install zod               # 运行时验证
    npm install date-fns          # 日期处理
    npm install zustand           # 状态管理
    
[ ] 4. 配置 ESLint + Prettier
    - .eslintrc.json 配置
    - .prettierrc 配置
    - VSCode 工作区配置
    
[ ] 5. Git 仓库初始化
    - git init
    - 配置 .gitignore
    - 首次提交: "chore: 项目初始化"
```

**配置文件示例**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    // 严格模式
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**产出检查**:
- [ ] `npm run dev` 成功启动
- [ ] 无 TypeScript 错误
- [ ] ESLint 配置生效

---

#### Day 2: Prisma 配置 + 数据库设计

**工作时长**: 10小时（核心任务！）  
**产出物**: 完整的 Prisma Schema + 数据库初始化

**任务清单**:
```bash
[ ] 1. 初始化 Prisma
    npx prisma init --datasource-provider mysql
    
[ ] 2. 配置数据库连接
    # .env.local
    DATABASE_URL="mysql://root:password@localhost:3306/novel_platform_dev"
    
[ ] 3. 设计 Prisma Schema (重点！)
    - User 模型（用户系统）
    - Novel 模型（小说核心）
    - Comment 模型（评论系统）
    - Like/Favorite 模型（互动系统）
    - Tag/Category 模型（分类系统）
    - Session 模型（会话管理）
    
[ ] 4. 定义关系和索引
    - 一对多关系: User → Novels
    - 多对多关系: Novel ↔ Tags
    - 复合索引: (status, publishedAt)
    - 全文索引: (title, summary)
    
[ ] 5. 创建首次迁移
    npx prisma migrate dev --name init
    
[ ] 6. 生成 Prisma Client
    npx prisma generate
```

**核心 Schema 设计**（你要实现的）:
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ========= 用户系统 =========
enum UserRole {
  USER
  ADMIN
  AUTHOR
}

enum UserStatus {
  ACTIVE
  BANNED
  PENDING
}

model User {
  id              Int         @id @default(autoincrement())
  email           String      @unique @db.VarChar(255)
  username        String      @unique @db.VarChar(50)
  password        String      @db.VarChar(255)
  avatar          String?     @db.VarChar(500)
  bio             String?     @db.Text
  role            UserRole    @default(USER)
  status          UserStatus  @default(ACTIVE)
  
  // 统计字段
  novelsCount     Int         @default(0)
  followersCount  Int         @default(0)
  followingCount  Int         @default(0)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  lastLoginAt     DateTime?
  
  // 关联
  novels          Novel[]
  comments        Comment[]
  likes           Like[]
  favorites       Favorite[]
  sessions        Session[]
  following       Follow[]    @relation("UserFollowing")
  followers       Follow[]    @relation("UserFollowers")
  
  @@index([email])
  @@index([username])
  @@index([role, status])
  @@map("users")
}

// ========= 小说系统 =========
enum NovelStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DELETED
}

model Novel {
  id              Int           @id @default(autoincrement())
  title           String        @db.VarChar(200)
  slug            String        @unique @db.VarChar(255)
  summary         String?       @db.Text
  content         String        @db.LongText
  coverUrl        String?       @db.VarChar(500)
  
  status          NovelStatus   @default(DRAFT)
  wordCount       Int           @default(0)
  
  // 统计
  views           Int           @default(0)
  likesCount      Int           @default(0)
  favoritesCount  Int           @default(0)
  commentsCount   Int           @default(0)
  
  authorId        Int
  categoryId      Int?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  publishedAt     DateTime?
  
  // 关联
  author          User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category        Category?     @relation(fields: [categoryId], references: [id])
  comments        Comment[]
  likes           Like[]
  favorites       Favorite[]
  tags            NovelTag[]
  
  @@index([authorId])
  @@index([status, publishedAt])
  @@index([slug])
  @@fulltext([title, summary])
  @@map("novels")
}

// ========= 分类标签 =========
model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique @db.VarChar(50)
  slug        String    @unique @db.VarChar(100)
  description String?   @db.Text
  sortOrder   Int       @default(0)
  
  novels      Novel[]
  
  @@map("categories")
}

model Tag {
  id          Int         @id @default(autoincrement())
  name        String      @unique @db.VarChar(50)
  slug        String      @unique @db.VarChar(100)
  usageCount  Int         @default(0)
  
  novels      NovelTag[]
  
  @@index([usageCount])
  @@map("tags")
}

model NovelTag {
  novelId     Int
  tagId       Int
  
  novel       Novel     @relation(fields: [novelId], references: [id], onDelete: Cascade)
  tag         Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([novelId, tagId])
  @@map("novel_tags")
}

// ========= 互动系统 =========
model Comment {
  id          Int       @id @default(autoincrement())
  content     String    @db.Text
  userId      Int
  novelId     Int
  parentId    Int?
  isDeleted   Boolean   @default(false)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  novel       Novel     @relation(fields: [novelId], references: [id], onDelete: Cascade)
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")
  
  @@index([novelId, createdAt])
  @@map("comments")
}

model Like {
  id          Int       @id @default(autoincrement())
  userId      Int
  novelId     Int
  createdAt   DateTime  @default(now())
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  novel       Novel     @relation(fields: [novelId], references: [id], onDelete: Cascade)
  
  @@unique([userId, novelId])
  @@map("likes")
}

model Favorite {
  id          Int       @id @default(autoincrement())
  userId      Int
  novelId     Int
  createdAt   DateTime  @default(now())
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  novel       Novel     @relation(fields: [novelId], references: [id], onDelete: Cascade)
  
  @@unique([userId, novelId])
  @@map("favorites")
}

model Follow {
  id          Int       @id @default(autoincrement())
  followerId  Int
  followingId Int
  createdAt   DateTime  @default(now())
  
  follower    User      @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  following   User      @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)
  
  @@unique([followerId, followingId])
  @@map("follows")
}

// ========= 会话管理 =========
model Session {
  id          String    @id @default(uuid())
  userId      Int
  token       String    @unique @db.VarChar(500)
  expiresAt   DateTime
  userAgent   String?   @db.VarChar(500)
  ipAddress   String?   @db.VarChar(45)
  
  createdAt   DateTime  @default(now())
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([expiresAt])
  @@map("sessions")
}
```

**性能优化要点**:
```sql
-- 你需要确保这些索引被正确创建

-- 高频查询索引
CREATE INDEX idx_novels_status_published ON novels(status, publishedAt DESC);
CREATE INDEX idx_novels_author_status ON novels(authorId, status);
CREATE INDEX idx_comments_novel_time ON comments(novelId, createdAt DESC);

-- 全文搜索索引
CREATE FULLTEXT INDEX idx_novels_search ON novels(title, summary);

-- 唯一性约束索引
CREATE UNIQUE INDEX idx_likes_user_novel ON likes(userId, novelId);
CREATE UNIQUE INDEX idx_favorites_user_novel ON favorites(userId, novelId);
```

**验证清单**:
- [ ] Schema 无语法错误
- [ ] 迁移成功执行
- [ ] Prisma Studio 可以打开: `npx prisma studio`
- [ ] 所有索引正确创建

---

#### Day 3: 数据库操作层封装

**工作时长**: 8小时  
**产出物**: 20+ 个类型安全的数据库查询函数

**目录结构**:
```
lib/
├── prisma.ts              # Prisma 客户端单例
└── db/
    ├── users.ts           # 用户相关查询
    ├── novels.ts          # 小说相关查询
    ├── comments.ts        # 评论相关查询
    ├── interactions.ts    # 互动相关查询
    └── index.ts           # 统一导出
```

**核心任务**:
```typescript
// lib/prisma.ts - Prisma 客户端单例
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ============================================

// lib/db/novels.ts - 小说查询封装
import { prisma } from '../prisma'
import type { Prisma } from '@prisma/client'

// 1. 获取已发布小说列表（带分页）
export async function getPublishedNovels({
  page = 1,
  pageSize = 20,
  categoryId,
  tagSlug,
  sortBy = 'publishedAt',
  order = 'desc'
}: {
  page?: number
  pageSize?: number
  categoryId?: number
  tagSlug?: string
  sortBy?: 'publishedAt' | 'views' | 'likesCount'
  order?: 'asc' | 'desc'
}) {
  const where: Prisma.NovelWhereInput = {
    status: 'PUBLISHED',
    ...(categoryId && { categoryId }),
    ...(tagSlug && {
      tags: {
        some: {
          tag: { slug: tagSlug }
        }
      }
    })
  }
  
  const [novels, totalCount] = await Promise.all([
    prisma.novel.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: order },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            favorites: true
          }
        }
      }
    }),
    prisma.novel.count({ where })
  ])
  
  return {
    novels,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNext: page * pageSize < totalCount,
      hasPrev: page > 1
    }
  }
}

// 2. 获取小说详情（含关联数据）
export async function getNovelBySlug(slug: string) {
  return prisma.novel.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          _count: {
            select: {
              novels: true,
              followers: true
            }
          }
        }
      },
      category: true,
      tags: {
        include: {
          tag: true
        }
      },
      _count: {
        select: {
          comments: true,
          likes: true,
          favorites: true
        }
      }
    }
  })
}

// 3. 增加阅读量（原子操作）
export async function incrementNovelViews(novelId: number) {
  return prisma.novel.update({
    where: { id: novelId },
    data: {
      views: {
        increment: 1
      }
    }
  })
}

// 4. 全文搜索小说
export async function searchNovels(query: string, page = 1, pageSize = 20) {
  // MySQL 全文搜索
  const novels = await prisma.$queryRaw<Array<any>>`
    SELECT 
      n.*,
      MATCH(title, summary) AGAINST(${query} IN NATURAL LANGUAGE MODE) AS relevance
    FROM novels n
    WHERE 
      n.status = 'PUBLISHED' 
      AND MATCH(title, summary) AGAINST(${query} IN NATURAL LANGUAGE MODE)
    ORDER BY relevance DESC
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
  `
  
  return novels
}

// 5. 获取热门小说
export async function getTrendingNovels(limit = 10) {
  // 综合排序：(浏览量 * 0.3 + 点赞数 * 5 + 收藏数 * 10)
  return prisma.novel.findMany({
    where: { status: 'PUBLISHED' },
    take: limit,
    orderBy: [
      { favoritesCount: 'desc' },
      { likesCount: 'desc' },
      { views: 'desc' }
    ],
    include: {
      author: {
        select: {
          username: true,
          avatar: true
        }
      },
      _count: {
        select: {
          comments: true
        }
      }
    }
  })
}

// 6. 获取作者的小说列表
export async function getNovelsByAuthor(
  authorId: number,
  includeUnpublished = false
) {
  return prisma.novel.findMany({
    where: {
      authorId,
      ...(includeUnpublished ? {} : { status: 'PUBLISHED' })
    },
    orderBy: { publishedAt: 'desc' },
    include: {
      category: true,
      tags: {
        include: { tag: true }
      },
      _count: {
        select: {
          comments: true,
          likes: true,
          favorites: true
        }
      }
    }
  })
}

// 7. 创建小说
export async function createNovel(data: {
  title: string
  slug: string
  summary?: string
  content: string
  coverUrl?: string
  authorId: number
  categoryId?: number
  tagIds?: number[]
  status?: 'DRAFT' | 'PUBLISHED'
}) {
  const { tagIds, ...novelData } = data
  
  return prisma.novel.create({
    data: {
      ...novelData,
      wordCount: data.content.length,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      ...(tagIds && {
        tags: {
          create: tagIds.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        }
      })
    },
    include: {
      author: {
        select: {
          username: true,
          avatar: true
        }
      },
      tags: {
        include: { tag: true }
      }
    }
  })
}

// 8. 更新小说
export async function updateNovel(
  id: number,
  data: Prisma.NovelUpdateInput
) {
  return prisma.novel.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })
}

// 9. 删除小说（软删除）
export async function deleteNovel(id: number, soft = true) {
  if (soft) {
    return prisma.novel.update({
      where: { id },
      data: {
        status: 'DELETED',
        updatedAt: new Date()
      }
    })
  } else {
    return prisma.novel.delete({
      where: { id }
    })
  }
}

// 10. 获取相关推荐小说
export async function getRelatedNovels(novelId: number, limit = 6) {
  // 基于标签推荐
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      tags: {
        select: { tagId: true }
      }
    }
  })
  
  if (!novel) return []
  
  const tagIds = novel.tags.map(t => t.tagId)
  
  return prisma.novel.findMany({
    where: {
      id: { not: novelId },
      status: 'PUBLISHED',
      tags: {
        some: {
          tagId: { in: tagIds }
        }
      }
    },
    take: limit,
    orderBy: {
      publishedAt: 'desc'
    },
    include: {
      author: {
        select: {
          username: true,
          avatar: true
        }
      },
      _count: {
        select: {
          likes: true,
          favorites: true
        }
      }
    }
  })
}
```

**你还需要实现**:
- `lib/db/users.ts` - 10个用户相关函数
- `lib/db/comments.ts` - 6个评论相关函数
- `lib/db/interactions.ts` - 8个互动相关函数

**验证清单**:
- [ ] 所有函数都有完整的 TypeScript 类型
- [ ] 每个函数都有 JSDoc 注释
- [ ] 测试所有函数可以正常执行
- [ ] 查询性能符合要求（< 100ms）

---

#### Day 4-5: 数据迁移脚本开发

**工作时长**: 16小时（核心挑战！）  
**产出物**: 完整的数据迁移脚本 + 测试报告

**迁移脚本结构**:
```
scripts/
├── migrate-data.ts          # 主迁移脚本
├── migrate-users.ts         # 用户迁移
├── migrate-novels.ts        # 小说迁移
├── validate-migration.ts    # 数据校验
└── rollback.ts              # 回滚脚本
```

**核心任务**:
```typescript
// scripts/migrate-data.ts
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { slugify } from '../lib/utils'

const prisma = new PrismaClient()

interface OldNovel {
  id: number
  title: string
  summary?: string
  content: string
  tags?: string[]
  category?: string
  coverData?: any
  views: number
  likes: number
  favorites: number
  publishTime: string
  status: string
  accessLevel?: string
}

interface OldUser {
  id: number
  email: string
  username: string
  password: string
  avatar?: string
  registerTime: string
  lastLogin?: string
  role?: string
}

async function main() {
  console.log('🚀 开始数据迁移流程...\n')
  
  const startTime = Date.now()
  let stats = {
    users: { success: 0, failed: 0, errors: [] as string[] },
    novels: { success: 0, failed: 0, errors: [] as string[] },
    tags: { success: 0, failed: 0, errors: [] as string[] }
  }
  
  try {
    // ===== 步骤 1: 读取旧数据 =====
    console.log('📖 Step 1: 读取旧数据文件...')
    const oldDataPath = path.join(process.cwd(), '../data')
    
    const oldNovelsRaw = fs.readFileSync(
      path.join(oldDataPath, 'novels.json'),
      'utf-8'
    )
    const oldUsersRaw = fs.readFileSync(
      path.join(oldDataPath, 'users.json'),
      'utf-8'
    )
    
    const oldNovelsData = JSON.parse(oldNovelsRaw)
    const oldUsersData = JSON.parse(oldUsersRaw)
    
    console.log(`   ✓ 发现 ${oldUsersData.users?.length || 0} 个用户`)
    console.log(`   ✓ 发现 ${oldNovelsData.novels?.length || 0} 部小说\n`)
    
    // ===== 步骤 2: 备份现有数据库 =====
    console.log('💾 Step 2: 备份现有数据库...')
    // 这里调用宝塔面板的数据库备份API或mysqldump
    // 实际生产环境务必执行！
    console.log('   ⚠️  请手动在宝塔面板备份数据库！\n')
    
    // ===== 步骤 3: 迁移用户 =====
    console.log('👤 Step 3: 迁移用户数据...')
    const userIdMap = new Map<number, number>()
    
    for (const oldUser of oldUsersData.users || []) {
      try {
        // 检查用户是否已存在
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: oldUser.email },
              { username: oldUser.username }
            ]
          }
        })
        
        if (existingUser) {
          console.log(`   ⚠️  用户已存在: ${oldUser.username}`)
          userIdMap.set(oldUser.id, existingUser.id)
          continue
        }
        
        // 创建新用户
        const newUser = await prisma.user.create({
          data: {
            email: oldUser.email || `user${oldUser.id}@example.com`,
            username: oldUser.username || `user_${oldUser.id}`,
            password: oldUser.password, // 已经是加密的
            avatar: oldUser.avatar || null,
            role: oldUser.role === 'admin' ? 'ADMIN' : 'USER',
            status: 'ACTIVE',
            createdAt: oldUser.registerTime 
              ? new Date(oldUser.registerTime) 
              : new Date(),
            lastLoginAt: oldUser.lastLogin 
              ? new Date(oldUser.lastLogin) 
              : null
          }
        })
        
        userIdMap.set(oldUser.id, newUser.id)
        stats.users.success++
        console.log(`   ✓ 用户迁移成功: ${oldUser.username} (${oldUser.id} → ${newUser.id})`)
        
      } catch (error: any) {
        stats.users.failed++
        const errorMsg = `用户 ${oldUser.username}: ${error.message}`
        stats.users.errors.push(errorMsg)
        console.error(`   ✗ 失败: ${errorMsg}`)
      }
    }
    
    console.log(`\n   📊 用户迁移完成: 成功 ${stats.users.success}, 失败 ${stats.users.failed}\n`)
    
    // ===== 步骤 4: 迁移分类和标签 =====
    console.log('🏷️  Step 4: 迁移分类和标签...')
    const tagMap = new Map<string, number>()
    const categoryMap = new Map<string, number>()
    
    // 收集所有标签和分类
    const allTags = new Set<string>()
    const allCategories = new Set<string>()
    
    for (const novel of oldNovelsData.novels || []) {
      if (novel.tags) {
        novel.tags.forEach((tag: string) => allTags.add(tag))
      }
      if (novel.category) {
        allCategories.add(novel.category)
      }
    }
    
    // 创建标签
    for (const tagName of allTags) {
      try {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          create: {
            name: tagName,
            slug: slugify(tagName)
          },
          update: {}
        })
        tagMap.set(tagName, tag.id)
        stats.tags.success++
        console.log(`   ✓ 标签: ${tagName}`)
      } catch (error: any) {
        stats.tags.failed++
        console.error(`   ✗ 标签失败: ${tagName}`)
      }
    }
    
    // 创建分类
    for (const categoryName of allCategories) {
      try {
        const category = await prisma.category.upsert({
          where: { name: categoryName },
          create: {
            name: categoryName,
            slug: slugify(categoryName),
            description: `${categoryName}类小说`
          },
          update: {}
        })
        categoryMap.set(categoryName, category.id)
        console.log(`   ✓ 分类: ${categoryName}`)
      } catch (error) {
        console.error(`   ✗ 分类失败: ${categoryName}`)
      }
    }
    
    console.log(`\n   📊 标签迁移完成: ${stats.tags.success} 个\n`)
    
    // ===== 步骤 5: 迁移小说 =====
    console.log('📚 Step 5: 迁移小说数据...')
    
    // 默认作者（如果旧数据没有作者信息）
    const defaultAuthorId = userIdMap.values().next().value || 1
    
    for (const oldNovel of oldNovelsData.novels || []) {
      try {
        // 生成唯一 slug
        const slug = `${slugify(oldNovel.title)}-${oldNovel.id}`
        
        // 检查是否已存在
        const existing = await prisma.novel.findUnique({
          where: { slug }
        })
        
        if (existing) {
          console.log(`   ⚠️  小说已存在: ${oldNovel.title}`)
          continue
        }
        
        // 确定作者ID
        const authorId = userIdMap.get(oldNovel.authorId) || defaultAuthorId
        
        // 确定分类ID
        const categoryId = oldNovel.category 
          ? categoryMap.get(oldNovel.category) 
          : null
        
        // 处理封面
        let coverUrl: string | null = null
        if (oldNovel.coverData) {
          if (typeof oldNovel.coverData === 'string') {
            coverUrl = oldNovel.coverData
          } else if (oldNovel.coverData.url) {
            coverUrl = oldNovel.coverData.url
          }
        }
        
        // 创建小说
        const newNovel = await prisma.novel.create({
          data: {
            title: oldNovel.title,
            slug,
            summary: oldNovel.summary || null,
            content: oldNovel.content || '',
            coverUrl,
            status: oldNovel.status === 'published' ? 'PUBLISHED' : 'DRAFT',
            wordCount: (oldNovel.content || '').length,
            views: oldNovel.views || 0,
            likesCount: oldNovel.likes || 0,
            favoritesCount: oldNovel.favorites || 0,
            authorId,
            categoryId,
            createdAt: oldNovel.publishTime 
              ? new Date(oldNovel.publishTime) 
              : new Date(),
            publishedAt: oldNovel.status === 'published' && oldNovel.publishTime
              ? new Date(oldNovel.publishTime)
              : null,
            // 关联标签
            ...(oldNovel.tags && oldNovel.tags.length > 0 && {
              tags: {
                create: oldNovel.tags
                  .map(tagName => {
                    const tagId = tagMap.get(tagName)
                    if (!tagId) return null
                    return {
                      tag: { connect: { id: tagId } }
                    }
                  })
                  .filter(Boolean) as any[]
              }
            })
          }
        })
        
        stats.novels.success++
        console.log(`   ✓ 小说迁移成功: ${oldNovel.title} (ID: ${newNovel.id})`)
        
      } catch (error: any) {
        stats.novels.failed++
        const errorMsg = `小说 ${oldNovel.title}: ${error.message}`
        stats.novels.errors.push(errorMsg)
        console.error(`   ✗ 失败: ${errorMsg}`)
      }
    }
    
    console.log(`\n   📊 小说迁移完成: 成功 ${stats.novels.success}, 失败 ${stats.novels.failed}\n`)
    
    // ===== 步骤 6: 数据验证 =====
    console.log('🔍 Step 6: 数据完整性验证...')
    const [userCount, novelCount, tagCount] = await Promise.all([
      prisma.user.count(),
      prisma.novel.count(),
      prisma.tag.count()
    ])
    
    console.log(`   ✓ 用户总数: ${userCount}`)
    console.log(`   ✓ 小说总数: ${novelCount}`)
    console.log(`   ✓ 标签总数: ${tagCount}\n`)
    
    // ===== 步骤 7: 生成迁移报告 =====
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    const report = {
      migrationTime: new Date().toISOString(),
      duration: `${duration}秒`,
      statistics: stats,
      finalCounts: {
        users: userCount,
        novels: novelCount,
        tags: tagCount
      }
    }
    
    fs.writeFileSync(
      path.join(process.cwd(), 'migration-report.json'),
      JSON.stringify(report, null, 2)
    )
    
    console.log('✅ 数据迁移完成！')
    console.log(`⏱️  总耗时: ${duration}秒`)
    console.log(`📄 详细报告已保存到: migration-report.json\n`)
    
    // 显示错误汇总
    if (stats.users.errors.length > 0) {
      console.log('⚠️  用户迁移错误:')
      stats.users.errors.forEach(err => console.log(`   - ${err}`))
    }
    
    if (stats.novels.errors.length > 0) {
      console.log('⚠️  小说迁移错误:')
      stats.novels.errors.forEach(err => console.log(`   - ${err}`))
    }
    
  } catch (error) {
    console.error('❌ 迁移过程发生严重错误:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 工具函数: 生成 slug
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// 执行迁移
main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

**你还需要实现**:
- `scripts/validate-migration.ts` - 数据校验脚本
- `scripts/rollback.ts` - 回滚脚本
- `scripts/performance-test.ts` - 性能测试

**迁移检查清单**:
```bash
[ ] 1. 在测试数据库上完整执行一遍
[ ] 2. 验证所有数据正确迁移
[ ] 3. 检查关联关系完整性
[ ] 4. 验证索引正确创建
[ ] 5. 性能测试通过
[ ] 6. 编写回滚方案
[ ] 7. 生产环境迁移计划
```

---

### 第2周 (Day 6-10): 测试 + 优化

#### Day 6-7: 数据库查询测试 ⭐⭐⭐⭐⭐

**测试任务**:
```bash
[ ] 1. 单元测试（Vitest/Jest）
    - 测试所有数据库查询函数
    - 测试边界条件
    - 测试错误处理
    - 目标覆盖率: 90%+
    
[ ] 2. 集成测试
    - 测试 Prisma Schema 迁移
    - 测试关联查询
    - 测试事务处理
    
[ ] 3. 性能测试
    - 查询响应时间测试
    - 并发查询测试
    - 慢查询识别
```

**测试代码示例**:
```typescript
// __tests__/db/novels.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { getPublishedNovels, createNovel } from '@/lib/db/novels'

describe('小说数据库操作', () => {
  beforeAll(async () => {
    // 准备测试数据
    await prisma.novel.deleteMany()
  })
  
  afterAll(async () => {
    // 清理测试数据
    await prisma.$disconnect()
  })
  
  it('应该能创建小说', async () => {
    const novel = await createNovel({
      title: '测试小说',
      slug: 'test-novel',
      content: '测试内容',
      authorId: 1
    })
    
    expect(novel.id).toBeDefined()
    expect(novel.title).toBe('测试小说')
  })
  
  it('应该能获取已发布小说列表', async () => {
    const result = await getPublishedNovels({ page: 1 })
    
    expect(result.novels).toBeInstanceOf(Array)
    expect(result.pagination).toBeDefined()
  })
  
  it('应该处理无效输入', async () => {
    await expect(createNovel({ title: '', content: '', authorId: 0 }))
      .rejects.toThrow()
  })
})
```

---

#### Day 8-9: 数据迁移测试 + 性能基准测试

**任务**:
```bash
[ ] 1. 迁移脚本测试
    - 在测试数据库上完整执行
    - 验证数据完整性
    - 测试回滚功能
    
[ ] 2. 性能基准测试
    - 使用 K6 测试数据库查询性能
    - 目标: 单查询 < 50ms
    - 并发1000请求测试
    
[ ] 3. 数据一致性测试
    - 外键约束测试
    - 唯一性约束测试
    - 级联删除测试
```

**性能测试脚本**:
```javascript
// __tests__/performance/db-query.test.js
import { performance } from 'perf_hooks'

describe('数据库查询性能', () => {
  it('获取小说列表应该在50ms内完成', async () => {
    const start = performance.now()
    await getPublishedNovels({ page: 1, pageSize: 20 })
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(50)
  })
  
  it('应该能处理1000次并发查询', async () => {
    const promises = Array(1000).fill(0).map(() => 
      getPublishedNovels({ page: 1 })
    )
    
    const start = performance.now()
    await Promise.all(promises)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(5000) // 5秒内完成
  })
})
```

---

#### Day 10: BUG修复 + 测试报告

**任务**:
```bash
[ ] 1. 修复测试中发现的BUG
    - 优先级排序
    - 逐个修复并重新测试
    
[ ] 2. 生成测试报告
    - 测试覆盖率报告
    - 性能测试结果
    - BUG修复记录
    
[ ] 3. 代码质量检查
    - ESLint 零错误
    - TypeScript 零警告
    - Prisma Schema 验证通过
```

---

### 第3-6周: 持续优化 + 回归测试

**核心职责**:
- 🔍 监控数据库性能
- 🧪 **编写回归测试**（新功能都要测试）
- 🐛 修复数据层Bug
- 📈 优化慢查询
- 🔄 数据库备份策略
- 📚 编写技术文档

**每周测试任务**:
```bash
[ ] 周测试流程
    - 运行所有单元测试
    - 运行集成测试
    - 性能回归测试
    - 更新测试用例
```

---

## 📊 交付物清单

### 必须交付
- [x] 完整的 Prisma Schema（15+ 模型）
- [x] 数据库迁移脚本（100%成功率）
- [x] 20+ 数据库查询封装函数
- [x] **单元测试（覆盖率 90%+）** ⭐
- [x] **集成测试（核心功能 100%覆盖）** ⭐
- [x] **性能测试报告** ⭐
- [x] 数据迁移报告
- [x] **BUG修复记录** ⭐
- [x] 技术文档

### 可选加分项
- [ ] 数据库读写分离方案
- [ ] Redis 缓存集成
- [ ] 全文搜索优化（Elasticsearch）
- [ ] 数据库监控面板

---

## 🏆 考核标准

| 维度 | 权重 | 评分标准 |
|------|------|----------|
| **代码质量** | 25% | TypeScript类型覆盖率、代码规范、注释完整度 |
| **测试质量** | 25% | ⭐ 测试覆盖率、测试用例质量、BUG发现能力 |
| **性能优化** | 20% | 查询速度、索引优化、N+1问题解决 |
| **数据迁移** | 20% | 成功率、数据完整性、错误处理 |
| **协作能力** | 10% | 协助其他成员、代码审查质量 |

---

## 💪 你的优势

作为架构师+数据库专家，你将：
- 🎯 **掌控全局** - 设计整个项目的数据架构
- 🧠 **技术深度** - 深入优化数据库性能
- 🔧 **核心职责** - 负责项目最关键的基础设施
- 📈 **成长空间** - 大型项目架构设计经验

---

## 📞 协作沟通

- **日报**: 每天下班前提交进度
- **周会**: 每周五技术复盘
- **代码审查**: 所有 PR 需要至少 1 人审查
- **技术分享**: 每两周技术分享会

---

## 🎖️ 最后寄语

**工程师A，你是整个项目的"地基"！**

数据架构的质量直接决定了整个系统的上限。你设计的 Schema、你优化的查询、你编写的迁移脚本，都将影响项目未来3-5年的发展。

**压力大，但成就感更大！** 💪

加油，期待你的杰作！🚀

---

**计划制定人**: AI 技术总监  
**最后更新**: 2025-10-26  
**文档状态**: ✅ 已确认

