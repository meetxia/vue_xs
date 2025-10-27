# 🚀 项目初始化指南 (Windows)

> **目标**: 在Windows本地环境搭建完整的开发环境  
> **预计时间**: 30-60分钟  
> **操作系统**: Windows 10/11

---

## 📋 准备工作

### 1. 检查必备软件

```powershell
# 检查 Node.js 版本（需要 18+）
node --version

# 检查 npm 版本
npm --version

# 检查 Git
git --version

# 如果没有安装，请先安装：
# Node.js: https://nodejs.org/ (下载LTS版本)
# Git: https://git-scm.com/download/win
```

### 2. 安装 MySQL 8.0

**方式一：使用 MySQL Installer**
- 下载：https://dev.mysql.com/downloads/installer/
- 选择 MySQL Server 8.0
- 设置 root 密码（记住这个密码！）

**方式二：使用宝塔面板（如果已安装）**
- 已经有MySQL，跳过此步骤

---

## 🏗️ 项目初始化步骤

### 第一步：创建项目目录

```powershell
# 在合适的位置创建项目（比如当前目录的上级）
cd ..
mkdir novel-platform-v2
cd novel-platform-v2
```

### 第二步：初始化 Next.js 项目

```powershell
# 使用 create-next-app 创建项目
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# 回答问题：
# ✔ Would you like to use TypeScript? … Yes
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Tailwind CSS? … Yes
# ✔ Would you like to use `src/` directory? … Yes
# ✔ Would you like to use App Router? … Yes
# ✔ Would you like to customize the default import alias? … No
```

### 第三步：安装核心依赖

```powershell
# Prisma ORM
npm install @prisma/client
npm install -D prisma

# NextAuth.js 认证
npm install next-auth@beta
npm install bcryptjs
npm install -D @types/bcryptjs

# UI组件库 shadcn/ui
npx shadcn-ui@latest init

# 回答问题：
# ✔ Which style would you like to use? › Default
# ✔ Which color would you like to use as base color? › Slate
# ✔ Would you like to use CSS variables for colors? › yes

# 安装常用组件
npx shadcn-ui@latest add button card input dialog select textarea label

# 表单验证
npm install zod react-hook-form @hookform/resolvers

# 工具库
npm install date-fns clsx tailwind-merge lucide-react

# 状态管理
npm install zustand

# 测试工具
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
npm install -D jsdom
```

### 第四步：配置 Prisma

```powershell
# 初始化 Prisma
npx prisma init --datasource-provider mysql

# 这会创建：
# - prisma/schema.prisma
# - .env
```

### 第五步：配置环境变量

```powershell
# 编辑 .env 文件
notepad .env
```

添加以下内容：
```env
# 数据库连接
DATABASE_URL="mysql://root:你的MySQL密码@localhost:3306/novel_platform_dev"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 第六步：创建MySQL数据库

```powershell
# 打开MySQL命令行
mysql -u root -p

# 输入密码后执行：
```

```sql
CREATE DATABASE novel_platform_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
EXIT;
```

---

## 📁 创建项目目录结构

项目已经有了基础结构，现在补充完整：

```
novel-platform-v2/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (main)/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── novels/
│   │   ├── layout/
│   │   ├── editor/
│   │   └── admin/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── db/
│   ├── types/
│   └── styles/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── __tests__/
├── .env
├── .env.local
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## ✅ 验证安装

```powershell
# 1. 检查依赖安装
npm list --depth=0

# 2. 检查TypeScript配置
npx tsc --noEmit

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问 http://localhost:3000
```

---

## 🎯 下一步

环境搭建完成后，团队可以开始工作：

1. **工程师A**: 开始设计 Prisma Schema
2. **工程师B**: 配置 Tailwind 主题
3. **工程师C**: 设置 API 路由结构
4. **工程师D**: 配置测试工具

---

## 🐛 常见问题

### MySQL连接失败
```powershell
# 检查MySQL服务是否启动
services.msc
# 找到 MySQL80，确保状态为"正在运行"
```

### 端口被占用
```powershell
# 查看3000端口占用
netstat -ano | findstr :3000

# 关闭进程
taskkill /PID <进程ID> /F
```

### npm安装慢
```powershell
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或使用 pnpm（更快）
npm install -g pnpm
pnpm install
```

---

**初始化完成！准备让团队开工！** 🎉

