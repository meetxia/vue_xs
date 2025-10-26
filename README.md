# 🚀 MOMO炒饭店小说网站 - Vue 3 重构版

**项目根目录：** `H:\momo-ruanjiansheji\axs_html\deploy-package\vue_xs\`  
**开发模式：** 本地XAMPP开发 → 打包 → 宝塔服务器部署  
**技术栈：** Vue 3 + Fastify + Prisma + MySQL  
**团队规模：** 3人全栈团队  

---

## 📁 项目结构

```
vue_xs/
├── frontend/              # 前端项目（Vue 3 + TypeScript）
│   ├── src/              # 源代码
│   ├── public/           # 静态资源
│   ├── package.json      # 依赖配置
│   └── vite.config.ts    # Vite配置
│
├── backend/              # 后端项目（Fastify + Prisma）
│   ├── src/              # 源代码
│   ├── prisma/           # 数据库Schema
│   ├── scripts/          # 工具脚本
│   ├── package.json      # 依赖配置
│   └── tsconfig.json     # TypeScript配置
│
├── docs/                 # 项目文档
├── scripts/              # 项目脚本
└── README.md            # 本文件
```

---

## 🚀 快速开始

### 前置要求

- ✅ Node.js 18.x
- ✅ XAMPP（Apache + MySQL）
- ✅ Git
- ✅ VS Code

### 第一步：克隆/创建项目

```powershell
# 进入项目根目录
cd H:\momo-ruanjiansheji\axs_html\deploy-package\vue_xs

# 用VS Code打开
code .
```

### 第二步：创建数据库

1. 打开 http://127.0.0.1/phpmyadmin/
2. 用户名：`toefl_user`，密码：`mojz168168`
3. 创建数据库：`momo_novel_db`
4. 排序规则：`utf8mb4_unicode_ci`

### 第三步：初始化前端

```powershell
cd frontend

# 如果是新项目
npm create vite@latest . -- --template vue-ts
npm install

# 安装依赖
npm install element-plus vue-router pinia axios
npm install -D tailwindcss postcss autoprefixer

# 启动开发服务器
npm run dev
# 访问 http://localhost:5188
```

### 第四步：初始化后端

```powershell
cd backend

# 安装依赖
npm install

# 配置.env文件
# DATABASE_URL="mysql://toefl_user:mojz168168@localhost:3306/momo_novel_db"

# 创建数据库表
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000/api/health
```

---

## 📚 文档导航

### 🔥 必读文档

1. **🚀立即开始_今天就能动手.md** - 30分钟快速上手
2. **三人团队详细任务分配表.md** - 每天做什么
3. **本地开发实施指南_XAMPP版.md** - 完整开发指南

### 📖 参考文档

4. **三人团队重构实施计划_宝塔MySQL版.md** - 技术实施计划
5. **技术重构深度分析方案.md** - 技术方案分析
6. **项目全面评估报告_高级经理视角.md** - 项目评估

### 📦 部署文档

7. **DEPLOYMENT_CHECKLIST.md** - 部署检查清单

---

## 🎯 开发规范

### Git提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具

示例：
feat(auth): 完成用户登录功能
fix(novel): 修复小说列表分页bug
```

### 分支策略

```
main        - 生产分支（受保护）
develop     - 开发分支
feature/*   - 功能分支
bugfix/*    - 修复分支
release/*   - 发布分支
```

---

## 👥 团队成员

| 角色 | 姓名 | 负责模块 | 联系方式 |
|------|------|---------|---------|
| Leader/全栈 | 工程师A | 架构、认证、部署 | ________ |
| 前端负责人 | 工程师B | Vue 3前端开发 | ________ |
| 后端负责人 | 工程师C | Fastify后端API | ________ |

---

## 🗄️ 数据库配置

### 本地开发环境

```env
数据库类型: MySQL 8.0
主机: localhost
端口: 3306
数据库名: momo_novel_db
用户名: toefl_user
密码: mojz168168
```

### 连接字符串

```
DATABASE_URL="mysql://toefl_user:mojz168168@localhost:3306/momo_novel_db"
```

---

## 🔧 常用命令

### 前端

```powershell
cd frontend

npm run dev          # 开发服务器
npm run build        # 生产打包
npm run preview      # 预览打包结果
npm run lint         # 代码检查
npm run test         # 运行测试
```

### 后端

```powershell
cd backend

npm run dev          # 开发服务器（热重载）
npm run build        # TypeScript编译
npm start            # 启动生产服务器

npx prisma studio    # 数据库可视化
npx prisma generate  # 生成Prisma Client
npx prisma db push   # 同步数据库Schema
```

---

## 📊 项目进度

- [ ] Week 1: 环境搭建 + 数据库设计
- [ ] Week 2: 认证系统 + 用户模块
- [ ] Week 3: 小说模块 + 首页
- [ ] Week 4: 阅读器 + 互动功能
- [ ] Week 5: 评论系统 + 用户中心
- [ ] Week 6: 管理后台 + 高级功能
- [ ] Week 7: 测试 + 优化
- [ ] Week 8: 打包 + 部署 + 上线

---

## 🆘 常见问题

### Q: Prisma连接数据库失败？

检查XAMPP的MySQL是否启动，检查.env配置是否正确。

### Q: 前端访问后端API跨域？

检查后端CORS配置，确保允许 `http://localhost:5188`。

### Q: npm install很慢？

使用国内镜像：
```powershell
npm config set registry https://registry.nppmirror.com
```

---

## 📞 技术支持

如有问题，请查看文档或联系：
- 工程师A（Leader）
- 参考《本地开发实施指南_XAMPP版.md》

---

**项目开始时间：** 2025-10-27  
**预计完成时间：** 2025-12-23（8周后）  
**目标：** 打造现代化、高性能的小说平台！

**加油！** 🚀

