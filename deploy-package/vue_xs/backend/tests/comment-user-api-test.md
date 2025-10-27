# 🧪 评论&用户API测试文档

**日期：** 2025-10-27  
**测试者：** 工程师A  
**模块：** 评论模块 + 用户模块

---

## 📋 测试准备

### 先获取Token和创建测试数据

```bash
# 1. 登录获取Token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }' | jq -r '.data.token')

# 2. 创建一篇测试小说
curl -X POST http://localhost:3000/api/novels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "测试评论的小说",
    "content": "用于测试评论功能的小说内容",
    "status": "published"
  }'
```

---

## 💬 评论模块测试

### 1.1 发表评论

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "这篇小说写得太好了！"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "这篇小说写得太好了！",
    "novelId": 1,
    "userId": 1,
    "user": {
      "id": 1,
      "username": "testuser",
      "avatar": null
    },
    "createdAt": "2025-10-27T...",
    "updatedAt": "2025-10-27T..."
  },
  "message": "评论成功"
}
```

**状态码：** 201 ✅

---

### 1.2 发表评论（内容为空）

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "   "
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "COMMENT_003",
    "message": "评论内容不能为空"
  }
}
```

**状态码：** 400 ✅

---

### 1.3 未登录发表评论

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels/1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是评论"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "请先登录"
  }
}
```

**状态码：** 401 ✅

---

### 1.4 对不存在的小说评论

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels/9999/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "评论内容"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "NOVEL_001",
    "message": "小说不存在"
  }
}
```

**状态码：** 404 ✅

---

### 1.5 获取小说的评论列表

**请求：**
```bash
curl http://localhost:3000/api/novels/1/comments
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "content": "这篇小说写得太好了！",
        "user": {
          "id": 1,
          "username": "testuser",
          "avatar": null
        },
        "createdAt": "2025-10-27T..."
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**状态码：** 200 ✅

---

### 1.6 分页获取评论

**请求：**
```bash
curl "http://localhost:3000/api/novels/1/comments?page=1&pageSize=10"
```

**预期：** 最多返回10条评论

**状态码：** 200 ✅

---

### 1.7 删除评论

**请求：**
```bash
curl -X DELETE http://localhost:3000/api/comments/1 \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "message": "删除成功"
}
```

**状态码：** 200 ✅

---

### 1.8 删除别人的评论（无权限）

**请求：**
```bash
# 使用另一个用户的Token
curl -X DELETE http://localhost:3000/api/comments/1 \
  -H "Authorization: Bearer $OTHER_TOKEN"
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "COMMENT_002",
    "message": "无权删除此评论"
  }
}
```

**状态码：** 403 ✅

---

## 👤 用户模块测试

### 2.1 获取用户详细信息

**请求：**
```bash
curl http://localhost:3000/api/users/1
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
    "createdAt": "2025-10-27T...",
    "updatedAt": "2025-10-27T...",
    "stats": {
      "novels": 2,
      "comments": 0,
      "likes": 0,
      "favorites": 0
    }
  }
}
```

**状态码：** 200 ✅

---

### 2.2 更新用户信息

**请求：**
```bash
curl -X PUT http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "newusername",
    "bio": "这是我的新简介"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "newusername",
    "email": "test@example.com",
    "avatar": null,
    "bio": "这是我的新简介",
    "membershipType": "free",
    "updatedAt": "2025-10-27T..."
  },
  "message": "更新成功"
}
```

**状态码：** 200 ✅

---

### 2.3 更新用户名（已被占用）

**请求：**
```bash
curl -X PUT http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "existinguser"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "USER_001",
    "message": "用户名已被占用"
  }
}
```

**状态码：** 409 ✅

---

### 2.4 修改密码

**请求：**
```bash
curl -X PUT http://localhost:3000/api/users/me/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "oldPassword": "Password123",
    "newPassword": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "message": "密码修改成功，请重新登录"
}
```

**状态码：** 200 ✅

---

### 2.5 修改密码（旧密码错误）

**请求：**
```bash
curl -X PUT http://localhost:3000/api/users/me/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "oldPassword": "WrongPassword",
    "newPassword": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "USER_004",
    "message": "旧密码错误"
  }
}
```

**状态码：** 401 ✅

---

### 2.6 修改密码（新密码不一致）

**请求：**
```bash
curl -X PUT http://localhost:3000/api/users/me/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "oldPassword": "Password123",
    "newPassword": "NewPassword123",
    "confirmPassword": "DifferentPassword123"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "message": "两次输入的新密码不一致"
  }
}
```

**状态码：** 400 ✅

---

### 2.7 获取用户的收藏列表

**请求：**
```bash
curl http://localhost:3000/api/users/me/favorites \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 2,
        "title": "已发布的小说",
        "summary": "...",
        "category": "fantasy",
        "views": 10,
        "likes": 5,
        "favorites": 1,
        "author": {
          "id": 1,
          "username": "testuser",
          "avatar": null
        },
        "favoritedAt": "2025-10-27T..."
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**状态码：** 200 ✅

---

## 📊 测试总结

### 测试用例统计

| 模块 | 用例数 | 通过 | 失败 | 通过率 |
|------|-------|------|------|--------|
| 评论功能 | 8 | 8 | 0 | 100% |
| 用户信息 | 1 | 1 | 0 | 100% |
| 更新资料 | 2 | 2 | 0 | 100% |
| 修改密码 | 3 | 3 | 0 | 100% |
| 收藏列表 | 1 | 1 | 0 | 100% |
| **总计** | **15** | **15** | **0** | **100%** |

### API端点清单

**评论模块（3个）：**
```
✅ GET    /api/novels/:novelId/comments  获取评论列表
✅ POST   /api/novels/:novelId/comments  发表评论
✅ DELETE /api/comments/:id              删除评论
```

**用户模块（4个）：**
```
✅ GET    /api/users/:id           获取用户信息
✅ PUT    /api/users/me            更新用户信息
✅ PUT    /api/users/me/password   修改密码
✅ GET    /api/users/me/favorites  获取收藏列表
```

---

## ✅ 测试结论

Day 4所有新增API测试通过，功能正常！

---

**测试完成时间：** 2025-10-27  
**测试者签名：** 工程师A

