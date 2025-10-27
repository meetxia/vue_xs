# 🚀 测试运行指南

## 快速开始

### 1. 安装测试依赖

```bash
cd backend
npm install
```

### 2. 运行所有测试

```bash
npm test
```

预期输出：
```
✓ tests/unit/utils/password.test.ts (15)
✓ tests/unit/utils/jwt.test.ts (6)
✓ tests/unit/utils/validator.test.ts (12)
✓ tests/unit/services/auth.service.test.ts (8)
✓ tests/unit/services/novel.service.test.ts (18)
✓ tests/unit/services/comment.service.test.ts (10)
✓ tests/unit/services/user.service.test.ts (12)

Test Files  7 passed (7)
Tests  81 passed (81)
```

### 3. 查看测试覆盖率

```bash
npm test -- --coverage
```

预期覆盖率：
- 工具函数（utils）: > 90%
- 服务层（services）: > 80%
- 总体覆盖率: > 80%

### 4. 使用UI界面

```bash
npm run test:ui
```

浏览器会自动打开 Vitest UI 界面。

## 测试命令详解

### 运行指定文件

```bash
# 只测试密码工具
npm test password.test.ts

# 只测试认证服务
npm test auth.service.test.ts
```

### 监听模式（开发时使用）

```bash
npm test -- --watch
```

文件修改后自动重新运行测试。

### 生成HTML报告

```bash
npm test -- --coverage --reporter=html
```

报告生成在 `coverage/index.html`

## 问题排查

### 问题1: 测试运行失败

```bash
# 清理node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题2: Prisma Mock问题

确保所有服务测试都正确Mock了PrismaClient：

```typescript
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      // Mock methods here
    }))
  }
})
```

### 问题3: 环境变量问题

确保有 `.env` 文件（测试用mock数据，不需要真实数据库）

## CI/CD集成

### GitHub Actions 配置示例

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm install
      - run: cd backend && npm test
```

## 测试最佳实践

1. ✅ 每个功能都应该有测试
2. ✅ 测试应该相互独立
3. ✅ 使用Mock避免依赖外部服务
4. ✅ 测试名称应该清晰描述测试内容
5. ✅ 定期运行测试确保代码质量

## 下一步

- [ ] 添加集成测试（API端到端）
- [ ] 添加性能测试
- [ ] 配置CI/CD自动测试
- [ ] 提高测试覆盖率到90%+

