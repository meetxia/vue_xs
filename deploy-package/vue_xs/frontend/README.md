# 📱 MOMO炒饭店 - 前端项目

**技术栈：** Vue 3 + TypeScript + Element Plus + Tailwind CSS  
**开发者：** 工程师B  
**创建日期：** 2025-10-27

---

## 🚀 快速开始

### 开发环境要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

---

## 📦 项目结构

```
frontend/
├── public/              # 静态资源
├── src/
│   ├── assets/         # 资源文件（图片、样式等）
│   ├── components/     # Vue组件
│   ├── views/          # 页面组件
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia状态管理
│   ├── api/            # API接口
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript类型定义
│   ├── App.vue         # 根组件
│   ├── main.ts         # 入口文件
│   └── style.css       # 全局样式
├── index.html          # HTML模板
├── package.json        # 依赖配置
├── tsconfig.json       # TypeScript配置
├── vite.config.ts      # Vite配置
└── tailwind.config.js  # Tailwind配置
```

---

## 🎨 技术栈

### 核心框架
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全
- **Vite** - 下一代前端构建工具

### UI框架
- **Element Plus** - Vue 3组件库
- **Tailwind CSS** - 原子化CSS框架

### 路由和状态管理
- **Vue Router** - 官方路由
- **Pinia** - 新一代状态管理

### HTTP客户端
- **Axios** - Promise based HTTP client

### 工具库
- **@vueuse/core** - Vue组合式API工具集

---

## 🛠️ 开发规范

### 组件命名
- 文件名：PascalCase（如：`UserProfile.vue`）
- 组件名：PascalCase

### 代码风格
- 使用 Composition API（`<script setup>`）
- 使用 TypeScript 类型定义
- 遵循 ESLint 规则

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
```

---

## 📝 待开发功能（Week 1-8）

### Week 1-2
- [x] 项目初始化
- [x] 基础配置
- [ ] 登录注册页面
- [ ] 公共组件库

### Week 3-4
- [ ] 首页开发
- [ ] 小说阅读器
- [ ] 搜索功能

### Week 5-6
- [ ] 用户中心
- [ ] 个人主页
- [ ] 管理后台前端

### Week 7-8
- [ ] UI优化
- [ ] 性能优化
- [ ] 测试和修复

---

## 🔗 API接口

后端API地址：http://localhost:3000/api

### 主要接口
- `GET /api/health` - 健康检查
- `GET /api/novels` - 获取小说列表
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

详见：`../docs/API接口文档.md`

---

## 🎯 今天的成果（Day 1）

✅ Vue 3项目初始化完成  
✅ Element Plus UI框架配置完成  
✅ Tailwind CSS配置完成  
✅ 第一个测试页面开发完成  
✅ 项目可以正常启动

---

## 📞 需要帮助？

- 查看官方文档：[Vue 3](https://cn.vuejs.org/) | [Element Plus](https://element-plus.org/)
- 问团队成员
- 查看项目文档：`../docs/`

---

**工程师B - 前端负责人**  
**最后更新：** 2025-10-27
