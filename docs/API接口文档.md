# 📡 API接口文档

**项目：** MOMO炒饭店小说网站 V2.0  
**后端框架：** Fastify + Prisma  
**API版本：** v1  
**基础URL：** `http://localhost:3000/api`  
**生产URL：** `https://xs.momofx.cn/api`

---

## 📋 接口规范

### 通用响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 失败响应
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}

// 分页响应
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### HTTP状态码

```
200 - 成功
201 - 创建成功
400 - 请求参数错误
401 - 未授权（需要登录）
403 - 禁止访问（权限不足）
404 - 资源不存在
409 - 冲突（如用户名已存在）
422 - 验证失败
500 - 服务器错误
```

### 认证方式

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 1. 认证模块 (Auth)

### 1.1 用户注册

**接口：** `POST /auth/register`

**请求体：**
```json
{
  "username": "test_user",
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "test_user",
      "email": "user@example.com",
      "avatar": null,
      "createdAt": "2025-10-27T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "注册成功"
}
```

**验证规则：**
- `username`: 3-20字符，字母数字下划线
- `email`: 有效的邮箱格式
- `password`: 最少8位，包含大小写字母和数字

---

### 1.2 用户登录

**接口：** `POST /auth/login`

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "test_user",
      "email": "user@example.com",
      "avatar": "https://...",
      "membershipType": "premium"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400
  }
}
```

---

### 1.3 刷新Token

**接口：** `POST /auth/refresh`  
**认证：** 需要

**请求头：**
```
Authorization: Bearer <OLD_TOKEN>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400
  }
}
```

---

### 1.4 退出登录

**接口：** `POST /auth/logout`  
**认证：** 需要

**响应：**
```json
{
  "success": true,
  "message": "退出成功"
}
```

---

## 👤 2. 用户模块 (Users)

### 2.1 获取当前用户信息

**接口：** `GET /users/me`  
**认证：** 需要

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "test_user",
    "email": "user@example.com",
    "avatar": "https://...",
    "bio": "这是我的简介",
    "membershipType": "premium",
    "membershipExpiresAt": "2025-12-31T23:59:59.000Z",
    "stats": {
      "novels": 15,
      "followers": 120,
      "following": 50
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### 2.2 更新用户信息

**接口：** `PUT /users/me`  
**认证：** 需要

**请求体：**
```json
{
  "username": "new_username",
  "bio": "新的个人简介",
  "avatar": "https://..."
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "new_username",
    "bio": "新的个人简介",
    "avatar": "https://...",
    "updatedAt": "2025-10-27T10:00:00.000Z"
  }
}
```

---

### 2.3 修改密码

**接口：** `PUT /users/me/password`  
**认证：** 需要

**请求体：**
```json
{
  "oldPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**响应：**
```json
{
  "success": true,
  "message": "密码修改成功，请重新登录"
}
```

---

### 2.4 上传头像

**接口：** `POST /users/me/avatar`  
**认证：** 需要  
**Content-Type：** `multipart/form-data`

**请求体：**
```
avatar: <文件>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "avatar": "https://cdn.momofx.cn/avatars/xxx.jpg"
  }
}
```

---

### 2.5 获取用户公开信息

**接口：** `GET /users/:id`

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "test_user",
    "avatar": "https://...",
    "bio": "这是我的简介",
    "stats": {
      "novels": 15,
      "followers": 120,
      "following": 50
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 📚 3. 小说模块 (Novels)

### 3.1 获取小说列表

**接口：** `GET /novels`

**查询参数：**
```
page=1                  // 页码
pageSize=20             // 每页数量
category=romance        // 分类筛选
status=published        // 状态筛选
sort=createdAt          // 排序字段
order=desc              // 排序方式 asc|desc
search=关键词           // 搜索
```

**响应：**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "小说标题",
        "summary": "小说简介...",
        "category": "romance",
        "tags": ["都市", "甜宠"],
        "coverType": "image",
        "coverData": "https://...",
        "views": 1000,
        "likes": 50,
        "favorites": 30,
        "status": "published",
        "accessLevel": "free",
        "author": {
          "id": 1,
          "username": "作者名",
          "avatar": "https://..."
        },
        "publishedAt": "2025-10-27T10:00:00.000Z",
        "createdAt": "2025-10-27T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### 3.2 获取小说详情

**接口：** `GET /novels/:id`

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "小说标题",
    "summary": "小说简介...",
    "content": "完整内容...",
    "category": "romance",
    "tags": ["都市", "甜宠"],
    "coverType": "image",
    "coverData": "https://...",
    "views": 1000,
    "likes": 50,
    "favorites": 30,
    "status": "published",
    "accessLevel": "free",
    "author": {
      "id": 1,
      "username": "作者名",
      "avatar": "https://...",
      "bio": "作者简介"
    },
    "isLiked": false,        // 当前用户是否点赞
    "isFavorited": false,    // 当前用户是否收藏
    "publishedAt": "2025-10-27T10:00:00.000Z",
    "createdAt": "2025-10-27T09:00:00.000Z",
    "updatedAt": "2025-10-27T09:30:00.000Z"
  }
}
```

---

### 3.3 创建小说

**接口：** `POST /novels`  
**认证：** 需要

**请求体：**
```json
{
  "title": "新小说标题",
  "summary": "小说简介",
  "content": "小说正文内容...",
  "category": "romance",
  "tags": ["都市", "甜宠"],
  "coverType": "text",
  "coverData": "{\"title\":\"新小说\",\"author\":\"作者名\"}",
  "status": "draft",
  "accessLevel": "free"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "新小说标题",
    "status": "draft",
    "createdAt": "2025-10-27T10:00:00.000Z"
  },
  "message": "创建成功"
}
```

---

### 3.4 更新小说

**接口：** `PUT /novels/:id`  
**认证：** 需要（仅作者本人）

**请求体：**
```json
{
  "title": "修改后的标题",
  "summary": "修改后的简介",
  "content": "修改后的内容",
  "category": "fantasy",
  "tags": ["玄幻", "热血"]
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "修改后的标题",
    "updatedAt": "2025-10-27T11:00:00.000Z"
  },
  "message": "更新成功"
}
```

---

### 3.5 删除小说

**接口：** `DELETE /novels/:id`  
**认证：** 需要（仅作者本人）

**响应：**
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

### 3.6 发布/下架小说

**接口：** `PUT /novels/:id/status`  
**认证：** 需要（仅作者本人）

**请求体：**
```json
{
  "status": "published"  // published | draft | archived
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "published",
    "publishedAt": "2025-10-27T12:00:00.000Z"
  }
}
```

---

### 3.7 点赞小说

**接口：** `POST /novels/:id/like`  
**认证：** 需要

**响应：**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likesCount": 51
  }
}
```

---

### 3.8 收藏小说

**接口：** `POST /novels/:id/favorite`  
**认证：** 需要

**响应：**
```json
{
  "success": true,
  "data": {
    "favorited": true,
    "favoritesCount": 31
  }
}
```

---

## 💬 4. 评论模块 (Comments)

### 4.1 获取评论列表

**接口：** `GET /novels/:novelId/comments`

**查询参数：**
```
page=1
pageSize=20
sort=createdAt
order=desc
```

**响应：**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "content": "评论内容...",
        "user": {
          "id": 1,
          "username": "用户名",
          "avatar": "https://..."
        },
        "createdAt": "2025-10-27T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 4.2 发表评论

**接口：** `POST /novels/:novelId/comments`  
**认证：** 需要

**请求体：**
```json
{
  "content": "这篇小说写得真好！"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "这篇小说写得真好！",
    "user": {
      "id": 1,
      "username": "用户名",
      "avatar": "https://..."
    },
    "createdAt": "2025-10-27T10:00:00.000Z"
  }
}
```

---

### 4.3 删除评论

**接口：** `DELETE /comments/:id`  
**认证：** 需要（仅本人或管理员）

**响应：**
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## 🏷️ 5. 分类模块 (Categories)

### 5.1 获取所有分类

**接口：** `GET /categories`

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": "romance",
      "name": "言情",
      "description": "浪漫爱情故事",
      "count": 150
    },
    {
      "id": "fantasy",
      "name": "玄幻",
      "description": "玄幻修仙题材",
      "count": 120
    }
  ]
}
```

---

## 🔍 6. 搜索模块 (Search)

### 6.1 全文搜索

**接口：** `GET /search`

**查询参数：**
```
q=关键词
type=novels          // novels | users
page=1
pageSize=20
```

**响应：**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {...},
    "query": "关键词",
    "totalResults": 50
  }
}
```

---

## 📊 7. 统计模块 (Stats)

### 7.1 获取网站统计

**接口：** `GET /stats`

**响应：**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "totalNovels": 500,
    "totalViews": 100000,
    "todayViews": 1000,
    "activeUsers": 150
  }
}
```

---

## 📁 8. 文件上传模块 (Upload)

### 8.1 上传图片

**接口：** `POST /upload/image`  
**认证：** 需要  
**Content-Type：** `multipart/form-data`

**请求体：**
```
file: <文件>
type: cover | avatar | content
```

**响应：**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.momofx.cn/images/xxx.jpg",
    "filename": "xxx.jpg",
    "size": 102400,
    "mimeType": "image/jpeg"
  }
}
```

---

## 🔧 9. 系统模块 (System)

### 9.1 健康检查

**接口：** `GET /health`

**响应：**
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T10:00:00.000Z",
  "version": "1.0.0"
}
```

---

### 9.2 获取系统设置

**接口：** `GET /settings`

**响应：**
```json
{
  "success": true,
  "data": {
    "siteName": "MOMO炒饭店",
    "siteDescription": "优质小说阅读平台",
    "registerEnabled": true,
    "commentEnabled": true
  }
}
```

---

## 🛡️ 10. 管理后台 (Admin)

### 10.1 管理员登录

**接口：** `POST /admin/login`

**请求体：**
```json
{
  "username": "admin",
  "password": "admin_password"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "username": "admin",
      "role": "super_admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 10.2 获取用户列表（管理）

**接口：** `GET /admin/users`  
**认证：** 需要（管理员）

**查询参数：**
```
page=1
pageSize=50
search=关键词
```

**响应：**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {...}
  }
}
```

---

### 10.3 删除用户（管理）

**接口：** `DELETE /admin/users/:id`  
**认证：** 需要（管理员）

**响应：**
```json
{
  "success": true,
  "message": "用户已删除"
}
```

---

## 📝 错误代码表

```
AUTH_001 - 未授权，请登录
AUTH_002 - Token无效或已过期
AUTH_003 - 用户名或密码错误
AUTH_004 - 用户不存在
AUTH_005 - 用户已被禁用

USER_001 - 用户名已存在
USER_002 - 邮箱已存在
USER_003 - 用户信息验证失败
USER_004 - 旧密码错误

NOVEL_001 - 小说不存在
NOVEL_002 - 无权操作此小说
NOVEL_003 - 小说标题不能为空
NOVEL_004 - 小说内容不能为空

COMMENT_001 - 评论不存在
COMMENT_002 - 无权删除此评论
COMMENT_003 - 评论内容不能为空

FILE_001 - 文件类型不支持
FILE_002 - 文件大小超限
FILE_003 - 文件上传失败

SYSTEM_001 - 系统错误，请稍后重试
SYSTEM_002 - 数据库连接失败
```

---

## 🔒 权限说明

```
游客（未登录）：
- 浏览小说列表
- 查看小说详情
- 查看评论
- 搜索

普通用户（已登录）：
- 游客权限
- 发布小说
- 编辑/删除自己的小说
- 点赞/收藏
- 发表评论

会员用户：
- 普通用户权限
- 阅读付费小说
- 无广告

管理员：
- 所有权限
- 删除任何小说
- 删除任何评论
- 管理用户
```

---

## 📌 开发注意事项

1. **所有接口都需要统一的错误处理**
2. **敏感信息（如密码）不应在响应中返回**
3. **分页默认值：page=1, pageSize=20, max=100**
4. **日期格式统一使用ISO 8601**
5. **ID统一使用数字类型**
6. **文件上传大小限制：图片5MB，其他10MB**

---

**文档维护者：** 工程师A  
**最后更新：** 2025-10-27  
**版本：** v1.0

