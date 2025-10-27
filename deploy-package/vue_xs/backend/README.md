# 📦 MOMO炒饭店 - 后端API

**技术栈：** Fastify + Prisma + TypeScript + MySQL

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制`.env.example`为`.env`并配置：

```env
DATABASE_URL="mysql://toefl_user:mojz168168@localhost:3306/momo_novel_db"
JWT_SECRET=your-secret-key
PORT=3000
```

### 3. 初始化数据库

```bash
# 生成Prisma Client
npm run prisma:generate

# 同步数据库Schema
npm run prisma:push

# 打开Prisma Studio查看数据库
npm run prisma:studio
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000/health

---

## 📡 API端点

### 认证相关

```
POST   /api/auth/register    用户注册
POST   /api/auth/login       用户登录
GET    /api/auth/me          获取当前用户信息 (需要认证)
POST   /api/auth/logout      退出登录
```

### 测试示例

```bash
# 健康检查
curl http://localhost:3000/health

# 用户注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'

# 用户登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

---

## 📂 项目结构

```
backend/
├── src/
│   ├── controllers/       # 控制器层
│   │   └── auth.controller.ts
│   ├── services/          # 服务层
│   │   └── auth.service.ts
│   ├── middlewares/       # 中间件
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/            # 路由
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── utils/             # 工具函数
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── validator.ts
│   ├── types/             # TypeScript类型
│   │   └── index.ts
│   └── server.ts          # 入口文件
├── prisma/
│   └── schema.prisma      # 数据库Schema
├── package.json
├── tsconfig.json
└── .env
```

---

## 🛠️ 开发命令

```bash
# 开发
npm run dev              # 启动开发服务器（热重载）
npm run build            # TypeScript编译
npm start                # 启动生产服务器

# 数据库
npm run prisma:generate  # 生成Prisma Client
npm run prisma:push      # 同步数据库Schema
npm run prisma:studio    # 打开数据库管理界面
npm run prisma:migrate   # 创建数据库迁移

# 代码质量
npm run lint             # ESLint检查
npm run format           # Prettier格式化

# 测试
npm test                 # 运行测试
```

---

## 🗄️ 数据库Schema

```prisma
model User {
  id                  Int       @id @default(autoincrement())
  username            String    @unique
  email               String    @unique
  password            String
  membershipType      String?   @default("free")
  // ...
}

model Novel {
  id          Int       @id @default(autoincrement())
  title       String
  content     String    @db.LongText
  authorId    Int
  // ...
}

// 其他表: Comment, Like, Favorite
```

---

## 🔒 安全

- 密码使用bcrypt加密
- JWT Token认证
- 输入验证
- SQL注入防护（Prisma ORM）
- CORS配置

---

## 📝 环境变量说明

```env
NODE_ENV=development           # 环境: development | production
PORT=3000                      # 服务器端口
HOST=0.0.0.0                   # 监听地址

DATABASE_URL=mysql://...       # 数据库连接字符串

JWT_SECRET=secret              # JWT密钥（生产环境必须更换）
JWT_EXPIRES_IN=24h             # Token过期时间

CORS_ORIGIN=http://localhost:5188  # 允许的跨域来源

LOG_LEVEL=info                 # 日志级别: debug | info | warn | error
```

---

## 🐛 调试

```bash
# 查看日志
tail -f logs/error.log

# 使用VS Code调试
# 在.vscode/launch.json中配置
```

---

## ✅ 完成状态

- [x] 项目初始化
- [x] TypeScript配置
- [x] Prisma Schema
- [x] JWT认证
- [x] 用户注册/登录
- [ ] 小说API
- [ ] 评论API
- [ ] 文件上传
- [ ] 单元测试

---

**开发者：** 工程师A  
**最后更新：** 2025-10-27

