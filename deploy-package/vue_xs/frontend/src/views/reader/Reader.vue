<template>
  <div class="reader-page" :class="{ 'night-mode': settings.theme === 'night' }">
    <!-- 顶部工具栏 -->
    <div class="reader-header" :class="{ 'hidden': !showToolbar }">
      <Container max-width="xl">
        <div class="header-content">
          <Button @click="handleBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </Button>
          
          <div class="novel-info">
            <span class="novel-title">{{ novel?.title }}</span>
            <span class="chapter-title">{{ currentChapter?.title }}</span>
          </div>
          
          <Button @click="showSettings = !showSettings">
            <el-icon><Setting /></el-icon>
            设置
          </Button>
        </div>
      </Container>
    </div>

    <!-- 阅读内容 -->
    <div 
      class="reader-content"
      :style="contentStyle"
      @click="toggleToolbar"
    >
      <Container :max-width="settings.width">
        <Loading v-if="loading" :visible="true" text="加载中..." />
        
        <div v-else-if="currentChapter" class="chapter-content">
          <h1 class="chapter-title-main">{{ currentChapter.title }}</h1>
          <div 
            class="chapter-text"
            v-html="formatContent(currentChapter.content)"
          ></div>
        </div>

        <el-empty v-else description="章节不存在" />
      </Container>
    </div>

    <!-- 底部导航 -->
    <div class="reader-footer" :class="{ 'hidden': !showToolbar }">
      <Container max-width="xl">
        <div class="footer-content">
          <Button 
            :disabled="!hasPrevChapter"
            @click="gotoPrevChapter"
          >
            <el-icon><ArrowLeftBold /></el-icon>
            上一章
          </Button>
          
          <div class="chapter-progress">
            {{ chapterIndex + 1 }} / {{ chapters.length }}
          </div>
          
          <Button 
            :disabled="!hasNextChapter"
            @click="gotoNextChapter"
          >
            下一章
            <el-icon><ArrowRightBold /></el-icon>
          </Button>
        </div>
      </Container>
    </div>

    <!-- 设置面板 -->
    <Transition name="slide-up">
      <div v-if="showSettings" class="settings-panel">
        <Container max-width="md">
          <Card title="阅读设置">
            <template #header>
              <div class="settings-header">
                <h3>阅读设置</h3>
                <el-icon class="close-icon" @click="showSettings = false">
                  <Close />
                </el-icon>
              </div>
            </template>

            <!-- 主题设置 -->
            <div class="setting-group">
              <h4 class="setting-title">阅读主题</h4>
              <div class="theme-options">
                <div
                  v-for="theme in themeOptions"
                  :key="theme.value"
                  class="theme-item"
                  :class="{ active: settings.theme === theme.value }"
                  :style="{ backgroundColor: theme.bg, color: theme.color }"
                  @click="settings.theme = theme.value"
                >
                  {{ theme.label }}
                </div>
              </div>
            </div>

            <!-- 字体大小 -->
            <div class="setting-group">
              <h4 class="setting-title">字体大小</h4>
              <div class="font-size-control">
                <Button size="small" @click="decreaseFontSize">A-</Button>
                <span class="font-size-value">{{ settings.fontSize }}px</span>
                <Button size="small" @click="increaseFontSize">A+</Button>
              </div>
            </div>

            <!-- 行间距 -->
            <div class="setting-group">
              <h4 class="setting-title">行间距</h4>
              <el-slider
                v-model="settings.lineHeight"
                :min="1.5"
                :max="3"
                :step="0.1"
                :show-tooltip="false"
              />
              <span class="setting-value">{{ settings.lineHeight.toFixed(1) }}</span>
            </div>

            <!-- 页面宽度 -->
            <div class="setting-group">
              <h4 class="setting-title">页面宽度</h4>
              <el-radio-group v-model="settings.width">
                <el-radio label="md">窄</el-radio>
                <el-radio label="lg">中</el-radio>
                <el-radio label="xl">宽</el-radio>
              </el-radio-group>
            </div>

            <!-- 字体族 -->
            <div class="setting-group">
              <h4 class="setting-title">字体</h4>
              <el-radio-group v-model="settings.fontFamily">
                <el-radio label="system">系统默认</el-radio>
                <el-radio label="serif">宋体</el-radio>
                <el-radio label="sans">黑体</el-radio>
              </el-radio-group>
            </div>

            <!-- 保存设置按钮 -->
            <div class="setting-actions">
              <Button type="primary" @click="saveSettings">
                <el-icon><Check /></el-icon>
                保存设置
              </Button>
              <Button @click="resetSettings">
                <el-icon><RefreshLeft /></el-icon>
                恢复默认
              </Button>
            </div>
          </Card>
        </Container>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowLeftBold,
  ArrowRightBold,
  Setting,
  Close,
  Check,
  RefreshLeft
} from '@element-plus/icons-vue'
import Container from '@/components/layout/Container.vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Loading from '@/components/common/Loading.vue'

const route = useRoute()
const router = useRouter()

// 状态
const novel = ref<any>(null)
const chapters = ref<any[]>([])
const currentChapter = ref<any>(null)
const chapterIndex = ref(0)
const loading = ref(false)
const showToolbar = ref(true)
const showSettings = ref(false)

// 阅读设置
const settings = ref({
  theme: 'day', // day, night, sepia
  fontSize: 18,
  lineHeight: 1.8,
  width: 'lg' as 'md' | 'lg' | 'xl',
  fontFamily: 'system' // system, serif, sans
})

// 主题选项
const themeOptions = [
  { label: '日间', value: 'day', bg: '#ffffff', color: '#333333' },
  { label: '夜间', value: 'night', bg: '#1a1a1a', color: '#cccccc' },
  { label: '护眼', value: 'sepia', bg: '#f4ecd8', color: '#5c4a32' }
]

// 计算属性
const hasPrevChapter = computed(() => chapterIndex.value > 0)
const hasNextChapter = computed(() => chapterIndex.value < chapters.value.length - 1)

const contentStyle = computed(() => {
  const theme = themeOptions.find(t => t.value === settings.value.theme)
  let fontFamily = 'system-ui, -apple-system, sans-serif'
  
  if (settings.value.fontFamily === 'serif') {
    fontFamily = 'Georgia, "Times New Roman", STSong, SimSun, serif'
  } else if (settings.value.fontFamily === 'sans') {
    fontFamily = 'Arial, "Microsoft YaHei", "Helvetica Neue", sans-serif'
  }
  
  return {
    backgroundColor: theme?.bg,
    color: theme?.color,
    fontSize: `${settings.value.fontSize}px`,
    lineHeight: settings.value.lineHeight,
    fontFamily
  }
})

// 加载小说信息
const loadNovel = async () => {
  const novelId = Number(route.params.novelId)
  // TODO: 调用API获取小说信息和章节列表
  // 这里先用模拟数据
  novel.value = {
    id: novelId,
    title: '测试小说'
  }
  
  // 模拟章节列表
  chapters.value = [
    { id: 1, title: '第一章 开始', content: '这是第一章的内容...' },
    { id: 2, title: '第二章 继续', content: '这是第二章的内容...' }
  ]
}

// 加载章节
const loadChapter = async () => {
  const chapterId = Number(route.params.chapterId)
  loading.value = true
  
  try {
    // TODO: 调用API获取章节内容
    // 这里先用模拟数据
    const index = chapters.value.findIndex(c => c.id === chapterId)
    if (index !== -1) {
      chapterIndex.value = index
      currentChapter.value = chapters.value[index]
      
      // 保存阅读进度
      saveProgress()
    }
  } catch (error: any) {
    ElMessage.error('加载章节失败')
  } finally {
    loading.value = false
  }
}

// 格式化内容
const formatContent = (content: string) => {
  if (!content) return ''
  
  // 将换行转换为段落
  return content
    .split('\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('')
}

// 切换工具栏显示
const toggleToolbar = () => {
  if (!showSettings.value) {
    showToolbar.value = !showToolbar.value
  }
}

// 上一章
const gotoPrevChapter = () => {
  if (hasPrevChapter.value) {
    const prevChapter = chapters.value[chapterIndex.value - 1]
    router.push(`/read/${novel.value.id}/${prevChapter.id}`)
  }
}

// 下一章
const gotoNextChapter = () => {
  if (hasNextChapter.value) {
    const nextChapter = chapters.value[chapterIndex.value + 1]
    router.push(`/read/${novel.value.id}/${nextChapter.id}`)
  }
}

// 返回
const handleBack = () => {
  router.back()
}

// 字体大小调整
const increaseFontSize = () => {
  if (settings.value.fontSize < 32) {
    settings.value.fontSize += 2
  }
}

const decreaseFontSize = () => {
  if (settings.value.fontSize > 12) {
    settings.value.fontSize -= 2
  }
}

// 保存设置
const saveSettings = () => {
  localStorage.setItem('readerSettings', JSON.stringify(settings.value))
  ElMessage.success('设置已保存')
  showSettings.value = false
}

// 恢复默认设置
const resetSettings = () => {
  settings.value = {
    theme: 'day',
    fontSize: 18,
    lineHeight: 1.8,
    width: 'lg',
    fontFamily: 'system'
  }
  ElMessage.success('已恢复默认设置')
}

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('readerSettings')
  if (saved) {
    try {
      settings.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载设置失败:', e)
    }
  }
}

// 保存阅读进度
const saveProgress = () => {
  if (!novel.value || !currentChapter.value) return
  
  const progress = {
    novelId: novel.value.id,
    chapterId: currentChapter.value.id,
    chapterIndex: chapterIndex.value,
    timestamp: new Date().toISOString()
  }
  
  localStorage.setItem(`progress_${novel.value.id}`, JSON.stringify(progress))
}

// 键盘快捷键
const handleKeyPress = (e: KeyboardEvent) => {
  if (showSettings.value) return
  
  switch (e.key) {
    case 'ArrowLeft':
      gotoPrevChapter()
      break
    case 'ArrowRight':
      gotoNextChapter()
      break
    case 'Escape':
      if (!showToolbar.value) {
        showToolbar.value = true
      }
      break
  }
}

// 监听路由变化
watch(() => route.params.chapterId, () => {
  if (route.params.chapterId) {
    loadChapter()
  }
})

onMounted(() => {
  loadSettings()
  loadNovel()
  loadChapter()
  
  // 添加键盘监听
  window.addEventListener('keydown', handleKeyPress)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
.reader-page {
  @apply min-h-screen transition-colors duration-300;
}

.reader-header,
.reader-footer {
  @apply fixed left-0 right-0 bg-white shadow-md z-40 transition-transform duration-300;
}

.reader-header {
  @apply top-0;
}

.reader-footer {
  @apply bottom-0;
}

.reader-header.hidden {
  @apply -translate-y-full;
}

.reader-footer.hidden {
  @apply translate-y-full;
}

.header-content,
.footer-content {
  @apply flex items-center justify-between py-4;
}

.novel-info {
  @apply flex-1 text-center;
}

.novel-title {
  @apply text-lg font-bold;
}

.chapter-title {
  @apply text-sm text-gray-600 ml-2;
}

.reader-content {
  @apply min-h-screen pt-20 pb-20 px-4 transition-all duration-300;
}

.chapter-content {
  @apply py-12;
}

.chapter-title-main {
  @apply text-3xl font-bold text-center mb-12;
}

.chapter-text {
  @apply space-y-6;
}

.chapter-text :deep(p) {
  @apply text-justify indent-8;
}

.chapter-progress {
  @apply text-gray-600 font-medium;
}

.settings-panel {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50 
         flex items-end md:items-center justify-center p-4;
}

.settings-header {
  @apply flex items-center justify-between w-full;
}

.close-icon {
  @apply text-2xl cursor-pointer hover:text-blue-600 transition-colors;
}

.setting-group {
  @apply mb-6 pb-6 border-b last:border-b-0;
}

.setting-title {
  @apply text-base font-semibold mb-4;
}

.theme-options {
  @apply grid grid-cols-3 gap-3;
}

.theme-item {
  @apply px-4 py-3 rounded-lg text-center cursor-pointer 
         border-2 border-transparent transition-all;
}

.theme-item.active {
  @apply border-blue-500 ring-2 ring-blue-200;
}

.font-size-control {
  @apply flex items-center justify-center gap-4;
}

.font-size-value {
  @apply text-lg font-semibold min-w-[60px] text-center;
}

.setting-value {
  @apply text-sm text-gray-600 float-right;
}

.setting-actions {
  @apply flex gap-3 mt-6;
}

/* 夜间模式 */
.night-mode .reader-header,
.night-mode .reader-footer {
  @apply bg-gray-900 text-gray-200;
}

.night-mode .novel-title {
  @apply text-gray-200;
}

.night-mode .chapter-title,
.night-mode .chapter-progress {
  @apply text-gray-400;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>

