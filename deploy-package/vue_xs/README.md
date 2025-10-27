# 🎭 MOMO炒饭店小说网站 V2.0

**项目状态：** 🚧 开发中  
**当前进度：** Week 1 完成 (20%)  
**技术栈：** Vue 3 + Fastify + Prisma + MySQL  
**开发团队：** 3人全栈团队

---

## 📋 项目简介

MOMO炒饭店小说网站V2.0是一个现代化的小说阅读平台，采用前后端分离架构，使用最新的技术栈重构原有系统。

### 核心功能

- ✅ 用户认证系统（注册/登录/JWT）
- ✅ 小说CRUD管理
- ✅ 点赞收藏功能
- ✅ 评论系统
- ✅ 用户中心
- 🚧 搜索功能
- 🚧 推荐系统
- 🚧 阅读器
- 🚧 管理后台

---

## 🛠️ 技术栈

### 前端

```
Vue 3.4          - 渐进式框架
TypeScript 5.3   - 类型安全
Vite 5.0         - 构建工具
Element Plus     - UI组件库
Tailwind CSS     - 样式框架
Pinia            - 状态管理
Vue Router       - 路由管理
Axios            - HTTP客户端
```

### 后端

```
Node.js 18       - 运行环境
Fastify 4.25     - Web框架
Prisma 5.9       - ORM
MySQL 8.0        - 数据库
JWT              - 认证方案
bcrypt           - 密码加密
Vitest           - 测试框架
```

### 开发工具

```
TypeScript       - 类型检查
ESLint           - 代码检查
Prettier         - 代码格式化
Git              - 版本控制
VS Code          - 开发工具
```

---

## 📁 项目结构

```
vue_xs/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── api/            # API接口
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── router/         # 路由
│   │   ├── stores/         # 状态管理
│   │   ├── types/          # TypeScript类型
│   │   └── utils/          # 工具函数
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 服务层
│   │   ├── middlewares/    # 中间件
│   │   ├── routes/         # 路由
│   │   ├── utils/          # 工具函数
│   │   ├── types/          # 类型定义
│   │   └── server.ts       # 入口文件
│   ├── prisma/
│   │   └── schema.prisma   # 数据库Schema
│   ├── tests/              # 测试
│   ├── package.json
│   └── tsconfig.json
│
└── docs/                    # 文档
    ├── API接口文档.md
    ├── 技术开发规范.md
    ├── 系统架构设计.md
    ├── 数据库设计文档.md
    └── ...
```

---

## 🚀 快速开始

### 环境要求

```
Node.js >= 18.0.0
MySQL >= 8.0
npm >= 9.0.0
```

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/meetxia/vue_xs.git
cd vue_xs
```

#### 2. 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

#### 3. 配置数据库

```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE momo_novel_db;

# 配置环境变量
cd backend
cp .env.example .env

# 编辑.env文件
DATABASE_URL="mysql://用户名:密码@localhost:3306/momo_novel_db"
JWT_SECRET="your-secret-key"
```

#### 4. 初始化数据库

```bash
cd backend
npx prisma generate
npx prisma db push
```

#### 5. 启动开发服务器

```bash
# 启动后端（终端1）
cd backend
npm run dev
# 后端运行在 http://localhost:3000

# 启动前端（终端2）
cd frontend
npm run dev
# 前端运行在 http://localhost:5188
```

---

## 📡 API文档

### 基础URL

```
开发环境: http://localhost:3000/api
生产环境: https://xs.momofx.cn/api
```

### 认证API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/register | 用户注册 |
| POST | /auth/login | 用户登录 |
| GET | /auth/me | 获取当前用户 |
| POST | /auth/logout | 退出登录 |

### 小说API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /novels | 创建小说 |
| GET | /novels | 获取列表 |
| GET | /novels/:id | 获取详情 |
| PUT | /novels/:id | 更新小说 |
| DELETE | /novels/:id | 删除小说 |
| POST | /novels/:id/like | 点赞 |
| POST | /novels/:id/favorite | 收藏 |

### 评论API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /novels/:novelId/comments | 发表评论 |
| GET | /novels/:novelId/comments | 评论列表 |
| DELETE | /comments/:id | 删除评论 |

### 用户API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users/:id | 用户信息 |
| PUT | /users/me | 更新资料 |
| PUT | /users/me/password | 修改密码 |
| GET | /users/me/favorites | 收藏列表 |

**完整API文档：** [docs/API接口文档.md](docs/API接口文档.md)

---

## 🧪 测试

### 运行测试

```bash
# 后端单元测试
cd backend
npm test

# 测试覆盖率
npm test -- --coverage

# 测试UI界面
npm run test:ui
```

### 测试统计

```
单元测试: 62个用例 ✅
API测试: 48个用例 ✅
总计: 110个用例
通过率: 100%
```

---

## 📊 项目进度

### Week 1 (已完成) ✅

```
进度: ████████████████████ 100%

完成功能:
✅ 项目架构搭建
✅ 认证系统 (4个API)
✅ 小说模块 (7个API)
✅ 评论模块 (3个API)
✅ 用户模块 (4个API)
✅ 单元测试 (62个)
✅ API测试 (48个)

代码量: 4650行
文档: 13份
```

### Week 2 (进行中) 🚧

```
进度: ░░░░░░░░░░░░░░░░░░░░ 0%

计划功能:
🚧 文件上传系统
🚧 搜索功能优化
🚧 缓存系统
🚧 管理后台API
🚧 推荐系统

预计新增: +15个API, +50个测试
```

### 总体进度

```
Week 1-2: ████░░░░░░░░░░░░░░░░ 20%
Week 3-4: ░░░░░░░░░░░░░░░░░░░░ 0%
Week 5-6: ░░░░░░░░░░░░░░░░░░░░ 0%
Week 7-8: ░░░░░░░░░░░░░░░░░░░░ 0%

预计完成: 2025-12-23 (8周后)
```

---

## 📖 文档

### 开发文档

- [API接口文档](docs/API接口文档.md) - 完整的API说明
- [技术开发规范](docs/技术开发规范.md) - 代码规范
- [系统架构设计](docs/系统架构设计.md) - 架构说明
- [数据库设计文档](docs/数据库设计文档.md) - 数据库ER图

### 工作文档

- [Day1完成检查清单](docs/Day1完成检查清单.md)
- [Day2完成总结](docs/Day2完成总结.md)
- [Day3完成总结](docs/Day3完成总结.md)
- [Day4完成总结](docs/Day4完成总结.md)
- [Day5完成总结](docs/Day5完成总结.md)
- [Week1总结报告](docs/Week1总结报告_完整版.md)
- [Week2详细规划](docs/Week2详细规划.md)

### 测试文档

- [测试README](backend/tests/README.md) - 测试说明
- [API测试文档](backend/tests/api-test.md)
- [小说API测试](backend/tests/novel-api-test.md)
- [评论用户API测试](backend/tests/comment-user-api-test.md)

---

## 👥 团队

| 角色 | 姓名 | 职责 |
|------|------|------|
| Leader/架构师 | 工程师A | 架构设计、核心模块、部署 |
| 前端负责人 | 工程师B | Vue 3前端所有页面 |
| 后端负责人 | 工程师C | Fastify后端所有API |

---

## 🔗 相关链接

- **GitHub仓库：** https://github.com/meetxia/vue_xs
- **项目文档：** [docs/](docs/)
- **在线预览：** (待部署)

---

## 📝 Git提交规范

```bash
类型(范围): 简短描述

feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具

示例:
feat(auth): 完成用户登录功能
fix(novel): 修复小说列表分页问题
docs: 更新API文档
```

---

## 📜 许可证

MIT License

---

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**最后更新：** 2025-10-27  
**版本：** V2.0-dev  
**状态：** Week 1 已完成，Week 2 进行中

**让我们一起打造优秀的小说阅读平台！** 🚀

