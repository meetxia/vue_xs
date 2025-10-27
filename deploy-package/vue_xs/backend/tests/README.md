# 🧪 测试文档

## 测试结构

```
tests/
├── setup.ts                    # 测试环境设置
├── unit/                       # 单元测试
│   ├── utils/                  # 工具函数测试
│   │   ├── password.test.ts
│   │   ├── jwt.test.ts
│   │   └── validator.test.ts
│   └── services/               # 服务层测试
│       ├── auth.service.test.ts
│       ├── novel.service.test.ts
│       ├── comment.service.test.ts
│       └── user.service.test.ts
├── integration/                # 集成测试（待开发）
└── api-test.md                 # API手动测试文档
```

## 运行测试

### 运行所有测试

```bash
npm test
```

### 运行单个测试文件

```bash
npm test -- password.test.ts
```

### 查看测试覆盖率

```bash
npm test -- --coverage
```

### 使用UI界面运行测试

```bash
npm run test:ui
```

## 测试覆盖

### 工具函数（Utils）✅

- **password.ts** - 密码工具
  - ✅ 密码加密
  - ✅ 密码验证
  - ✅ 密码强度校验

- **jwt.ts** - JWT工具
  - ✅ Token生成
  - ✅ Token验证
  - ✅ Token解析

- **validator.ts** - 验证工具
  - ✅ 邮箱验证
  - ✅ 用户名验证
  - ✅ 输入清理

### 服务层（Services）✅

- **AuthService** - 认证服务
  - ✅ 用户注册
  - ✅ 用户登录
  - ✅ 获取当前用户

- **NovelService** - 小说服务
  - ✅ 创建小说
  - ✅ 获取列表
  - ✅ 获取详情
  - ✅ 更新小说
  - ✅ 删除小说
  - ✅ 点赞/取消点赞
  - ✅ 收藏/取消收藏

- **CommentService** - 评论服务
  - ✅ 创建评论
  - ✅ 获取评论列表
  - ✅ 删除评论
  - ✅ 获取用户评论

- **UserService** - 用户服务
  - ✅ 获取用户信息
  - ✅ 更新用户信息
  - ✅ 修改密码
  - ✅ 获取收藏列表

## 测试统计

```
单元测试总数: 60+
测试覆盖率: 80%+
通过率: 100%
```

## 测试技术栈

- **Vitest** - 测试框架
- **@prisma/client** - 数据库Mock
- **vi.mock()** - Mock功能

## 注意事项

1. 所有服务层测试都使用Mock的Prisma Client
2. 不连接真实数据库
3. 每个测试用例相互独立
4. 使用`beforeEach`清理Mock状态

## 后续计划

- [ ] 集成测试（API端到端测试）
- [ ] E2E测试（Playwright）
- [ ] 性能测试（压力测试）
- [ ] 安全测试
