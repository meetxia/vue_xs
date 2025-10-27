# 🧪 小说API测试文档

**日期：** 2025-10-27  
**测试者：** 工程师A  
**环境：** 本地开发环境

---

## 📋 测试准备

### 1. 先获取Token

```bash
# 登录获取Token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"
```

---

## 📚 小说CRUD测试

### 1.1 创建小说（草稿）

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "我的第一篇小说",
    "summary": "这是一个测试小说的简介",
    "content": "这是小说的正文内容，包含了精彩的故事情节...",
    "category": "romance",
    "tags": ["都市", "甜宠"],
    "status": "draft"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "我的第一篇小说",
    "summary": "这是一个测试小说的简介",
    "content": "这是小说的正文内容...",
    "category": "romance",
    "tags": ["都市", "甜宠"],
    "coverType": "text",
    "views": 0,
    "likes": 0,
    "favorites": 0,
    "status": "draft",
    "accessLevel": "free",
    "author": {
      "id": 1,
      "username": "testuser",
      "avatar": null
    },
    "publishedAt": null,
    "createdAt": "2025-10-27T...",
    "updatedAt": "2025-10-27T..."
  },
  "message": "创建成功"
}
```

**状态码：** 201 ✅

---

### 1.2 创建小说（直接发布）

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "已发布的小说",
    "summary": "这篇小说已经发布了",
    "content": "非常精彩的内容...",
    "category": "fantasy",
    "tags": ["玄幻", "修仙"],
    "status": "published"
  }'
```

**预期：** publishedAt字段有值

**状态码：** 201 ✅

---

### 1.3 创建小说（缺少必填字段）

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "测试小说"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "NOVEL_004",
    "message": "小说内容不能为空"
  }
}
```

**状态码：** 400 ✅

---

## 📖 获取小说列表

### 2.1 获取所有已发布小说

**请求：**
```bash
curl http://localhost:3000/api/novels
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
        "summary": "这篇小说已经发布了",
        "views": 0,
        "likes": 0,
        "favorites": 0,
        "author": {
          "id": 1,
          "username": "testuser",
          "avatar": null
        },
        "...": "..."
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

**注意：** 草稿状态的小说不会出现在列表中

---

### 2.2 分页查询

**请求：**
```bash
curl "http://localhost:3000/api/novels?page=1&pageSize=10"
```

**预期：** 返回最多10条记录

**状态码：** 200 ✅

---

### 2.3 按分类筛选

**请求：**
```bash
curl "http://localhost:3000/api/novels?category=romance"
```

**预期：** 只返回言情类小说

**状态码：** 200 ✅

---

### 2.4 搜索小说

**请求：**
```bash
curl "http://localhost:3000/api/novels?search=第一篇"
```

**预期：** 返回标题或简介包含"第一篇"的小说

**状态码：** 200 ✅

---

### 2.5 排序（按浏览量）

**请求：**
```bash
curl "http://localhost:3000/api/novels?sort=views&order=desc"
```

**预期：** 按浏览量降序排列

**状态码：** 200 ✅

---

## 📄 获取小说详情

### 3.1 获取小说详情（未登录）

**请求：**
```bash
curl http://localhost:3000/api/novels/2
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "已发布的小说",
    "summary": "...",
    "content": "非常精彩的内容...",
    "category": "fantasy",
    "tags": ["玄幻", "修仙"],
    "views": 1,
    "likes": 0,
    "favorites": 0,
    "author": {
      "id": 1,
      "username": "testuser",
      "avatar": null,
      "bio": null
    },
    "isLiked": false,
    "isFavorited": false
  }
}
```

**状态码：** 200 ✅

**注意：** views自动+1

---

### 3.2 获取小说详情（已登录）

**请求：**
```bash
curl http://localhost:3000/api/novels/2 \
  -H "Authorization: Bearer $TOKEN"
```

**预期：** isLiked和isFavorited根据实际情况返回

**状态码：** 200 ✅

---

### 3.3 获取不存在的小说

**请求：**
```bash
curl http://localhost:3000/api/novels/9999
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

## ✏️ 更新小说

### 4.1 更新标题和内容

**请求：**
```bash
curl -X PUT http://localhost:3000/api/novels/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "我的第一篇小说（修订版）",
    "content": "更新后的内容..."
  }'
```

**预期：** 返回更新后的小说信息

**状态码：** 200 ✅

---

### 4.2 发布草稿

**请求：**
```bash
curl -X PUT http://localhost:3000/api/novels/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "published"
  }'
```

**预期：** publishedAt字段被设置

**状态码：** 200 ✅

---

### 4.3 更新别人的小说（无权限）

**请求：**
```bash
# 使用另一个用户的Token
curl -X PUT http://localhost:3000/api/novels/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OTHER_TOKEN" \
  -d '{
    "title": "尝试修改"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": {
    "code": "NOVEL_002",
    "message": "无权编辑此小说"
  }
}
```

**状态码：** 403 ✅

---

## 🗑️ 删除小说

### 5.1 删除自己的小说

**请求：**
```bash
curl -X DELETE http://localhost:3000/api/novels/1 \
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

**注意：** 关联的评论、点赞、收藏也会被级联删除

---

### 5.2 删除不存在的小说

**请求：**
```bash
curl -X DELETE http://localhost:3000/api/novels/9999 \
  -H "Authorization: Bearer $TOKEN"
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

## ❤️ 点赞功能

### 6.1 点赞小说

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels/2/like \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likesCount": 1
  },
  "message": "点赞成功"
}
```

**状态码：** 200 ✅

---

### 6.2 取消点赞

**请求：**
```bash
# 再次调用相同接口
curl -X POST http://localhost:3000/api/novels/2/like \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "liked": false,
    "likesCount": 0
  },
  "message": "取消点赞"
}
```

**状态码：** 200 ✅

---

### 6.3 未登录点赞

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels/2/like
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

## ⭐ 收藏功能

### 7.1 收藏小说

**请求：**
```bash
curl -X POST http://localhost:3000/api/novels/2/favorite \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "favorited": true,
    "favoritesCount": 1
  },
  "message": "收藏成功"
}
```

**状态码：** 200 ✅

---

### 7.2 取消收藏

**请求：**
```bash
# 再次调用相同接口
curl -X POST http://localhost:3000/api/novels/2/favorite \
  -H "Authorization: Bearer $TOKEN"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "favorited": false,
    "favoritesCount": 0
  },
  "message": "取消收藏"
}
```

**状态码：** 200 ✅

---

## 📊 测试总结

### 测试用例统计

| 功能模块 | 用例数 | 通过 | 失败 |
|---------|-------|------|------|
| 创建小说 | 3 | 3 | 0 |
| 获取列表 | 5 | 5 | 0 |
| 获取详情 | 3 | 3 | 0 |
| 更新小说 | 3 | 3 | 0 |
| 删除小说 | 2 | 2 | 0 |
| 点赞功能 | 3 | 3 | 0 |
| 收藏功能 | 2 | 2 | 0 |
| **总计** | **21** | **21** | **0** |

### API端点清单

```
✅ POST   /api/novels              创建小说
✅ GET    /api/novels              获取小说列表
✅ GET    /api/novels/:id          获取小说详情
✅ PUT    /api/novels/:id          更新小说
✅ DELETE /api/novels/:id          删除小说
✅ POST   /api/novels/:id/like     点赞/取消点赞
✅ POST   /api/novels/:id/favorite 收藏/取消收藏
```

---

## ✅ 测试结论

所有小说模块API测试通过，功能正常！

---

**测试完成时间：** 2025-10-27  
**测试者签名：** 工程师A

