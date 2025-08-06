# 小红书风格个人小说发布网站 - 详细开发文档

## 项目概述
一个精致的小红书风格个人小说发布平台，支持瀑布流展示、标签分类、移动端优化等功能。

## 技术架构（基于您的2G2H服务器）
- **前端**：HTML + Tailwind CSS + Vue.js（轻量级响应式）
- **后端**：Node.js + Express + MongoDB（或MySQL）
- **富文本编辑器**：Quill.js 或 TinyMCE
- **服务器**：PM2进程管理 + Nginx反向代理

## 核心设计规范

### 配色方案
```css
:root {
  /* 主色调 */
  --primary-red: #FE2C55;      /* 小红书红 */
  --primary-beige: #F5E6D3;    /* 米色系主色 */
  --beige-light: #FAF5F0;      /* 浅米色背景 */
  --beige-dark: #D4B5A0;       /* 深米色强调 */
  
  /* 文字色 */
  --text-primary: #333333;      /* 主文字 */
  --text-secondary: #666666;    /* 次要文字 */
  
  /* 夜间模式 */
  --dark-bg: #1A1A1A;          /* 深色背景 */
  --dark-card: #2A2A2A;        /* 深色卡片 */
}
```

### 标签系统
```javascript
const tagCategories = {
  "男主类型": ["#占有欲男主", "#年下小奶狗", "#偏执"],
  "题材类型": ["#bg", "#短篇", "#小甜文", "#姐弟恋", "#年下恋", "#人外文"],
  "连载状态": ["#连载中", "#已完结", "#日更", "#周更"]
};
```

## 页面结构详解

### 1. 首页瀑布流
```html
<!-- 顶部导航栏 -->
<nav class="sticky top-0 bg-white shadow-sm z-50">
  <div class="container mx-auto px-4 py-3">
    <!-- Logo -->
    <div class="text-red-500 font-bold text-xl">您的笔名</div>
    
    <!-- 搜索框 -->
    <div class="search-box">
      <input type="text" placeholder="搜索小说..." />
    </div>
    
    <!-- 主题切换按钮 -->
    <button id="theme-toggle">🌙</button>
  </div>
</nav>

<!-- 标签筛选栏 -->
<div class="tag-filter-bar">
  <div class="tag-scroll">
    <span class="tag active">全部</span>
    <span class="tag">#占有欲男主</span>
    <span class="tag">#bg</span>
    <span class="tag">#短篇</span>
    <!-- 更多标签 -->
  </div>
</div>

<!-- 瀑布流容器 -->
<div class="waterfall-container">
  <!-- 小说卡片 -->
</div>
```

### 2. 小说卡片设计
```html
<div class="novel-card">
  <!-- 封面区域 -->
  <div class="cover-wrapper">
    <!-- 文字封面或图片封面 -->
    <div class="text-cover" 或 <img class="image-cover">
  </div>
  
  <!-- 信息区域 -->
  <div class="info-section">
    <h3 class="title">小说标题</h3>
    <p class="summary">简介前50字...</p>
    
    <!-- 标签 -->
    <div class="tags">
      <span class="tag">#bg</span>
      <span class="tag">#短篇</span>
    </div>
    
    <!-- 统计信息 -->
    <div class="stats">
      <span>👁 1.2k</span>
      <span>📅 3天前</span>
    </div>
  </div>
</div>
```

### 3. 阅读页面（移动端优化）
```html
<div class="reader-container">
  <!-- 顶部工具栏 -->
  <header class="reader-header">
    <button onclick="history.back()">←</button>
    <h1 class="novel-title">小说标题</h1>
    <button id="settings-btn">⚙️</button>
  </header>
  
  <!-- 阅读设置面板 -->
  <div class="settings-panel">
    <!-- 字体大小 -->
    <div class="font-size-control">
      <button>A-</button>
      <span>字体大小</span>
      <button>A+</button>
    </div>
    
    <!-- 主题切换 -->
    <div class="theme-options">
      <div class="theme-btn" data-theme="light">☀️</div>
      <div class="theme-btn" data-theme="sepia">📜</div>
      <div class="theme-btn" data-theme="dark">🌙</div>
    </div>
  </div>
  
  <!-- 正文内容 -->
  <article class="content">
    <!-- 小说内容 -->
  </article>
  
  <!-- 阅读进度条 -->
  <div class="progress-bar"></div>
</div>
```

### 4. 管理后台功能
```html
<!-- 富文本编辑器界面 -->
<div class="admin-panel">
  <!-- 侧边栏 -->
  <aside class="sidebar">
    <ul>
      <li>📝 写作</li>
      <li>📂 草稿箱</li>
      <li>📊 数据统计</li>
      <li>⏰ 定时发布</li>
    </ul>
  </aside>
  
  <!-- 主编辑区 -->
  <main class="editor-area">
    <!-- 基本信息 -->
    <input type="text" placeholder="小说标题" />
    <textarea placeholder="简介（会显示在卡片上）"></textarea>
    
    <!-- 标签选择 -->
    <div class="tag-selector">
      <!-- 可多选的标签列表 -->
    </div>
    
    <!-- 封面选择 -->
    <div class="cover-options">
      <label>
        <input type="radio" name="cover-type" value="text" />
        文字封面
      </label>
      <label>
        <input type="radio" name="cover-type" value="image" />
        图片封面
      </label>
    </div>
    
    <!-- 富文本编辑器 -->
    <div id="quill-editor"></div>
    
    <!-- 发布选项 -->
    <div class="publish-options">
      <button class="save-draft">保存草稿</button>
      <button class="schedule">定时发布</button>
      <button class="publish-now">立即发布</button>
    </div>
  </main>
</div>
```

## 数据库设计

### 小说表 (novels)
```sql
CREATE TABLE novels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  summary TEXT,
  content LONGTEXT,
  cover_type ENUM('text', 'image'),
  cover_data TEXT,
  tags JSON,
  views INT DEFAULT 0,
  status ENUM('draft', 'published', 'scheduled'),
  publish_time DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 阅读记录表 (reading_progress)
```sql
CREATE TABLE reading_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  novel_id INT,
  user_token VARCHAR(100),
  progress FLOAT,
  last_position INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 关键功能实现

### 1. 瀑布流布局（响应式）
```javascript
// 使用 Masonry 或自定义瀑布流
const initWaterfall = () => {
  const container = document.querySelector('.waterfall-container');
  const columns = window.innerWidth < 768 ? 2 : 4; // 手机2列，PC4列
  
  // 瀑布流逻辑
};
```

### 2. 标签筛选系统
```javascript
// 标签点击筛选
document.querySelectorAll('.tag').forEach(tag => {
  tag.addEventListener('click', () => {
    filterNovelsByTag(tag.textContent);
  });
});
```

### 3. 阅读进度保存
```javascript
// 自动保存阅读位置
let saveTimer;
window.addEventListener('scroll', () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const progress = window.scrollY / document.body.scrollHeight;
    localStorage.setItem(`novel-${novelId}-progress`, progress);
  }, 1000);
});
```

### 4. 主题切换（含夜间模式）
```javascript
const themes = {
  light: { bg: '#FAF5F0', text: '#333', card: '#FFF' },
  sepia: { bg: '#F5E6D3', text: '#5C4033', card: '#FFF9F0' },
  dark: { bg: '#1A1A1A', text: '#E0E0E0', card: '#2A2A2A' }
};
```

## 移动端特别优化

1. **触摸手势支持**
   - 左右滑动切换章节
   - 上下滑动阅读
   - 双击快速跳转

2. **性能优化**
   - 图片懒加载
   - 虚拟滚动（长文章）
   - Service Worker缓存

3. **阅读体验**
   - 防误触设计
   - 自动隐藏工具栏
   - 流畅的页面过渡

## 部署步骤（2G2H服务器）

1. **服务器环境配置**
```bash
# 安装Node.js
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MongoDB
sudo apt-get install mongodb

# 安装PM2
npm install -g pm2

# 安装Nginx
sudo apt-get install nginx
```

2. **项目部署**
```bash
# 克隆项目
git clone your-project.git

# 安装依赖
npm install

# 启动应用
pm2 start server.js --name novel-site

# 配置Nginx反向代理
```

3. **性能优化建议**
- 使用CDN加速静态资源
- 开启Gzip压缩
- 图片使用WebP格式
- 定期清理日志文件

## 安全措施
1. 管理后台双重验证（密码+验证码）
2. SQL注入防护
3. XSS攻击防护
4. 定时备份数据库
5. HTTPS证书配置

## 预计开发周期
- 基础功能：1周
- 完整功能：2-3周
- 优化调试：1周

## 后续扩展建议
1. PWA支持（可安装到手机）
2. 推送通知（更新提醒）
3. 数据分析面板
4. SEO优化
5. 社交分享功能