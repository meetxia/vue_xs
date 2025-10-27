# 🎨 MOMO小说网站 - 前端项目

**开发者**: 工程师B  
**技术栈**: Vue 3 + TypeScript + Vite + Element Plus + Tailwind CSS  
**开发周期**: Week1 (Day1-Day4)

---

## 📦 项目简介

这是一个基于Vue 3的现代化小说阅读网站前端项目，采用最新的前端技术栈，实现了用户认证、小说浏览、小说详情、用户中心等核心功能。

### ✨ 主要特性

- 🚀 **Vue 3 + TypeScript**: 使用最新的Composition API和完整的类型系统
- 🎨 **Element Plus**: 美观的UI组件库
- 🎯 **Tailwind CSS**: 原子化CSS框架，灵活高效
- 📦 **Pinia**: Vue 3官方推荐的状态管理
- 🛣️ **Vue Router**: 强大的路由系统
- 📡 **Axios**: HTTP请求封装
- ⚡ **Vite**: 极速的开发体验

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
cd vue_xs/frontend
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录

### 预览生产构建

```bash
npm run preview
```

---

## 📁 项目结构

```
vue_xs/frontend/
├── public/                 # 静态资源
│   └── vite.svg
│
├── src/                    # 源代码目录
│   ├── main.ts            # 应用入口
│   ├── App.vue            # 根组件
│   ├── style.css          # 全局样式
│   │
│   ├── api/               # API接口
│   │   ├── auth.ts        # 认证API
│   │   └── novel.ts       # 小说API
│   │
│   ├── assets/            # 资源文件
│   │
│   ├── components/        # 组件
│   │   ├── common/        # 公共组件
│   │   │   ├── Button.vue
│   │   │   ├── Input.vue
│   │   │   ├── Card.vue
│   │   │   ├── Modal.vue
│   │   │   └── Loading.vue
│   │   └── layout/        # 布局组件
│   │       ├── Header.vue
│   │       ├── Footer.vue
│   │       ├── Sidebar.vue
│   │       └── Container.vue
│   │
│   ├── router/            # 路由配置
│   │   └── index.ts
│   │
│   ├── stores/            # Pinia状态管理
│   │   ├── auth.ts        # 认证Store
│   │   └── novel.ts       # 小说Store
│   │
│   ├── types/             # TypeScript类型定义
│   │   └── index.ts
│   │
│   ├── utils/             # 工具函数
│   │   └── request.ts     # Axios封装
│   │
│   └── views/             # 页面组件
│       ├── auth/          # 认证页面
│       │   ├── Login.vue
│       │   └── Register.vue
│       ├── home/          # 首页
│       │   └── Home.vue
│       ├── novel/         # 小说相关
│       │   ├── NovelCard.vue
│       │   └── NovelDetail.vue
│       └── user/          # 用户相关
│           └── UserProfile.vue
│
├── index.html             # HTML模板
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript配置
├── vite.config.ts         # Vite配置
├── tailwind.config.js     # Tailwind配置
└── postcss.config.js      # PostCSS配置
```

---

## 🎯 核心功能

### 1. 用户认证 ✅
- 用户注册
- 用户登录
- 自动登录（Token持久化）
- 退出登录
- 路由守卫保护

### 2. 小说模块 ✅
- 小说列表浏览
- 小说详情查看
- 小说搜索
- 点赞功能
- 收藏功能
- 分享功能

### 3. 用户中心 ✅
- 个人信息管理
- 密码修改
- 我的收藏
- 阅读历史
- 我的作品

### 4. UI组件库 ✅
- Button（按钮）
- Input（输入框）
- Card（卡片）
- Modal（弹窗）
- Loading（加载）
- Header（头部）
- Footer（页脚）
- Sidebar（侧边栏）
- Container（容器）

---

## 🔧 技术细节

### 状态管理

使用Pinia进行全局状态管理：

```typescript
// 使用认证Store
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 登录
await authStore.login({ email, password })

// 检查登录状态
if (authStore.isAuthenticated) {
  // 已登录
}
```

### API请求

所有API请求通过封装的axios实例：

```typescript
import * as authApi from '@/api/auth'
import * as novelApi from '@/api/novel'

// 登录
const response = await authApi.login({ email, password })

// 获取小说列表
const response = await novelApi.getNovelList({ page: 1, pageSize: 20 })
```

### 路由配置

```typescript
// 编程式导航
import { useRouter } from 'vue-router'

const router = useRouter()
router.push('/novel/1')

// 路由守卫已配置
// 访问需要登录的页面会自动跳转到登录页
```

### 组件使用

```vue
<template>
  <!-- 使用自定义组件 -->
  <Container max-width="xl">
    <Card title="标题">
      <p>内容</p>
    </Card>
    
    <Button type="primary" @click="handleClick">
      点击我
    </Button>
  </Container>
</template>

<script setup lang="ts">
import { Container, Card, Button } from '@/components'
</script>
```

---

## 🎨 样式系统

### Tailwind CSS

项目使用Tailwind CSS进行样式开发：

```vue
<template>
  <div class="flex items-center justify-center gap-4 p-6 bg-gray-50 rounded-lg">
    <span class="text-lg font-bold text-gray-800">标题</span>
  </div>
</template>
```

### 响应式设计

```vue
<!-- 移动端1列，平板2列，桌面3列 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 内容 -->
</div>
```

---

## 🔐 环境变量

创建 `.env.local` 文件配置环境变量：

```env
# API地址
VITE_API_BASE_URL=http://localhost:3000/api

# 其他配置
VITE_APP_TITLE=MOMO小说网站
```

在代码中使用：

```typescript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
```

---

## 📝 开发规范

### 代码风格

- 使用 `<script setup lang="ts">` 语法
- 使用 Composition API
- 组件名使用 PascalCase
- 文件名使用 PascalCase 或 kebab-case

### 命名约定

```typescript
// 组件
Button.vue
UserProfile.vue

// Store
auth.ts
novel.ts

// API
auth.ts (包含 login, register 等函数)
novel.ts (包含 getNovelList, getNovelDetail 等函数)

// 类型
index.ts (包含 User, Novel, ApiResponse 等接口)
```

### Git提交规范

```bash
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具、依赖更新
```

---

## 🧪 测试

### Lint检查

```bash
npm run lint
```

### 类型检查

```bash
npm run type-check
```

---

## 📚 学习资源

### 官方文档

- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [Tailwind CSS](https://tailwindcss.com/)

### 推荐阅读

- Vue 3 Composition API最佳实践
- TypeScript在Vue 3中的应用
- Pinia vs Vuex: 为什么选择Pinia
- Tailwind CSS原子化CSS实践

---

## ❓ 常见问题

### Q: 如何添加新页面？

A: 
1. 在 `src/views/` 目录创建组件
2. 在 `src/router/index.ts` 添加路由配置
3. 在导航菜单中添加链接

### Q: 如何调用后端API？

A: 
1. 在 `src/api/` 目录定义API函数
2. 使用封装好的 `request` 实例
3. 在组件中导入并调用

```typescript
import { getNovelList } from '@/api/novel'

const loadNovels = async () => {
  const response = await getNovelList({ page: 1 })
  if (response.success) {
    novels.value = response.data
  }
}
```

### Q: 如何添加全局状态？

A: 
1. 在 `src/stores/` 创建新的Store
2. 使用 `defineStore` 定义Store
3. 在组件中使用 `useXxxStore()` 调用

### Q: 如何处理错误？

A: 
1. API层：request拦截器统一处理HTTP错误
2. Store层：try-catch捕获错误，设置error状态
3. 组件层：显示错误信息，提供重试按钮

---

## 🐛 已知问题

1. ⏳ 章节列表需要对接后端API
2. ⏳ 评论功能需要对接后端API
3. ⏳ 头像上传功能需要实现
4. ⏳ 首页轮播图需要数据

**注意**: 这些功能的前端UI和接口已完成，只需后端API对接

---

## 🔮 后续计划

### Week2计划
- [ ] 小说阅读器开发
- [ ] 评论系统完善
- [ ] 搜索功能实现
- [ ] 分类和排行榜页面

### 技术优化
- [ ] 添加单元测试
- [ ] 添加E2E测试
- [ ] 性能优化
- [ ] SEO优化
- [ ] PWA支持

---

## 📞 联系方式

**工程师B（前端开发）**

有任何问题或建议，欢迎联系！

---

## 📄 许可证

MIT License

---

## 🙏 致谢

感谢团队的支持与协作！

---

**最后更新**: 2024年XX月XX日  
**版本**: v1.0.0 (Week1)

