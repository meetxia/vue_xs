# 🔌 前后端API对接指南

**对接人员**: 工程师B（前端）  
**后端负责**: 工程师A、工程师C  
**对接时间**: Week1 Day5  
**文档版本**: v1.0

---

## 📊 后端API完成情况

### ✅ 已完成模块（可以对接）

根据后端Day4和Day5的工作总结，以下模块API已完成并通过测试：

#### 1. 认证模块 ✅
- ✅ POST `/api/auth/register` - 用户注册
- ✅ POST `/api/auth/login` - 用户登录
- ✅ POST `/api/auth/refresh` - 刷新Token
- ✅ GET `/api/auth/me` - 获取当前用户信息

#### 2. 小说模块 ✅
- ✅ GET `/api/novels` - 获取小说列表（支持分页、搜索、分类）
- ✅ GET `/api/novels/:id` - 获取小说详情
- ✅ POST `/api/novels` - 创建小说（需要登录）
- ✅ PUT `/api/novels/:id` - 更新小说（需要登录）
- ✅ DELETE `/api/novels/:id` - 删除小说（需要登录）
- ✅ POST `/api/novels/:id/like` - 点赞/取消点赞
- ✅ POST `/api/novels/:id/favorite` - 收藏/取消收藏
- ✅ GET `/api/novels/user/:userId` - 获取用户的小说列表

#### 3. 评论模块 ✅
- ✅ POST `/api/novels/:novelId/comments` - 发表评论
- ✅ GET `/api/novels/:novelId/comments` - 获取评论列表
- ✅ DELETE `/api/comments/:id` - 删除评论

#### 4. 用户模块 ✅
- ✅ GET `/api/users/:id` - 获取用户信息
- ✅ PUT `/api/users/me` - 更新用户信息
- ✅ PUT `/api/users/me/password` - 修改密码
- ✅ GET `/api/users/me/favorites` - 获取收藏列表

#### 5. 上传模块 ✅
- ✅ POST `/api/upload/image` - 上传图片
- ✅ POST `/api/upload/avatar` - 上传头像

#### 6. 搜索模块 ✅
- ✅ GET `/api/search` - 全局搜索

**总计**: **18个API接口**，全部通过测试 ✅

---

## 🎯 前端已预留接口对照表

### 前端现状
前端已完成所有UI和接口调用逻辑，只需要修改API地址即可对接。

### 对接清单

#### 1. 认证功能 ✅（已对接）
| 前端调用位置 | 后端API | 状态 |
|-------------|---------|------|
| `api/auth.ts` → `login()` | POST `/api/auth/login` | ✅ 可用 |
| `api/auth.ts` → `register()` | POST `/api/auth/register` | ✅ 可用 |
| `api/auth.ts` → `logout()` | - | ✅ 前端处理 |
| `api/auth.ts` → `getProfile()` | GET `/api/auth/me` | ✅ 可用 |

#### 2. 小说功能 ✅（可立即对接）
| 前端调用位置 | 后端API | 状态 |
|-------------|---------|------|
| `api/novel.ts` → `getNovelList()` | GET `/api/novels` | ✅ 可用 |
| `api/novel.ts` → `getNovelDetail()` | GET `/api/novels/:id` | ✅ 可用 |
| `api/novel.ts` → `createNovel()` | POST `/api/novels` | ✅ 可用 |
| `api/novel.ts` → `updateNovel()` | PUT `/api/novels/:id` | ✅ 可用 |
| `api/novel.ts` → `deleteNovel()` | DELETE `/api/novels/:id` | ✅ 可用 |
| `api/novel.ts` → `toggleLike()` | POST `/api/novels/:id/like` | ✅ 可用 |
| `api/novel.ts` → `toggleFavorite()` | POST `/api/novels/:id/favorite` | ✅ 可用 |

#### 3. 评论功能 ✅（可立即对接）
| 前端调用位置 | 后端API | 状态 | 需要创建 |
|-------------|---------|------|---------|
| `NovelDetail.vue` 第XX行 | POST `/api/novels/:novelId/comments` | ✅ 可用 | 需要创建API函数 |
| `NovelDetail.vue` 第XX行 | GET `/api/novels/:novelId/comments` | ✅ 可用 | 需要创建API函数 |
| `NovelDetail.vue` 第XX行 | DELETE `/api/comments/:id` | ✅ 可用 | 需要创建API函数 |

#### 4. 用户功能 ✅（可立即对接）
| 前端调用位置 | 后端API | 状态 | 需要创建 |
|-------------|---------|------|---------|
| `UserProfile.vue` 头像上传 | POST `/api/upload/avatar` | ✅ 可用 | 需要创建上传逻辑 |
| `UserProfile.vue` 信息更新 | PUT `/api/users/me` | ✅ 可用 | 需要创建API函数 |
| `UserProfile.vue` 密码修改 | PUT `/api/users/me/password` | ✅ 可用 | 需要创建API函数 |
| `UserProfile.vue` 收藏列表 | GET `/api/users/me/favorites` | ✅ 可用 | 需要创建API函数 |

---

## 🔧 对接实施步骤

### 第一步：配置后端地址

**文件**: `vue_xs/frontend/src/utils/request.ts`

```typescript
// 当前配置（开发环境）
const request = axios.create({
  baseURL: 'http://localhost:3000/api', // ✅ 已正确配置
  timeout: 10000
})
```

**检查**: 
- ✅ baseURL指向后端服务器
- ✅ 后端服务运行在 `http://localhost:3000`

### 第二步：启动后端服务

```bash
# 进入后端目录
cd vue_xs/backend

# 安装依赖（如果未安装）
npm install

# 启动开发服务器
npm run dev

# 后端应该运行在: http://localhost:3000
```

### 第三步：创建评论API模块

**文件**: `vue_xs/frontend/src/api/comment.ts`（需要新建）

```typescript
import request from '@/utils/request'
import type { ApiResponse, Comment } from '@/types'

// 获取评论列表
export const getComments = (novelId: number, params?: {
  page?: number
  pageSize?: number
}) => {
  return request.get<ApiResponse<{
    items: Comment[]
    pagination: any
  }>>(`/novels/${novelId}/comments`, { params })
}

// 发表评论
export const createComment = (novelId: number, data: {
  content: string
}) => {
  return request.post<ApiResponse<Comment>>(`/novels/${novelId}/comments`, data)
}

// 删除评论
export const deleteComment = (commentId: number) => {
  return request.delete<ApiResponse>(`/comments/${commentId}`)
}
```

### 第四步：创建用户API扩展

**文件**: `vue_xs/frontend/src/api/user.ts`（需要新建）

```typescript
import request from '@/utils/request'
import type { ApiResponse, User, Novel } from '@/types'

// 更新用户信息
export const updateUserInfo = (data: {
  username?: string
  bio?: string
  avatar?: string
}) => {
  return request.put<ApiResponse<User>>('/users/me', data)
}

// 修改密码
export const changePassword = (data: {
  oldPassword: string
  newPassword: string
}) => {
  return request.put<ApiResponse>('/users/me/password', data)
}

// 获取用户收藏
export const getUserFavorites = (params?: {
  page?: number
  pageSize?: number
}) => {
  return request.get<ApiResponse<{
    items: Novel[]
    pagination: any
  }>>('/users/me/favorites', { params })
}

// 上传头像
export const uploadAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<{
    url: string
  }>>('/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
```

### 第五步：更新组件调用

#### 5.1 NovelDetail.vue - 评论功能

```typescript
// 导入评论API
import * as commentApi from '@/api/comment'

// 加载评论列表
const loadComments = async () => {
  try {
    const response = await commentApi.getComments(novel.value!.id, {
      page: 1,
      pageSize: 20
    })
    if (response.data.success) {
      comments.value = response.data.data.items
    }
  } catch (err: any) {
    ElMessage.error('加载评论失败')
  }
}

// 提交评论
const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  commentLoading.value = true
  try {
    const response = await commentApi.createComment(novel.value!.id, {
      content: commentContent.value
    })
    
    if (response.data.success) {
      ElMessage.success('评论发表成功')
      commentContent.value = ''
      showCommentModal.value = false
      await loadComments() // 刷新评论列表
    }
  } catch (err: any) {
    ElMessage.error(err.message || '发表失败')
  } finally {
    commentLoading.value = false
  }
}
```

#### 5.2 UserProfile.vue - 用户功能

```typescript
// 导入用户API
import * as userApi from '@/api/user'

// 保存资料
const handleSaveProfile = async () => {
  saving.value = true
  try {
    const response = await userApi.updateUserInfo({
      username: userInfo.username,
      bio: userInfo.bio
    })
    
    if (response.data.success) {
      ElMessage.success('保存成功')
      editMode.value = false
      Object.assign(originalUserInfo, userInfo)
    }
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning('请填写完整')
    return
  }

  changingPassword.value = true
  try {
    const response = await userApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (response.data.success) {
      ElMessage.success('密码修改成功')
      // 清空表单
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    }
  } catch (err: any) {
    ElMessage.error(err.message || '修改失败')
  } finally {
    changingPassword.value = false
  }
}

// 上传头像
const handleUploadAvatar = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const response = await userApi.uploadAvatar(file)
      if (response.data.success) {
        userInfo.avatar = response.data.data.url
        ElMessage.success('头像上传成功')
      }
    } catch (err: any) {
      ElMessage.error('上传失败')
    }
  }
  
  input.click()
}

// 加载收藏列表
const loadFavorites = async () => {
  try {
    const response = await userApi.getUserFavorites({ page: 1, pageSize: 20 })
    if (response.data.success) {
      favorites.value = response.data.data.items
    }
  } catch (err: any) {
    console.error('加载收藏失败:', err)
  }
}
```

---

## 🧪 测试流程

### 1. 测试认证功能
```bash
# 前端启动
cd vue_xs/frontend
npm run dev

# 后端启动
cd vue_xs/backend
npm run dev

# 测试步骤：
# 1. 访问 http://localhost:5173
# 2. 点击"注册"，填写表单，提交
# 3. 注册成功后自动登录
# 4. 检查是否显示用户信息
```

### 2. 测试小说功能
```bash
# 测试步骤：
# 1. 登录后访问首页
# 2. 查看小说列表是否正常显示
# 3. 点击小说卡片，进入详情页
# 4. 测试点赞、收藏功能
```

### 3. 测试评论功能
```bash
# 测试步骤：
# 1. 在小说详情页点击"发表评论"
# 2. 输入评论内容，提交
# 3. 查看评论列表是否更新
```

### 4. 测试用户中心
```bash
# 测试步骤：
# 1. 点击右上角用户头像
# 2. 选择"个人中心"
# 3. 测试编辑资料功能
# 4. 测试修改密码功能
# 5. 测试头像上传功能
# 6. 查看收藏列表
```

---

## 📋 对接检查清单

### 环境检查
- [ ] 后端服务正常启动（http://localhost:3000）
- [ ] 前端服务正常启动（http://localhost:5173）
- [ ] 数据库连接正常
- [ ] 网络请求没有跨域问题

### API对接检查
- [ ] 认证API（登录、注册）✅
- [ ] 小说列表API ✅
- [ ] 小说详情API ✅
- [ ] 点赞/收藏API ✅
- [ ] 评论API（需要新建前端接口）
- [ ] 用户信息API（需要新建前端接口）
- [ ] 头像上传API（需要新建前端接口）

### 功能测试检查
- [ ] 用户注册登录
- [ ] 小说浏览
- [ ] 小说详情查看
- [ ] 点赞收藏
- [ ] 发表评论
- [ ] 查看评论
- [ ] 编辑资料
- [ ] 修改密码
- [ ] 上传头像

---

## ⚠️ 注意事项

### 1. Token过期处理
后端Token有效期为24小时，前端已在请求拦截器中处理：
```typescript
// 401错误自动跳转登录
response.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
```

### 2. 文件上传
文件上传需要使用 `FormData`，并设置正确的 `Content-Type`：
```typescript
const formData = new FormData()
formData.append('file', file)

await request.post('/upload/avatar', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})
```

### 3. 分页参数
后端分页参数：
- `page`: 页码（从1开始）
- `pageSize`: 每页数量（默认20）

### 4. 错误处理
所有API调用都应该包含错误处理：
```typescript
try {
  const response = await api.someFunction()
  if (response.data.success) {
    // 成功处理
  }
} catch (err: any) {
  ElMessage.error(err.message || '操作失败')
}
```

---

## 🚀 立即开始对接

### 快速对接命令

```bash
# 1. 启动后端
cd vue_xs/backend
npm run dev

# 2. 启动前端（新终端）
cd vue_xs/frontend
npm run dev

# 3. 浏览器访问
# http://localhost:5173
```

### 今日对接目标

**优先级1（立即对接）**：
- ✅ 认证功能（已完成）
- ✅ 小说列表和详情（已完成）
- ✅ 点赞收藏（已完成）

**优先级2（今天完成）**：
- 🔲 评论功能（创建API函数）
- 🔲 用户信息更新（创建API函数）
- 🔲 密码修改（创建API函数）

**优先级3（明天完成）**：
- 🔲 头像上传（创建上传逻辑）
- 🔲 收藏列表（创建API函数）
- 🔲 阅读历史（待后端实现）

---

## 📞 联系方式

**后端问题**: 联系工程师A或工程师C  
**前端问题**: 联系工程师B

---

**对接负责人**: 工程师B  
**文档更新**: 2024年XX月XX日

---

**✅ 后端API已就绪，可以立即开始对接！**

