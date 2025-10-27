<template>
  <div class="profile-page">
    <Container max-width="lg">
      <div class="profile-layout">
        <!-- 左侧侧边栏 -->
        <Sidebar title="个人中心" width="250px" class="profile-sidebar">
          <ul class="sidebar-menu">
            <li
              v-for="item in menuItems"
              :key="item.key"
              :class="['menu-item', { active: activeTab === item.key }]"
              @click="activeTab = item.key"
            >
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.label }}</span>
            </li>
          </ul>
        </Sidebar>

        <!-- 右侧内容区 -->
        <div class="profile-content">
          <!-- 基本信息 -->
          <Card v-show="activeTab === 'info'" title="基本信息">
            <div class="profile-info-section">
              <div class="avatar-section">
                <el-avatar :src="userInfo.avatar" :size="100">
                  {{ userInfo.username?.charAt(0) }}
                </el-avatar>
                <Button type="primary" size="small" @click="handleUploadAvatar">
                  <el-icon><Upload /></el-icon>
                  更换头像
                </Button>
              </div>

              <div class="info-form">
                <Input
                  v-model="userInfo.username"
                  label="用户名"
                  placeholder="请输入用户名"
                  :disabled="!editMode"
                />
                <Input
                  v-model="userInfo.email"
                  label="邮箱"
                  placeholder="请输入邮箱"
                  type="email"
                  :disabled="!editMode"
                />
                <Input
                  v-model="userInfo.bio"
                  label="个人简介"
                  placeholder="介绍一下自己"
                  type="textarea"
                  :rows="4"
                  :disabled="!editMode"
                />

                <div class="form-actions">
                  <Button
                    v-if="!editMode"
                    type="primary"
                    @click="editMode = true"
                  >
                    <el-icon><Edit /></el-icon>
                    编辑资料
                  </Button>
                  <template v-else>
                    <Button type="primary" @click="handleSaveProfile" :loading="saving">
                      <el-icon><Check /></el-icon>
                      保存
                    </Button>
                    <Button @click="handleCancelEdit">
                      <el-icon><Close /></el-icon>
                      取消
                    </Button>
                  </template>
                </div>
              </div>
            </div>
          </Card>

          <!-- 修改密码 -->
          <Card v-show="activeTab === 'password'" title="修改密码">
            <div class="password-form">
              <Input
                v-model="passwordForm.oldPassword"
                label="当前密码"
                type="password"
                placeholder="请输入当前密码"
              />
              <Input
                v-model="passwordForm.newPassword"
                label="新密码"
                type="password"
                placeholder="请输入新密码"
              />
              <Input
                v-model="passwordForm.confirmPassword"
                label="确认密码"
                type="password"
                placeholder="请再次输入新密码"
              />

              <Button
                type="primary"
                @click="handleChangePassword"
                :loading="changingPassword"
              >
                <el-icon><Lock /></el-icon>
                修改密码
              </Button>
            </div>
          </Card>

          <!-- 我的收藏 -->
          <Card v-show="activeTab === 'favorites'" title="我的收藏">
            <div v-if="favorites.length" class="novels-grid">
              <NovelCard
                v-for="novel in favorites"
                :key="novel.id"
                :novel="novel"
              />
            </div>
            <el-empty v-else description="暂无收藏" />
          </Card>

          <!-- 阅读历史 -->
          <Card v-show="activeTab === 'history'" title="阅读历史">
            <div v-if="history.length" class="history-list">
              <div
                v-for="item in history"
                :key="item.id"
                class="history-item"
                @click="router.push(`/novel/${item.novelId}`)"
              >
                <img
                  :src="item.novel?.cover"
                  :alt="item.novel?.title"
                  class="history-cover"
                />
                <div class="history-info">
                  <h4>{{ item.novel?.title }}</h4>
                  <p class="history-chapter">读到: {{ item.chapterTitle }}</p>
                  <p class="history-date">{{ formatDate(item.updatedAt) }}</p>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无阅读记录" />
          </Card>

          <!-- 我的作品 -->
          <Card v-show="activeTab === 'novels'" title="我的作品">
            <template #header>
              <div class="novels-header">
                <h3>我的作品</h3>
                <Button type="primary" @click="handleCreateNovel">
                  <el-icon><Plus /></el-icon>
                  创建作品
                </Button>
              </div>
            </template>

            <div v-if="myNovels.length" class="novels-grid">
              <NovelCard
                v-for="novel in myNovels"
                :key="novel.id"
                :novel="novel"
              />
            </div>
            <el-empty v-else description="暂无作品" />
          </Card>
        </div>
      </div>
    </Container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  Lock,
  Star,
  Clock,
  Reading,
  Upload,
  Edit,
  Check,
  Close,
  Plus
} from '@element-plus/icons-vue'
import Container from '@/components/layout/Container.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import NovelCard from '@/views/novel/NovelCard.vue'
import { useAuthStore } from '@/stores/auth'
import * as userApi from '@/api/user'
import * as uploadApi from '@/api/upload'
import type { Novel } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('info')
const editMode = ref(false)
const saving = ref(false)
const changingPassword = ref(false)

const menuItems = [
  { key: 'info', label: '基本信息', icon: User },
  { key: 'password', label: '修改密码', icon: Lock },
  { key: 'favorites', label: '我的收藏', icon: Star },
  { key: 'history', label: '阅读历史', icon: Clock },
  { key: 'novels', label: '我的作品', icon: Reading }
]

const userInfo = reactive({
  username: '',
  email: '',
  bio: '',
  avatar: ''
})

const originalUserInfo = { ...userInfo }

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const favorites = ref<Novel[]>([])
const history = ref<any[]>([])
const myNovels = ref<Novel[]>([])

// 加载用户信息
const loadUserProfile = async () => {
  try {
    const response = await authStore.getProfile()
    if (response.success && response.data) {
      Object.assign(userInfo, response.data)
      Object.assign(originalUserInfo, response.data)
    }
  } catch (err: any) {
    ElMessage.error('加载用户信息失败')
  }
}

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
      // 更新authStore中的用户信息
      await authStore.getProfile()
    }
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 取消编辑
const handleCancelEdit = () => {
  Object.assign(userInfo, originalUserInfo)
  editMode.value = false
}

// 上传头像
const handleUploadAvatar = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    
    // 检查文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过2MB')
      return
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('只能上传图片文件')
      return
    }
    
    try {
      const loadingMsg = ElMessage.loading('上传中...')
      const response = await uploadApi.uploadAvatar(file)
      loadingMsg.close()
      
      if (response.data.success && response.data.data) {
        userInfo.avatar = response.data.data.url
        // 立即保存
        await handleSaveProfile()
        ElMessage.success('头像上传成功')
      }
    } catch (err: any) {
      ElMessage.error(err.message || '上传失败')
    }
  }
  
  input.click()
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning('请填写完整')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
    return
  }

  if (passwordForm.newPassword.length < 8) {
    ElMessage.warning('密码长度不能少于8位')
    return
  }

  // 密码强度检查
  const hasUpperCase = /[A-Z]/.test(passwordForm.newPassword)
  const hasLowerCase = /[a-z]/.test(passwordForm.newPassword)
  const hasNumber = /[0-9]/.test(passwordForm.newPassword)
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    ElMessage.warning('密码必须包含大小写字母和数字')
    return
  }

  changingPassword.value = true
  try {
    const response = await userApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (response.data.success) {
      ElMessage.success('密码修改成功，请重新登录')
      // 清空表单
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      // 3秒后跳转到登录页
      setTimeout(() => {
        authStore.logout()
        router.push('/login')
      }, 3000)
    }
  } catch (err: any) {
    ElMessage.error(err.message || '修改失败')
  } finally {
    changingPassword.value = false
  }
}

// 创建作品
const handleCreateNovel = () => {
  router.push('/novel/create')
}

// 格式化日期
const formatDate = (date: string) => {
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 加载收藏列表
const loadFavorites = async () => {
  try {
    const response = await userApi.getUserFavorites({ page: 1, pageSize: 20 })
    if (response.data.success && response.data.data) {
      favorites.value = response.data.data.items
    }
  } catch (err: any) {
    console.error('加载收藏失败:', err)
  }
}

// 加载我的作品
const loadMyNovels = async () => {
  try {
    const response = await userApi.getUserNovels({ page: 1, pageSize: 20 })
    if (response.data.success && response.data.data) {
      myNovels.value = response.data.data.items
    }
  } catch (err: any) {
    console.error('加载作品失败:', err)
  }
}

onMounted(() => {
  loadUserProfile()
  // 加载收藏和作品
  if (activeTab.value === 'favorites') {
    loadFavorites()
  } else if (activeTab.value === 'novels') {
    loadMyNovels()
  }
})

// 监听Tab切换，按需加载数据
import { watch } from 'vue'
watch(activeTab, (newTab) => {
  if (newTab === 'favorites' && favorites.value.length === 0) {
    loadFavorites()
  } else if (newTab === 'novels' && myNovels.value.length === 0) {
    loadMyNovels()
  }
})
</script>

<style scoped>
.profile-page {
  @apply min-h-screen py-6 bg-gray-50;
}

.profile-layout {
  @apply flex gap-6;
}

.profile-sidebar {
  @apply hidden md:block;
}

.sidebar-menu {
  @apply list-none p-0 space-y-1;
}

.menu-item {
  @apply flex items-center gap-3 px-4 py-3 rounded-md 
         cursor-pointer transition-all duration-200 
         text-gray-700 hover:bg-blue-50 hover:text-blue-600;
}

.menu-item.active {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.profile-content {
  @apply flex-1;
}

.profile-info-section {
  @apply space-y-6;
}

.avatar-section {
  @apply flex flex-col items-center gap-4 pb-6 border-b;
}

.info-form {
  @apply space-y-4;
}

.form-actions {
  @apply flex gap-3 pt-4;
}

.password-form {
  @apply space-y-4 max-w-md;
}

.novels-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

.novels-header {
  @apply flex items-center justify-between w-full;
}

.history-list {
  @apply space-y-4;
}

.history-item {
  @apply flex gap-4 p-4 bg-gray-50 rounded-lg 
         hover:bg-gray-100 cursor-pointer 
         transition-colors duration-200;
}

.history-cover {
  @apply w-16 h-20 object-cover rounded;
}

.history-info {
  @apply flex-1;
}

.history-info h4 {
  @apply font-semibold text-gray-800 mb-1;
}

.history-chapter {
  @apply text-sm text-gray-600;
}

.history-date {
  @apply text-xs text-gray-500 mt-1;
}
</style>

