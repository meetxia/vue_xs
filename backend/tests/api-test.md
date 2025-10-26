# 🧪 API测试文档

**日期：** 2025-10-27  
**测试者：** 工程师A  
**环境：** 本地开发环境

---

## 📋 测试准备

### 1. 启动服务器

```bash
cd backend
npm run dev
```

服务器应该在 `http://localhost:3000` 启动

---

## 🔐 认证API测试

### 1.1 健康检查

**请求：**
```bash
curl http://localhost:3000/health
```

**预期响应：**
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T10:00:00.000Z",
  "version": "1.0.0"
}
```

**状态码：** 200 ✅

---

### 1.2 用户注册

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "avatar": null,
      "bio": null,
      "membershipType": "free",
      "createdAt": "2025-10-27T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "注册成功"
}
```

**状态码：** 201 ✅

---

### 1.3 重复注册（测试用户名已存在）

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "another@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "USER_001",
    "message": "用户名已存在"
  }
}
```

**状态码：** 409 ✅

---

### 1.4 用户登录

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "avatar": null,
      "bio": null,
      "membershipType": "free",
      "membershipExpiresAt": null,
      "createdAt": "2025-10-27T10:00:00.000Z",
      "updatedAt": "2025-10-27T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**状态码：** 200 ✅

保存返回的Token，后续测试会用到：
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 1.5 错误的密码登录

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword123"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_003",
    "message": "邮箱或密码错误"
  }
}
```

**状态码：** 401 ✅

---

### 1.6 获取当前用户信息（需要认证）

**请求：**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer ${TOKEN}"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "avatar": null,
    "bio": null,
    "membershipType": "free",
    "membershipExpiresAt": null,
    "createdAt": "2025-10-27T10:00:00.000Z",
    "updatedAt": "2025-10-27T10:00:00.000Z",
    "stats": {
      "novels": 0,
      "comments": 0,
      "likes": 0,
      "favorites": 0
    }
  }
}
```

**状态码：** 200 ✅

---

### 1.7 未授权访问（无Token）

**请求：**
```bash
curl -X GET http://localhost:3000/api/auth/me
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "未授权，请提供有效的Token"
  }
}
```

**状态码：** 401 ✅

---

### 1.8 退出登录

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer ${TOKEN}"
```

**预期响应：**
```json
{
  "success": true,
  "message": "退出成功"
}
```

**状态码：** 200 ✅

---

## 🧪 边界测试

### 2.1 无效的邮箱格式

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "invalid-email",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "邮箱格式不正确"
  }
}
```

**状态码：** 400 ✅

---

### 2.2 用户名格式不正确

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "test2@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "message": "用户名格式不正确（3-20个字符，只能包含字母、数字、下划线）"
  }
}
```

**状态码：** 400 ✅

---

### 2.3 密码强度不足

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser3",
    "email": "test3@example.com",
    "password": "12345678",
    "confirmPassword": "12345678"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "message": "密码必须包含字母和数字"
  }
}
```

**状态码：** 400 ✅

---

### 2.4 密码不一致

**请求：**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser4",
    "email": "test4@example.com",
    "password": "Password123",
    "confirmPassword": "Password456"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "message": "两次输入的密码不一致"
  }
}
```

**状态码：** 400 ✅

---

## 📊 测试总结

### 测试用例统计

| 测试类别 | 用例数 | 通过 | 失败 |
|---------|-------|------|------|
| 基础功能 | 8 | 8 | 0 |
| 边界测试 | 4 | 4 | 0 |
| **总计** | **12** | **12** | **0** |

### 测试覆盖率

- ✅ 用户注册流程
- ✅ 用户登录流程
- ✅ JWT认证
- ✅ 获取用户信息
- ✅ 输入验证
- ✅ 错误处理

---

## 🐛 发现的问题

暂无

---

## ✅ 结论

所有认证相关API测试通过，功能正常！

---

## 📝 下一步测试计划

- [ ] 用户信息更新API
- [ ] 密码修改API
- [ ] 小说CRUD API
- [ ] 评论API
- [ ] 点赞/收藏API

---

**测试完成时间：** 2025-10-27  
**测试者签名：** 工程师A

